/**
 * Optimized Main App Component - 2026 UX Standards
 * Features: Improved layout, better empty states, enhanced accessibility, performance optimizations
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  EnhancedLayout,
  EnhancedHeader,
  EnhancedSidebar,
  EnhancedMain,
  EnhancedFooter,
  EnhancedGrid,
  EnhancedEmptyState,
  NoDocumentsState,
  NoResultsState,
  EnhancedButton,
  EnhancedInput,
  EnhancedCard,
  useFocusManagement,
} from '../components/designOS';
import { DatabaseGrid } from '../components/database-grid';
import { DocumentDetail } from '../components/DetailModal';
import { SettingsView } from '../components/SettingsView';
import { AuthView } from '../components/AuthView';
import { BackupView } from '../components/BackupView';
import { MicroInteractionsDemo } from '../components/designOS/MicroInteractionsDemo';
import { analyzeDocumentWithGemini } from '../services/geminiService';
import { applyAccountingRules, generateZoeInvoiceId } from '../services/ruleEngine';
import * as storageService from '../services/storageService';
import * as supabaseService from '../services/supabaseService';
import { detectPrivateDocument } from '../services/privateDocumentDetection';
import { DocumentRecord, DocumentStatus, AppSettings, ExtractedData } from '../types';
import { normalizeExtractedData } from '../services/extractedDataNormalization';
import { formatPreflightForDialog, runExportPreflight } from '../services/exportPreflight';
import { User } from '../services/supabaseService';

// Helper functions (moved to separate utils file in real implementation)
const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const readFileToBase64 = (file: File): Promise<{ base64: string; url: string }> => {
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

const mergeDocuments = (
  localDocs: DocumentRecord[],
  cloudDocs: DocumentRecord[]
): DocumentRecord[] => {
  const docMap = new Map<string, DocumentRecord>();
  for (const doc of localDocs) docMap.set(doc.id, doc);
  for (const cloudDoc of cloudDocs) {
    const existing = docMap.get(cloudDoc.id);
    if (!existing) {
      docMap.set(cloudDoc.id, cloudDoc);
    } else {
      const localDate = new Date(existing.uploadDate).getTime();
      const cloudDate = new Date(cloudDoc.uploadDate).getTime();
      if (cloudDate > localDate) docMap.set(cloudDoc.id, cloudDoc);
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
    vendor.includes('manuelle eingabe') || (score <= 0 && (data.bruttoBetrag ?? 0) === 0);

  if (looksLikeManualTemplate) {
    const errorMsg = rationale || description || 'Analyse fehlgeschlagen. Bitte manuell erfassen.';
    return {
      status: isTechnicalFailure ? DocumentStatus.ERROR : DocumentStatus.REVIEW_NEEDED,
      error: errorMsg,
    };
  }

  if (
    rationale.includes('Datum unklar') ||
    rationale.includes('Summen widersprüchlich') ||
    score < 6
  ) {
    return { status: DocumentStatus.REVIEW_NEEDED, error: rationale || 'Bitte Daten prüfen.' };
  }

  return { status: DocumentStatus.COMPLETED, error: undefined };
};

const findSemanticDuplicate = (
  data: Partial<ExtractedData>,
  existingDocs: DocumentRecord[]
): { doc: DocumentRecord; reason: string; confidence: number } | undefined => {
  if (!data.bruttoBetrag && !data.belegNummerLieferant) return undefined;

  const normalize = (s: string | undefined) => (s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '');
  const newInvoiceNum = normalize(data.belegNummerLieferant);
  const newAmount = data.bruttoBetrag;
  const newDate = data.belegDatum;
  const newVendor = normalize(data.lieferantName);

  for (const doc of existingDocs) {
    if (!doc.data || doc.status === DocumentStatus.ERROR || doc.status === DocumentStatus.DUPLICATE)
      continue;

    const existingInvNum = normalize(doc.data.belegNummerLieferant);
    const existingAmount = doc.data.bruttoBetrag;
    const existingDate = doc.data.belegDatum;

    // Hard match: Invoice Number + Amount
    if (newInvoiceNum.length >= 2 && newInvoiceNum === existingInvNum) {
      if (newAmount !== undefined && existingAmount !== undefined) {
        if (Math.abs(newAmount - existingAmount) < 0.1) {
          return {
            doc,
            reason: `Belegnummer (${doc.data.belegNummerLieferant}) und Betrag identisch.`,
            confidence: 0.95,
          };
        }
      }
    }

    // Hard match: Invoice Number + Date
    if (newInvoiceNum.length >= 3 && newInvoiceNum === existingInvNum) {
      if (newDate && existingDate && newDate === existingDate) {
        return {
          doc,
          reason: `Belegnummer (${doc.data.belegNummerLieferant}) und Datum identisch.`,
          confidence: 0.9,
        };
      }
    }

    // Scoring approach
    let score = 0;
    if (newAmount !== undefined && existingAmount !== undefined) {
      if (Math.abs(newAmount - existingAmount) < 0.05) score += 40;
    }
    if (newDate && existingDate && newDate === existingDate) score += 30;

    const existingVendor = normalize(doc.data.lieferantName);
    if (newVendor && existingVendor) {
      if (newVendor.includes(existingVendor) || existingVendor.includes(newVendor)) score += 20;
    }

    if (newInvoiceNum.length > 4 && existingInvNum.includes(newInvoiceNum)) score += 20;

    if (score >= 70) {
      return {
        doc,
        reason: 'Hohe Ähnlichkeit bei Datum, Betrag und Lieferant.',
        confidence: Math.min(0.89, score / 100),
      };
    }
  }
  return undefined;
};

export default function App() {
  // State management
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    'document' | 'settings' | 'database' | 'auth' | 'backup' | 'interactions'
  >('document');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [privateDocNotification, setPrivateDocNotification] = useState<{
    vendor: string;
    amount: number;
    reason: string;
  } | null>(null);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Filter state
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVendor, setFilterVendor] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterTaxCategory, setFilterTaxCategory] = useState<string>('all');

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  // Focus management
  const { containerRef } = useFocusManagement();

  // Memoized filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const d = doc.data;
        if (
          !doc.fileName.toLowerCase().includes(term) &&
          !d?.lieferantName?.toLowerCase().includes(term) &&
          !d?.eigeneBelegNummer?.toLowerCase().includes(term) &&
          !d?.bruttoBetrag?.toString().includes(term)
        )
          return false;
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

  // Available years for filters
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    documents.forEach((d) => {
      const date = d.data?.belegDatum || d.uploadDate;
      if (date) years.add(date.substring(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [documents]);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        const [localDocs, localSettings] = await Promise.all([
          storageService.getAllDocuments(),
          storageService.getSettings(),
        ]);
        setDocuments(
          localDocs.sort(
            (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          )
        );
        setSettings(localSettings);

        if (supabaseService.isSupabaseConfigured()) {
          try {
            const [cloudDocs, cloudSettings] = await Promise.all([
              supabaseService.getAllDocuments(),
              supabaseService.getSettings(),
            ]);
            const mergedDocs = mergeDocuments(localDocs || [], cloudDocs || []);
            setDocuments(
              mergedDocs.sort(
                (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
              )
            );

            for (const doc of mergedDocs) {
              await storageService.saveDocument(doc);
            }

            if (cloudSettings) {
              await storageService.saveSettings(cloudSettings);
              setSettings(cloudSettings);
            }
          } catch (syncError) {
            console.warn('Supabase sync failed, using local data:', syncError);
          }
        }
      } catch (e) {
        console.error('Init Error:', e);
        setNotification('Fehler beim Laden der Daten. IndexedDB oder Supabase prüfen.');
      }
    };
    initData();
  }, []);

  // Notification cleanup
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

  // File upload handler
  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isProcessing) return;

      setIsProcessing(true);
      setViewMode('document');

      const newDocs: DocumentRecord[] = [];
      const fileData: { id: string; file: File; hash: string; base64: string; url: string }[] = [];

      for (const file of files) {
        const id = crypto.randomUUID();
        const [hash, { base64, url }] = await Promise.all([
          computeFileHash(file),
          readFileToBase64(file),
        ]);
        fileData.push({ id, file, hash, base64, url });
        newDocs.push({
          id,
          fileName: file.name,
          fileType: file.type,
          uploadDate: new Date().toISOString(),
          status: DocumentStatus.PROCESSING,
          data: null,
          previewUrl: url,
          fileHash: hash,
        });
      }

      setDocuments((prev) => [...newDocs, ...prev]);

      const currentSettings = settings || (await storageService.getSettings());
      const processedBatch: DocumentRecord[] = [];
      let currentDocsSnapshot = [...documents, ...newDocs];

      const processingPromises = fileData.map(async (item) => {
        const isExactDuplicate = currentDocsSnapshot.some(
          (d) => d.id !== item.id && d.fileHash === item.hash
        );
        if (isExactDuplicate) {
          const original = currentDocsSnapshot.find((d) => d.fileHash === item.hash);
          return {
            type: 'DOC',
            doc: {
              id: item.id,
              status: DocumentStatus.DUPLICATE,
              error: undefined,
              data: null,
              duplicateReason: 'Datei identisch (Hash)',
              duplicateOfId: original?.id,
              duplicateConfidence: 1,
            },
          };
        }

        try {
          const extractedRaw = await analyzeDocumentWithGemini(item.base64, item.file.type);
          const extracted = normalizeExtractedData(extractedRaw);
          const semanticDup = findSemanticDuplicate(extracted, currentDocsSnapshot);

          if (semanticDup && semanticDup.doc.id !== item.id) {
            return {
              type: 'DOC',
              doc: {
                id: item.id,
                status: DocumentStatus.DUPLICATE,
                data: extracted,
                duplicateReason: semanticDup.reason || 'Inhaltliches Duplikat erkannt',
                duplicateOfId: semanticDup.doc.id,
                duplicateConfidence: semanticDup.confidence,
              },
            };
          }

          // Private document detection
          const privateCheck = detectPrivateDocument(extracted);
          if (privateCheck.isPrivate && privateCheck.detectedVendor) {
            return {
              type: 'PRIVATE_DOC',
              id: item.id,
              base64: item.base64,
              fileName: item.file.name,
              fileType: item.file.type,
              data: extracted,
              vendor: privateCheck.detectedVendor,
              reason: privateCheck.reason || 'Private Positionen erkannt',
            };
          }

          const outcome = classifyOcrOutcome(extracted);
          return { type: 'DOC', data: extracted, id: item.id, outcome };
        } catch (e) {
          return {
            type: 'DOC',
            doc: {
              id: item.id,
              status: DocumentStatus.ERROR,
              error: 'KI Analyse fehlgeschlagen',
              data: null,
              duplicateReason: undefined,
            },
          };
        }
      });

      const results = await Promise.all(processingPromises);

      for (const res of results) {
        if (res.type === 'PRIVATE_DOC') {
          const privateRes = res as any;
          try {
            await supabaseService.savePrivateDocument(
              privateRes.id,
              privateRes.fileName,
              privateRes.fileType,
              privateRes.base64,
              privateRes.data,
              privateRes.reason
            );

            setPrivateDocNotification({
              vendor: privateRes.vendor,
              amount: privateRes.data?.bruttoBetrag || 0,
              reason: privateRes.reason,
            });
          } catch (e) {
            console.error('Failed to save private document:', e);
            const fallbackDoc: DocumentRecord = {
              id: privateRes.id,
              fileName: privateRes.fileName,
              fileType: privateRes.fileType,
              uploadDate: new Date().toISOString(),
              status: DocumentStatus.PRIVATE,
              data: { ...privateRes.data, privatanteil: true },
            };
            processedBatch.push(fallbackDoc);
            await supabaseService.saveDocument(fallbackDoc);
          }
          continue;
        }

        if (res.type === 'DOC') {
          let finalDoc: DocumentRecord | undefined;

          if ('doc' in res && res.doc) {
            const resultDoc = res.doc;
            const placeholder = newDocs.find((d) => d.id === resultDoc.id);
            if (!placeholder) continue;

            finalDoc = { ...placeholder, ...resultDoc } as DocumentRecord;

            if (finalDoc.status === DocumentStatus.DUPLICATE && finalDoc.data) {
              const zoeId = generateZoeInvoiceId(
                finalDoc.data.belegDatum || '',
                currentDocsSnapshot
              );
              finalDoc.data.eigeneBelegNummer = zoeId;
            }
          } else if ('data' in res && res.data && res.id) {
            const { id, data } = res as any;
            const placeholder = newDocs.find((d) => d.id === id);
            if (!placeholder) continue;

            const zoeId = generateZoeInvoiceId(data.belegDatum || '', currentDocsSnapshot);
            let overrideRule: { accountId?: string; taxCategoryValue?: string } | undefined =
              undefined;

            if (data.lieferantName) {
              const rule = await storageService.getVendorRule(data.lieferantName);
              if (rule)
                overrideRule = {
                  accountId: rule.accountId,
                  taxCategoryValue: rule.taxCategoryValue,
                };
            }

            const normalized = normalizeExtractedData(data);
            const outcome = (res as any).outcome || classifyOcrOutcome(normalized);
            const finalData = applyAccountingRules(
              { ...normalized, eigeneBelegNummer: zoeId },
              currentDocsSnapshot,
              currentSettings,
              overrideRule
            );

            finalDoc = {
              ...placeholder,
              status: outcome.status,
              data: finalData,
              error: outcome.error,
            };
            currentDocsSnapshot.push(finalDoc);
          }

          if (finalDoc) {
            processedBatch.push(finalDoc);
            await storageService.saveDocument(finalDoc);
            if (supabaseService.isSupabaseConfigured()) {
              try {
                await supabaseService.saveDocument(finalDoc);
              } catch (e) {
                console.warn('Failed to sync document to Supabase:', e);
              }
            }
          }
        }
      }

      setDocuments((prev) => {
        const cleanPrev = prev.filter((d) => !newDocs.some((n) => n.id === d.id));
        const updatedOldDocs = cleanPrev;
        return [...processedBatch, ...updatedOldDocs];
      });

      setIsProcessing(false);
      if (processedBatch.length > 0) setSelectedDocId(processedBatch[0].id);
    },
    [documents, settings]
  );

  // Other handlers...
  const handleSaveDocument = async (updatedDoc: DocumentRecord) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc)));
    await storageService.saveDocument(updatedDoc);
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.saveDocument(updatedDoc);
      } catch (e) {
        console.warn('Failed to sync document to Supabase:', e);
      }
    }
    if (
      updatedDoc.data?.lieferantName &&
      updatedDoc.data?.kontierungskonto &&
      updatedDoc.data?.steuerkategorie
    ) {
      await storageService.saveVendorRule(
        updatedDoc.data.lieferantName,
        updatedDoc.data.kontierungskonto,
        updatedDoc.data.steuerkategorie
      );
      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.saveVendorRule(
            updatedDoc.data.lieferantName,
            updatedDoc.data.kontierungskonto,
            updatedDoc.data.steuerkategorie
          );
        } catch (e) {
          console.warn('Failed to sync vendor rule to Supabase:', e);
        }
      }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDocId === id) setSelectedDocId(null);
    await storageService.deleteDocument(id);
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.deleteDocument(id);
      } catch (e) {
        console.warn('Failed to delete document from Supabase:', e);
      }
    }
  };

  const handleMergeDocuments = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceDoc = documents.find((d) => d.id === sourceId);
    const targetDoc = documents.find((d) => d.id === targetId);
    if (!sourceDoc || !targetDoc) return;

    if (
      sourceDoc.status === DocumentStatus.DUPLICATE ||
      targetDoc.status === DocumentStatus.DUPLICATE
    ) {
      setNotification('Merge abgebrochen: Duplikate können nicht als Quelle/Ziel genutzt werden.');
      return;
    }

    if (sourceDoc.status === DocumentStatus.ERROR || targetDoc.status === DocumentStatus.ERROR) {
      setNotification('Merge abgebrochen: Belege mit Fehlerstatus können nicht gemerged werden.');
      return;
    }

    if (!confirm(`Möchten Sie "${sourceDoc.fileName}" in "${targetDoc.fileName}" integrieren?`))
      return;

    const newAttachment = {
      id: crypto.randomUUID(),
      url: sourceDoc.previewUrl || '',
      type: sourceDoc.fileType,
      name: sourceDoc.fileName,
    };

    const updatedTarget = {
      ...targetDoc,
      attachments: [
        ...(targetDoc.attachments || []),
        newAttachment,
        ...(sourceDoc.attachments || []),
      ],
    };

    await storageService.saveDocument(updatedTarget);
    await storageService.deleteDocument(sourceId);

    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.saveDocument(updatedTarget);
        await supabaseService.deleteDocument(sourceId);
      } catch (e) {
        console.warn('Failed to sync merge to Supabase:', e);
      }
    }

    setDocuments((prev) =>
      prev.filter((d) => d.id !== sourceId).map((d) => (d.id === targetId ? updatedTarget : d))
    );
    setNotification('Belege erfolgreich zusammengeführt.');
    if (selectedDocId === sourceId) setSelectedDocId(targetId);
  };

  const handleRetryOCR = async (doc: DocumentRecord) => {
    if (!doc.previewUrl) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, status: DocumentStatus.PROCESSING, error: undefined } : d
      )
    );

    try {
      const base64 = doc.previewUrl.split(',')[1];
      const extractedRaw = await analyzeDocumentWithGemini(base64, doc.fileType);
      const extracted = normalizeExtractedData(extractedRaw);
      const currentSettings = settings || (await storageService.getSettings());
      const existingId = doc.data?.eigeneBelegNummer;
      let overrideRule: { accountId?: string; taxCategoryValue?: string } | undefined = undefined;

      if (extracted.lieferantName) {
        const rule = await storageService.getVendorRule(extracted.lieferantName);
        if (rule)
          overrideRule = { accountId: rule.accountId, taxCategoryValue: rule.taxCategoryValue };
      }

      const finalData = applyAccountingRules(extracted, documents, currentSettings, overrideRule);
      finalData.eigeneBelegNummer =
        existingId || generateZoeInvoiceId(finalData.belegDatum, documents);
      const outcome = classifyOcrOutcome(finalData);
      const updated = { ...doc, status: outcome.status, data: finalData, error: outcome.error };
      await handleSaveDocument(updated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Retry fehlgeschlagen';
      const errDoc = { ...doc, status: DocumentStatus.ERROR, error: msg };
      await handleSaveDocument(errDoc);
    }
  };

  const handleExportSQLWithPreflight = async () => {
    if (!settings) return;

    const docsToExport = filteredDocuments;
    const preflight = runExportPreflight(docsToExport, settings);
    const dialog = formatPreflightForDialog(preflight);

    if (preflight.blockers.length > 0) {
      alert(`${dialog.title}\n\n${dialog.body}`);
      return;
    }

    if (preflight.warnings.length > 0) {
      const ok = confirm(`${dialog.title}\n\n${dialog.body}\n\nTrotzdem exportieren?`);
      if (!ok) return;
    }

    const sql = supabaseService.exportDocumentsToSQL(docsToExport, settings);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const y = filterYear === 'all' ? 'all' : filterYear;
    const q = filterQuarter === 'all' ? 'all' : filterQuarter;
    const m = filterMonth === 'all' ? 'all' : filterMonth;
    const fileName = `zoe_belege_${y}_${q}_${m}_${timestamp}.sql`;
    const url = URL.createObjectURL(new Blob([sql], { type: 'text/sql' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  // Render functions
  const renderEmptyState = () => (
    <div className="h-full flex items-center justify-center p-8">
      <NoDocumentsState
        onUpload={() => {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.pdf,.jpg,.jpeg,.png,.bmp,.tiff,.tif';
          fileInput.multiple = true;
          fileInput.onchange = (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            if (files.length > 0) handleFilesSelect(files);
          };
          fileInput.click();
        }}
        onBrowse={() => setViewMode('database')}
      />
    </div>
  );

  const renderDatabaseView = () => (
    <DatabaseGrid
      documents={filteredDocuments}
      onOpen={(d) => {
        setSelectedDocId(d.id);
      }}
      onDelete={handleDeleteDocument}
      onMerge={handleMergeDocuments}
      onDuplicateCompare={(d) => {
        const original = documents.find((doc) => doc.id === d.duplicateOfId);
        if (original) {
          setSelectedDocId(original.id);
          setViewMode('document');
        }
      }}
    />
  );

  const renderSettingsView = () => (
    <SettingsView
      settings={settings!}
      onSave={async (s) => {
        setSettings(s);
        await storageService.saveSettings(s);
        if (supabaseService.isSupabaseConfigured()) {
          try {
            await supabaseService.saveSettings(s);
          } catch (e) {
            console.warn('Failed to sync settings to Supabase:', e);
          }
        }
      }}
      onClose={() => setViewMode('document')}
    />
  );

  const renderInteractionsView = () => (
    <div className="p-6">
      <EnhancedCard variant="glass" className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Interaktive Demo</h2>
        <p className="text-text-muted">
          Erkunde die neuen Design-Interaktionen und Mikro-Animationen.
        </p>
      </EnhancedCard>
      <MicroInteractionsDemo />
    </div>
  );

  const renderDocumentDetailView = () => {
    const doc = documents.find((d) => d.id === selectedDocId);
    if (!doc) return renderEmptyState();

    return (
      <DocumentDetail
        document={doc}
        allDocuments={documents}
        isOpen={true}
        onSave={handleSaveDocument}
        onDelete={handleDeleteDocument}
        onRetryOCR={handleRetryOCR}
        onSelectDocument={(d) => setSelectedDocId(d.id)}
        onClose={() => setSelectedDocId(null)}
        onMerge={handleMergeDocuments}
      />
    );
  };

  const renderContent = () => {
    if (viewMode === 'settings' && settings) return renderSettingsView();
    if (viewMode === 'interactions') return renderInteractionsView();
    if (viewMode === 'database') return renderDatabaseView();
    if (selectedDocId) return renderDocumentDetailView();

    // Show filtered results empty state if there are documents but none match filters
    if (documents.length > 0 && filteredDocuments.length === 0) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <NoResultsState
            searchTerm={searchQuery}
            onClearFilter={() => setSearchQuery('')}
            onResetFilters={() => {
              setFilterYear('all');
              setFilterQuarter('all');
              setFilterMonth('all');
              setFilterStatus('all');
            }}
          />
        </div>
      );
    }

    return documents.length === 0 ? renderEmptyState() : renderDocumentDetailView();
  };

  // Navigation items
  const navigationItems = [
    { id: 'document', label: 'Belege', icon: '📋', description: 'Dokumente verwalten' },
    { id: 'database', label: 'Berichte', icon: '📊', description: 'Auswertungen & Export' },
    { id: 'interactions', label: 'Interaktionen', icon: '🎯', description: 'Demo-Bereich' },
    { id: 'settings', label: 'Einstellungen', icon: '⚙️', description: 'Konfiguration' },
  ];

  // Stats for dashboard
  const stats = [
    {
      label: 'Belege',
      value: documents.length.toString(),
      icon: '📊',
      trend: documents.length > 0 ? 'up' : 'neutral',
    },
    {
      label: 'Heute verarbeitet',
      value: documents
        .filter((d) => new Date(d.uploadDate).toDateString() === new Date().toDateString())
        .length.toString(),
      icon: '📈',
      trend: 'neutral',
    },
    {
      label: 'Durchschnitt',
      value:
        documents.length > 0
          ? `${(documents.reduce((acc, d) => acc + (d.data?.bruttoBetrag || 0), 0) / documents.length).toFixed(2)}€`
          : '0.00€',
      icon: '💶',
      trend: 'neutral',
    },
    {
      label: 'Jahr',
      value: availableYears[0] || new Date().getFullYear().toString(),
      icon: '📅',
      trend: 'neutral',
    },
  ];

  return (
    <EnhancedLayout variant="dashboard" ref={containerRef}>
      {/* Enhanced Sidebar */}
      <EnhancedSidebar
        title="ZOE Solar Accounting"
        variant="navigation"
        collapsible={true}
        className={clsx(sidebarCollapsed && 'w-20')}
      >
        {/* Quick Actions */}
        <div className="space-y-4">
          <EnhancedCard variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text">Schnellaktionen</h3>
            </div>

            <div className="space-y-2">
              <EnhancedButton
                variant="primary"
                size="sm"
                fullWidth={true}
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = '.pdf,.jpg,.jpeg,.png,.bmp,.tiff,.tif';
                  fileInput.multiple = true;
                  fileInput.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    if (files.length > 0) handleFilesSelect(files);
                  };
                  fileInput.click();
                }}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              >
                {sidebarCollapsed ? '' : 'Beleg hochladen'}
              </EnhancedButton>

              <EnhancedButton
                variant="ghost"
                size="sm"
                fullWidth={true}
                onClick={() => setViewMode('database')}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                }
              >
                {sidebarCollapsed ? '' : 'Alle Belege'}
              </EnhancedButton>
            </div>
          </EnhancedCard>

          {/* Search */}
          <EnhancedCard variant="filled" className="p-4">
            <EnhancedInput
              id="search"
              placeholder="Dokumente durchsuchen..."
              value={searchQuery}
              onChange={setSearchQuery}
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text-muted"
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              size="sm"
              variant="filled"
            />
          </EnhancedCard>

          {/* Navigation */}
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedDocId(null);
                  setViewMode(item.id as any);
                }}
                className={clsx(
                  'w-full text-left p-3 rounded-lg transition-all duration-300 group',
                  viewMode === item.id && !selectedDocId
                    ? 'bg-primary/10 border border-primary/30 text-primary'
                    : 'text-text hover:bg-surface-hover'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-text-muted">{item.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Document List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Neueste Dokumente
              </div>
              <div className="text-xs text-text-muted">{filteredDocuments.length}</div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredDocuments.slice(0, 10).map((doc) => {
                const isActive = selectedDocId === doc.id;
                const isDup = doc.status === DocumentStatus.DUPLICATE;
                const isErr = doc.status === DocumentStatus.ERROR;
                const isReview = doc.status === DocumentStatus.REVIEW_NEEDED;
                const displayId = doc.data?.eigeneBelegNummer || doc.id.substring(0, 8);

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setViewMode('document');
                    }}
                    className={clsx(
                      'p-3 rounded-lg cursor-pointer transition-all duration-300 group',
                      isActive
                        ? 'bg-surface-hover border border-primary/30'
                        : 'hover:bg-surface-hover',
                      (isDup || isErr || isReview) && 'opacity-75'
                    )}
                    title={doc.data?.lieferantName || doc.fileName}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={clsx(
                              'w-2 h-2 rounded-full',
                              isDup
                                ? 'bg-red-500'
                                : isErr
                                  ? 'bg-rose-500'
                                  : isReview
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                            )}
                          ></span>
                          <span className="font-mono text-xs font-medium text-text group-hover:text-primary transition-colors">
                            {displayId}
                          </span>
                          {isDup && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded-full">
                              Duplikat
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {doc.data?.lieferantName || doc.fileName}
                        </div>
                      </div>
                      <div className="text-right">
                        {doc.data?.bruttoBetrag && (
                          <div className="font-mono text-sm font-semibold text-text">
                            {doc.data.bruttoBetrag.toFixed(2)}€
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredDocuments.length > 10 && (
                <div className="text-xs text-text-muted text-center py-2 border-t border-border/40">
                  +{filteredDocuments.length - 10} weitere
                </div>
              )}
            </div>
          </div>
        </div>
      </EnhancedSidebar>

      {/* Enhanced Main Content */}
      <EnhancedMain variant="default">
        {/* Enhanced Header */}
        <EnhancedHeader
          title={
            viewMode === 'document'
              ? 'Belegverwaltung'
              : viewMode === 'database'
                ? 'Datenbank'
                : 'Einstellungen'
          }
          subtitle={
            viewMode === 'document' ? 'Dokumente hochladen, analysieren und verwalten' : undefined
          }
          breadcrumbs={[
            { label: 'ZOE Solar', href: '/' },
            {
              label:
                viewMode === 'document'
                  ? 'Belege'
                  : viewMode === 'database'
                    ? 'Berichte'
                    : 'Einstellungen',
            },
          ]}
          variant="with-actions"
          actions={
            <div className="flex items-center gap-2">
              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = '.pdf,.jpg,.jpeg,.png,.bmp,.tiff,.tif';
                  fileInput.multiple = true;
                  fileInput.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    if (files.length > 0) handleFilesSelect(files);
                  };
                  fileInput.click();
                }}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              >
                Hochladen
              </EnhancedButton>

              {viewMode === 'database' && (
                <EnhancedButton
                  variant="secondary"
                  size="sm"
                  onClick={handleExportSQLWithPreflight}
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                >
                  Exportieren
                </EnhancedButton>
              )}
            </div>
          }
        />

        {/* Main Content Area */}
        <div className="animate-in fade-in duration-500">{renderContent()}</div>

        {/* Footer */}
        <EnhancedFooter variant="simple" />
      </EnhancedMain>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-3">
        {notification && (
          <div className="glass-card border-primary/30 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-3 p-4">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="font-semibold text-text">{notification}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-auto text-text-muted hover:text-text transition-colors"
                aria-label="Close notification"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {privateDocNotification && (
          <div className="glass-card border-warning/30 bg-warning/5 animate-in slide-in-from-right duration-500">
            <div className="flex items-start gap-3 p-4">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse mt-1"></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-warning">Privatbeleg erkannt</div>
                <div className="text-sm text-text-muted mt-1">
                  {privateDocNotification.vendor} • {privateDocNotification.amount.toFixed(2)} EUR
                </div>
                <div className="text-xs text-text-muted mt-1 line-clamp-2">
                  {privateDocNotification.reason}
                </div>
              </div>
              <button
                onClick={() => setPrivateDocNotification(null)}
                className="text-warning hover:text-warning/80 transition-colors p-1"
                aria-label="Close private document notification"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </EnhancedLayout>
  );
}
