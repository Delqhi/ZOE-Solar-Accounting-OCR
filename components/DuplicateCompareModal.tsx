import React, { useState, useEffect, useRef } from 'react';
import { DocumentRecord, ExtractedData, DocumentStatus } from '../types';
import { PdfViewer } from './PdfViewer';

// Modern Input Styles
const INPUT_CLASS = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none placeholder-slate-400 transition-all";
const LABEL_CLASS = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";

interface DuplicateCompareModalProps {
  original: DocumentRecord;
  duplicate: DocumentRecord;
  allDocuments: DocumentRecord[];
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (doc: DocumentRecord) => Promise<void>;
  onMerge: (sourceId: string, targetId: string) => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onIgnoreDuplicate: (id: string) => void;
}

export const DuplicateCompareModal: React.FC<DuplicateCompareModalProps> = ({
  original,
  duplicate,
  allDocuments,
  onClose,
  onDelete,
  onSave,
  onMerge,
  onSelectDocument,
  onIgnoreDuplicate
}) => {
  const [originalData, setOriginalData] = useState<Partial<ExtractedData>>(original.data || {});
  const [duplicateData, setDuplicateData] = useState<Partial<ExtractedData>>(duplicate.data || {});
  const [activeSide, setActiveSide] = useState<'original' | 'duplicate'>('duplicate');
  const [saving, setSaving] = useState(false);

  // Get view URL and type for each document
  const getViewUrl = (doc: DocumentRecord) => doc.previewUrl || '';
  const getViewType = (doc: DocumentRecord) => doc.fileType || '';

  const handleOriginalChange = (field: keyof ExtractedData, value: any) => {
    setOriginalData(prev => ({ ...prev, [field]: value }));
  };

  const handleDuplicateChange = (field: keyof ExtractedData, value: any) => {
    setDuplicateData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveOriginal = async () => {
    setSaving(true);
    await onSave({ ...original, data: originalData as ExtractedData });
    setSaving(false);
  };

  const handleSaveDuplicate = async () => {
    setSaving(true);
    await onSave({ ...duplicate, data: duplicateData as ExtractedData });
    setSaving(false);
  };

  const handleMarkAsOriginal = async () => {
    // Remove duplicate status from duplicate, keep original
    const updatedDup = {
      ...duplicate,
      status: DocumentStatus.REVIEW_NEEDED as DocumentStatus,
      duplicateOfId: undefined,
      duplicateConfidence: undefined,
      duplicateReason: undefined
    };
    await onSave(updatedDup);
    onClose();
  };

  const handleDeleteDuplicate = async () => {
    if (confirm('Möchten Sie dieses Duplikat wirklich löschen?')) {
      await onDelete(duplicate.id);
      onClose();
    }
  };

  const handleKeepBoth = async () => {
    // Remove duplicate status from duplicate
    const updatedDup = {
      ...duplicate,
      status: DocumentStatus.REVIEW_NEEDED as DocumentStatus,
      duplicateOfId: undefined,
      duplicateConfidence: undefined,
      duplicateReason: undefined
    };
    await onSave(updatedDup);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Find other duplicates of the same original
  const otherDuplicates = allDocuments.filter(
    d => d.duplicateOfId === original.id && d.id !== duplicate.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-[95vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between flex-none bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <h2 className="font-bold text-slate-800 text-lg">Duplikat-Vergleich</h2>
            </div>
            <span className="text-sm text-slate-500">
              Ähnlichkeit: <span className="font-bold text-red-600">{(duplicate.duplicateConfidence || 0).toFixed(0)}%</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation between duplicates */}
            {otherDuplicates.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                <span className="text-slate-600">
                  {otherDuplicates.indexOf(duplicate) + 1} von {otherDuplicates.length + 1} Duplikaten
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Aktionen:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleKeepBoth}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Beide behalten
            </button>
            <button
              onClick={handleMarkAsOriginal}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Als Original markieren
            </button>
            <button
              onClick={() => onMerge(duplicate.id, original.id)}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Zusammenführen
            </button>
            <button
              onClick={handleDeleteDuplicate}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Duplikat löschen
            </button>
          </div>
        </div>

        {/* Main Content - Side by Side */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Original */}
          <div className="flex-1 flex flex-col border-r border-slate-200 min-w-0">
            <div className="px-4 py-2 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <span className="font-semibold text-green-700 text-sm">Original</span>
              <button
                onClick={() => onSelectDocument(original)}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Im Detail öffnen
              </button>
            </div>

            {/* Preview */}
            <div className="h-1/2 bg-slate-100 relative">
              {getViewUrl(original) && (
                <PdfViewer
                  url={getViewUrl(original)}
                  type={getViewType(original)}
                />
              )}
            </div>

            {/* Data */}
            <div className="h-1/2 overflow-y-auto p-4 bg-white">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Buchungsdaten
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Datum</label>
                  <input
                    type="date"
                    value={originalData.belegDatum || ''}
                    onChange={(e) => handleOriginalChange('belegDatum', e.target.value)}
                    onBlur={handleSaveOriginal}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Beleg-Nr.</label>
                  <input
                    value={originalData.belegNummerLieferant || ''}
                    onChange={(e) => handleOriginalChange('belegNummerLieferant', e.target.value)}
                    onBlur={handleSaveOriginal}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>Lieferant</label>
                  <input
                    value={originalData.lieferantName || ''}
                    onChange={(e) => handleOriginalChange('lieferantName', e.target.value)}
                    onBlur={handleSaveOriginal}
                    className={`${INPUT_CLASS} font-bold`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Netto</label>
                  <input
                    type="number"
                    value={originalData.nettoBetrag || ''}
                    onChange={(e) => handleOriginalChange('nettoBetrag', parseFloat(e.target.value))}
                    onBlur={handleSaveOriginal}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Brutto</label>
                  <input
                    type="number"
                    value={originalData.bruttoBetrag || ''}
                    onChange={(e) => handleOriginalChange('bruttoBetrag', parseFloat(e.target.value))}
                    onBlur={handleSaveOriginal}
                    className={`${INPUT_CLASS} font-bold`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Konto</label>
                  <input
                    value={originalData.kontierungskonto || ''}
                    onChange={(e) => handleOriginalChange('kontierungskonto', e.target.value)}
                    onBlur={handleSaveOriginal}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Steuerkategorie</label>
                  <input
                    value={originalData.steuerkategorie || ''}
                    onChange={(e) => handleOriginalChange('steuerkategorie', e.target.value)}
                    onBlur={handleSaveOriginal}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className={LABEL_CLASS}>Bemerkung</label>
                <textarea
                  value={originalData.beschreibung || ''}
                  onChange={(e) => handleOriginalChange('beschreibung', e.target.value)}
                  onBlur={handleSaveOriginal}
                  className={`${INPUT_CLASS} min-h-[60px] resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Right: Duplicate */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <span className="font-semibold text-red-700 text-sm">Duplikat</span>
              <span className="text-xs text-red-500">{duplicate.duplicateReason}</span>
            </div>

            {/* Preview */}
            <div className="h-1/2 bg-slate-100 relative">
              {getViewUrl(duplicate) && (
                <PdfViewer
                  url={getViewUrl(duplicate)}
                  type={getViewType(duplicate)}
                />
              )}
            </div>

            {/* Data */}
            <div className="h-1/2 overflow-y-auto p-4 bg-white">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Buchungsdaten
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Datum</label>
                  <input
                    type="date"
                    value={duplicateData.belegDatum || ''}
                    onChange={(e) => handleDuplicateChange('belegDatum', e.target.value)}
                    onBlur={handleSaveDuplicate}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Beleg-Nr.</label>
                  <input
                    value={duplicateData.belegNummerLieferant || ''}
                    onChange={(e) => handleDuplicateChange('belegNummerLieferant', e.target.value)}
                    onBlur={handleSaveDuplicate}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>Lieferant</label>
                  <input
                    value={duplicateData.lieferantName || ''}
                    onChange={(e) => handleDuplicateChange('lieferantName', e.target.value)}
                    onBlur={handleSaveDuplicate}
                    className={`${INPUT_CLASS} font-bold`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Netto</label>
                  <input
                    type="number"
                    value={duplicateData.nettoBetrag || ''}
                    onChange={(e) => handleDuplicateChange('nettoBetrag', parseFloat(e.target.value))}
                    onBlur={handleSaveDuplicate}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Brutto</label>
                  <input
                    type="number"
                    value={duplicateData.bruttoBetrag || ''}
                    onChange={(e) => handleDuplicateChange('bruttoBetrag', parseFloat(e.target.value))}
                    onBlur={handleSaveDuplicate}
                    className={`${INPUT_CLASS} font-bold`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Konto</label>
                  <input
                    value={duplicateData.kontierungskonto || ''}
                    onChange={(e) => handleDuplicateChange('kontierungskonto', e.target.value)}
                    onBlur={handleSaveDuplicate}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Steuerkategorie</label>
                  <input
                    value={duplicateData.steuerkategorie || ''}
                    onChange={(e) => handleDuplicateChange('steuerkategorie', e.target.value)}
                    onBlur={handleSaveDuplicate}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className={LABEL_CLASS}>Bemerkung</label>
                <textarea
                  value={duplicateData.beschreibung || ''}
                  onChange={(e) => handleDuplicateChange('beschreibung', e.target.value)}
                  onBlur={handleSaveDuplicate}
                  className={`${INPUT_CLASS} min-h-[60px] resize-none`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Änderungen werden automatisch gespeichert (auf Blur)
          </div>
          <div className="flex items-center gap-4">
            <span>Esc: Schließen</span>
          </div>
        </div>
      </div>
    </div>
  );
};
