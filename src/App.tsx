import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UploadArea } from './components/UploadArea';
import { DatabaseGrid } from './components/database-grid';
import { DocumentDetail } from './components/DetailModal';
import { DuplicateCompareModal } from './components/DuplicateCompareModal';
import { SettingsView } from './components/SettingsView';
import { applyAccountingRules, generateZoeInvoiceId } from './services/ruleEngine';
import * as storageService from './services/storageService';
import * as supabaseService from './services/supabaseService';
import { detectPrivateDocument } from './services/privateDocumentDetection';
import { DocumentRecord, DocumentStatus, AppSettings, ExtractedData, Attachment } from './types';
import { normalizeExtractedData } from './services/extractedDataNormalization';
import { documentProcessingPipeline } from './services/pipeline/documentProcessingPipeline';
import { costOptimizer } from './services/optimization/costOptimizer';
import { pipelineErrorHandler } from './services/errors/pipelineErrorHandler';

const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const readFileToBase64 = (file: File): Promise<{base64: string, url: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const res = reader.result as string;
            resolve({ base64: res.split(',')[1], url: res });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

type DuplicateMatch = { doc: DocumentRecord; reason: string; confidence: number };

// --- Document Merge Helper for Sync ---
const mergeDocuments = (localDocs: DocumentRecord[], cloudDocs: DocumentRecord[]): DocumentRecord[] => {
  const docMap = new Map<string, DocumentRecord>();

  // Add all local docs
  for (const doc of localDocs) {
    docMap.set(doc.id, doc);
  }

  // Merge cloud docs (prefer newer versions)
  for (const cloudDoc of cloudDocs) {
    const existing = docMap.get(cloudDoc.id);
    if (!existing) {
      docMap.set(cloudDoc.id, cloudDoc);
    } else {
      // Compare by upload date, prefer newer
      const localDate = new Date(existing.uploadDate).getTime();
      const cloudDate = new Date(cloudDoc.uploadDate).getTime();
      if (cloudDate > localDate) {
        docMap.set(cloudDoc.id, cloudDoc);
      }
    }
  }

  return Array.from(docMap.values());
};

const classifyOcrOutcome = (data: ExtractedData): { status: DocumentStatus; error?: string } => {
    const score = data.ocr_score ?? 0;
    const vendor = (data.lieferantName || '').toLowerCase();
    const rationale = (data.ocr_rationale || '').trim();
    const description = (data.beschreibung || '').trim();

    const msg = (rationale || description).toLowerCase();

    const isTechnicalFailure =
        msg.includes('siliconflow_api_key') ||
        msg.includes('api key') ||
        msg.includes('pdf ist zu groß') ||
        msg.includes('vision api error') ||
        msg.includes('gemini fehlgeschlagen') ||
        msg.includes('quota') ||
        msg.includes('http 4') ||
        msg.includes('http 5');

    const looksLikeManualTemplate =
        vendor.includes('manuelle eingabe') ||
        (score <= 0 && (data.bruttoBetrag ?? 0) === 0);

    if (looksLikeManualTemplate) {
        const errorMsg = rationale || description || 'Analyse fehlgeschlagen. Bitte manuell erfassen.';
        return { status: isTechnicalFailure ? DocumentStatus.ERROR : DocumentStatus.REVIEW_NEEDED, error: errorMsg };
    }

    // Non-fatal but needs review
    if (rationale.includes('Datum unklar') || rationale.includes('Summen widersprüchlich') || score < 6) {
        return { status: DocumentStatus.REVIEW_NEEDED, error: rationale || 'Bitte Daten prüfen.' };
    }

    return { status: DocumentStatus.COMPLETED, error: undefined };
};

// --- AGGRESSIVE SEMANTIC DUPLICATE DETECTION V2 ---
const findSemanticDuplicate = (data: Partial<ExtractedData>, existingDocs: DocumentRecord[]): DuplicateMatch | undefined => {
    if (!data.bruttoBetrag && !data.belegNummerLieferant) return undefined;
    
    // Helper to normalize strings (remove spaces, special chars, lowercase)
    // "Re-Nr: 220" -> "220", "22O" -> "220"
    const normalize = (s: string | undefined) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    const newInvoiceNum = normalize(data.belegNummerLieferant);
    const newAmount = data.bruttoBetrag;
    const newDate = data.belegDatum;
    const newVendor = normalize(data.lieferantName);

    for (const doc of existingDocs) {
        // Skip invalid docs or the doc itself (if we had IDs here, but this runs before ID assignment in some flows)
        if (!doc.data || doc.status === DocumentStatus.ERROR || doc.status === DocumentStatus.DUPLICATE) continue;
        
        const existingInvNum = normalize(doc.data.belegNummerLieferant);
        const existingAmount = doc.data.bruttoBetrag;
        const existingDate = doc.data.belegDatum;

        // --- RULE 1: HARD MATCH (Invoice Number + Amount) ---
        // If Invoice Number matches (at least 2 chars, e.g. "220") AND Amount matches exactly (0.10€ tolerance)
        // THIS IS THE STRONGEST SIGNAL.
        if (newInvoiceNum.length >= 2 && newInvoiceNum === existingInvNum) {
            if (newAmount !== undefined && existingAmount !== undefined) {
                if (Math.abs(newAmount - existingAmount) < 0.1) {
                    return { doc, reason: `Belegnummer (${doc.data.belegNummerLieferant}) und Betrag identisch.`, confidence: 0.95 };
                }
            }
        }

        // --- RULE 2: HARD MATCH (Invoice Number + Date) ---
        // If Amount is slightly different (OCR error) but Number and Date match exactly.
        if (newInvoiceNum.length >= 3 && newInvoiceNum === existingInvNum) {
            if (newDate && existingDate && newDate === existingDate) {
                return { doc, reason: `Belegnummer (${doc.data.belegNummerLieferant}) und Datum identisch.`, confidence: 0.9 };
            }
        }

        // --- RULE 3: SCORING (Fuzzy Match) ---
        // Only falls back to this if Hard Rules didn't trigger
        let score = 0;

        // Amount Match
        if (newAmount !== undefined && existingAmount !== undefined) {
            if (Math.abs(newAmount - existingAmount) < 0.05) score += 40;
        }

        // Date Match
        if (newDate && existingDate && newDate === existingDate) score += 30;

        // Vendor Match (Fuzzy)
        const existingVendor = normalize(doc.data.lieferantName);
        if (newVendor && existingVendor) {
            if (newVendor.includes(existingVendor) || existingVendor.includes(newVendor)) score += 20;
        }

        // Partial Invoice Number Match (if long)
        if (newInvoiceNum.length > 4 && existingInvNum.includes(newInvoiceNum)) score += 20;

        // If Score is high enough, flag it
        if (score >= 70) {
            return { doc, reason: "Hohe Ähnlichkeit bei Datum, Betrag und Lieferant.", confidence: Math.min(0.89, score / 100) };
        }

        continue;
    }

    return undefined;
};

export default function App() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'document' | 'settings' | 'database' | 'auth' | 'backup'>('document');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [privateDocNotification, setPrivateDocNotification] = useState<{
    vendor: string;
    amount: number;
    reason: string;
  } | null>(null);

  // Filter State
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterQuarter] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  
  // Drag State for Sidebar
  const [sidebarDragTarget, setSidebarDragTarget] = useState<string | null>(null);

  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Duplicate Compare Modal State
  const [compareDoc, setCompareDoc] = useState<DocumentRecord | null>(null);
  const [originalDoc, setOriginalDoc] = useState<DocumentRecord | null>(null);

  // Pipeline Progress State
  const [pipelineProgress, setPipelineProgress] = useState<{
    phase: string;
    completed: number;
    total: number;
    message: string;
    batchIndex: number;
    currentFile: string;
  } | null>(null);

  // Cost Tracking State
  const [costInfo, setCostInfo] = useState<{
    remaining: number;
    budget: number;
    avgCost: number;
  } | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        // Local-first: Load from IndexedDB first
        const [localDocs, localSettings] = await Promise.all([
          storageService.getAllDocuments(),
          storageService.getSettings()
        ]);
        setDocuments(localDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
        setSettings(localSettings);

        // Load cost info
        const status = await documentProcessingPipeline.getStatus();
        setCostInfo({
          remaining: status.remaining,
          budget: status.budget,
          avgCost: status.avgCost,
        });

        // Optionally sync with Supabase if configured
        if (supabaseService.isSupabaseConfigured()) {
          try {
            const [cloudDocs, cloudSettings] = await Promise.all([
              supabaseService.getAllDocuments(),
              supabaseService.getSettings()
            ]);

            // Merge strategy: Prefer newer documents, handle duplicates
            const mergedDocs = mergeDocuments(localDocs || [], cloudDocs || []);
            setDocuments(mergedDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));

            // Save merged data back to local storage
            for (const doc of mergedDocs) {
              await storageService.saveDocument(doc);
            }

            // Update settings if cloud is newer (simple approach: use cloud settings)
            if (cloudSettings) {
              await storageService.saveSettings(cloudSettings);
              setSettings(cloudSettings);
            }
          } catch (syncError) {
            // Supabase sync failed, using local data
          }
        }
      } catch (e) {
        setNotification('Fehler beim Laden der Daten. IndexedDB oder Supabase prüfen.');
      }
    };
    initData();
  }, []);

  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => setNotification(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  useEffect(() => {
      if (privateDocNotification) {
          const timer = setTimeout(() => setPrivateDocNotification(null), 8000);
          return () => clearTimeout(timer);
      }
  }, [privateDocNotification]);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizing.current = true;
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;
    const doDrag = (mouseMoveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
        if (newWidth > 220 && newWidth < 800) setSidebarWidth(newWidth);
    };
    const stopDrag = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'col-resize';
  };

  const handleFilesSelect = async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setViewMode('document');
    setPipelineProgress(null);

    // Prepare file data
    const newDocs: DocumentRecord[] = [];
    const fileData: {id: string, file: File, hash: string, base64: string, url: string}[] = [];

    for (const file of files) {
        const id = crypto.randomUUID();
        const [hash, {base64, url}] = await Promise.all([computeFileHash(file), readFileToBase64(file)]);
        fileData.push({ id, file, hash, base64, url });
        newDocs.push({
            id,
            fileName: file.name,
            fileType: file.type,
            uploadDate: new Date().toISOString(),
            status: DocumentStatus.PROCESSING,
            data: null,
            previewUrl: url,
            fileHash: hash
        });
    }

    setDocuments(prev => [...newDocs, ...prev]);

    const currentSettings = settings || await storageService.getSettings();
    const currentDocs = await storageService.getAllDocuments();

    // Check for exact duplicates first
    const exactDuplicates: DocumentRecord[] = [];
    const filesToProcess: typeof fileData = [];

    for (const item of fileData) {
        const isExactDuplicate = currentDocs.some(d => d.fileHash === item.hash);
        if (isExactDuplicate) {
            const original = currentDocs.find(d => d.fileHash === item.hash);
            exactDuplicates.push({
                id: item.id,
                fileName: item.file.name,
                fileType: item.file.type,
                uploadDate: new Date().toISOString(),
                status: DocumentStatus.DUPLICATE,
                data: null,
                duplicateReason: "Datei identisch (Hash)",
                duplicateOfId: original?.id,
                duplicateConfidence: 1,
                previewUrl: item.url,
                fileHash: item.hash
            });
        } else {
            filesToProcess.push(item);
        }
    }

    // Process remaining files through the pipeline
    const processedResults = await documentProcessingPipeline.processBatch(
        filesToProcess,
        currentDocs,
        currentSettings,
        (progress) => {
            setPipelineProgress({
                phase: progress.phase,
                completed: progress.completed,
                total: progress.total,
                message: progress.message,
                batchIndex: progress.batchIndex,
                currentFile: filesToProcess[progress.batchIndex]?.file.name || '',
            });
        }
    );

    // Combine results
    const finalResults = [...exactDuplicates, ...processedResults.map(r => r.document)];

    // Save all documents
    for (const doc of finalResults) {
        await storageService.saveDocument(doc);
        if (supabaseService.isSupabaseConfigured()) {
            try {
                await supabaseService.saveDocument(doc);
            } catch (e) {
                // Supabase sync failed - document saved locally
            }
        }

        // Handle private documents
        if (doc.status === DocumentStatus.PRIVATE && doc.data?.privatanteil) {
            try {
                await supabaseService.savePrivateDocument(
                    doc.id,
                    doc.fileName,
                    doc.fileType,
                    doc.previewUrl?.split(',')[1] || '',
                    doc.data,
                    'Private Positionen erkannt'
                );
                setPrivateDocNotification({
                    vendor: doc.data?.lieferantName || 'Unbekannt',
                    amount: doc.data?.bruttoBetrag || 0,
                    reason: 'Private Positionen erkannt'
                });
            } catch (e) {
                // Already saved locally
            }
        }
    }

    // Update documents state
    setDocuments(prev => {
        const cleanPrev = prev.filter(d => !finalResults.some(n => n.id === d.id));
        return [...finalResults, ...cleanPrev];
    });

    // Update cost info
    const status = await documentProcessingPipeline.getStatus();
    setCostInfo({
        remaining: status.remaining,
        budget: status.budget,
        avgCost: status.avgCost,
    });

    // Show notifications
    const errors = processedResults.filter(r => r.document.status === DocumentStatus.ERROR).length;
    const duplicates = exactDuplicates.length;
    const privateDocs = processedResults.filter(r => r.document.status === DocumentStatus.PRIVATE).length;

    let notificationMsg = '';
    if (errors > 0) notificationMsg += `${errors} Fehler, `;
    if (duplicates > 0) notificationMsg += `${duplicates} Duplikate, `;
    if (privateDocs > 0) notificationMsg += `${privateDocs} privat, `;

    if (notificationMsg) {
        setNotification(notificationMsg.slice(0, -2) + ' verarbeitet.');
    } else {
        setNotification(`${processedResults.length} Dokumente erfolgreich verarbeitet.`);
    }

    setIsProcessing(false);
    setPipelineProgress(null);

    // Select first document
    if (finalResults.length > 0) {
        setSelectedDocId(finalResults[0].id);
    }
  };

  const handleSaveDocument = async (updatedDoc: DocumentRecord) => {
    setDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    // Local-first: Save to IndexedDB first
    await storageService.saveDocument(updatedDoc);
    // Optionally sync to Supabase if configured
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.saveDocument(updatedDoc);
      } catch (e) {
        // Supabase sync failed - document saved locally
      }
    }
    // Save vendor rule if applicable
    if (updatedDoc.data?.lieferantName && updatedDoc.data?.kontierungskonto && updatedDoc.data?.steuerkategorie) {
      await storageService.saveVendorRule(updatedDoc.data.lieferantName, updatedDoc.data.kontierungskonto, updatedDoc.data.steuerkategorie);
      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.saveVendorRule(updatedDoc.data.lieferantName, updatedDoc.data.kontierungskonto, updatedDoc.data.steuerkategorie);
        } catch (e) {
          // Supabase sync failed - vendor rule saved locally
        }
      }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedDocId === id) setSelectedDocId(null);
    // Local-first: Delete from IndexedDB first
    await storageService.deleteDocument(id);
    // Optionally sync to Supabase if configured
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.deleteDocument(id);
      } catch (e) {
        // Supabase delete failed - document deleted locally
      }
    }
  };

  const handleMergeDocuments = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceDoc = documents.find(d => d.id === sourceId);
    const targetDoc = documents.find(d => d.id === targetId);
    if (!sourceDoc || !targetDoc) return;

    // D2: Safety checks - don't merge duplicates
    if (sourceDoc.status === DocumentStatus.DUPLICATE || targetDoc.status === DocumentStatus.DUPLICATE) {
        setNotification('Merge abgebrochen: Duplikate können nicht als Quelle/Ziel genutzt werden.');
        return;
    }

    if (sourceDoc.status === DocumentStatus.ERROR || targetDoc.status === DocumentStatus.ERROR) {
        setNotification('Merge abgebrochen: Belege mit Fehlerstatus können nicht gemerged werden.');
        return;
    }

    if (sourceDoc.status === DocumentStatus.REVIEW_NEEDED || targetDoc.status === DocumentStatus.REVIEW_NEEDED) {
        setNotification('Merge abgebrochen: Belege mit Status "Prüfen" bitte erst korrigieren, dann mergen.');
        return;
    }

    if (!confirm(`Möchten Sie "${sourceDoc.fileName}" in "${targetDoc.fileName}" integrieren?`)) return;

    // Preserve the source document as an attachment
    const newAttachment: Attachment = {
        id: crypto.randomUUID(), 
        url: sourceDoc.previewUrl || '', 
        type: sourceDoc.fileType, 
        name: sourceDoc.fileName
    };
    
    const updatedTarget: DocumentRecord = {
        ...targetDoc,
        // Combine existing attachments from target, the new source file, and any attachments the source already had
        attachments: [
            ...(targetDoc.attachments || []), 
            newAttachment, 
            ...(sourceDoc.attachments || [])
        ]
    };

    // Save merged document locally first
    await storageService.saveDocument(updatedTarget);
    await storageService.deleteDocument(sourceId);

    // Optionally sync to Supabase if configured
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.saveDocument(updatedTarget);
        await supabaseService.deleteDocument(sourceId);
      } catch (e) {
        // Supabase sync failed - merge saved locally
      }
    }
    
    setDocuments(prev => prev.filter(d => d.id !== sourceId).map(d => d.id === targetId ? updatedTarget : d));
    
    setNotification('Belege erfolgreich zusammengeführt.');
    
    if (selectedDocId === sourceId) setSelectedDocId(targetId);
  };

  const handleRetryOCR = async (doc: DocumentRecord) => {
    if (!doc.previewUrl) return;

    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: DocumentStatus.PROCESSING, error: undefined } : d));

    try {
      const base64 = doc.previewUrl.split(',')[1];
      const currentSettings = settings || await storageService.getSettings();
      const currentDocs = await storageService.getAllDocuments();

      // Process single document through pipeline
      const fileData = {
        id: doc.id,
        base64,
        file: { name: doc.fileName, type: doc.fileType } as File,
        url: doc.previewUrl,
      };

      setPipelineProgress({
        phase: 'starting',
        completed: 0,
        total: 6,
        message: 'Neuer Versuch gestartet...',
        batchIndex: 0,
        currentFile: doc.fileName,
      });

      const result = await documentProcessingPipeline.processDocument(
        fileData,
        currentDocs,
        currentSettings,
        (progress) => {
          setPipelineProgress({
            phase: progress.phase,
            completed: progress.completed,
            total: progress.total,
            message: progress.message,
            batchIndex: 0,
            currentFile: doc.fileName,
          });
        }
      );

      const updated = { ...doc, ...result.document };
      await handleSaveDocument(updated);

      // Update cost info
      const status = await documentProcessingPipeline.getStatus();
      setCostInfo({
        remaining: status.remaining,
        budget: status.budget,
        avgCost: status.avgCost,
      });

      setNotification('Dokument erfolgreich erneut verarbeitet.');
      setPipelineProgress(null);

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Retry fehlgeschlagen';
      const errDoc = { ...doc, status: DocumentStatus.ERROR, error: msg };
      await handleSaveDocument(errDoc);
      setPipelineProgress(null);
    }
  };

  const handleCompareDuplicates = (original: DocumentRecord, duplicate: DocumentRecord) => {
    setOriginalDoc(original);
    setCompareDoc(duplicate);
  };

  const handleCloseCompare = () => {
    setCompareDoc(null);
    setOriginalDoc(null);
  };

  const handleIgnoreDuplicate = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      const updated = {
        ...doc,
        status: DocumentStatus.REVIEW_NEEDED as DocumentStatus,
        duplicateOfId: undefined,
        duplicateConfidence: undefined,
        duplicateReason: undefined
      };
      await handleSaveDocument(updated);
    }
    handleCloseCompare();
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const d = doc.data;
        if (!doc.fileName.toLowerCase().includes(term) && !d?.lieferantName?.toLowerCase().includes(term) && 
            !d?.eigeneBelegNummer?.toLowerCase().includes(term) && !d?.bruttoBetrag?.toString().includes(term)) return false;
      }
      const dateStr = doc.data?.belegDatum || doc.uploadDate;
      const year = dateStr.substring(0, 4);
      const month = parseInt(dateStr.substring(5, 7), 10);
      if (filterYear !== 'all' && year !== filterYear) return false;
      if (filterMonth !== 'all' && month !== parseInt(filterMonth, 10)) return false;
      if (filterQuarter !== 'all') {
        const q = Math.ceil(month / 3);
        if (`Q${q}` !== filterQuarter) return false;
      }
      return true;
    });
  }, [documents, searchQuery, filterYear, filterQuarter, filterMonth]);

  const availableYears = useMemo(() => {
      const years = new Set<string>();
      documents.forEach(d => {
          const date = d.data?.belegDatum || d.uploadDate;
          if (date) years.add(date.substring(0, 4));
      });
      return Array.from(years).sort().reverse();
  }, [documents]);

  const renderContent = () => {
      if (viewMode === 'settings' && settings) {
          return <SettingsView settings={settings} _onSave={async (s) => {
            setSettings(s);
            // Local-first: Save to IndexedDB first
            await storageService.saveSettings(s);
            // Optionally sync to Supabase
            if (supabaseService.isSupabaseConfigured()) {
              try {
                await supabaseService.saveSettings(s);
              } catch (e) {
                // Supabase sync failed - settings saved locally
              }
            }
          }} onClose={() => setViewMode('document')} />;
      }
      if (viewMode === 'database') {
          return <DatabaseGrid
              documents={filteredDocuments}
              onOpen={(d) => { setSelectedDocId(d.id); }}
              onDelete={handleDeleteDocument}
              onMerge={handleMergeDocuments}
              onDuplicateCompare={(d) => {
                const original = documents.find(doc => doc.id === d.duplicateOfId);
                if (original) {
                  setOriginalDoc(original);
                  setCompareDoc(d);
                }
              }}
          />;
      }
      if (selectedDocId) {
          const doc = documents.find(d => d.id === selectedDocId);
          if (doc) return <DocumentDetail
              document={doc}
              allDocuments={documents}
              isOpen={true}
              onSave={handleSaveDocument}
              onDelete={handleDeleteDocument}
              onRetryOCR={handleRetryOCR}
              onSelectDocument={(d) => setSelectedDocId(d.id)}
              onClose={() => setSelectedDocId(null)}
              onMerge={handleMergeDocuments}
          />;
      }
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 md:p-8 bg-white/50 relative">
              {/* Modern Background Decor */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                   <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px]"></div>
                   <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 rounded-full blur-[100px]"></div>
              </div>

              <div className="max-w-xl w-full z-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 tracking-tight">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">ZOE Solar</span> Accounting
                  </h2>

                  {/* Pipeline Progress Indicator */}
                  {pipelineProgress && (
                    <div className="mb-6 p-4 bg-white rounded-2xl shadow-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{pipelineProgress.message}</span>
                        <span className="text-xs text-slate-500">{pipelineProgress.completed}/{pipelineProgress.total}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(pipelineProgress.completed / pipelineProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Phase: {pipelineProgress.phase} | Datei: {pipelineProgress.currentFile}
                      </div>
                    </div>
                  )}

                  {/* Cost Info */}
                  {costInfo && (
                    <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Budget verbleibend:</span>
                        <span className={`font-bold ${costInfo.remaining < 1 ? 'text-red-600' : 'text-green-600'}`}>
                          ${costInfo.remaining.toFixed(2)} / ${costInfo.budget.toFixed(2)}
                        </span>
                      </div>
                      {costInfo.avgCost > 0 && (
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-600">Ø Kosten/Doc:</span>
                          <span className="font-mono">${costInfo.avgCost.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <UploadArea onFilesSelected={handleFilesSelect} isProcessing={isProcessing} />

                  {/* Quick stats for mobile on empty state */}
                  <div className="mt-8 flex justify-center gap-6 text-slate-400 text-xs md:hidden">
                      <div className="text-center">
                          <div className="font-bold text-slate-600 text-lg">{documents.length}</div>
                          <div>Belege</div>
                      </div>
                      <div className="text-center">
                          <div className="font-bold text-slate-600 text-lg">{availableYears[0] || new Date().getFullYear()}</div>
                          <div>Aktuelles Jahr</div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const SidebarItem = ({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) => (
      <button 
        onClick={onClick} 
        className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-3 transition-all ${
            active 
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <span className={`${active ? 'text-blue-600' : 'text-slate-400'}`}>{icon}</span>
        {label}
      </button>
  );

  return (
    <div className="h-[100dvh] flex bg-white text-slate-900 font-sans text-sm antialiased relative overflow-hidden">
      
      {/* Toast Notification */}
      {notification && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span className="font-medium">{notification}</span>
          </div>
      )}

      {/* Private Document Toast */}
      {privateDocNotification && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-amber-50/90 backdrop-blur-md border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div className="flex flex-col min-w-0">
                  <span className="font-medium">Privatbeleg erkannt</span>
                  <span className="text-xs opacity-75 truncate">
                    {privateDocNotification.vendor} - {privateDocNotification.amount.toFixed(2)} EUR
                  </span>
                  <span className="text-[10px] opacity-60 truncate">
                    {privateDocNotification.reason}
                  </span>
              </div>
              <button
                onClick={() => setPrivateDocNotification(null)}
                className="ml-2 text-amber-600 hover:text-amber-800 flex-shrink-0"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
              </button>
          </div>
      )}

      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside 
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className="hidden md:flex bg-slate-50/50 border-r border-slate-200/60 flex-col z-20 flex-shrink-0 relative group backdrop-blur-xl"
      >
          <div 
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 z-50 transition-colors"
            onMouseDown={startResizing}
          ></div>

          <div className="h-16 flex items-center px-5 border-b border-slate-200/60 flex-none">
              <div className="font-bold text-lg flex items-center gap-2 text-slate-800 tracking-tight">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <span>ZOE</span>
              </div>
          </div>

          <div className="p-4 space-y-4 border-b border-slate-200/60">
             <div className="flex flex-col gap-1">
                 <SidebarItem 
                    active={viewMode === 'document'} 
                    label="Belege" 
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                    onClick={() => { setSelectedDocId(null); setViewMode('document'); }} 
                />
                 <SidebarItem 
                    active={viewMode === 'database'} 
                    label="Berichte" 
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                    onClick={() => { setSelectedDocId(null); setViewMode('database'); }} 
                 />
             </div>

             <div className="relative group">
                 <svg className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                 <input 
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" 
                    placeholder="Suchen..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                 />
             </div>
             
             <div className="flex gap-2">
                 <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-2 flex-1 outline-none focus:border-blue-500 cursor-pointer text-slate-600 font-medium"
                 >
                    <option value="all">Jahr</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
                 <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-2 w-16 outline-none focus:border-blue-500 cursor-pointer text-slate-600 font-medium"
                 >
                    <option value="all">Mon</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>{m}</option>
                    ))}
                 </select>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="flex flex-col p-2 gap-1">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Neueste ({filteredDocuments.length})
                </div>
                {filteredDocuments.map(doc => {
                    const isActive = selectedDocId === doc.id;
                    const isDragTarget = sidebarDragTarget === doc.id;
                    const isDup = doc.status === DocumentStatus.DUPLICATE;
                    const isErr = doc.status === DocumentStatus.ERROR;
                    const isReview = doc.status === DocumentStatus.REVIEW_NEEDED;
                    const isBlocked = isDup || isErr || isReview;
                    const displayId = doc.data?.eigeneBelegNummer || doc.id.substring(0, 8);
                    
                    return (
                        <div 
                            key={doc.id}
                            draggable={!isBlocked}
                            title={isDup ? `Duplikat: ${doc.duplicateReason}` : (isErr || isReview) ? (doc.error || doc.data?.ocr_rationale || '') : ''}
                            onClick={() => { setSelectedDocId(doc.id); setViewMode('document'); }}
                            onDragStart={(e) => {
                                if (isBlocked) {
                                    e.preventDefault();
                                    return;
                                }
                                e.dataTransfer.setData('text/plain', doc.id);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                                if (!isBlocked) {
                                    e.preventDefault();
                                    setSidebarDragTarget(doc.id);
                                }
                            }}
                            onDragLeave={() => setSidebarDragTarget(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setSidebarDragTarget(null);
                                if (isBlocked) return;
                                
                                const sourceId = e.dataTransfer.getData('text/plain');
                                if (sourceId && sourceId !== doc.id) {
                                    handleMergeDocuments(sourceId, doc.id);
                                }
                            }}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative
                                ${isActive ? 'bg-white shadow-md shadow-blue-500/5 text-blue-700 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-100/80'}
                                ${isDragTarget ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                                ${isDup && !isActive ? 'bg-red-50 text-red-600' : ''}
                                ${(isDup || isErr || isReview) ? 'opacity-80' : ''}
                            `}
                        >
                            <div className={`w-2 h-2 rounded-full flex-none ${isDup ? 'bg-red-500' : isErr ? 'bg-rose-500' : isReview ? 'bg-amber-500' : (isActive ? 'bg-blue-500' : 'bg-slate-300')}`}></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-mono font-medium text-xs truncate opacity-90">{displayId}</span>
                                    {doc.data?.bruttoBetrag && (
                                        <span className="text-[10px] opacity-70 font-mono ml-1">{Math.round(doc.data.bruttoBetrag)}€</span>
                                    )}
                                </div>
                                <div className="truncate text-xs opacity-70 flex items-center gap-1">
                                    {doc.data?.lieferantName || doc.fileName}
                                </div>
                            </div>
                            {/* Compare button for duplicates */}
                            {isDup && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const original = documents.find(d => d.id === doc.duplicateOfId);
                                        if (original) {
                                            handleCompareDuplicates(original, doc);
                                        }
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                                    title="Mit Original vergleichen"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7"/>
                                        <rect x="14" y="3" width="7" height="7"/>
                                        <rect x="14" y="14" width="7" height="7"/>
                                        <rect x="3" y="14" width="7" height="7"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}
             </div>
          </div>

          <div className="p-4 border-t border-slate-200/60 bg-slate-50/30">
               <SidebarItem 
                 active={viewMode === 'settings'} 
                 label="Einstellungen" 
                 icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2-2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
                 onClick={() => { setSelectedDocId(null); setViewMode('settings'); }} 
               />
          </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION (Visible only on Mobile) --- */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-16 bg-white/80 backdrop-blur-2xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl z-50 flex items-center justify-around px-2">
          <button 
             onClick={() => { setSelectedDocId(null); setViewMode('document'); }}
             className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'document' && !selectedDocId ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </button>
          
          <button 
             onClick={() => { if(documents.length > 0) setSelectedDocId(documents[0].id); else setViewMode('document'); }}
             className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedDocId ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </button>

          <button 
             onClick={() => { setSelectedDocId(null); setViewMode('database'); }}
             className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'database' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </button>

          <button 
             onClick={() => { setSelectedDocId(null); setViewMode('settings'); }}
             className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'settings' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2-2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/50 min-w-0 md:mb-0 mb-20">
          {renderContent()}
      </main>

      {/* Duplicate Compare Modal */}
      {compareDoc && originalDoc && (
        <DuplicateCompareModal
          original={originalDoc}
          duplicate={compareDoc}
          allDocuments={documents}
          onClose={handleCloseCompare}
          onDelete={handleDeleteDocument}
          onSave={handleSaveDocument}
          onMerge={handleMergeDocuments}
          onSelectDocument={(doc) => { setSelectedDocId(doc.id); setViewMode('document'); handleCloseCompare(); }}
          onIgnoreDuplicate={handleIgnoreDuplicate}
        />
      )}
    </div>
  );
}