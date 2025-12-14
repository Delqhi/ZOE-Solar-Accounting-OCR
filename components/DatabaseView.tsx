
import React, { useMemo, useState } from 'react';
import { DocumentRecord, DocumentStatus } from '../types';

interface DatabaseViewProps {
  documents: DocumentRecord[];
  onSelectDocument: (doc: DocumentRecord) => void;
  selectedId: string | null;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onBulkDelete: () => void;
  onBulkMarkReviewed: () => void;
  onBulkOCR: () => void;
  onMerge: (sourceId: string, targetId: string) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ 
  documents, 
  onSelectDocument, 
  selectedId,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onBulkDelete,
  onMerge
}) => {
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  const stats = useMemo(() => {
      const count = documents.length;
      const total = documents.reduce((acc, doc) => acc + (doc.data?.bruttoBetrag || 0), 0);
      return { count, total };
  }, [documents]);

  const allSelected = documents.length > 0 && selectedIds.length === documents.length;

  return (
    <div className="flex flex-col h-full bg-white md:rounded-tl-2xl overflow-hidden shadow-sm border-l border-t border-slate-100">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center flex-none sticky top-0 z-20">
          <div className="flex items-center gap-3">
              <h2 className="font-bold text-slate-800 text-sm md:text-base">Übersicht</h2>
              <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{stats.count}</span>
          </div>
          <div className="text-xs md:text-sm text-slate-500">
              <span className="mr-2 hidden md:inline">Gesamtvolumen:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg">{stats.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
          </div>
      </div>

      {/* Table Container - Responsive Scroll */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse min-w-[600px] md:min-w-full">
            <thead className="bg-slate-50/80 backdrop-blur text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 text-xs uppercase tracking-wide">
                <tr>
                    <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"/>
                    </th>
                    <th className="px-4 py-3">Datum / Nr.</th>
                    <th className="px-4 py-3">Lieferant</th>
                    <th className="px-4 py-3 hidden md:table-cell">Konto</th>
                    <th className="px-4 py-3 text-right">Betrag</th>
                    <th className="px-4 py-3 w-32 text-center">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {documents.map(doc => {
                    const isSelected = selectedId === doc.id;
                    const isChecked = selectedIds.includes(doc.id);
                    const isDup = doc.status === DocumentStatus.DUPLICATE;
                    const isDragTarget = dragTargetId === doc.id;
                    const score = doc.data?.ocr_score || 0;
                    
                    let scoreBadge = "bg-emerald-100 text-emerald-700";
                    if (score < 9) scoreBadge = "bg-amber-100 text-amber-700";
                    if (score < 6) scoreBadge = "bg-rose-100 text-rose-700";
                    if (isDup) scoreBadge = "bg-red-500 text-white shadow-red-200 shadow-md";

                    return (
                        <tr 
                            key={doc.id}
                            draggable={!isDup} // Disable dragging for duplicates
                            title={isDup ? `Duplikat: ${doc.duplicateReason}` : ''}
                            onDragStart={(e) => {
                                if (isDup) {
                                    e.preventDefault();
                                    return;
                                }
                                e.dataTransfer.setData('text/plain', doc.id);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                                if (!isDup) {
                                    e.preventDefault();
                                    setDragTargetId(doc.id);
                                }
                            }}
                            onDragLeave={() => setDragTargetId(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragTargetId(null);
                                
                                // Do not allow merging INTO a duplicate
                                if (isDup) return;

                                const sourceId = e.dataTransfer.getData('text/plain');
                                if (sourceId && sourceId !== doc.id) {
                                    onMerge(sourceId, doc.id);
                                }
                            }}
                            onClick={() => onSelectDocument(doc)}
                            className={`group cursor-pointer text-sm transition-all border-l-4 
                                ${isDragTarget ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-20 relative' : ''} 
                                ${isSelected && !isDragTarget ? 'bg-blue-50/50' : 'hover:bg-slate-50'} 
                                ${isDup 
                                    ? 'bg-red-50/40 border-l-red-500 hover:bg-red-100/50' 
                                    : 'border-l-transparent'
                                }
                            `}
                        >
                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={isChecked} onChange={() => onToggleSelect(doc.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" />
                            </td>
                            <td className="px-4 py-3 align-middle">
                                <div className="font-mono font-bold text-slate-700 text-xs">{doc.data?.eigeneBelegNummer || '---'}</div>
                                <div className="text-slate-400 text-[11px] font-medium mt-0.5">{doc.data?.belegDatum || doc.uploadDate.split('T')[0]}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                                {doc.data?.lieferantName || <span className="text-slate-400 italic text-xs">{doc.fileName}</span>}
                                <div className="md:hidden text-[10px] text-slate-400 mt-1">{doc.data?.kontierungskonto}</div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 font-medium font-mono">
                                    {doc.data?.kontierungskonto || '-'}
                                </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-900 text-right font-bold">
                                {doc.data?.bruttoBetrag ? doc.data.bruttoBetrag.toLocaleString('de-DE', {minimumFractionDigits: 2}) + ' €' : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${scoreBadge}`}>
                                    {isDup && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {isDup ? 'Duplikat' : `Score ${score}`}
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      {/* Bulk Action Footer */}
      {selectedIds.length > 0 && (
          <div className="bg-white border-t border-slate-100 p-4 flex justify-between items-center px-6 sticky bottom-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <span className="text-sm text-slate-600 font-medium">{selectedIds.length} ausgewählt</span>
              <button 
                onClick={onBulkDelete}
                className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
              >
                  Löschen
              </button>
          </div>
      )}
    </div>
  );
};
