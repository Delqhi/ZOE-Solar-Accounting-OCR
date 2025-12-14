
import React, { useMemo, useState } from 'react';
import { DocumentRecord, DocumentStatus, ExtractedData } from '../types';

interface DatabaseGridProps {
  documents: DocumentRecord[];
  onSelectDocument: (doc: DocumentRecord) => void;
  onExportSQL: () => void;
}

export const DatabaseGrid: React.FC<DatabaseGridProps> = ({ 
  documents, 
  onSelectDocument,
  onExportSQL
}) => {
  const [sortField, setSortField] = useState<string>('uploadDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedDocs = useMemo(() => {
    return [...documents].sort((a, b) => {
      let valA: any = a;
      let valB: any = b;
      
      // Handle nested data fields
      if (sortField.startsWith('data.')) {
        const field = sortField.split('.')[1];
        valA = a.data ? (a.data as any)[field] : '';
        valB = b.data ? (b.data as any)[field] : '';
      } else {
        valA = (a as any)[sortField];
        valB = (b as any)[sortField];
      }

      if (!valA) valA = '';
      if (!valB) valB = '';

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const TH = ({ label, field, className = '' }: { label: string, field: string, className?: string }) => (
    <th 
      className={`px-3 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label} <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="h-full flex flex-col bg-white">
       {/* Header Toolbar */}
       <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-sm inline-block"></span>
              Datenbank Ansicht
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Alle Belege (PostgreSQL Kompatibel) • {documents.length} Einträge
            </p>
          </div>
          <button 
             onClick={onExportSQL}
             className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             Export SQL
          </button>
       </div>

       {/* Grid */}
       <div className="flex-1 overflow-auto">
         <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 shadow-sm">
               <tr>
                 <th className="w-10 px-3 py-3 border-b border-slate-200 bg-slate-50"></th>
                 <TH label="ZOE-Nr." field="data.eigeneBelegNummer" className="font-mono" />
                 <TH label="Datum" field="data.belegDatum" />
                 <TH label="Lieferant" field="data.lieferantName" />
                 <TH label="Netto" field="data.nettoBetrag" className="text-right" />
                 <TH label="MwSt 7%" field="data.mwstBetrag7" className="text-right" />
                 <TH label="MwSt 19%" field="data.mwstBetrag19" className="text-right" />
                 <TH label="Brutto" field="data.bruttoBetrag" className="text-right" />
                 <TH label="Soll" field="data.sollKonto" />
                 <TH label="Haben" field="data.habenKonto" />
                 <TH label="Kategorie" field="data.steuerKategorie" />
                 <TH label="Status" field="status" />
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {sortedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                       Keine Daten vorhanden.
                    </td>
                  </tr>
               ) : (
                  sortedDocs.map((doc) => {
                    const d = (doc.data || {}) as Partial<ExtractedData>;
                    const formatCurrency = (val?: number) => val ? val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '-';
                    
                    return (
                       <tr 
                          key={doc.id} 
                          onClick={() => onSelectDocument(doc)}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                       >
                          <td className="px-3 py-3 text-center">
                             <div className={`w-2.5 h-2.5 rounded-full mx-auto ${
                                doc.status === DocumentStatus.COMPLETED ? 'bg-green-500' :
                                doc.status === DocumentStatus.ERROR ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                             }`} />
                          </td>
                          <td className="px-3 py-3 font-mono text-blue-700 font-medium">{d.eigeneBelegNummer || '-'}</td>
                          <td className="px-3 py-3 text-slate-600">{d.belegDatum || doc.uploadDate.split('T')[0]}</td>
                          <td className="px-3 py-3 font-medium text-slate-800">{d.lieferantName || doc.fileName}</td>
                          
                          <td className="px-3 py-3 text-right text-slate-600 font-mono">{formatCurrency(d.nettoBetrag)}</td>
                          <td className="px-3 py-3 text-right text-slate-500 text-xs">{d.mwstBetrag7 ? formatCurrency(d.mwstBetrag7) : ''}</td>
                          <td className="px-3 py-3 text-right text-slate-500 text-xs">{d.mwstBetrag19 ? formatCurrency(d.mwstBetrag19) : ''}</td>
                          <td className="px-3 py-3 text-right font-bold text-slate-800 font-mono bg-slate-50 group-hover:bg-blue-100/30">{formatCurrency(d.bruttoBetrag)}</td>
                          
                          <td className="px-3 py-3"><span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">{d.sollKonto}</span></td>
                          <td className="px-3 py-3"><span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">{d.habenKonto}</span></td>
                          
                          <td className="px-3 py-3 text-xs text-slate-500 truncate max-w-[150px]" title={d.steuerKategorie}>{d.steuerKategorie}</td>
                          <td className="px-3 py-3">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                doc.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                doc.status === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                             }`}>
                                {doc.status === 'COMPLETED' ? 'Fertig' : doc.status.toLowerCase()}
                             </span>
                          </td>
                       </tr>
                    );
                  })
               )}
            </tbody>
         </table>
       </div>
    </div>
  );
};
