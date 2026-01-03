import React, { useMemo, useState, useEffect, useRef } from 'react';
import { DocumentRecord, ExtractedData, AppSettings, Attachment, DocumentStatus, LineItem } from '../types';
import { PdfViewer } from './PdfViewer';
import { getSettings } from '../services/storageService';

// Vercel-style constants
const INPUT_CLASS = "w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all placeholder-gray-400";
const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide";
const BUTTON_PRIMARY = "bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 active:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const BUTTON_SECONDARY = "bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const BUTTON_DANGER = "bg-white text-red-600 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-all";
const CARD_STYLE = "bg-white border border-gray-200 rounded-xl overflow-hidden";
const SECTION_TITLE = "text-lg font-semibold text-gray-900 flex items-center gap-2";

const isPresent = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean') return true;
    return true;
};

const getErrorNextSteps = (message: string): string[] => {
    const msg = (message || '').toLowerCase();
    const steps: string[] = [];

    steps.push('Retry OCR (Button oben rechts).');

    if (/gemini_api_key|gemini|api key|apikey|unauthorized|forbidden|\b401\b|\b403\b/.test(msg)) {
        steps.push('API-Keys prüfen/setzen: GEMINI_API_KEY (Pflicht), SILICONFLOW_API_KEY (Fallback).');
    }
    if (/\b429\b|quota|rate limit|too many requests/.test(msg)) {
        steps.push('Quota/Rate-Limit: später erneut versuchen oder Fallback nutzen.');
    }
    if (/pdf|page|pages|size|zu gro[ßs]|too large|max/.test(msg)) {
        steps.push('PDF verkleinern/splitten (weniger Seiten/Dateigröße) und erneut hochladen.');
    }
    if (/failed to fetch|network|timeout|econn|offline/.test(msg)) {
        steps.push('Netzwerk/Firewall/Adblock prüfen (Requests zu KI-Providern).');
    }

    steps.push('Fehlende Felder manuell ergänzen (Datum/Lieferant/Beträge) und erneut exportieren.');
    return steps;
};

interface DocumentDetailProps {
  document: DocumentRecord;
  allDocuments: DocumentRecord[];
  taxCategories: string[];
  onSave: (doc: DocumentRecord) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onRetryOCR: (doc: DocumentRecord) => Promise<void>;
  onSelectDocument: (doc: DocumentRecord) => void;
  onClose: () => void;
  onMerge: (sourceId: string, targetId: string) => void;
}

