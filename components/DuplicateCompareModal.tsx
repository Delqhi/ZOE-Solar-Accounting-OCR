import React, { useState, useEffect, useRef } from 'react';
import { DocumentRecord, ExtractedData, DocumentStatus } from '../types';
import { PdfViewer } from './PdfViewer';

// Vercel-style constants
const INPUT_CLASS = "w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all placeholder-gray-400";
const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide";
const BUTTON_PRIMARY = "bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 active:bg-gray-900 transition-all";
const BUTTON_SECONDARY = "bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-all";
const BUTTON_DANGER = "bg-white text-red-600 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-all";

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
    if (confirm('Moechten Sie dieses Duplikat wirklich loeschen?')) {
      await onDelete(duplicate.id);
      onClose();
    }
  };

  const handleKeepBoth = async () => {
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

  const otherDuplicates = allDocuments.filter(
    d => d.duplicateOfId === original.id && d.id !== duplicate.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-[95vw] h-[90vh] rounded-xl border border-gray-200 flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="h-14 px-6 flex items-center justify-between flex-none bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <h2 className="font-semibold text-gray-900 text-base">Duplikat-Vergleich</h2>
            </div>
            <span className="text-sm text-gray-500">
              Aehnlichkeit: <span className="font-semibold text-red-600">{(duplicate.duplicateConfidence || 0).toFixed(0)}%</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {otherDuplicates.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-md text-sm">
                <span className="text-gray-600">
                  {otherDuplicates.indexOf(duplicate) + 1} von {otherDuplicates.length + 1} Duplikaten
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Aktionen:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleKeepBoth}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Beide behalten
            </button>
            <button
              onClick={handleMarkAsOriginal}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Als Original markieren
            </button>
            <button
              onClick={() => onMerge(duplicate.id, original.id)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Zusammenfuehren
            </button>
            <button
              onClick={handleDeleteDuplicate}
              className="px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 hover:border-red-200 transition-all"
            >
              Duplikat loeschen
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Original */}
          <div className="flex-1 flex flex-col border-r border-gray-200 min-w-0">
            <div className="px-4 py-2 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <span className="font-medium text-green-700 text-sm">Original</span>
              <button
                onClick={() => onSelectDocument(original)}
                className="text-xs text-green-600 hover:text-green-800 transition-colors"
              >
                Im Detail oeffnen
              </button>
            </div>

            <div className="h-1/2 bg-gray-50 relative">
              {getViewUrl(original) && (
                <PdfViewer
                  url={getViewUrl(original)}
                  type={getViewType(original)}
                />
              )}
            </div>

            <div className="h-1/2 overflow-y-auto p-4 bg-white">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Buchungsdaten
              </h3>

              <div className="grid grid-cols-2 gap-3">
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
                    className={`${INPUT_CLASS} font-medium`}
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
                    className={`${INPUT_CLASS} font-medium`}
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

              <div className="mt-4 pt-4 border-t border-gray-100">
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
              <span className="font-medium text-red-700 text-sm">Duplikat</span>
              <span className="text-xs text-red-500">{duplicate.duplicateReason}</span>
            </div>

            <div className="h-1/2 bg-gray-50 relative">
              {getViewUrl(duplicate) && (
                <PdfViewer
                  url={getViewUrl(duplicate)}
                  type={getViewType(duplicate)}
                />
              )}
            </div>

            <div className="h-1/2 overflow-y-auto p-4 bg-white">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Buchungsdaten
              </h3>

              <div className="grid grid-cols-2 gap-3">
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
                    className={`${INPUT_CLASS} font-medium`}
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
                    className={`${INPUT_CLASS} font-medium`}
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

              <div className="mt-4 pt-4 border-t border-gray-100">
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
        <div className="px-6 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Aenderungen werden automatisch gespeichert (auf Blur)
          </div>
          <div className="flex items-center gap-4">
            <span>Esc: Schliessen</span>
          </div>
        </div>
      </div>
    </div>
  );
};
