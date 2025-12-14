
import { ExtractedData, DocumentRecord } from '../types';

/**
 * ZOE Solar Accounting Rules Engine
 * Implements strict rules for Soll/Haben/Steuerkategorie.
 * 
 * Logic Order:
 * 1. Habenkonto: Strict (Cash=1000, Rest=1800)
 * 2. Sollkonto: Vendor Mapping > Keyword Fallback > Default (3100)
 * 3. Tax: PV 0% > Reverse Charge > 7% > 19%
 */
export const applyAccountingRules = (
  data: ExtractedData, 
  existingDocs: DocumentRecord[]
): ExtractedData => {
  const enriched = { ...data };
  
  // Helper for normalization and matching
  const lower = (s: string) => (s || '').toLowerCase();
  const containsAny = (source: string, keywords: string[]) => keywords.some(k => source.includes(k));

  const vendor = lower(enriched.lieferantName);
  const payment = lower(enriched.zahlungsmethode);
  
  // Combine all text sources for context searching
  const combinedText = `${vendor} ${lower(enriched.beschreibung)} ${lower(enriched.textContent)} ${enriched.lineItems?.map(l => lower(l.description)).join(' ') || ''}`;

  // --- 1. Habenkonto Regeln (Money Account) ---
  // Konsequente Regel: Bar -> 1000, Alles andere -> 1800
  let haben = '1800'; 
  if (containsAny(payment, ['bar', 'cash', 'kasse'])) {
    haben = '1000';
  }
  enriched.habenKonto = haben;


  // --- 2. Sollkonto Regeln (Expense Account) ---
  // Strategie: Erst Vendor prüfen, dann Keywords, Fallback 3100
  
  let soll = '3100'; // Default: Fremdleistungen / Material

  // A) Vendor-Specific Rules (Primary Source)
  if (containsAny(vendor, ['telekom', 'vodafone', 'o2', 'telefonica', 'congstar'])) {
    soll = '4220'; // Telefon
  } 
  else if (containsAny(vendor, ['ionos', 'strato', '1&1', 'domain', 'hetzner', 'all-inkl'])) {
    soll = '4225'; // Internet / Webhosting
  } 
  else if (containsAny(vendor, ['obeta', 'conrad', 'hornbach', 'bauhaus', 'würth', 'toom', 'hagebau'])) {
    soll = '3100'; // Material / Fremdleistungen
  } 
  else if (containsAny(vendor, ['allianz', 'versicherung', 'huk', 'vpv'])) {
    soll = '4610'; // Versicherung
  } 
  else if (containsAny(vendor, ['stadtwerke', 'e.on', 'vattenfall', 'strom', 'gas', 'attenfall'])) {
    soll = '4330'; // Energie / Strom
  } 
  else if (containsAny(vendor, ['hotel', 'airbnb', 'booking', 'motel'])) {
    soll = '4660'; // Reisekosten Unterkunft
  } 
  else if (containsAny(vendor, ['db vertrieb', 'bahn', 'lufthansa', 'uber', 'bolt', 'taxi', 'free now'])) {
    soll = '4670'; // Reisekosten Fahrt
  }
  // Complex Vendor: Tankstellen (Unterscheidung Sprit vs. Shop)
  else if (containsAny(vendor, ['shell', 'aral', 'total', 'jet', 'tankstelle', 'esso', 'hem', 'star'])) {
    if (containsAny(combinedText, ['diesel', 'benzin', 'super', 'kraftstoff', 'adblue'])) {
        soll = '4830'; // Kraftstoff
    } else {
        soll = '4110'; // Kfz Kosten allgemein (Wäsche, Öl, Shop)
    }
  } 
  // Complex Vendor: Supermärkte (Unterscheidung Bewirtung vs. Büro/Sonstiges)
  else if (containsAny(vendor, ['edeka', 'rewe', 'lidl', 'aldi', 'kaufland', 'dm', 'rossmann', 'metro'])) {
    if (containsAny(combinedText, ['bewirtung', 'trinkgeld', 'restaurant'])) {
        soll = '4650'; // Bewirtung
    } else {
        soll = '4230'; // Raumkosten / Sonstiges / Verpflegung
    }
  }

  // B) Keyword / Category Fallback (Only if still default 3100)
  // Dies fängt Fälle ab, wo der Vendor unbekannt ist, aber der Inhalt eindeutig ist.
  if (soll === '3100') {
    if (containsAny(combinedText, ['photovoltaik', 'solar', 'modul', 'wechselrichter', 'unterkonstruktion', 'pv-anlage'])) {
      soll = '4810'; // PV-Wareneingang
    } else if (containsAny(combinedText, ['kraftstoff', 'diesel', 'benzin'])) {
      soll = '4830'; // Kraftstoff
    } else if (containsAny(combinedText, ['reparatur', 'wartung']) && combinedText.includes('kfz')) {
      soll = '4820'; // Fahrzeug Instandhaltung
    } else if (containsAny(combinedText, ['bewirtung', 'trinkgeld', 'restaurant', 'speisen', 'getränke'])) {
      soll = '4650'; // Bewirtung
    } else if (containsAny(combinedText, ['büro', 'papier', 'toner', 'ordner', 'schreibwaren', 'stifte'])) {
      soll = '4930'; // Bürobedarf
    } else if (containsAny(combinedText, ['porto', 'dhl', 'post', 'briefmarke', 'einschreiben'])) {
      soll = '4910'; // Porto
    }
  }

  enriched.sollKonto = soll;


  // --- 3. Steuerkategorie Regeln ---
  // Priority: 0% PV > Reverse Charge > 7% > 19% (Default)
  
  let taxCat = '19% Vorsteuer'; // Default fallback

  const hasTax7 = (enriched.mwstBetrag7 > 0) || (enriched.mwstSatz7 > 0);
  const hasTax19 = (enriched.mwstBetrag19 > 0) || (enriched.mwstSatz19 > 0);
  const isZeroTax = !hasTax7 && !hasTax19;

  // PV Context Check
  const isSolarContext = soll === '4810' || containsAny(combinedText, ['solar', 'photovoltaik', 'pv-anlage', '§12']);
  
  if (isSolarContext && isZeroTax) {
    taxCat = '0% PV (Steuerfrei)';
  } 
  else if (enriched.reverseCharge || (enriched.steuernummer && /^(AT|NL|PL|FR|ES|IT)/i.test(enriched.steuernummer))) {
    taxCat = '0% IGL / Reverse Charge';
    enriched.reverseCharge = true;
  }
  else if (hasTax7 && !hasTax19) {
    taxCat = '7% Vorsteuer';
  }
  else if ((soll === '4610' || soll === '4910') && isZeroTax) {
     taxCat = 'Steuerfrei (Sonstiges)';
  }
  else {
    taxCat = '19% Vorsteuer';
  }

  enriched.steuerKategorie = taxCat;


  // --- 4. ZOE-Specific Organisatorische Regeln ---

  // A) Eigene Belegnummer: ZOEyyMM.n
  if (data.belegDatum) {
    try {
        const dateObj = new Date(data.belegDatum);
        if (!isNaN(dateObj.getTime())) {
            const yy = dateObj.getFullYear().toString().slice(-2);
            const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const prefix = `ZOE${yy}${mm}`;
            
            // Suche nach der höchsten existierenden Nummer mit diesem Präfix
            let maxNum = 0;
            existingDocs.forEach(d => {
                const existingNr = d.data?.eigeneBelegNummer || '';
                if (existingNr.startsWith(prefix)) {
                    const parts = existingNr.split('.');
                    if (parts.length === 2) {
                        const n = parseInt(parts[1], 10);
                        if (!isNaN(n) && n > maxNum) maxNum = n;
                    }
                }
            });
            enriched.eigeneBelegNummer = `${prefix}.${maxNum + 1}`;
        }
    } catch (e) { /* ignore invalid dates */ }
  }

  // B) Statische Daten
  enriched.rechnungsEmpfaenger = 'ZOE Solar, Inh. Jeremy Schulze\nKurfürstenstr. 124, 10785 Berlin';
  enriched.aufbewahrungsOrt = 'Betriebseigene Cloud-Storage';

  // C) Zahlungsstatus
  if (!enriched.zahlungsStatus) {
    if (haben === '1000' || containsAny(payment, ['karte', 'paypal', 'apple', 'google'])) {
        enriched.zahlungsStatus = 'bezahlt';
        if (!enriched.zahlungsDatum) enriched.zahlungsDatum = enriched.belegDatum;
    } else {
        enriched.zahlungsStatus = 'offen';
    }
  }

  // D) Flags
  enriched.kleinbetrag = (enriched.bruttoBetrag || 0) <= 250;
  enriched.vorsteuerabzug = taxCat.includes('Vorsteuer') || taxCat.includes('IGL') || taxCat.includes('PV');
  if (enriched.privatanteil === undefined) enriched.privatanteil = false;

  return enriched;
};
