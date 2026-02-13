import { useEffect, useRef } from 'react';
import { MicroInteractionsDemo } from './components/designOS/MicroInteractionsDemo';
import { DatabaseGrid } from './components/database-grid';
import { DocumentDetail } from './components/DetailModal';
import { DuplicateCompareModal } from './components/DuplicateCompareModal';
import { SettingsView } from './components/SettingsView';
import { UploadArea } from './components/UploadArea';
import { analyzeDocumentWithGemini } from './services/geminiService';
import { applyAccountingRules, generateZoeInvoiceId } from './services/ruleEngine';
import * as storageService from './services/storageService';
import * as supabaseService from './services/supabaseService';
import { detectPrivateDocument } from './services/privateDocumentDetection';
import { DocumentRecord, DocumentStatus } from './types';
import { normalizeExtractedData } from './services/extractedDataNormalization';
import { useAppState } from './app/hooks/useAppState';
import { useNotification, usePrivateDocNotification } from './app/hooks';
import { computeFileHash, readFileToBase64, mergeDocuments, classifyOcrOutcome, findSemanticDuplicate } from './app/utils';

export default function App() {
  const appState = useAppState();
  const { documents, setDocuments, settings, setSettings, isProcessing, setIsProcessing,
    selectedDocId, setSelectedDocId, viewMode, setViewMode, searchQuery, setSearchQuery,
    compareDoc, setCompareDoc, originalDoc, setOriginalDoc, sidebarWidth, setSidebarWidth,
    filteredDocuments } = appState;

  const { notification, setNotification } = useNotification();
  const { notification: privateDocNotification, setNotification: setPrivateDocNotification } = usePrivateDocNotification();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [localDocs, localSettings] = await Promise.all([
          storageService.getAllDocuments(),
          storageService.getSettings()
        ]);
        setDocuments(localDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
        setSettings(localSettings);

        if (supabaseService.isSupabaseConfigured()) {
          try {
            const [cloudDocs, cloudSettings] = await Promise.all([
              supabaseService.getAllDocuments(),
              supabaseService.getSettings()
            ]);
            const mergedDocs = mergeDocuments(localDocs || [], cloudDocs || []);
            setDocuments(mergedDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
            for (const doc of mergedDocs) await storageService.saveDocument(doc);
            if (cloudSettings) {
              await storageService.saveSettings(cloudSettings);
              setSettings(cloudSettings);
            }
          } catch (syncError) {
            console.warn('Supabase sync failed:', syncError);
          }
        }
      } catch (e) {
        console.error('Init Error:', e);
        setNotification('Fehler beim Laden der Daten.');
      }
    };
    initData();
  }, []);

  const handleFilesSelect = async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setViewMode('document');

    const newDocs: DocumentRecord[] = [];
    const fileData: {id: string, file: File, hash: string, base64: string, url: string}[] = [];

    for (const file of files) {
      const id = crypto.randomUUID();
      const [hash, {base64, url}] = await Promise.all([computeFileHash(file), readFileToBase64(file)]);
      fileData.push({ id, file, hash, base64, url });
      newDocs.push({ id, fileName: file.name, fileType: file.type, uploadDate: new Date().toISOString(), status: DocumentStatus.PROCESSING, data: null, previewUrl: url, fileHash: hash });
    }

    setDocuments(prev => [...newDocs, ...prev]);
    const currentSettings = settings || await storageService.getSettings();
    const processedBatch: DocumentRecord[] = [];
    const currentDocsSnapshotRef: { current: DocumentRecord[] } = { current: [] };
    setDocuments(prev => { currentDocsSnapshotRef.current = [...prev]; return prev; });

    const processingPromises = fileData.map(async (item) => {
      const isExactDuplicate = currentDocsSnapshotRef.current.some(d => d.id !== item.id && d.fileHash === item.hash);
      if (isExactDuplicate) {
        const original = currentDocsSnapshotRef.current.find(d => d.fileHash === item.hash);
        return { type: 'DOC' as const, doc: { id: item.id, status: DocumentStatus.DUPLICATE, error: undefined, data: null, duplicateReason: 'Datei identisch (Hash)', duplicateOfId: original?.id, duplicateConfidence: 1 } };
      }

      try {
        const extractedRaw = await analyzeDocumentWithGemini(item.base64, item.file.type);
        const extracted = normalizeExtractedData(extractedRaw);
        const semanticDup = findSemanticDuplicate(extracted, currentDocsSnapshotRef.current);
        
        if (semanticDup && semanticDup.doc.id !== item.id) {
          return { type: 'DOC' as const, doc: { id: item.id, status: DocumentStatus.DUPLICATE, data: extracted, duplicateReason: semanticDup.reason, duplicateOfId: semanticDup.doc.id, duplicateConfidence: semanticDup.confidence } };
        }

        const privateCheck = detectPrivateDocument(extracted);
        if (privateCheck.isPrivate && privateCheck.detectedVendor) {
          return { type: 'PRIVATE_DOC' as const, id: item.id, base64: item.base64, fileName: item.file.name, fileType: item.file.type, data: extracted, vendor: privateCheck.detectedVendor, reason: privateCheck.reason };
        }

        const outcome = classifyOcrOutcome(extracted);
        return { type: 'DOC' as const, data: extracted, id: item.id, outcome };
      } catch (e) {
        return { type: 'DOC' as const, doc: { id: item.id, status: DocumentStatus.ERROR, error: 'KI Analyse fehlgeschlagen', data: null } };
      }
    });

    const results = await Promise.all(processingPromises);

    for (const res of results) {
      if (res.type === 'PRIVATE_DOC') {
        const privateRes = res as any;
        try {
          await supabaseService.savePrivateDocument(privateRes.id, privateRes.fileName, privateRes.fileType, privateRes.base64, privateRes.data, privateRes.reason);
          setPrivateDocNotification({ vendor: privateRes.vendor, amount: privateRes.data?.bruttoBetrag || 0, reason: privateRes.reason });
        } catch (e) {
          console.error('Failed to save private document:', e);
        }
        continue;
      }

      if (res.type === 'DOC') {
        let finalDoc: DocumentRecord | undefined;

        if ('doc' in res && res.doc) {
          const resultDoc = res.doc;
          const placeholder = newDocs.find(d => d.id === resultDoc.id);
          if (!placeholder) continue;
          finalDoc = { ...placeholder, ...resultDoc } as DocumentRecord;
          if (finalDoc.status === DocumentStatus.DUPLICATE && finalDoc.data) {
            const zoeId = generateZoeInvoiceId(finalDoc.data.belegDatum || '', currentDocsSnapshotRef.current);
            finalDoc.data.eigeneBelegNummer = zoeId;
          }
        } else if ('data' in res && res.data && res.id) {
          const { id, data } = res as any;
          const placeholder = newDocs.find(d => d.id === id);
          if (!placeholder) continue;

          const zoeId = generateZoeInvoiceId(data.belegDatum || '', currentDocsSnapshotRef.current);
          let overrideRule: { accountId?: string, taxCategoryValue?: string } | undefined;
          if (data.lieferantName) {
            const rule = await storageService.getVendorRule(data.lieferantName);
            if (rule) overrideRule = { accountId: rule.accountId, taxCategoryValue: rule.taxCategoryValue };
          }
          
          const normalized = normalizeExtractedData(data);
          const outcome = (res as any).outcome || classifyOcrOutcome(normalized);
          const finalData = applyAccountingRules({ ...normalized, eigeneBelegNummer: zoeId }, currentDocsSnapshotRef.current, currentSettings, overrideRule);
          finalDoc = { ...placeholder, status: outcome.status, data: finalData, error: outcome.error };
          currentDocsSnapshotRef.current.push(finalDoc);
        }
        
        if (finalDoc) {
          processedBatch.push(finalDoc);
          await storageService.saveDocument(finalDoc);
          if (supabaseService.isSupabaseConfigured()) {
            try { await supabaseService.saveDocument(finalDoc); } catch (e) { console.warn('Failed to sync:', e); }
          }
        }
      }
    }

    setDocuments(prev => {
      const cleanPrev = prev.filter(d => !newDocs.some(n => n.id === d.id));
      return [...processedBatch, ...cleanPrev];
    });

    setIsProcessing(false);
    if (processedBatch.length > 0) setSelectedDocId(processedBatch[0].id);
  };

  const renderContent = () => {
    if (viewMode === 'settings' && settings) {
      return <SettingsView settings={settings} onSave={async (s) => { setSettings(s); await storageService.saveSettings(s); }} onClose={() => setViewMode('document')} />;
    }
    if (viewMode === 'interactions') return <MicroInteractionsDemo />;
    if (viewMode === 'database') {
      return <DatabaseGrid documents={filteredDocuments} onOpen={(d) => setSelectedDocId(d.id)} onDelete={() => {}} onMerge={() => {}} onDuplicateCompare={() => {}} />;
    }
    if (selectedDocId) {
      const doc = documents.find(d => d.id === selectedDocId);
      if (doc) return <DocumentDetail document={doc} allDocuments={documents} isOpen={true} onSave={() => {}} onDelete={() => {}} onRetryOCR={() => {}} onSelectDocument={(d) => setSelectedDocId(d.id)} onClose={() => setSelectedDocId(null)} onMerge={() => {}} />;
    }

    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-text mb-4">ZOE Solar Accounting</h1>
          <p className="text-text-muted mb-8">Laden Sie Ihre Belege hoch für KI-gestützte Verarbeitung</p>
          <UploadArea onUploadComplete={() => setNotification('Beleg verarbeitet!')} onUploadError={(e) => setNotification(`Fehler: ${e}`)} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] flex bg-background text-text">
      <div className="hidden md:flex w-full h-full">
        <aside className="w-64 bg-surface border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="font-bold text-xl">ZOE</div>
            <div className="text-xs text-text-muted">Accounting Suite</div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[{ id: 'document', label: 'Belege' }, { id: 'database', label: 'Berichte' }, { id: 'settings', label: 'Einstellungen' }].map((item) => (
              <button key={item.id} onClick={() => setViewMode(item.id as any)} className={`w-full text-left p-2 rounded ${viewMode === item.id ? 'bg-primary text-text-inverted' : 'hover:bg-surface-hover'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-4">{renderContent()}</main>
      </div>
    </div>
  );
}
