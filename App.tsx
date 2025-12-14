
import React, { useState, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { DatabaseView } from './components/DatabaseView';
import { DatabaseGrid } from './components/DatabaseGrid';
import { DocumentDetail } from './components/DetailModal';
import { SettingsView } from './components/SettingsView';
import { analyzeDocumentWithGemini } from './services/geminiService';
import { applyAccountingRules } from './services/ruleEngine';
import * as storageService from './services/storageService';
import { DocumentRecord, DocumentStatus, AppSettings, ExtractedData } from './types';

// Helper: Calculate SHA-256 Hash of a file
const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function App() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'document' | 'settings' | 'database'>('document');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Load documents and settings on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [savedDocs, savedSettings] = await Promise.all([
           storageService.getAllDocuments(),
           storageService.getSettings()
        ]);
        
        // Sort by upload date descending (newest first)
        const sorted = savedDocs.sort((a, b) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
        setDocuments(sorted);
        setSettings(savedSettings);
      } catch (e) {
        console.error("Failed to load data from database", e);
      }
    };
    initData();
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setViewMode('document');
    
    const docId = crypto.randomUUID();
    let previewUrlStr = '';

    try {
      // 1. Calculate Hash & Preview
      const [fileHash, { base64Data, previewUrl }] = await Promise.all([
        computeFileHash(file),
        new Promise<{base64Data: string, previewUrl: string}>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Part = result.split(',')[1];
            resolve({ base64Data: base64Part, previewUrl: result });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      ]);
      previewUrlStr = previewUrl;

      // 2. CHECK 1: Exact File Duplicate (Hash)
      // If we find the exact same file, we skip the AI call to save money and time.
      const exactDuplicate = documents.find(d => d.fileHash === fileHash);

      if (exactDuplicate) {
        // Create duplicate record immediately with data from original
        const dupDoc: DocumentRecord = {
          id: docId,
          fileName: file.name,
          fileType: file.type,
          uploadDate: new Date().toISOString(),
          status: DocumentStatus.DUPLICATE, // Explicit status
          data: exactDuplicate.data, // Copy data
          previewUrl: previewUrl,
          fileHash: fileHash,
          duplicateOfId: exactDuplicate.id
        };

        await storageService.saveDocument(dupDoc);
        setDocuments(prev => [dupDoc, ...prev]);
        setSelectedDocId(dupDoc.id);
        setIsProcessing(false);
        alert(`Duplikat erkannt! Diese Datei existiert bereits (Original: ${exactDuplicate.fileName}).`);
        return;
      }

      // 3. Create initial processing record
      const newDoc: DocumentRecord = {
        id: docId,
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        status: DocumentStatus.PROCESSING,
        data: null,
        previewUrl: previewUrl,
        fileHash: fileHash
      };

      await storageService.saveDocument(newDoc);
      setDocuments(prev => [newDoc, ...prev]);
      setSelectedDocId(newDoc.id);

      // 4. Call Gemini for Extraction
      const extractedRaw = await analyzeDocumentWithGemini(base64Data, file.type);
      
      // 5. Apply Deterministic Rule Engine
      const processedData = applyAccountingRules(extractedRaw as ExtractedData, documents);

      // 6. CHECK 2: Semantic/Business Duplicate
      // Logic: Same Vendor AND (Same Invoice Number OR (Same Date AND Same Amount))
      const cleanStr = (s?: string) => (s || '').toLowerCase().trim();
      
      const semanticDuplicate = documents.find(d => {
        if (!d.data || d.id === docId) return false;
        
        const sameVendor = cleanStr(d.data.lieferantName) === cleanStr(processedData.lieferantName);
        if (!sameVendor) return false;

        // Rule A: Invoice Number Match (if exists and longer than 2 chars)
        if (d.data.belegNummerLieferant && processedData.belegNummerLieferant && 
            d.data.belegNummerLieferant.length > 2) {
             if (cleanStr(d.data.belegNummerLieferant) === cleanStr(processedData.belegNummerLieferant)) {
               return true;
             }
        }

        // Rule B: Date + Amount Match (Fallback if invoice number missing or fuzzy)
        const sameDate = d.data.belegDatum === processedData.belegDatum;
        const sameAmount = Math.abs((d.data.bruttoBetrag || 0) - (processedData.bruttoBetrag || 0)) < 0.02; // Cent tolerance

        return sameDate && sameAmount;
      });

      // 7. Finalize Record
      const completedDoc: DocumentRecord = { 
        ...newDoc, 
        status: semanticDuplicate ? DocumentStatus.DUPLICATE : DocumentStatus.COMPLETED, 
        duplicateOfId: semanticDuplicate ? semanticDuplicate.id : undefined,
        data: processedData 
      };

      await storageService.saveDocument(completedDoc);
      setDocuments(prev => prev.map(d => d.id === docId ? completedDoc : d));

      if (semanticDuplicate) {
         alert(`Mögliches Duplikat erkannt (Ähnlichkeit mit ${semanticDuplicate.fileName}).`);
      }

    } catch (error) {
      console.error("Processing failed", error);
      
      const errorDoc: DocumentRecord = {
        id: docId,
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        status: DocumentStatus.ERROR,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        previewUrl: previewUrlStr
      };

      await storageService.saveDocument(errorDoc);
      setDocuments(prev => prev.map(d => d.id === docId ? errorDoc : d));
      
      alert("Fehler bei der Analyse. Der Beleg wurde gespeichert, aber Daten konnten nicht extrahiert werden.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDocument = async (updatedDoc: DocumentRecord) => {
    setDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    try {
      await storageService.saveDocument(updatedDoc);
    } catch (e) {
      console.error("Failed to save changes", e);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Diesen Beleg wirklich löschen?')) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDocId === id) setSelectedDocId(null);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      try {
        await storageService.deleteDocument(id);
      } catch (e) {
        console.error("Failed to delete from DB", e);
      }
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      await storageService.saveSettings(newSettings);
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  const handleExportCSV = () => {
    if (documents.length === 0) {
      alert("Keine Daten zum Exportieren vorhanden.");
      return;
    }

    const headers = [
      "Belegdatum", 
      "Eigene Beleg-Nr", 
      "Lieferant", 
      "Rechnungs-Nr", 
      "Netto", 
      "MwSt 7%", 
      "MwSt 19%", 
      "Brutto", 
      "Sollkonto", 
      "Habenkonto", 
      "Steuerkategorie",
      "Kostenstelle",
      "Beschreibung",
      "Status",
      "Duplikat von"
    ];

    const csvContent = documents.map(doc => {
      const d = doc.data || {} as any;
      const row = [
        d.belegDatum || '',
        d.eigeneBelegNummer || '',
        `"${(d.lieferantName || '').replace(/"/g, '""')}"`,
        `"${(d.belegNummerLieferant || '').replace(/"/g, '""')}"`,
        (d.nettoBetrag || 0).toFixed(2).replace('.', ','),
        (d.mwstBetrag7 || 0).toFixed(2).replace('.', ','),
        (d.mwstBetrag19 || 0).toFixed(2).replace('.', ','),
        (d.bruttoBetrag || 0).toFixed(2).replace('.', ','),
        d.sollKonto || '',
        d.habenKonto || '',
        `"${(d.steuerKategorie || '').replace(/"/g, '""')}"`,
        d.kostenstelle || '',
        `"${(d.beschreibung || '').replace(/"/g, '""')}"`,
        doc.status,
        doc.duplicateOfId || ''
      ];
      return row.join(';');
    }).join('\n');

    const csvString = `${headers.join(';')}\n${csvContent}`;
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zoe_accounting_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSQL = async () => {
    try {
      const sql = await storageService.exportDatabaseToSQL();
      const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `zoe_accounting_dump_${new Date().toISOString().slice(0,10)}.sql`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to export SQL", e);
      alert("Fehler beim SQL Export");
    }
  };

  // Filter Logic
  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    const vendor = (doc.data?.lieferantName || doc.fileName).toLowerCase();
    const vendorInvNum = (doc.data?.belegNummerLieferant || '').toLowerCase();
    const ownInvNum = (doc.data?.eigeneBelegNummer || '').toLowerCase();
    const amount = doc.data?.bruttoBetrag?.toString() || '';

    return vendor.includes(query) || 
           vendorInvNum.includes(query) || 
           ownInvNum.includes(query) ||
           amount.includes(query);
  });

  // Bulk Action Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedIds.length === filteredDocuments.length && filteredDocuments.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocuments.map(d => d.id));
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`${selectedIds.length} Belege wirklich löschen?`)) {
       const idsToDelete = [...selectedIds];
       
       // UI Update
       setDocuments(prev => prev.filter(d => !idsToDelete.includes(d.id)));
       setSelectedIds([]);
       if (selectedDocId && idsToDelete.includes(selectedDocId)) {
         setSelectedDocId(null);
       }

       // DB Update
       for (const id of idsToDelete) {
         try {
           await storageService.deleteDocument(id);
         } catch (e) {
           console.error(`Failed to delete doc ${id}`, e);
         }
       }
    }
  };

  const handleBulkMarkReviewed = async () => {
    const idsToUpdate = [...selectedIds];
    
    // UI Update
    setDocuments(prev => prev.map(doc => 
      idsToUpdate.includes(doc.id) ? { ...doc, status: DocumentStatus.COMPLETED } : doc
    ));
    setSelectedIds([]); // Clear selection after action

    // DB Update
    for (const id of idsToUpdate) {
       const doc = documents.find(d => d.id === id);
       if (doc) {
          const updated = { ...doc, status: DocumentStatus.COMPLETED };
          await storageService.saveDocument(updated);
       }
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const renderRightContent = () => {
    if (viewMode === 'settings' && settings) {
      return (
        <SettingsView 
          settings={settings} 
          onSave={handleSaveSettings} 
          onClose={() => setViewMode('document')}
        />
      );
    }
    
    if (viewMode === 'database') {
      return (
        <DatabaseGrid 
          documents={documents}
          onSelectDocument={(doc) => {
             setSelectedDocId(doc.id);
             setViewMode('document');
          }}
          onExportSQL={handleExportSQL}
        />
      );
    }

    if (selectedDoc) {
      return (
        <DocumentDetail 
          document={selectedDoc} 
          taxCategories={settings?.taxCategories || []}
          onSave={handleSaveDocument}
          onDelete={handleDeleteDocument}
        />
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Belegerfassung</h2>
            <p className="text-slate-500">Lade einen neuen Beleg hoch, um die KI-Analyse zu starten.</p>
          </div>
          
          <UploadArea onFileSelected={handleFileSelect} isProcessing={isProcessing} />
          
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">OCR Scan</div>
              <div className="text-xs text-slate-500">Automatische Texterkennung</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">Regel-Engine</div>
              <div className="text-xs text-slate-500">Exakte SKR03 Zuordnung</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">Database</div>
              <div className="text-xs text-slate-500">PostgreSQL Kompatibel</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 h-14 flex-none z-20">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-sm shadow-yellow-200">
               <span className="font-bold text-yellow-900">Z</span>
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">ZOE Solar <span className="text-slate-400 font-normal">Accounting</span></h1>
          </div>
          <div className="text-xs text-slate-400">
             {documents.length} Belege gespeichert (Lokal)
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Sidebar */}
        <aside className="w-[400px] flex flex-col border-r border-slate-200 bg-white shadow-sm z-10 flex-none relative">
          <div className="p-4 border-b border-slate-100 flex-none bg-slate-50/50 space-y-3">
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                      setSelectedDocId(null);
                      setViewMode('document');
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm ${
                    viewMode === 'document' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Neu
                </button>
                <button 
                  onClick={() => {
                      setSelectedDocId(null);
                      setViewMode('database');
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm ${
                    viewMode === 'database' ? 'bg-slate-800 text-white shadow-slate-300' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s 9-1.34 9-3V5"></path></svg>
                  Datenbank
                </button>
             </div>

             {/* Search Bar */}
             <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                    type="text" 
                    placeholder="Suchen (Lieferant, Beleg-Nr)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
            <DatabaseView 
              documents={filteredDocuments} 
              selectedId={selectedDocId}
              onSelectDocument={(doc) => {
                  setViewMode('document');
                  setSelectedDocId(doc.id);
              }}
              // Bulk props
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
              onBulkDelete={handleBulkDelete}
              onBulkMarkReviewed={handleBulkMarkReviewed}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
             <button
               onClick={handleExportCSV}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
               title="Daten als CSV exportieren"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
               CSV Export
             </button>
             <button
               onClick={() => {
                   setSelectedDocId(null);
                   setViewMode('settings');
               }}
               className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'settings' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
               Einstellungen
             </button>
          </div>
        </aside>

        {/* Right Column */}
        <main className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
          {renderRightContent()}
        </main>
      </div>
    </div>
  );
}
