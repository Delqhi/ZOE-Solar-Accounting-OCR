
import React, { useMemo, useState } from 'react';
import { AppSettings, DocumentRecord, DocumentStatus } from '../types';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { formatPreflightForDialog, runExportPreflight } from '../services/exportPreflight';
import { generateDatevExtfBuchungsstapelCsv, runDatevExportPreflight } from '../services/datevExport';
import { validateUstva, submitUstva, UstvaValidationRequest, UstvaSubmissionRequest } from '../services/submissionService';
import { generateElsterXml, downloadElsterXml, ElsterExportRequest } from '../services/elsterExport';

interface DatabaseGridProps {
  documents: DocumentRecord[];
  onSelectDocument: (doc: DocumentRecord) => void;
    onExportSQL: () => void | Promise<void>;
  onMerge: (sourceId: string, targetId: string) => void;
    settings?: AppSettings;
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
    settings,
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

  // Submission State
  const [pfxFile, setPfxFile] = useState<File | null>(null);
  const [pfxPassword, setPfxPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string>('');

  // Sorting Logic - optimized to avoid repeated split()
  const sortFieldKey = sortField.startsWith('data.') ? sortField.split('.')[1] : null;
  const sortedDocs = useMemo(() => {
    return [...documents].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortFieldKey) {
        valA = a.data ? (a.data as any)[sortFieldKey] : '';
        valB = b.data ? (b.data as any)[sortFieldKey] : '';
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
  }, [documents, sortField, sortDirection, sortFieldKey]);

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

  // Submission Functions
  const getSubmissionUrl = () => {
    const config = settings?.submissionConfig;
    if (!config) return null;

    if (config.mode === 'local') {
      return config.localUrl || 'http://localhost:8080';
    } else if (config.mode === 'oci') {
      return config.ociUrl;
    }
    return null;
  };

  const getSubmissionApiKey = () => {
    return settings?.submissionConfig?.apiKey;
  };

  const handleValidateUstva = async () => {
    const url = getSubmissionUrl();
    if (!url) {
      setSubmissionResult('Fehler: Keine Backend-URL konfiguriert. Prüfen Sie die Einstellungen.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult('Validierung läuft...');

    const period = filterYear === 'all' ? 'all' : `${filterYear}${filterQuarter !== 'all' ? filterQuarter : filterMonth !== 'all' ? filterMonth : ''}`;

    const request: UstvaValidationRequest = {
      period,
      data: ustvaData,
    };

    const result = await validateUstva(url, request, getSubmissionApiKey());

    if (result.success) {
      setSubmissionResult('Validierung erfolgreich!');
    } else {
      setSubmissionResult(`Validierungsfehler: ${result.error}`);
    }

    setIsSubmitting(false);
  };

  const handleSubmitUstva = async () => {
    if (!pfxFile) {
      setSubmissionResult('Fehler: Keine Zertifikatsdatei ausgewählt.');
      return;
    }

    if (!pfxPassword) {
      setSubmissionResult('Fehler: Kein PIN/Passwort eingegeben.');
      return;
    }

    const url = getSubmissionUrl();
    if (!url) {
      setSubmissionResult('Fehler: Keine Backend-URL konfiguriert. Prüfen Sie die Einstellungen.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult('Übermittlung läuft...');

    const period = filterYear === 'all' ? 'all' : `${filterYear}${filterQuarter !== 'all' ? filterQuarter : filterMonth !== 'all' ? filterMonth : ''}`;

    const request: UstvaSubmissionRequest = {
      period,
      data: ustvaData,
      pfxFile,
      pfxPassword,
    };

    const result = await submitUstva(url, request, getSubmissionApiKey());

    if (result.success) {
      setSubmissionResult(`Übermittlung erfolgreich! Ticket: ${result.ticket || 'N/A'}`);
    } else {
      setSubmissionResult(`Übermittlungsfehler: ${result.error}`);
    }

    setIsSubmitting(false);
  };

  const calculateUstvaData = () => {
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

    return { base0, reverseChargeBase, base7, tax7, base19, tax19 };
  };

  const handleExportUstvaXml = () => {
    if (!settings?.elsterStammdaten) {
      alert('ELSTER XML Export: Stammdaten fehlen. Bitte konfigurieren Sie Ihre ELSTER-Stammdaten in den Einstellungen.');
      return;
    }

    // Calculate UStVA data for current filter period
    const period = filterQuarter !== 'all'
      ? `${filterYear}Q${filterQuarter}`
      : filterMonth !== 'all'
        ? `${filterYear}${filterMonth.padStart(2, '0')}`
        : `${filterYear}`;
    const ustvaData = calculateUstvaData();

    const exportRequest: ElsterExportRequest = {
      stammdaten: settings.elsterStammdaten,
      ustvaData: {
        period,
        base0: ustvaData.base0,
        reverseChargeBase: ustvaData.reverseChargeBase,
        base7: ustvaData.base7,
        tax7: ustvaData.tax7,
        base19: ustvaData.base19,
        tax19: ustvaData.tax19
      }
    };

    const xml = generateElsterXml(exportRequest);
    const filename = `elster_ustva_${period}.xml`;
    downloadElsterXml(xml, filename);

    alert(`ELSTER XML-Datei "${filename}" wurde heruntergeladen.\n\nBitte laden Sie diese Datei manuell im ELSTER Online Portal hoch:\nhttps://www.elster.de/eportal/`);
  };

  const handleExportPDF = () => {
        const preflight = runExportPreflight(sortedDocs, settings);
    const dialog = formatPreflightForDialog(preflight);

    if (preflight.blockers.length > 0) {
        alert(`${dialog.title}\n\n${dialog.body}`);
        return;
    }

    if (preflight.warnings.length > 0) {
        const ok = confirm(`${dialog.title}\n\n${dialog.body}\n\nTrotzdem exportieren?`);
        if (!ok) return;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
    const title = viewType === 'euer' ? 'Einnahmenüberschussrechnung (EÜR)' : viewType === 'ustva' ? 'Umsatzsteuervoranmeldung' : 'Belegliste (Detailliert)';
    const timestamp = new Date().toISOString();
    const timestampTag = timestamp.replace(/[:.]/g, '-');
    const y = filterYear === 'all' ? 'all' : filterYear;
    const q = filterQuarter === 'all' ? 'all' : filterQuarter;
    const m = filterMonth === 'all' ? 'all' : filterMonth;
    const filterTag = `${y}_${q}_${m}`;

    doc.setFontSize(18);
    doc.text(`ZOE Solar - ${title}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Filter: ${filterYear}/${filterQuarter}/${filterMonth}`, 14, 28);
    doc.text(`Export: ${timestamp}`, 14, 34);

        // Optional: ELSTER Stammdaten als Header-Block
        const elster = settings?.elsterStammdaten;
        const trim = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim();
        const elsterLines: string[] = [];
        if (elster) {
            const name = trim(elster.unternehmensName);
            const addr = [trim(elster.strasse), trim(elster.hausnummer), trim(elster.plz), trim(elster.ort)].filter(Boolean).join(' ');
            const stnr = trim(elster.eigeneSteuernummer);
            const ustId = trim(elster.eigeneUstIdNr);
            const fa = trim(elster.finanzamtName);
            if (name) elsterLines.push(`Mandant: ${name}`);
            if (addr) elsterLines.push(`Anschrift: ${addr}${trim(elster.land) ? ` (${trim(elster.land)})` : ''}`);
            if (stnr) elsterLines.push(`Eigene Steuernummer: ${stnr}`);
            if (ustId) elsterLines.push(`Eigene USt-IdNr: ${ustId}`);
            if (fa) elsterLines.push(`Finanzamt: ${fa}`);
        }

        let tableStartY = 40;
        if (elsterLines.length > 0) {
            doc.setFontSize(9);
            const headerY = 40;
            elsterLines.forEach((line, idx) => {
                doc.text(line, 14, headerY + idx * 5);
            });
            tableStartY = headerY + elsterLines.length * 5 + 4;
        }

    if (viewType === 'list') {
        const tableData = sortedDocs.map(d => {
            const data: any = d.data || {};
            const money = (v: unknown) => {
                const n = typeof v === 'number' ? v : Number(v);
                return Number.isFinite(n) ? n.toLocaleString('de-DE', { minimumFractionDigits: 2 }) : '';
            };
            const flag = (v: unknown) => (v === true ? '✓' : '');

            return [
                data.belegDatum || '',
                data.eigeneBelegNummer || '',
                data.lieferantName || '',
                data.belegNummerLieferant || '',
                data.zahlungsStatus || '',
                data.zahlungsDatum || '',
                data.zahlungsmethode || '',
                money(data.nettoBetrag),
                money(data.mwstBetrag19),
                money(data.mwstBetrag7),
                money(data.bruttoBetrag),
                data.steuerkategorie || '',
                data.sollKonto || '',
                data.habenKonto || '',
                data.kontierungskonto || '',
                flag(data.reverseCharge),
                flag(data.vorsteuerabzug),
                flag(data.kleinbetrag),
                flag(data.privatanteil),
                String(data.ocr_score ?? ''),
                d.status
            ];
        });
        autoTable(doc, {
            startY: tableStartY,
            head: [[
                'Datum',
                'ZOE-Nr.',
                'Lieferant',
                'Re-Nr.',
                'Zahl-Status',
                'Zahl-Datum',
                'Zahlart',
                'Netto',
                'MwSt 19',
                'MwSt 7',
                'Brutto',
                'Steuerkat.',
                'Soll',
                'Haben',
                'Konto',
                'RC',
                'VSt',
                'KB',
                'Priv',
                'OCR',
                'Status'
            ]],
            body: tableData,
            styles: { fontSize: 6, cellPadding: 1 },
            headStyles: { fillColor: [245, 245, 245], textColor: 80 },
            margin: { left: 10, right: 10 },
            horizontalPageBreak: true
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
            startY: tableStartY,
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
            startY: tableStartY,
            head: [['Position', 'Bemessungsgrundlage', 'Steuer']],
            body: tableData,
        });
    }
    doc.save(`zoe_${viewType}_${filterTag}_${timestampTag}.pdf`);
  };

  const handleExportCSV = () => {
    const preflight = runExportPreflight(sortedDocs, settings);
    const dialog = formatPreflightForDialog(preflight);
    if (preflight.blockers.length > 0) {
        alert(`${dialog.title}\n\n${dialog.body}`);
        return;
    }
    if (preflight.warnings.length > 0) {
        const ok = confirm(`${dialog.title}\n\n${dialog.body}\n\nTrotzdem exportieren?`);
        if (!ok) return;
    }

    const timestamp = new Date().toISOString();
    const timestampTag = timestamp.replace(/[:.]/g, '-');
    const y = filterYear === 'all' ? 'all' : filterYear;
    const q = filterQuarter === 'all' ? 'all' : filterQuarter;
    const m = filterMonth === 'all' ? 'all' : filterMonth;
    const filterTag = `${y}_${q}_${m}`;

    const columns = [
        'datum',
        'lieferant',
        'adresse',
        'steuernummer',
        'belegnummer_lieferant',
        'interne_nummer',
        'zahlungsmethode',
        'zahlungsdatum',
        'zahlungsstatus',
        'rechnungs_empfaenger',
        'aufbewahrungsort',
        'netto',
        'mwst_satz_0',
        'mwst_0',
        'mwst_satz_7',
        'mwst_7',
        'mwst_satz_19',
        'mwst_19',
        'brutto',
        'steuerkategorie',
        'kontierungskonto',
        'soll_konto',
        'haben_konto',
        'reverse_charge',
        'vorsteuerabzug',
        'kleinbetrag',
        'privatanteil',
        'ocr_score',
        'ocr_rationale',
        'beschreibung',
        'text_content',
        'status'
    ];

    const csvEscape = (value: unknown): string => {
        const s = value === null || value === undefined ? '' : String(value);
        // Always quote for robustness
        return `"${s.replace(/"/g, '""')}"`;
    };

    const num = (value: unknown): string => {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return '';
        return n.toFixed(2);
    };

    const bool = (value: unknown): string => {
        if (value === true) return 'true';
        if (value === false) return 'false';
        if (value === 1) return 'true';
        if (value === 0) return 'false';
        return '';
    };

    const isoDate = (value: unknown): string => {
        const s = value === null || value === undefined ? '' : String(value);
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
    };

    const rows = sortedDocs.map(doc => {
        const d: any = doc.data || {};
        return [
            isoDate(d.belegDatum),
            d.lieferantName || '',
            d.lieferantAdresse || '',
            d.steuernummer || '',
            d.belegNummerLieferant || '',
            d.eigeneBelegNummer || '',
            d.zahlungsmethode || '',
            isoDate(d.zahlungsDatum),
            d.zahlungsStatus || '',
            d.rechnungsEmpfaenger || '',
            d.aufbewahrungsOrt || '',
            num(d.nettoBetrag),
            num(d.mwstSatz0),
            num(d.mwstBetrag0),
            num(d.mwstSatz7),
            num(d.mwstBetrag7),
            num(d.mwstSatz19),
            num(d.mwstBetrag19),
            num(d.bruttoBetrag),
            d.steuerkategorie || '',
            d.kontierungskonto || '',
            d.sollKonto || '',
            d.habenKonto || '',
            bool(d.reverseCharge),
            bool(d.vorsteuerabzug),
            bool(d.kleinbetrag),
            bool(d.privatanteil),
            d.ocr_score ?? '',
            d.ocr_rationale || '',
            d.beschreibung || '',
            d.textContent || '',
            doc.status || ''
        ];
    });

    const delimiter = ';';
    const header = columns.map(csvEscape).join(delimiter);
    const body = rows.map(r => r.map(csvEscape).join(delimiter)).join('\r\n');
    const csv = `${header}\r\n${body}\r\n`;

    // 2nd CSV: Positionen (1:n)
    const positionColumns = ['doc_id', 'line_index', 'description', 'amount'];
    const positionRows: Array<Array<string>> = [];
    sortedDocs.forEach(doc => {
        const items = doc.data?.lineItems || [];
        items.forEach((item: any, idx: number) => {
            positionRows.push([
                doc.id,
                String(idx),
                item?.description || '',
                num(item?.amount)
            ]);
        });
    });
    const positionHeader = positionColumns.map(csvEscape).join(delimiter);
    const positionBody = positionRows.map(r => r.map(csvEscape).join(delimiter)).join('\r\n');
    const positionsCsv = `${positionHeader}\r\n${positionBody}\r\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoe_belege_${filterTag}_${timestampTag}.csv`;
    a.click();
    URL.revokeObjectURL(url);

        // Download positions CSV (if any rows, still export header-only to keep deterministic)
        const blob2 = new Blob([positionsCsv], { type: 'text/csv;charset=utf-8' });
        const url2 = URL.createObjectURL(blob2);
        const a2 = document.createElement('a');
        a2.href = url2;
        a2.download = `zoe_positionen_${filterTag}_${timestampTag}.csv`;
        a2.click();
        URL.revokeObjectURL(url2);

        // 3rd CSV: ELSTER Stammdaten (1:1 / 1 row)
        const stammdatenColumns = [
            'unternehmens_name',
            'land',
            'plz',
            'ort',
            'strasse',
            'hausnummer',
            'eigene_steuernummer',
            'eigene_steuernummer_digits',
            'eigene_ust_idnr',
            'finanzamt_name',
            'finanzamt_nr',
            'rechtsform',
            'besteuerung_ust',
            'kleinunternehmer',
            'iban',
            'kontakt_email'
        ];
        const sd = settings?.elsterStammdaten;
        const sdDigits = (sd?.eigeneSteuernummer || '').replace(/\D/g, '');
        const stammdatenRow = [
            sd?.unternehmensName || '',
            sd?.land || 'DE',
            sd?.plz || '',
            sd?.ort || '',
            sd?.strasse || '',
            sd?.hausnummer || '',
            sd?.eigeneSteuernummer || '',
            sdDigits,
            sd?.eigeneUstIdNr || '',
            sd?.finanzamtName || '',
            sd?.finanzamtNr || '',
            sd?.rechtsform || '',
            sd?.besteuerungUst || '',
            sd?.kleinunternehmer === true ? 'true' : sd?.kleinunternehmer === false ? 'false' : '',
            sd?.iban || '',
            sd?.kontaktEmail || ''
        ];
        const stammdatenHeader = stammdatenColumns.map(csvEscape).join(delimiter);
        const stammdatenBody = stammdatenRow.map(csvEscape).join(delimiter);
        const stammdatenCsv = `${stammdatenHeader}\r\n${stammdatenBody}\r\n`;

        const blob3 = new Blob([stammdatenCsv], { type: 'text/csv;charset=utf-8' });
        const url3 = URL.createObjectURL(blob3);
        const a3 = document.createElement('a');
        a3.href = url3;
        a3.download = `zoe_elster_stammdaten_${filterTag}_${timestampTag}.csv`;
        a3.click();
        URL.revokeObjectURL(url3);
  };

    const handleExportDATEV = () => {
        if (!settings) {
                alert('DATEV Export: Einstellungen fehlen.');
                return;
        }

        const preflight = runDatevExportPreflight(sortedDocs, settings);
        const dialog = formatPreflightForDialog(preflight);

        if (preflight.blockers.length > 0) {
                alert(`${dialog.title}\n\n${dialog.body}`);
                return;
        }

        if (preflight.warnings.length > 0) {
                const ok = confirm(`${dialog.title}\n\n${dialog.body}\n\nTrotzdem exportieren?`);
                if (!ok) return;
        }

        const { csv, filename } = generateDatevExtfBuchungsstapelCsv(sortedDocs, settings);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1 text-[10px]">▼</span>;
    return <span className="text-gray-900 ml-1 text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  const TH = ({ label, field, className = '', style = {} }: { label: string, field: string, className?: string, style?: React.CSSProperties }) => (
    <th
      className={`px-4 py-3 border-b border-gray-200 bg-white text-left text-[11px] font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors duration-150 select-none whitespace-nowrap ${className}`}
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
        <thead className="bg-white z-20">
          <tr>
            <th className="px-2 py-3 border-b border-gray-200 bg-white w-8 sticky left-0 z-30"></th>
            {/* Sticky Columns for essential ID data */}
            <TH label="Datum" field="data.belegDatum" className="sticky left-8 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" />
            <TH label="ZOE-Nr." field="data.eigeneBelegNummer" className="sticky left-[132px] bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" />
            <TH label="Lieferant" field="data.lieferantName" className="sticky left-[232px] bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-gray-200" />

            {/* Scrollable Columns for Data Richness */}
            <TH label="Original-Nr." field="data.belegNummerLieferant" />

            <TH label="Netto" field="data.nettoBetrag" className="text-right" />
            <TH label="Brutto" field="data.bruttoBetrag" className="text-right" />

            <TH label="Soll (SKR03)" field="data.sollKonto" />
            <TH label="Haben" field="data.habenKonto" />

            <TH label="Konto" field="data.kontierungskonto" />
            <TH label="Kategorie" field="data.steuerkategorie" />

                        <TH label="Zahlart" field="data.zahlungsmethode" />
                        <TH label="Zahl-Datum" field="data.zahlungsDatum" />
                        <TH label="Zahl-Status" field="data.zahlungsStatus" />

                        <TH label="Steuernr." field="data.steuernummer" />
                        <TH label="Adresse" field="data.lieferantAdresse" />
                        <TH label="Empfänger" field="data.rechnungsEmpfaenger" />
                        <TH label="Ablage" field="data.aufbewahrungsOrt" />

                        <TH label="RC" field="data.reverseCharge" />
                        <TH label="VSt" field="data.vorsteuerabzug" />
                        <TH label="KB" field="data.kleinbetrag" />
                        <TH label="Priv" field="data.privatanteil" />

                        <TH label="OCR" field="data.ocr_score" />
                        <TH label="Beschreibung" field="data.beschreibung" />
                        <TH label="Text" field="data.textContent" />

                        <TH label="Status" field="status" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-[13px]">
          {sortedDocs.map(doc => {
              const isDuplicate = doc.status === DocumentStatus.DUPLICATE;
              const isError = doc.status === DocumentStatus.ERROR;
              const isReview = doc.status === DocumentStatus.REVIEW_NEEDED;
              const isBlocked = isDuplicate || isError || isReview;
              const isDragTarget = dragTarget === doc.id;
              const isExpanded = expandedRowIds.has(doc.id);

              return (
                <React.Fragment key={doc.id}>
                <tr
                draggable={!isBlocked}
                onDragStart={(e) => {
                    if (isBlocked) {
                        e.preventDefault();
                        return;
                    }
                    e.dataTransfer.setData('text/plain', doc.id);
                    e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                    if (isBlocked) return;
                    e.preventDefault();
                    setDragTarget(doc.id);
                }}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(e) => {
                    e.preventDefault();
                    if (isBlocked) {
                        setDragTarget(null);
                        return;
                    }
                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (sourceId && sourceId !== doc.id) {
                        onMerge(sourceId, doc.id);
                    }
                    setDragTarget(null);
                }}
                onClick={() => onSelectDocument(doc)}
                className={`cursor-pointer transition-colors duration-150 border-l-2 ${
                    isDragTarget
                        ? 'bg-gray-100 ring-2 ring-inset ring-gray-400 z-20 relative'
                        : isDuplicate
                            ? 'hover:bg-gray-50 border-gray-400'
                            : isError
                                ? 'hover:bg-gray-50 border-gray-400'
                                : isReview
                                    ? 'hover:bg-gray-50 border-gray-300'
                                    : 'hover:bg-gray-50 border-transparent'
                }`}
                >
                <td className="px-2 py-2.5 bg-white border-r border-gray-100 sticky left-0 z-20 text-center" onClick={(e) => toggleExpandRow(e, doc.id)}>
                    <div className={`p-1 hover:bg-gray-100 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}>
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                </td>
                {/* Sticky Cells Matching Headers */}
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap font-mono text-xs sticky left-8 bg-white border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50 transition-colors duration-150">
                    {doc.data?.belegDatum}
                </td>
                <td className="px-4 py-2.5 sticky left-[132px] bg-white border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50 transition-colors duration-150">
                     <span className={`font-mono text-xs font-medium text-gray-900`}>
                        {doc.data?.eigeneBelegNummer}
                    </span>
                    {(isError || isReview) && (
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${isError ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-900'}`}>
                            {isError ? 'Fehler' : 'Prüfen'}
                        </span>
                    )}
                </td>
                <td className="px-4 py-2.5 text-gray-900 font-medium sticky left-[232px] bg-white border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50 transition-colors duration-150 max-w-[200px] truncate">
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
                    <span className="px-2 py-0.5 border border-gray-200 whitespace-nowrap">
                        {doc.data?.kontierungskonto}
                    </span>
                </td>
                <td className="px-4 py-2.5 text-[10px] text-gray-500 whitespace-nowrap">
                    {doc.data?.steuerkategorie}
                </td>

                {/* Zahlung */}
                <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                    {doc.data?.zahlungsmethode || ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap font-mono">
                    {doc.data?.zahlungsDatum || ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                    {doc.data?.zahlungsStatus || ''}
                </td>

                {/* Orga / Steuern */}
                <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap font-mono">
                    {doc.data?.steuernummer || ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[240px] truncate">
                    {doc.data?.lieferantAdresse || ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[200px] truncate">
                    {doc.data?.rechnungsEmpfaenger || ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[200px] truncate">
                    {doc.data?.aufbewahrungsOrt || ''}
                </td>

                {/* Flags */}
                <td className="px-4 py-2.5 text-xs text-gray-600 text-center">
                    {doc.data?.reverseCharge ? '✓' : ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 text-center">
                    {doc.data?.vorsteuerabzug ? '✓' : ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 text-center">
                    {doc.data?.kleinbetrag ? '✓' : ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 text-center">
                    {doc.data?.privatanteil ? '✓' : ''}
                </td>

                {/* OCR / Text */}
                <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap font-mono">
                    {doc.data?.ocr_score ?? ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[260px] truncate">
                    {doc.data?.beschreibung || ''}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[260px] truncate">
                    {doc.data?.textContent || ''}
                </td>

                <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                    {doc.status}
                </td>
                </tr>

                {/* Nested Line Items Row */}
                {isExpanded && (
                    <tr className="bg-gray-50/50 shadow-inner">
                        <td colSpan={2} className="sticky left-0 bg-white border-r border-gray-200"></td>
                        <td colSpan={24} className="p-4">
                             <div className="bg-white border border-gray-200 overflow-hidden max-w-2xl">
                                 <table className="w-full text-xs">
                                     <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
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
        <tfoot className="bg-white border-t border-gray-200 z-20">
            <tr>
                <td colSpan={26} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Gesamt Brutto: <span className="font-mono text-gray-900">{totals.brutto.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
                </td>
            </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderEuerView = () => (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Einnahmenüberschussrechnung (Ausgaben)</h3>
            <div className="text-sm text-gray-500">
                Gesamt Netto: <span className="font-mono font-medium text-gray-900 ml-2">{totals.netto.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
            </div>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-200 text-[13px]">
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
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-3">
                                <div className="font-medium text-gray-900">{row.label}</div>
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
                                    <div className="flex-1 h-1.5 bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full bg-gray-900"
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
            <tfoot className="bg-white border-t border-gray-200">
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
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Umsatzsteuervoranmeldung (Vorbereitung)</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 font-semibold border-b border-gray-200 text-[13px]">
                    <tr>
                        <th className="px-6 py-3 w-1/2">Position</th>
                        <th className="px-6 py-3 text-right">Bemessungsgrundlage</th>
                        <th className="px-6 py-3 text-right">Steuer</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px]">
                     <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-3 text-gray-900">Steuerfreie Umsätze / PV (0%)</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.base0.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-400">0,00 €</td>
                     </tr>
                     <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-3 text-gray-900">IGL / Reverse Charge (§13b)</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.reverseChargeBase.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-400">0,00 €</td>
                     </tr>
                     <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-3 text-gray-900">Vorsteuer 7%</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.base7.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-900">{ustvaData.tax7.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                     </tr>
                     <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-3 text-gray-900">Vorsteuer 19%</td>
                        <td className="px-6 py-3 text-right font-mono">{ustvaData.base19.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-900">{ustvaData.tax19.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                     </tr>
                </tbody>
                <tfoot className="bg-white border-t border-gray-200">
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

        {/* Übermittlung Section */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">ELSTER XML Export für manuelle Übermittlung</h3>
                <div className="text-xs text-gray-500 mt-1">
                    Export der UStVA-Daten als XML-Datei für Upload im ELSTER Online Portal.
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex gap-3">
                    <button
                        onClick={handleExportUstvaXml}
                        className="bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors duration-150"
                    >
                        XML Export
                    </button>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Anleitung:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Klicken Sie auf "XML Export" um die XML-Datei herunterzuladen</li>
                        <li>Öffnen Sie das <a href="https://www.elster.de/portal" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">ELSTER Online Portal</a></li>
                        <li>Melden Sie sich mit Ihren ELSTER-Zugangsdaten an</li>
                        <li>Wählen Sie "Umsatzsteuer" → "Umsatzsteuervoranmeldung"</li>
                        <li>Laden Sie die XML-Datei hoch und übermitteln Sie die Voranmeldung</li>
                    </ol>
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-3">
                    <strong>Hinweis:</strong> Die XML-Datei enthält keine Signatur. ELSTER Online Portal signiert die Daten automatisch bei der Übermittlung.
                </div>
            </div>
        </div>
      </div>
  );


  return (
    <div className="h-full flex flex-col bg-white">
       {/* Filter Toolbar */}
       <div className="px-6 py-3 border-b border-gray-100 bg-white flex justify-between items-center gap-4">
            <div className="flex gap-1">
                {(['list', 'euer', 'ustva'] as ViewType[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setViewType(t)}
                        className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 ${viewType === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        {t === 'list' ? 'Liste' : t.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 items-center">
                 <select
                        value={filterYear}
                        onChange={(e) => onFilterYearChange(e.target.value)}
                        className="bg-white border border-gray-200 text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-gray-900 hover:border-gray-300 transition-colors duration-150"
                 >
                        <option value="all">Jahr</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>

                 <select
                        value={filterQuarter}
                        onChange={(e) => onFilterQuarterChange(e.target.value)}
                        className="bg-white border border-gray-200 text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-gray-900 hover:border-gray-300 transition-colors duration-150"
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
                        className="bg-white border border-gray-200 text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-gray-900 hover:border-gray-300 transition-colors duration-150"
                 >
                        <option value="all">M</option>
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                             <option key={m} value={m.toString().padStart(2, '0')}>{m}</option>
                        ))}
                 </select>

                 <div className="h-4 w-px bg-gray-200 mx-1"></div>

                 <button onClick={handleExportPDF} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                 </button>
                      <button onClick={handleExportCSV} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150" title="CSV Export">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h8"></path><path d="M8 17h8"></path></svg>
                      </button>
                      <button onClick={handleExportDATEV} className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150" title="DATEV Export (EXTF Buchungsstapel)">
                          DATEV
                      </button>
                      {viewType === 'ustva' && (
                          <button onClick={handleExportUstvaXml} className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150" title="ELSTER XML Export">
                              XML
                          </button>
                      )}
                 <button onClick={onExportSQL} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150">
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
