
import React, { useState, useEffect } from 'react';
import { DocumentRecord, ExtractedData } from '../types';

interface DocumentDetailProps {
  document: DocumentRecord;
  taxCategories: string[];
  onSave: (doc: DocumentRecord) => void;
  onDelete: (id: string) => void;
}

// SKR03 Accounts based on ZOE Solar Rules Engine
const SOLL_ACCOUNTS = [
  { code: '3100', label: 'Fremdleistungen / Material (Obeta, Conrad)' },
  { code: '4110', label: 'Kfz-Kosten allgemein (Shell, Aral)' },
  { code: '4220', label: 'Telefon (Telekom, Vodafone, O2)' },
  { code: '4225', label: 'Internet / Webhosting (Ionos, Strato)' },
  { code: '4230', label: 'Raumkosten / Sonstiges (Edeka, Rewe)' },
  { code: '4330', label: 'Energie / Strom (Stadtwerke)' },
  { code: '4610', label: 'Versicherungen / Beiträge (Allianz)' },
  { code: '4650', label: 'Bewirtungskosten' },
  { code: '4660', label: 'Reisekosten Arbeitnehmer' },
  { code: '4670', label: 'Reisekosten Fahrtkosten' },
  { code: '4810', label: 'Photovoltaik Aufwendungen (Wareneingang)' },
  { code: '4820', label: 'Fahrzeug Instandhaltung' },
  { code: '4830', label: 'Kraftstoffkosten' },
  { code: '4910', label: 'Porto' },
  { code: '4930', label: 'Bürobedarf' },
];

const HABEN_ACCOUNTS = [
  { code: '1000', label: 'Kasse (Bar/Cash)' },
  { code: '1800', label: 'Bank / PayPal / Kreditkarte' },
  { code: '1360', label: 'Geldtransit' },
];

const INPUT_CLASS = "w-full bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all";
const LABEL_CLASS = "block text-xs font-medium text-slate-500 mb-1";

// Helper to convert Data URL to Blob safely
const dataURLtoBlob = (dataurl: string | undefined) => {
  if (!dataurl) return null;
  try {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Failed to convert data URL to blob", e);
    return null;
  }
};

