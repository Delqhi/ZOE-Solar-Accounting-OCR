
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
  onCompareDuplicates?: (original: DocumentRecord, duplicate: DocumentRecord) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  documents,
  onSelectDocument,
  selectedId,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onBulkDelete,
  onBulkMarkReviewed,
  onBulkOCR,
  onMerge,
  onCompareDuplicates
}) => {
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'supplier' | 'account' | 'amount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const stats = useMemo(() => {
    const count = documents.length;
    const total = documents.reduce((acc, doc) => acc + (doc.data?.bruttoBetrag || 0), 0);
    return { count, total };
  }, [documents]);

  const allSelected = documents.length > 0 && selectedIds.length === documents.length;

  const sortedDocuments = useMemo(() => {
    const sorted = [...documents].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          const dateA = a.data?.belegDatum || a.uploadDate.split('T')[0];
          const dateB = b.data?.belegDatum || b.uploadDate.split('T')[0];
          comparison = dateA.localeCompare(dateB);
          break;
        case 'supplier':
          const nameA = a.data?.lieferantName || a.fileName || '';
          const nameB = b.data?.lieferantName || b.fileName || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'account':
          const accA = a.data?.kontierungskonto || '';
          const accB = b.data?.kontierungskonto || '';
          comparison = accA.localeCompare(accB);
          break;
        case 'amount':
          const amountA = a.data?.bruttoBetrag || 0;
          const amountB = b.data?.bruttoBetrag || 0;
          comparison = amountA - amountB;
          break;
        case 'status':
          const statusOrder = { DUPLICATE: 0, ERROR: 1, REVIEW_NEEDED: 2, COMPLETED: 3, PROCESSING: 4 };
          comparison = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [documents, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon: React.FC<{ field: string }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-slate-300 ml-1 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white md:rounded-tl-2xl overflow-hidden shadow-sm border-l border-t border-slate-100">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center flex-none sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-slate-800 text-sm md:text-base">Übersicht</h2>
          <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{stats.count}</span>
        </div>
        <div className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
          <span className="hidden md:inline">Gesamtvolumen:</span>
          <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg">
            {stats.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>

      {/* Table Container - Responsive Scroll */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse min-w-[700px] md:min-w-full">
          <thead className="bg-slate-50/80 backdrop-blur text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-slate-700 transition-colors group"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Datum / Nr.
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-slate-700 transition-colors group"
                onClick={() => handleSort('supplier')}
              >
                <div className="flex items-center">
                  Lieferant
                  <SortIcon field="supplier" />
                </div>
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-slate-700 transition-colors group hidden md:table-cell"
                onClick={() => handleSort('account')}
              >
                <div className="flex items-center">
                  Konto
                  <SortIcon field="account" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 transition-colors group"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end">
                  Betrag
                  <SortIcon field="amount" />
                </div>
              </th>
              <th
                className="px-4 py-3 w-32 cursor-pointer hover:text-slate-700 transition-colors group"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedDocuments.map(doc => {
              const isSelected = selectedId === doc.id;
              const isChecked = selectedIds.includes(doc.id);
              const isDup = doc.status === DocumentStatus.DUPLICATE;
              const isError = doc.status === DocumentStatus.ERROR;
              const isReview = doc.status === DocumentStatus.REVIEW_NEEDED;
              const isCompleted = doc.status === DocumentStatus.COMPLETED;
              const isDragTarget = dragTargetId === doc.id;
              const score = doc.data?.ocr_score || 0;

              // Determine badge styling
              let badgeConfig = { bg: 'bg-slate-100', text: 'text-slate-600', label: `${score}` };
              if (isDup) {
                badgeConfig = { bg: 'bg-red-500', text: 'text-white', label: 'Duplikat' };
              } else if (isError) {
                badgeConfig = { bg: 'bg-rose-500', text: 'text-white', label: 'Fehler' };
              } else if (isReview) {
                badgeConfig = { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Prüfen' };
              } else if (score >= 9) {
                badgeConfig = { bg: 'bg-emerald-100', text: 'text-emerald-700', label: `${score}` };
              } else if (score >= 6) {
                badgeConfig = { bg: 'bg-yellow-100', text: 'text-yellow-700', label: `${score}` };
              } else {
                badgeConfig = { bg: 'bg-orange-100', text: 'text-orange-700', label: `${score}` };
              }

              const rowTitle = isDup
                ? `Duplikat: ${doc.duplicateReason}`
                : (isError || isReview)
                  ? (doc.error || doc.data?.ocr_rationale || 'Analyse fehlgeschlagen')
                  : '';

              return (
                <tr
                  key={doc.id}
                  draggable={!isDup && !isError && !isReview}
                  title={rowTitle}
                  onDragStart={(e) => {
                    if (isDup || isError || isReview) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData('text/plain', doc.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (!isDup && !isError && !isReview) {
                      e.preventDefault();
                      setDragTargetId(doc.id);
                    }
                  }}
                  onDragLeave={() => setDragTargetId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragTargetId(null);

                    if (isDup || isError || isReview) return;

                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (sourceId && sourceId !== doc.id) {
                      onMerge(sourceId, doc.id);
                    }
                  }}
                  onClick={() => onSelectDocument(doc)}
                  className={`group cursor-pointer text-sm transition-all border-l-4
                    ${isDragTarget ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-20 relative' : ''}
                    ${isSelected && !isDragTarget ? 'bg-blue-50/70' : 'hover:bg-slate-50'}
                    ${isDup
                      ? 'bg-red-50/40 border-l-red-500 hover:bg-red-100/50'
                      : 'border-l-transparent'}
                  `}
                >
                  <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelect(doc.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <div className="font-mono font-bold text-slate-700 text-xs">
                      {doc.data?.eigeneBelegNummer || '---'}
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {doc.data?.belegDatum || doc.uploadDate.split('T')[0]}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {doc.data?.lieferantName || (
                      <span className="text-slate-400 italic text-xs">{doc.fileName}</span>
                    )}
                    <div className="md:hidden text-[10px] text-slate-400 mt-1">{doc.data?.kontierungskonto}</div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-xs text-slate-600 font-medium font-mono">
                      {doc.data?.kontierungskonto || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-900 text-right font-bold">
                    {doc.data?.bruttoBetrag
                      ? doc.data.bruttoBetrag.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €'
                      : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${badgeConfig.bg} ${badgeConfig.text}`}>
                        {(isDup || isError || isReview) && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                          </svg>
                        )}
                        {badgeConfig.label}
                      </span>

                      {/* Compare button for duplicates */}
                      {isDup && onCompareDuplicates && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the original document
                            const original = documents.find(d => d.id === doc.duplicateOfId);
                            if (original) {
                              onCompareDuplicates(original, doc);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
          <div className="flex gap-2">
            {onBulkOCR && (
              <button
                onClick={onBulkOCR}
                className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
              >
                Erneut OCR
              </button>
            )}
            {onBulkMarkReviewed && (
              <button
                onClick={onBulkMarkReviewed}
                className="bg-white border border-emerald-200 text-emerald-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm"
              >
                Als geprüft
              </button>
            )}
            <button
              onClick={onBulkDelete}
              className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
            >
              Löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
