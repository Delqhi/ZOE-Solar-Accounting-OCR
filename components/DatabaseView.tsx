
import React from 'react';
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
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ 
  documents, 
  onSelectDocument, 
  selectedId,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onBulkDelete,
  onBulkMarkReviewed
}) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 px-6">
        <p className="text-sm">Keine Belege in der Datenbank</p>
        <p className="text-xs mt-2">Nutze den Button oben, um Belege zu erfassen.</p>
      </div>
    );
  }

  const allSelected = documents.length > 0 && selectedIds.length === documents.length;

  return (
    <div className="w-full relative min-h-full">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-semibold text-slate-500 shadow-sm">
          <tr>
            <th className="px-4 py-3 border-b border-slate-200 w-8">
               <input 
                 type="checkbox"
                 checked={allSelected}
                 onChange={onToggleAll}
                 className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
               />
            </th>
            <th className="px-2 py-3 border-b border-slate-200 w-12 text-center">Stat</th>
            <th className="px-2 py-3 border-b border-slate-200">ZOE-Nr.</th>
            <th className="px-2 py-3 border-b border-slate-200">Lieferant / Datum</th>
            <th className="px-4 py-3 border-b border-slate-200 text-right">Betrag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white pb-16">
          {documents.map((doc) => {
            const isSelected = selectedId === doc.id;
            const isChecked = selectedIds.includes(doc.id);
            const isDuplicate = doc.status === DocumentStatus.DUPLICATE;
            
            return (
              <tr 
                key={doc.id} 
                onClick={() => onSelectDocument(doc)}
                className={`cursor-pointer transition-colors group ${
                  isSelected ? 'bg-blue-50' : isDuplicate ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleSelect(doc.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                </td>
                <td className="px-2 py-3 align-top text-center">
                   <div className={`w-3 h-3 rounded-full mt-1.5 mx-auto ${
                      doc.status === DocumentStatus.COMPLETED ? 'bg-green-400' :
                      doc.status === DocumentStatus.DUPLICATE ? 'bg-amber-400' :
                      doc.status === DocumentStatus.PROCESSING ? 'bg-blue-400 animate-pulse' :
                      'bg-red-400'
                   }`} title={doc.status} />
                </td>
                <td className="px-2 py-3 align-top">
                    <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${isDuplicate ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {doc.data?.eigeneBelegNummer || '-'}
                    </span>
                    {isDuplicate && <div className="text-[9px] text-amber-600 mt-0.5">Duplikat</div>}
                </td>
                <td className="px-2 py-3 align-top">
                  <div className={`font-medium truncate max-w-[150px] ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {doc.data?.lieferantName || doc.fileName}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-col gap-0.5 mt-0.5">
                    <span>{doc.data?.belegDatum || doc.uploadDate.split('T')[0]}</span>
                    <span className="text-slate-400 text-[10px] truncate max-w-[150px]" title={doc.data?.belegNummerLieferant}>
                       Ext: {doc.data?.belegNummerLieferant || '-'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <div className={`font-mono font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                    {doc.data?.bruttoBetrag 
                      ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(doc.data.bruttoBetrag)
                      : '-'}
                  </div>
                  {doc.data?.sollKonto && (
                     <div className="text-[10px] text-slate-400 mt-1 px-1.5 py-0.5 bg-slate-100 rounded inline-block">
                        {doc.data.sollKonto} / {doc.data.habenKonto}
                     </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-800 text-white rounded-xl shadow-lg p-3 flex items-center justify-between animate-in slide-in-from-bottom-5 duration-200 z-20">
              <div className="text-xs font-medium pl-2">
                 {selectedIds.length} ausgewählt
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onBulkMarkReviewed(); }}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     Fertig
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onBulkDelete(); }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                     Löschen
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