export const DocumentDetail: React.FC<DocumentDetailProps> = ({ document, taxCategories, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Partial<ExtractedData>>(document.data || {});
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setFormData(document.data || {});
  }, [document]);

  useEffect(() => {
    let url = '';
    if (document.previewUrl) {
      if (document.previewUrl.startsWith('data:')) {
          const blob = dataURLtoBlob(document.previewUrl);
          if (blob) {
            url = URL.createObjectURL(blob);
            setBlobUrl(url);
          }
      } else {
          setBlobUrl(document.previewUrl);
      }
    } else {
      setBlobUrl(null);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [document.previewUrl]);

  const updateField = (field: keyof ExtractedData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    if (document.data) {
        onSave({
            ...document,
            data: { ...document.data, ...newData } as ExtractedData
        });
    }
  };

  const currentCategory = formData.steuerKategorie || '';
  const displayCategories = taxCategories.includes(currentCategory) || !currentCategory
    ? taxCategories 
    : [currentCategory, ...taxCategories];

  const isPdf = document.fileType === 'application/pdf' || document.fileName.toLowerCase().endsWith('.pdf');
  const isImage = document.fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(document.fileName);

  return (
    <div className="h-full flex flex-col">
      {/* Detail Toolbar */}
      <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-none">
         <div className="flex items-center gap-4">
             <h2 className="font-bold text-slate-800 text-lg truncate max-w-md">{document.fileName}</h2>
             <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Zoe-Belegnummer</span>
                <span className="text-sm font-mono font-bold text-blue-600">{formData.eigeneBelegNummer || '-'}</span>
             </div>
         </div>
         <div className="flex gap-2">
            <button 
                onClick={() => onDelete(document.id)}
                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" 
                title="Löschen"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
         </div>
      </div>

      {/* Split Content Area */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        
        {/* Left: Preview */}
        <div className="xl:w-1/2 h-[40vh] xl:h-full bg-slate-100 border-b xl:border-b-0 xl:border-r border-slate-200 flex flex-col relative group">
           <div className="flex-1 overflow-hidden p-4 flex items-center justify-center relative">
             {blobUrl ? (
                isPdf ? (
                  <iframe 
                    src={blobUrl} 
                    className="w-full h-full rounded shadow-sm bg-white" 
                    title="PDF Preview" 
                  />
                ) : isImage ? (
                  <img 
                    src={blobUrl} 
                    alt="Receipt" 
                    className="max-w-full max-h-full object-contain shadow-sm rounded bg-white" 
                  />
                ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-2 p-6 bg-white rounded shadow-sm text-center">
                        <div><p className="font-medium">Vorschau nicht verfügbar</p></div>
                    </div>
                )
             ) : (
               <div className="text-slate-400">Keine Daten</div>
             )}
           </div>
           
           {/* Overlay Actions */}
           {blobUrl && (
             <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                    href={blobUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2"
                >
                    Original öffnen
                </a>
             </div>
           )}
        </div>

        {/* Right: Data Form */}
        <div className="xl:w-1/2 h-full overflow-y-auto bg-white">
          <div className="p-6 space-y-8 max-w-3xl mx-auto">
            
            {/* Logic Block (Accounting Rules) */}
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 shadow-sm">
              <h4 className="text-xs font-bold uppercase text-blue-800 mb-4 tracking-wider flex items-center gap-2">
                Kategorisierung & Regeln
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>Steuerkategorie (Regel-basiert)</label>
                  <select
                    value={currentCategory}
                    onChange={(e) => updateField('steuerKategorie', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="" disabled>Bitte wählen...</option>
                    {displayCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Sollkonto (Aufwand)</label>
                  <input 
                    list="soll-accounts"
                    value={formData.sollKonto || ''} 
                    onChange={(e) => updateField('sollKonto', e.target.value)}
                    className={`${INPUT_CLASS} font-bold text-blue-900`} 
                  />
                  <datalist id="soll-accounts">
                    {SOLL_ACCOUNTS.map(acc => (
                      <option key={acc.code} value={acc.code}>{acc.code} - {acc.label}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Habenkonto (Geld)</label>
                  <input 
                    list="haben-accounts"
                    value={formData.habenKonto || ''} 
                    onChange={(e) => updateField('habenKonto', e.target.value)}
                    className={`${INPUT_CLASS} font-bold text-blue-900`} 
                  />
                  <datalist id="haben-accounts">
                    {HABEN_ACCOUNTS.map(acc => (
                      <option key={acc.code} value={acc.code}>{acc.code} - {acc.label}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                   <label className={LABEL_CLASS}>Kostenstelle</label>
                   <input 
                     value={formData.kostenstelle || ''}
                     onChange={(e) => updateField('kostenstelle', e.target.value)}
                     className={INPUT_CLASS}
                   />
                </div>
                <div>
                   <label className={LABEL_CLASS}>Projekt / Auftrag</label>
                   <input 
                     value={formData.projekt || ''}
                     onChange={(e) => updateField('projekt', e.target.value)}
                     className={INPUT_CLASS}
                   />
                </div>
              </div>
            </div>

            {/* Basic Data (OCR) */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Grunddaten (OCR Scan)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>Lieferant Name</label>
                  <input 
                    value={formData.lieferantName || ''} 
                    onChange={(e) => updateField('lieferantName', e.target.value)}
                    className={INPUT_CLASS} 
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>Lieferant Adresse</label>
                  <input 
                    value={formData.lieferantAdresse || ''} 
                    onChange={(e) => updateField('lieferantAdresse', e.target.value)}
                    className={INPUT_CLASS} 
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Belegdatum</label>
                  <input 
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={formData.belegDatum || ''} 
                    onChange={(e) => updateField('belegDatum', e.target.value)}
                    className={INPUT_CLASS} 
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Rechnungs-Nr. (Lieferant)</label>
                  <input 
                    value={formData.belegNummerLieferant || ''} 
                    onChange={(e) => updateField('belegNummerLieferant', e.target.value)}
                    className={INPUT_CLASS} 
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>Steuernummer / USt-ID (Lieferant)</label>
                  <input 
                    value={formData.steuernummer || ''} 
                    onChange={(e) => updateField('steuernummer', e.target.value)}
                    className={INPUT_CLASS} 
                  />
                </div>
              </div>
            </div>

             {/* Organizational Data */}
             <div>
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Organisatorisch</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className={LABEL_CLASS}>Eigene Belegnummer (KI Generiert)</label>
                   <input 
                     value={formData.eigeneBelegNummer || ''}
                     onChange={(e) => updateField('eigeneBelegNummer', e.target.value)}
                     className={`${INPUT_CLASS} font-mono bg-yellow-50 text-yellow-800 border-yellow-200`}
                   />
                </div>
                <div>
                   <label className={LABEL_CLASS}>Aufbewahrungsort</label>
                   <input 
                     value={formData.aufbewahrungsOrt || 'Betriebseigene Cloud-Storage'}
                     className={`${INPUT_CLASS} bg-slate-100 text-slate-500`}
                     readOnly
                   />
                </div>
                <div className="col-span-2">
                   <label className={LABEL_CLASS}>Rechnungsempfänger</label>
                   <textarea 
                     value={formData.rechnungsEmpfaenger || 'ZOE Solar...'}
                     className={`${INPUT_CLASS} h-16 text-xs resize-none bg-slate-100 text-slate-500`}
                     readOnly
                   />
                </div>
              </div>
            </div>

            {/* Financial Data */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Finanzielle Daten</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Netto (€)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.nettoBetrag ?? ''} 
                    onChange={(e) => updateField('nettoBetrag', parseFloat(e.target.value))}
                    className={`${INPUT_CLASS} text-right`} 
                  />
                </div>
                <div>
                  <label className={`${LABEL_CLASS} font-bold text-slate-700`}>Brutto Gesamt (€)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.bruttoBetrag ?? ''} 
                    onChange={(e) => updateField('bruttoBetrag', parseFloat(e.target.value))}
                    className={`${INPUT_CLASS} text-right font-bold bg-green-50 border-green-200 text-green-900`} 
                  />
                </div>
              </div>

              {/* Tax Details */}
              <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                 <div>
                    <label className={LABEL_CLASS}>MwSt 19% (Betrag)</label>
                    <input 
                      type="number" step="0.01"
                      value={formData.mwstBetrag19 ?? ''} 
                      onChange={(e) => updateField('mwstBetrag19', parseFloat(e.target.value))}
                      className={`${INPUT_CLASS} text-right`} 
                    />
                 </div>
                 <div>
                    <label className={LABEL_CLASS}>MwSt 7% (Betrag)</label>
                    <input 
                      type="number" step="0.01"
                      value={formData.mwstBetrag7 ?? ''} 
                      onChange={(e) => updateField('mwstBetrag7', parseFloat(e.target.value))}
                      className={`${INPUT_CLASS} text-right`} 
                    />
                 </div>
                 {/* Hint for 0% PV */}
                 {formData.steuerKategorie?.includes('0%') && (
                     <div className="col-span-2 text-xs text-green-600 font-medium text-center">
                        Steuerbefreiung aktiv ({formData.steuerKategorie})
                     </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={LABEL_CLASS}>Zahlungsmethode</label>
                  <input 
                    value={formData.zahlungsmethode || ''} 
                    onChange={(e) => updateField('zahlungsmethode', e.target.value)}
                    className={INPUT_CLASS} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                    <label className={LABEL_CLASS}>Status</label>
                    <select
                      value={formData.zahlungsStatus || 'offen'}
                      onChange={(e) => updateField('zahlungsStatus', e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="offen">offen</option>
                      <option value="bezahlt">bezahlt</option>
                    </select>
                   </div>
                   <div>
                     <label className={LABEL_CLASS}>Zahlungsdatum</label>
                     <input 
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={formData.zahlungsDatum || ''}
                        onChange={(e) => updateField('zahlungsDatum', e.target.value)}
                        className={INPUT_CLASS}
                     />
                   </div>
                </div>
              </div>
            </div>

             {/* Positionen / Line Items */}
             <div>
               <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Positionen (OCR Scan)</h4>
               <div className="bg-slate-50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto border border-slate-200">
                  {formData.lineItems && formData.lineItems.length > 0 ? (
                    formData.lineItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-700">{item.description}</span>
                        <span className="font-mono text-slate-500">{item.amount ? item.amount.toFixed(2) + ' €' : ''}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-4">Keine Positionen einzeln erfasst</div>
                  )}
               </div>
             </div>

             {/* Special Flags */}
             <div>
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Besonderheiten</h4>
              <div className="flex flex-wrap gap-4">
                 <Flag label="Kleinbetrag (<250€)" active={formData.kleinbetrag} onClick={() => updateField('kleinbetrag', !formData.kleinbetrag)} />
                 <Flag label="Vorsteuerabzug" active={formData.vorsteuerabzug} onClick={() => updateField('vorsteuerabzug', !formData.vorsteuerabzug)} />
                 <Flag label="Reverse Charge" active={formData.reverseCharge} onClick={() => updateField('reverseCharge', !formData.reverseCharge)} />
                 <Flag label="Privatanteil" active={formData.privatanteil} onClick={() => updateField('privatanteil', !formData.privatanteil)} />
              </div>
            </div>

            {/* Notes */}
            <div className="pb-12">
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Beschreibung / Verwendungszweck</h4>
               <textarea
                 className={`${INPUT_CLASS} h-24 resize-y`}
                 placeholder="Beschreibung oder Verwendungszweck..."
                 value={formData.beschreibung || ''}
                 onChange={(e) => updateField('beschreibung', e.target.value)}
               />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const Flag: React.FC<{label: string, active?: boolean, onClick: () => void}> = ({label, active, onClick}) => (
  <button 
    onClick={onClick}
    type="button"
    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
  >
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${active ? 'bg-green-500' : 'bg-slate-300'}`} />
    {label}
  </button>
);
