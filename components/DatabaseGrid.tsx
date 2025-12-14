
import React, { useMemo, useState } from 'react';
import { DocumentRecord, DocumentStatus } from '../types';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

interface DatabaseGridProps {
  documents: DocumentRecord[];
  onSelectDocument: (doc: DocumentRecord) => void;
  onExportSQL: () => void;
  onMerge: (sourceId: string, targetId: string) => void;
  availableYears: string[];
  filterYear: string;
  onFilterYearChange: (val: string) => void;
  filterQuarter: string;
  onFilterQuarterChange: (val: string) => void;
  filterMonth: string;
  onFilterMonthChange: (val: string) => void;
}

export const DatabaseGrid: React.FC<DatabaseGridProps> = ({ 
  documents, 
  onSelectDocument,
  onExportSQL,
  onMerge,
  availableYears,
  filterYear,
  onFilterYearChange,
  filterQuarter,
  onFilterQuarterChange,
  filterMonth,
  onFilterMonthChange
}) => {
  // View State
  type ViewType = 'list' | 'euer' | 'ustva';
  const [viewType, setViewType] = useState<ViewType>('list');

  // Drag State
  const [dragTarget, setDragTarget] = useState<string | null>(null);

  // Expand State for Line Items
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Sort State
  const [sortField, setSortField] = useState<string>('uploadDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sorting Logic
  const sortedDocs = useMemo(() => {
    return [...documents].sort((a, b) => {
      let valA: any = a;
      let valB: any = b;
      
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

  // Totals for Footer (Global)
  const totals = useMemo(() => {
    return sortedDocs.reduce((acc, doc) => {
        if (doc.status === DocumentStatus.DUPLICATE) return acc;
        return {
          netto: acc.netto + (doc.data?.nettoBetrag || 0),
          mwst: acc.mwst + (doc.data?.mwstBetrag19 || 0) + (doc.data?.mwstBetrag7 || 0),
          brutto: acc.brutto + (doc.data?.bruttoBetrag || 0)
        };
    }, { netto: 0, mwst: 0, brutto: 0 });
  }, [sortedDocs]);

  // --- EÜR Calculation ---
  const euerData = useMemo(() => {
      const groups: Record<string, { id: string, label: string, amount: number, count: number }> = {};
      
      sortedDocs.forEach(doc => {
          if (doc.status === DocumentStatus.DUPLICATE) return;
          const d = doc.data;
          if (!d) return;

          const id = d.kontierungskonto || d.sollKonto || 'sonstiges';
          const label = d.kontogruppe || (d.kontierungskonto ? d.kontierungskonto.toUpperCase() : 'Sonstiges');
          const net = d.nettoBetrag || 0;
          
          if (!groups[id]) {
              groups[id] = { 
                  id, 
                  label, 
                  amount: 0, 
                  count: 0 
              };
          }
          groups[id].amount += net;
          groups[id].count += 1;
      });

      return Object.values(groups).sort((a, b) => b.amount - a.amount); 
  }, [sortedDocs]);

  // --- UStVA Calculation ---
  const ustvaData = useMemo(() => {
      let base19 = 0;
      let tax19 = 0;
      let base7 = 0;
      let tax7 = 0;
      let base0 = 0; 
      let reverseChargeBase = 0;

      sortedDocs.forEach(doc => {
          if (doc.status === DocumentStatus.DUPLICATE) return;
          const d = doc.data;
          if (!d) return;

          tax19 += d.mwstBetrag19 || 0;
          tax7 += d.mwstBetrag7 || 0;

          if ((d.mwstBetrag19 || 0) > 0) base19 += (d.mwstBetrag19 || 0) / 0.19;
          if ((d.mwstBetrag7 || 0) > 0) base7 += (d.mwstBetrag7 || 0) / 0.07;
          
          const taxedNet19 = (d.mwstBetrag19 || 0) / 0.19;
          const taxedNet7 = (d.mwstBetrag7 || 0) / 0.07;
          const totalTaxedNet = taxedNet19 + taxedNet7;
          
          let remainderNet = (d.nettoBetrag || 0) - totalTaxedNet;
          if (remainderNet < 0.05 && remainderNet > -0.05) remainderNet = 0;

          if (remainderNet > 0) {
              if (d.reverseCharge) {
                  reverseChargeBase += remainderNet;
              } else {
                  base0 += remainderNet;
              }
          }
      });

      return { base19, tax19, base7, tax7, base0, reverseChargeBase };
  }, [sortedDocs]);


  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleExpandRow = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setExpandedRowIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
    const title = viewType === 'euer' ? 'Einnahmenüberschussrechnung (EÜR)' : viewType === 'ustva' ? 'Umsatzsteuervoranmeldung' : 'Belegliste (Detailliert)';
    
    doc.setFontSize(18);
    doc.text(`ZOE Solar - ${title}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Filter: ${filterYear}/${filterQuarter}/${filterMonth}`, 14, 28);

    if (viewType === 'list') {
        const tableData = sortedDocs.map(d => [
            d.data?.belegDatum || '',
            d.data?.lieferantName || '',
            d.data?.belegNummerLieferant || '',
            (d.data?.nettoBetrag || 0).toLocaleString('de-DE', {minimumFractionDigits: 2}),
            (d.data?.bruttoBetrag || 0).toLocaleString('de-DE', {minimumFractionDigits: 2}),
            d.data?.sollKonto || '',
            d.data?.habenKonto || ''
        ]);
        autoTable(doc, {
            startY: 40,
            head: [['Datum', 'Lieferant', 'Re-Nr.', 'Netto', 'Brutto', 'Soll', 'Haben']],
            body: tableData,
            styles: { fontSize: 8 }
        });
    } else if (viewType === 'euer') {
        const tableData = euerData.map(d => [
            d.id,
            d.label,
            d.count,
            d.amount.toLocaleString('de-DE', {minimumFractionDigits: 2}) + ' €'
        ]);
        tableData.push(['', 'SUMME AUSGABEN', '', totals.netto.toLocaleString('de-DE', {minimumFractionDigits: 2}) + ' €']);
        autoTable(doc, {
            startY: 40,
            head: [['Konto', 'Bezeichnung', 'Anzahl', 'Netto Summe']],
            body: tableData,
        });
    } else if (viewType === 'ustva') {
        const tableData = [
            ['Steuerfreie Umsätze / PV', ustvaData.base0.toLocaleString('de-DE', {minimumFractionDigits: 2}), '0,00'],
            ['IGL / Reverse Charge', ustvaData.reverseChargeBase.toLocaleString('de-DE', {minimumFractionDigits: 2}), '0,00'],
            ['Vorsteuer 7%', ustvaData.base7.toLocaleString('de-DE', {minimumFractionDigits: 2}), ustvaData.tax7.toLocaleString('de-DE', {minimumFractionDigits: 2})],
            ['Vorsteuer 19%', ustvaData.base19.toLocaleString('de-DE', {minimumFractionDigits: 2}), ustvaData.tax19.toLocaleString('de-DE', {minimumFractionDigits: 2})],
            ['SUMME VORSTEUER', '', (ustvaData.tax7 + ustvaData.tax19).toLocaleString('de-DE', {minimumFractionDigits: 2})]
        ];
        autoTable(doc, {
            startY: 40,
            head: [['Position', 'Bemessungsgrundlage', 'Steuer']],
            body: tableData,
        });
    }
    doc.save(`zoe_${viewType}_${filterYear}.pdf`);
  };

  const handleExportCSV = () => {
    // ... CSV Export logic remains similar but could be expanded ...
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1 text-[10px]">▼</span>;
    return <span className="text-gray-800 ml-1 text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  const TH = ({ label, field, className = '', style = {} }: { label: string, field: string, className?: string, style?: React.CSSProperties }) => (
    <th 
      className={`px-4 py-3 border-b border-gray-200 bg-gray-50 text-left text-[11px] font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap ${className}`}
      style={style}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label} <SortIcon field={field} />
      </div>
    </th>
  );

  const renderStandardList = () => (
    <div className="relative w-full h-full overflow-auto">
      <table className="min-w-max text-left text-sm border-collapse">
        <thead className="bg-gray-50 z-20">
          <tr>
            <th className="px-2 py-3 border-b border-gray-200 bg-gray-50 w-8 sticky left-0 z-30"></th>
            {/* Sticky Columns for essential ID data */}
            <TH label="Datum" field="data.belegDatum" className="sticky left-8 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" />
            <TH label="ZOE-Nr." field="data.eigeneBelegNummer" className="sticky left-[132px] bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" />
            <TH label="Lieferant" field="data.lieferantName" className="sticky left-[232px] bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-200" />
            
            {/* Scrollable Columns for Data Richness */}
            <TH label="Original-Nr." field="data.belegNummerLieferant" />
            
            <TH label="Netto" field="data.nettoBetrag" className="text-right" />
            <TH label="Brutto" field="data.bruttoBetrag" className="text-right" />
            
            <TH label="Soll (SKR03)" field="data.sollKonto" />
            <TH label="Haben" field="data.habenKonto" />
            
            <TH label="Konto" field="data.kontierungskonto" />
            <TH label="Kategorie" field="data.steuerkategorie" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-[13px]">
          {sortedDocs.map(doc => {
              const isDuplicate = doc.status === DocumentStatus.DUPLICATE;
              const isDragTarget = dragTarget === doc.id;
              const isExpanded = expandedRowIds.has(doc.id);
              
              return (
                <React.Fragment key={doc.id}>
                <tr 
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', doc.id);
                    e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragTarget(doc.id);
                }}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (sourceId && sourceId !== doc.id) {
                        onMerge(sourceId, doc.id);
                    }
                    setDragTarget(null);
                }}
                onClick={() => onSelectDocument(doc)}
                className={`cursor-pointer transition-colors border-l-2 ${
                    isDragTarget 
                        ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-20 relative' 
                        : isDuplicate 
                            ? 'bg-red-50/30 hover:bg-red-50 border-red-400' 
                            : 'hover:bg-gray-50 border-transparent'
                }`}
                >
                <td className="px-2 py-2.5 bg-white border-r border-gray-100 sticky left-0 z-20 text-center" onClick={(e) => toggleExpandRow(e, doc.id)}>
                    <div className={`p-1 rounded hover:bg-gray-100 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                </td>
                {/* Sticky Cells Matching Headers */}
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap font-mono text-xs sticky left-8 bg-white border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50">
                    {doc.data?.belegDatum}
                </td>
                <td className="px-4 py-2.5 sticky left-[132px] bg-white border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50">
                     <span className={`font-mono text-xs font-medium text-blue-600`}>
                        {doc.data?.eigeneBelegNummer}
                    </span>
                </td>
                <td className="px-4 py-2.5 text-gray-900 font-medium sticky left-[232px] bg-white border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50 max-w-[200px] truncate">
                    {doc.data?.lieferantName || doc.fileName}
                </td>

                {/* Extended Data Cells */}
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                    {doc.data?.belegNummerLieferant || '-'}
                </td>
               
                {/* Financials */}
                <td className="px-4 py-2.5 text-right font-mono text-gray-500">
                    {(doc.data?.nettoBetrag || 0).toLocaleString('de-DE', {minimumFractionDigits: 2})}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-900 font-medium">
                    {(doc.data?.bruttoBetrag || 0).toLocaleString('de-DE', {minimumFractionDigits: 2})}
                </td>
                
                {/* SKR03 */}
                <td className="px-4 py-2.5 text-xs text-gray-700 font-bold font-mono">
                    {doc.data?.sollKonto}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700 font-bold font-mono">
                    {doc.data?.habenKonto}
                </td>

                {/* Meta */}
                <td className="px-4 py-2.5 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
                        {doc.data?.kontierungskonto}
                    </span>
                </td>
                <td className="px-4 py-2.5 text-[10px] text-gray-500 whitespace-nowrap">
                    {doc.data?.steuerkategorie}
                </td>
                </tr>
                
                {/* Nested Line Items Row */}
                {isExpanded && (
                    <tr className="bg-gray-50/50 shadow-inner">
                        <td colSpan={2} className="sticky left-0 bg-gray-50 border-r border-gray-200"></td>
                        <td colSpan={9} className="p-4">
                             <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-2xl">
                                 <table className="w-full text-xs">
                                     <thead className="bg-gray-100 text-gray-500 font-semibold border-b border-gray-200">
                                         <tr>
                                             <th className="px-3 py-2 text-left">Beschreibung</th>
                                             <th className="px-3 py-2 text-right w-24">Betrag</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-gray-100">
                                         {(doc.data?.lineItems || []).map((item, idx) => (
                                             <tr key={idx}>
                                                 <td className="px-3 py-1.5 text-gray-700">{item.description}</td>
                                                 <td className="px-3 py-1.5 text-right font-mono">{item.amount?.toFixed(2)}</td>
                                             </tr>
                                         ))}
                                         {(!doc.data?.lineItems || doc.data.lineItems.length === 0) && (
                                             <tr><td colSpan={2} className="px-3 py-2 text-center text-gray-400 italic">Keine Positionen</td></tr>
                                         )}
                                     </tbody>
                                 </table>
                             </div>
                        </td>
                    </tr>
                )}
                </React.Fragment>
              );
          })}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200 z-20">
            <tr>
                <td className="sticky left-0 bg-gray-50"></td>
                <td colSpan={5} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 sticky left-8 bg-gray-50">Gesamt</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                    {totals.brutto.toLocaleString('de-DE', {minimumFractionDigits: 2})} €
                </td>
                <td colSpan={4}></td>
            </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderEuerView = () => (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Einnahmenüberschussrechnung (Ausgaben)</h3>
            <div className="text-sm text-gray-500">
                Gesamt Netto: <span className="font-mono font-bold text-gray-900 ml-2">{totals.netto.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
            </div>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[13px]">
                <tr>
                    <th className="px-6 py-3">Kategorie / Konto</th>
                    <th className="px-6 py-3 text-center">Anzahl</th>
                    <th className="px-6 py-3 text-right">Netto Summe</th>
                    <th className="px-6 py-3 w-40">Anteil (Volumen)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[13px]">
                {euerData.map((row) => {
                    const percent = totals.netto > 0 ? (row.amount / totals.netto) * 100 : 0;
                    return (
                        <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                                <div className="font-medium text-gray-800">{row.label}</div>
                                <div className="text-xs text-gray-400 font-mono mt-0.5">{row.id}</div>
                            </td>
                            <td className="px-6 py-3 text-center text-gray-600 font-mono">
                                {row.count}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-gray-900 font-medium">
                                {row.amount.toLocaleString('de-DE', {minimumFractionDigits: 2})} €
                            </td>
                            <td className="px-6 py-3 align-middle">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 rounded-full" 
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 w-8 text-right font-mono">{percent.toFixed(1)}%</span>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                {euerData.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                            Keine Daten für den gewählten Zeitraum.
                        </td>
                    </tr>
                )}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                    <td className="px-6 py-3 font-semibold text-gray-700">Gesamtsumme</td>
                    <td className="px-6 py-3 text-center font-bold text-gray-700 font-mono">{euerData.reduce((a,b) => a + b.count, 0)}</td>
                    <td className="px-6 py-3 text-right font-bold font-mono text-gray-900">{totals.netto.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
      </div>
    </div>
  );

  const renderUstvaView = () => (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Umsatzsteuervoranmeldung (Vorbereitung)</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[13px]">
                    <tr>
                        <th className="px-6 py-3 w-1/2">Position</th>
                        <th className="px-6 py-3 text-right">Bemessungsgrundlage</th>
                        <th className="px-6 py-3 text-right">Steuer</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px]">
                     <tr className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-800">Steuerfreie Umsätze / PV (0%)</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.base0.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-400">0,00 €</td>
                     </tr>
                     <tr className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-800">IGL / Reverse Charge (§13b)</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.reverseChargeBase.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-400">0,00 €</td>
                     </tr>
                     <tr className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-800">Vorsteuer 7%</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.base7.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-700">{ustvaData.tax7.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                     </tr>
                     <tr className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-800">Vorsteuer 19%</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.base19.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-700">{ustvaData.tax19.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                     </tr>
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                        <td className="px-6 py-3 font-semibold text-gray-700">SUMME VORSTEUER (Abziehbar)</td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right font-bold font-mono text-gray-900">
                            {(ustvaData.tax7 + ustvaData.tax19).toLocaleString('de-DE', {minimumFractionDigits: 2})} €
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
      </div>
  );


  return (
    <div className="h-full flex flex-col bg-white">
       {/* Filter Toolbar */}
       <div className="px-6 py-3 border-b border-gray-200 bg-white flex justify-between items-center gap-4">
            <div className="flex bg-gray-100 p-0.5 rounded-md">
                {(['list', 'euer', 'ustva'] as ViewType[]).map(t => (
                    <button 
                        key={t}
                        onClick={() => setViewType(t)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewType === t ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        {t === 'list' ? 'Liste' : t.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 items-center">
                 <select 
                        value={filterYear}
                        onChange={(e) => onFilterYearChange(e.target.value)}
                        className="bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500 hover:border-gray-400 transition-colors"
                 >
                        <option value="all">Jahr</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
                 
                 <select 
                        value={filterQuarter}
                        onChange={(e) => onFilterQuarterChange(e.target.value)}
                        className="bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500 hover:border-gray-400 transition-colors"
                 >
                        <option value="all">Q</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                 </select>

                 <select 
                        value={filterMonth}
                        onChange={(e) => onFilterMonthChange(e.target.value)}
                        className="bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500 hover:border-gray-400 transition-colors"
                 >
                        <option value="all">M</option>
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                             <option key={m} value={m.toString().padStart(2, '0')}>{m}</option>
                        ))}
                 </select>

                 <div className="h-4 w-px bg-gray-200 mx-1"></div>

                 <button onClick={handleExportPDF} className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded hover:bg-gray-50 transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                 </button>
                 <button onClick={onExportSQL} className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded hover:bg-gray-50 transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                 </button>
            </div>
       </div>

       <div className="flex-1 overflow-auto bg-white">
          {viewType === 'list' && renderStandardList()}
          {viewType === 'euer' && renderEuerView()}
          {viewType === 'ustva' && renderUstvaView()}
       </div>
    </div>
  );
};