export const DocumentDetail: React.FC<DocumentDetailProps> = ({ document, allDocuments, onSave, onDelete, onRetryOCR, onSelectDocument, onClose, onMerge }) => {
  const [formData, setFormData] = useState<Partial<ExtractedData>>(document.data || {});
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [mobileTab, setMobileTab] = useState<'preview' | 'data'>('data');
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string>('');
  const [showMergeSearch, setShowMergeSearch] = useState(false);
  const [mergeQuery, setMergeQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const belegDatumRef = useRef<HTMLInputElement>(null);
  const lieferantNameRef = useRef<HTMLInputElement>(null);
  const bruttoBetragRef = useRef<HTMLInputElement>(null);

  const latestFormDataRef = useRef<Partial<ExtractedData>>(formData);
  useEffect(() => {
      latestFormDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    setFormData(document.data || {});
    setActiveFileIndex(0);
  }, [document.id]);

  useEffect(() => {
      let currentUrl = document.previewUrl || '';
      let currentType = document.fileType;

      const atts = document.attachments || [];
      if (activeFileIndex > 0 && atts[activeFileIndex - 1]) {
          currentUrl = atts[activeFileIndex - 1].url;
          currentType = atts[activeFileIndex - 1].type;
      }

      let active = true;
      let objectUrl: string | null = null;

      if (currentUrl.startsWith('data:')) {
           fetch(currentUrl)
             .then(res => res.blob())
             .then(blob => {
                 if (active) {
                     objectUrl = URL.createObjectURL(blob);
                     setViewUrl(objectUrl);
                     setViewType(currentType);
                 }
             });
      } else {
          setViewUrl(currentUrl);
          setViewType(currentType);
      }

      return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [document, activeFileIndex]);

  const handleInputChange = (field: keyof ExtractedData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof ExtractedData, checked: boolean) => {
      setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
      const newItems = [...(formData.lineItems || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData(prev => ({ ...prev, lineItems: newItems }));
  };

  const handleAddLineItem = () => {
      setFormData(prev => ({
          ...prev,
          lineItems: [...(prev.lineItems || []), { description: '', amount: 0 }]
      }));
  };

  const handleRemoveLineItem = (index: number) => {
      const newItems = [...(formData.lineItems || [])];
      newItems.splice(index, 1);
      setFormData(prev => ({ ...prev, lineItems: newItems }));
  };

  const handleBlur = () => {
      onSave({ ...document, data: formData as ExtractedData });
  };

  const handleSaveNow = () => {
      onSave({ ...document, data: latestFormDataRef.current as ExtractedData });
  };

  const handleMergeClick = (targetDoc: DocumentRecord) => {
      onMerge(targetDoc.id, document.id);
      setShowMergeSearch(false);
      setMergeQuery('');
  };

  const handleAddFileClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              const res = ev.target?.result as string;
              const newAttachment: Attachment = {
                  id: crypto.randomUUID(),
                  url: res,
                  type: file.type,
                  name: file.name
              };
              const updatedDoc = {
                  ...document,
                  attachments: [...(document.attachments || []), newAttachment]
              };
              onSave(updatedDoc);
          };
          reader.readAsDataURL(file);
      }
  };

  const accounts = settings?.accountDefinitions || [];
  const taxes = settings?.taxDefinitions || [];
  const selectedAccount = accounts.find(a => a.id === formData.kontierungskonto);
  const availableTaxes = selectedAccount
      ? taxes.filter(t => selectedAccount.steuerkategorien.includes(t.value))
      : taxes;

  const filteredMergeCandidates = allDocuments
    .filter(d => d.id !== document.id)
        .filter(d => d.status !== DocumentStatus.DUPLICATE && d.status !== DocumentStatus.ERROR && d.status !== DocumentStatus.REVIEW_NEEDED)
    .filter(d => {
        const term = mergeQuery.toLowerCase();
        return d.fileName.toLowerCase().includes(term) ||
               d.data?.lieferantName?.toLowerCase().includes(term) ||
               d.data?.bruttoBetrag?.toString().includes(term) ||
               d.uploadDate.includes(term);
    })
    .slice(0, 5);

  const totalPages = 1 + (document.attachments?.length || 0);
  const isDuplicate = document.status === DocumentStatus.DUPLICATE;
  const isError = document.status === DocumentStatus.ERROR;
  const isReview = document.status === DocumentStatus.REVIEW_NEEDED;
  const errorMessage = (document.error || document.data?.ocr_rationale || '').trim();
  const originalDoc = document.duplicateOfId ? allDocuments.find(d => d.id === document.duplicateOfId) : undefined;

  const shortcutHint = useMemo(() => {
      if (!(isError || isReview)) return '';
      return 'Shortcuts: Esc schließen · Strg+S speichern · Alt+←/→ nächster/vorheriger Beleg';
  }, [isError, isReview]);

  const errorNextSteps = useMemo(() => {
      if (!isError) return [] as string[];
      return getErrorNextSteps(errorMessage);
  }, [isError, errorMessage]);

  useEffect(() => {
      if (!settings) return;
      if (!(isReview || isError)) return;

      const required = settings.ocrConfig?.required_fields || [];
      const focusOrder = required.length > 0 ? required : ['belegDatum', 'lieferantName', 'bruttoBetrag'];

      const tryFocus = (field: string): boolean => {
          if (field === 'belegDatum') {
              if (!isPresent(formData.belegDatum)) {
                  setMobileTab('data');
                  requestAnimationFrame(() => belegDatumRef.current?.focus());
                  return true;
              }
          }
          if (field === 'lieferantName') {
              if (!isPresent(formData.lieferantName)) {
                  setMobileTab('data');
                  requestAnimationFrame(() => lieferantNameRef.current?.focus());
                  return true;
              }
          }
          if (field === 'bruttoBetrag') {
              if (!isPresent(formData.bruttoBetrag)) {
                  setMobileTab('data');
                  requestAnimationFrame(() => bruttoBetragRef.current?.focus());
                  return true;
              }
          }
          return false;
      };

      for (const field of focusOrder) {
          if (tryFocus(field)) return;
      }

      setMobileTab('data');
      requestAnimationFrame(() => lieferantNameRef.current?.focus());
  }, [document.id, settings, isReview, isError]);

  useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
              return;
          }

          const key = e.key.toLowerCase();
          if ((e.ctrlKey || e.metaKey) && key === 's') {
              e.preventDefault();
              handleSaveNow();
              return;
          }

          if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
              e.preventDefault();
              const idx = allDocuments.findIndex(d => d.id === document.id);
              if (idx < 0) return;
              const nextIndex = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
              const nextDoc = allDocuments[nextIndex];
              if (nextDoc) onSelectDocument(nextDoc);
              return;
          }
      };

      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
  }, [allDocuments, document.id, onClose, onSelectDocument]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-14 px-4 md:px-6 flex items-center justify-between flex-none relative z-30 border-b border-gray-100 bg-white">
         <div className="flex items-center gap-3">
             <button onClick={onClose} className="p-1.5 -ml-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors md:hidden">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
             </button>
             <div>
                <h3 className={`font-semibold text-base md:text-lg flex items-center gap-2 ${isDuplicate ? 'text-red-600' : 'text-gray-900'}`}>
                    {isDuplicate && <span className="w-2 h-2 rounded-full bg-red-500"/>}
                    {isDuplicate ? 'Duplikat' : 'Beleg Details'}
                </h3>
                <div className="text-xs text-gray-400 font-mono hidden md:block">{document.id.substring(0, 8)}</div>
             </div>
         </div>

         {/* Merge Search */}
         <div className="hidden md:block relative">
             {!isDuplicate && (!showMergeSearch ? (
                 <button
                    onClick={() => setShowMergeSearch(true)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-md hover:border-gray-300 transition-all"
                 >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                     <span>Merge</span>
                 </button>
             ) : (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px]">
                     <div className="relative">
                        <input
                            autoFocus
                            value={mergeQuery}
                            onChange={e => setMergeQuery(e.target.value)}
                            onBlur={() => setTimeout(() => setShowMergeSearch(false), 200)}
                            placeholder="Beleg suchen..."
                            className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-200"
                        />
                        <svg className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

                        {mergeQuery.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg mt-1 overflow-hidden max-h-64 overflow-y-auto shadow-sm">
                                {filteredMergeCandidates.map(c => (
                                    <div
                                        key={c.id}
                                        onMouseDown={() => handleMergeClick(c)}
                                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                    >
                                        <div className="font-medium text-gray-900 text-sm truncate">{c.data?.lieferantName || c.fileName}</div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                            <span>{c.data?.belegDatum}</span>
                                            <span className="font-mono">{c.data?.bruttoBetrag?.toFixed(2)} EUR</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                 </div>
             ))}
         </div>

         <div className="flex gap-2">
            <button
                onClick={() => onRetryOCR(document)}
                disabled={isDuplicate}
                className="hidden md:inline-flex px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={isDuplicate ? 'Retry ist fuer Duplikate deaktiviert' : ''}
            >
                Retry OCR
            </button>
            <button onClick={() => onDelete(document.id)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all">
                <span className="hidden md:inline">Loschen</span>
                <span className="md:hidden">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </span>
            </button>
         </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden px-4 py-2 bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setMobileTab('data')}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${mobileTab === 'data' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                  Daten
              </button>
              <button
                onClick={() => setMobileTab('preview')}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${mobileTab === 'preview' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                  Beleg
              </button>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Preview Panel */}
        <div className={`
            absolute inset-0 md:static md:w-1/2 bg-gray-50 md:border-r border-gray-200 p-0 md:p-4 flex flex-col items-center gap-3 transition-all z-10
            ${mobileTab === 'preview' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 w-full relative">
                {viewUrl ? (
                    <PdfViewer
                        url={viewUrl}
                        type={viewType}
                        onAddPage={handleAddFileClick}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Lade Vorschau...</div>
                )}

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>

            {totalPages > 1 && (
                <div className="absolute bottom-4 md:static bg-white border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-3">
                    <button
                        disabled={activeFileIndex === 0}
                        onClick={() => setActiveFileIndex(i => Math.max(0, i - 1))}
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span className="text-sm font-mono font-medium text-gray-700">
                        {activeFileIndex + 1} / {totalPages}
                    </span>
                    <button
                        disabled={activeFileIndex === totalPages - 1}
                        onClick={() => setActiveFileIndex(i => Math.min(totalPages - 1, i + 1))}
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
            )}
        </div>

        {/* Data Panel */}
        <div className={`
            absolute inset-0 md:static md:w-1/2 bg-white overflow-y-auto transition-all z-0
            ${mobileTab === 'data' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
            <div className="p-5 md:p-6 max-w-lg mx-auto space-y-6 pb-24 md:pb-6">

                {/* Duplicate Warning */}
                {isDuplicate && (
                     <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-700 flex gap-3 items-start">
                         <svg className="w-5 h-5 flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                         <div>
                            <strong className="font-medium">Duplikat erkannt</strong>
                            <p className="mt-1">{document.duplicateReason}</p>
                            <p className="mt-2">Naechste Schritte: Original pruefen und dieses Duplikat loeschen.</p>
                            {originalDoc && (
                                <button
                                    onClick={() => onSelectDocument(originalDoc)}
                                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 rounded-md text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    Original oeffnen
                                </button>
                            )}
                         </div>
                     </div>
                )}

                {/* Error/Review Banner */}
                {(isError || isReview) && (
                    <div className={`${isError ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-800'} border rounded-lg p-4 text-sm flex gap-3 items-start`}
                         title={errorMessage}
                    >
                        <svg className="w-5 h-5 flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <div>
                            <strong className="font-medium">{isError ? 'OCR Fehler' : 'OCR pruefen'}</strong>
                            <p className="mt-1">
                                {errorMessage || 'Analyse war nicht erfolgreich. Bitte Werte manuell pruefen/ergaenzen.'}
                            </p>
                            {isError ? (
                                <div className="mt-2">
                                    <div className="font-medium text-xs uppercase tracking-wide mb-1">Naechste Schritte</div>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {errorNextSteps.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="mt-2">
                                    Naechste Schritte: Werte pruefen/ergaenzen, dann erneut exportieren.
                                </p>
                            )}
                            {shortcutHint && (
                                <p className="mt-3 text-xs opacity-75">{shortcutHint}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* OCR Confidence Card */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                     <div className="flex justify-between items-center">
                         <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">KI Konfidenz</span>
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${formData.ocr_score && formData.ocr_score > 8 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">{formData.ocr_score || 0}/10</span>
                         </div>
                     </div>
                     {formData.ruleApplied && (
                         <div className="mt-2 text-xs text-gray-600 flex items-center gap-1.5">
                             <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                             Regel angewendet
                         </div>
                     )}
                     {formData.ocr_rationale && (
                         <div className="mt-2 text-xs text-gray-500 leading-relaxed">{formData.ocr_rationale}</div>
                     )}
                </div>

                {/* Buchung Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-900 rounded-full"></span>
                        Buchung
                    </h4>

                    {/* Account Selection */}
                    <div>
                        <label className={LABEL_CLASS}>Konto</label>
                        <div className="relative">
                            <select
                                value={formData.kontierungskonto || ''}
                                onChange={(e) => {
                                    const accId = e.target.value;
                                    const acc = accounts.find(a => a.id === accId);

                                    const updates: any = {
                                        kontierungskonto: accId,
                                        ruleApplied: false,
                                        kontierungBegruendung: acc
                                            ? `Manuell gewaehlt: "${acc.name}".`
                                            : 'Manuell gewaehlt.'
                                    };

                                    if (acc && acc.steuerkategorien.length > 0 && (!formData.steuerkategorie || !acc.steuerkategorien.includes(formData.steuerkategorie))) {
                                        updates.steuerkategorie = acc.steuerkategorien[0];
                                    }

                                    if (acc && acc.skr03) {
                                        updates.sollKonto = acc.skr03;
                                    }

                                    setFormData(prev => ({ ...prev, ...updates }));
                                }}
                                className={`${INPUT_CLASS} appearance-none font-medium`}
                            >
                                <option value="">Konto waehlen...</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.skr03})</option>)}
                            </select>
                            <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                        {formData.kontierungBegruendung && (
                            <div className="mt-2 text-xs text-gray-500 leading-relaxed">
                                <span className="font-medium text-gray-600">Warum dieses Konto?</span>{' '}
                                {formData.kontierungBegruendung}
                            </div>
                        )}
                    </div>

                    {/* SOLL / HABEN Row */}
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className={LABEL_CLASS}>Soll (Aufwand)</label>
                            <input
                                value={formData.sollKonto || ''}
                                onChange={e => handleInputChange('sollKonto', e.target.value)}
                                onBlur={handleBlur}
                                className={`${INPUT_CLASS} font-mono text-gray-600 bg-gray-50`}
                                placeholder="0000"
                            />
                         </div>
                         <div>
                            <label className={LABEL_CLASS}>Haben (Kreditor)</label>
                            <input
                                value={formData.habenKonto || ''}
                                onChange={e => handleInputChange('habenKonto', e.target.value)}
                                onBlur={handleBlur}
                                className={`${INPUT_CLASS} font-mono text-gray-600 bg-gray-50`}
                                placeholder="70000"
                            />
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className={LABEL_CLASS}>Datum</label>
                            <input
                                type="date"
                                ref={belegDatumRef}
                                value={formData.belegDatum || ''}
                                onChange={e => handleInputChange('belegDatum', e.target.value)}
                                onBlur={handleBlur}
                                className={INPUT_CLASS}
                            />
                         </div>
                         <div>
                            <label className={LABEL_CLASS}>Interne Nr.</label>
                            <input
                                value={formData.eigeneBelegNummer || ''}
                                onChange={e => handleInputChange('eigeneBelegNummer', e.target.value)}
                                onBlur={handleBlur}
                                className={`${INPUT_CLASS} font-mono text-gray-900 bg-gray-50`}
                            />
                         </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-600 rounded-full"></span>
                        Details
                    </h4>

                     <div>
                        <label className={LABEL_CLASS}>Original Beleg-Nr.</label>
                        <input
                            value={formData.belegNummerLieferant || ''}
                            onChange={e => handleInputChange('belegNummerLieferant', e.target.value)}
                            onBlur={handleBlur}
                            className={INPUT_CLASS}
                            placeholder="z.B. RE-2023-999"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                            <label className={LABEL_CLASS}>Lieferant</label>
                            <input
                                ref={lieferantNameRef}
                                value={formData.lieferantName || ''}
                                onChange={e => handleInputChange('lieferantName', e.target.value)}
                                onBlur={handleBlur}
                                className={`${INPUT_CLASS} font-medium`}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={LABEL_CLASS}>Adresse</label>
                            <input
                                value={formData.lieferantAdresse || ''}
                                onChange={e => handleInputChange('lieferantAdresse', e.target.value)}
                                onBlur={handleBlur}
                                className={INPUT_CLASS}
                                placeholder="Strasse, PLZ, Ort"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={LABEL_CLASS}>Steuernummer</label>
                            <input
                                value={formData.steuernummer || ''}
                                onChange={e => handleInputChange('steuernummer', e.target.value)}
                                onBlur={handleBlur}
                                className={`${INPUT_CLASS} font-mono`}
                                placeholder="z.B. DE123456789"
                            />
                        </div>
                    </div>
                </div>

                {/* Zahlung Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-500 rounded-full"></span>
                        Zahlung
                    </h4>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL_CLASS}>Zahlungsmethode</label>
                                <input
                                    value={formData.zahlungsmethode || ''}
                                    onChange={e => handleInputChange('zahlungsmethode', e.target.value)}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                    placeholder="z.B. Ueberweisung, Karte, Lastschrift"
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Zahlungsdatum</label>
                                <input
                                    type="date"
                                    value={formData.zahlungsDatum || ''}
                                    onChange={e => handleInputChange('zahlungsDatum', e.target.value)}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={LABEL_CLASS}>Zahlungsstatus</label>
                                <select
                                    value={formData.zahlungsStatus || ''}
                                    onChange={e => handleInputChange('zahlungsStatus', e.target.value)}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} appearance-none`}
                                >
                                    <option value="">(leer)</option>
                                    <option value="offen">offen</option>
                                    <option value="bezahlt">bezahlt</option>
                                    <option value="teilbezahlt">teilbezahlt</option>
                                    <option value="storniert">storniert</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Organisation Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-400 rounded-full"></span>
                        Organisation
                    </h4>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL_CLASS}>Aufbewahrungsort</label>
                                <input
                                    value={formData.aufbewahrungsOrt || ''}
                                    onChange={e => handleInputChange('aufbewahrungsOrt', e.target.value)}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                    placeholder="z.B. Drive/Ordner/Schrank"
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Rechnungsempfaenger</label>
                                <input
                                    value={formData.rechnungsEmpfaenger || ''}
                                    onChange={e => handleInputChange('rechnungsEmpfaenger', e.target.value)}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                    placeholder="z.B. ZOE Solar GmbH"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flags Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-300 rounded-full"></span>
                        Flags
                    </h4>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={!!formData.kleinbetrag}
                                    onChange={e => handleCheckboxChange('kleinbetrag', e.target.checked)}
                                    onBlur={handleBlur}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                />
                                Kleinbetrag
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={!!formData.vorsteuerabzug}
                                    onChange={e => handleCheckboxChange('vorsteuerabzug', e.target.checked)}
                                    onBlur={handleBlur}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                />
                                Vorsteuerabzug
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={!!formData.reverseCharge}
                                    onChange={e => handleCheckboxChange('reverseCharge', e.target.checked)}
                                    onBlur={handleBlur}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                />
                                Reverse Charge
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={!!formData.privatanteil}
                                    onChange={e => handleCheckboxChange('privatanteil', e.target.checked)}
                                    onBlur={handleBlur}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                />
                                Privatanteil
                            </label>
                        </div>
                    </div>
                </div>

                {/* Line Items Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className={SECTION_TITLE}>
                            <span className="w-1 h-5 bg-gray-700 rounded-full"></span>
                            Positionen
                        </h4>
                        <button onClick={handleAddLineItem} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-200 rounded-md hover:border-gray-300 transition-all">
                            + Hinzufuegen
                        </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2.5 w-3/4">Beschreibung</th>
                                    <th className="px-4 py-2.5 w-1/4 text-right">Betrag</th>
                                    <th className="px-2 py-2.5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(formData.lineItems || []).map((item, index) => (
                                    <tr key={index} className="group hover:bg-gray-50">
                                        <td className="p-0">
                                            <input
                                                value={item.description || ''}
                                                onChange={e => handleLineItemChange(index, 'description', e.target.value)}
                                                onBlur={handleBlur}
                                                className="w-full px-4 py-2.5 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                                placeholder="Position..."
                                            />
                                        </td>
                                        <td className="p-0">
                                            <input
                                                type="number"
                                                value={item.amount || ''}
                                                onChange={e => handleLineItemChange(index, 'amount', parseFloat(e.target.value))}
                                                onBlur={handleBlur}
                                                className="w-full px-4 py-2.5 bg-transparent outline-none text-gray-900 text-right font-mono placeholder-gray-400"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => handleRemoveLineItem(index)}
                                                className="text-gray-300 hover:text-red-600 transition-colors p-1"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!formData.lineItems || formData.lineItems.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm italic">
                                            Keine Positionen erkannt.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Betraege Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-800 rounded-full"></span>
                        Betraege
                    </h4>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                             <div>
                                <label className={LABEL_CLASS}>Netto</label>
                                <input
                                    type="number"
                                    value={formData.nettoBetrag ?? ''}
                                    onChange={e => handleInputChange('nettoBetrag', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Steuerkat.</label>
                                <div className="relative">
                                    <select
                                        value={formData.steuerkategorie || ''}
                                        onChange={(e) => handleInputChange('steuerkategorie', e.target.value)}
                                        className={`${INPUT_CLASS} appearance-none pr-8 text-xs`}
                                    >
                                        <option value="">Waehlen</option>
                                        {availableTaxes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <svg className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className={LABEL_CLASS}>MwSt 19%</label>
                                <input
                                    type="number"
                                    value={formData.mwstBetrag19 || 0}
                                    onChange={e => handleInputChange('mwstBetrag19', parseFloat(e.target.value))}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} text-gray-500`}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>MwSt 7%</label>
                                <input
                                    type="number"
                                    value={formData.mwstBetrag7 || 0}
                                    onChange={e => handleInputChange('mwstBetrag7', parseFloat(e.target.value))}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} text-gray-500`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className={LABEL_CLASS}>Satz 0</label>
                                <input
                                    type="number"
                                    value={formData.mwstSatz0 ?? ''}
                                    onChange={e => handleInputChange('mwstSatz0', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} text-gray-600`}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Satz 7</label>
                                <input
                                    type="number"
                                    value={formData.mwstSatz7 ?? ''}
                                    onChange={e => handleInputChange('mwstSatz7', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} text-gray-600`}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Satz 19</label>
                                <input
                                    type="number"
                                    value={formData.mwstSatz19 ?? ''}
                                    onChange={e => handleInputChange('mwstSatz19', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} text-gray-600`}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                             <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Gesamtbetrag (Brutto)</label>
                             <div className="relative">
                                 <input
                                    type="number"
                                    ref={bruttoBetragRef}
                                    value={formData.bruttoBetrag ?? ''}
                                    onChange={e => handleInputChange('bruttoBetrag', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    onBlur={handleBlur}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-8 text-2xl font-semibold text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all"
                                />
                                <span className="absolute left-3 top-3.5 text-lg text-gray-400">EUR</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Bemerkung */}
                <div className="space-y-2">
                    <label className={LABEL_CLASS}>Bemerkung</label>
                    <textarea
                        value={formData.beschreibung || ''}
                        onChange={e => handleInputChange('beschreibung', e.target.value)}
                        onBlur={handleBlur}
                        className={`${INPUT_CLASS} min-h-[80px] resize-none leading-relaxed`}
                        placeholder="Zusaetzliche Infos..."
                    />
                </div>

                {/* OCR / Text Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-200 rounded-full"></span>
                        OCR / Text
                    </h4>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL_CLASS}>OCR Score</label>
                                <input
                                    value={String(formData.ocr_score ?? '')}
                                    readOnly
                                    className={`${INPUT_CLASS} font-mono bg-gray-100 text-gray-500`}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Dokumenttyp</label>
                                <input
                                    value={formData.documentType || ''}
                                    onChange={e => handleInputChange('documentType', e.target.value)}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                    placeholder="z.B. Rechnung, Quittung"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={LABEL_CLASS}>OCR Rationale</label>
                            <textarea
                                value={formData.ocr_rationale || ''}
                                onChange={e => handleInputChange('ocr_rationale', e.target.value)}
                                onBlur={handleBlur}
                                className={`${INPUT_CLASS} min-h-[60px] resize-none`}
                                placeholder="(optional)"
                            />
                        </div>

                        <div>
                            <label className={LABEL_CLASS}>Text Content</label>
                            <textarea
                                value={formData.textContent || ''}
                                onChange={e => handleInputChange('textContent', e.target.value)}
                                onBlur={handleBlur}
                                className={`${INPUT_CLASS} min-h-[60px] resize-none`}
                                placeholder="(optional)"
                            />
                        </div>
                    </div>
                </div>

                {/* Legacy / Technik Section */}
                <div className="space-y-4">
                    <h4 className={SECTION_TITLE}>
                        <span className="w-1 h-5 bg-gray-100 rounded-full"></span>
                        Legacy / Technik
                    </h4>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL_CLASS}>Kontogruppe</label>
                                <input
                                    value={formData.kontogruppe || ''}
                                    onChange={e => handleInputChange('kontogruppe', e.target.value)}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} font-mono`}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Konto SKR03 (legacy)</label>
                                <input
                                    value={formData.konto_skr03 || ''}
                                    onChange={e => handleInputChange('konto_skr03', e.target.value)}
                                    onBlur={handleBlur}
                                    className={`${INPUT_CLASS} font-mono`}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>USt Typ (legacy)</label>
                                <input
                                    value={formData.ust_typ || ''}
                                    onChange={e => handleInputChange('ust_typ', e.target.value)}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>SteuerKategorie (legacy)</label>
                                <input
                                    value={formData.steuerKategorie || ''}
                                    onChange={e => handleInputChange('steuerKategorie', e.target.value)}
                                    onBlur={handleBlur}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
