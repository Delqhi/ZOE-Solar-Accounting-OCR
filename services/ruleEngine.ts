
import { ExtractedData, DocumentRecord, AppSettings, AccountDefinition, TaxCategoryDefinition } from '../types';

export const generateZoeInvoiceId = (dateStr: string, existingDocs: DocumentRecord[]): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';

        const yy = d.getFullYear().toString().slice(-2);
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `ZOE${yy}${mm}`;
        
        let max = 0;
        existingDocs.forEach(doc => {
            const nr = doc.data?.eigeneBelegNummer || '';
            if (nr.startsWith(prefix)) {
                const parts = nr.split('.');
                if (parts.length > 1) {
                    const n = parseInt(parts[1], 10);
                    if (!isNaN(n) && n > max) max = n;
                }
            }
        });

        return `${prefix}.${(max + 1).toString().padStart(3, '0')}`;
    } catch (e) {
        return '';
    }
};

const calculateOCRScore = (data: ExtractedData, taxDefs: TaxCategoryDefinition[]): { score: number, rationale: string } => {
    let score = 10;
    const rationaleParts: string[] = [];

    // 1. Basic Fields Presence
    if (!data.belegDatum) {
        score -= 2;
        rationaleParts.push("Datum fehlt (-2)");
    }
    if (!data.lieferantName || data.lieferantName.length < 3) {
        score -= 2;
        rationaleParts.push("Lieferant unklar (-2)");
    }
    if (!data.bruttoBetrag && data.bruttoBetrag !== 0) {
        score -= 3;
        rationaleParts.push("Betrag fehlt (-3)");
    }

    // 2. Tax Consistency
    const has19 = (data.mwstBetrag19 || 0) > 0;
    const has7 = (data.mwstBetrag7 || 0) > 0;
    
    // Heuristic: If tax 19% is present, but potential category implies 0%
    if (has19 && data.steuerkategorie === '0_pv') {
        score -= 2;
        rationaleParts.push("Steuerkonflikt: 19% erkannt aber 0% gewählt (-2)");
    }

    // 3. Logic Checks
    if (data.nettoBetrag && data.bruttoBetrag) {
        const calcBrutto = data.nettoBetrag + (data.mwstBetrag19 || 0) + (data.mwstBetrag7 || 0);
        const diff = Math.abs(calcBrutto - data.bruttoBetrag);
        if (diff > 0.05) {
            score -= 2;
            rationaleParts.push("Rechenfehler Summe (-2)");
        }
    }

    // Clamp
    score = Math.max(0, Math.min(10, score));
    return { score, rationale: rationaleParts.join(", ") || "Perfekt" };
};

const PV_MATERIAL_KEYWORDS = [
    'modul', 'solar', 'panel', 'kabel', 'leitung', 'stecker', 'mc4', 'schiene', 
    'profil', 'dachhaken', 'schraube', 'klemme', 'wechselrichter', 'inverter', 
    'speicher', 'batterie', 'akku', 'montage', 'lieferung', 'fracht', 'spedition', 
    'versand', 'material', 'baustoff', 'unterkonstruktion', 'ziegel', 'lüfter'
];

const determineAccount = (data: ExtractedData, accounts: AccountDefinition[]): AccountDefinition | null => {
    // Combine all relevant text sources
    const fullText = (
        (data.lieferantName || '') + ' ' + 
        (data.textContent || '') + ' ' + 
        (data.beschreibung || '') + ' ' +
        (data.lineItems?.map(i => i.description).join(' ') || '')
    ).toLowerCase();

    // 1. Priority Check: Material / Wareneingang via Line Item Keywords
    // If we find specific hardware keywords, we prioritize the Material account
    const hasMaterialKeyword = PV_MATERIAL_KEYWORDS.some(kw => fullText.includes(kw));
    if (hasMaterialKeyword) {
        const materialAccount = accounts.find(a => a.id === 'wareneingang');
        if (materialAccount) return materialAccount;
    }

    // 2. Standard Name Match
    for (const acc of accounts) {
        if (fullText.includes(acc.name.toLowerCase())) return acc;
    }
    
    // 3. Specific Hardcoded Fallbacks
    if (fullText.includes('tank') || fullText.includes('aral') || fullText.includes('shell') || fullText.includes('jet ')) return accounts.find(a => a.id === 'fuhrpark') || null;
    if (fullText.includes('adobe') || fullText.includes('software') || fullText.includes('google')) return accounts.find(a => a.id === 'software') || null;
    if (fullText.includes('telekom') || fullText.includes('o2') || fullText.includes('vodafone')) return accounts.find(a => a.id === 'internet') || null;
    
    return null;
};

export const applyAccountingRules = (
    data: ExtractedData, 
    existingDocs: DocumentRecord[], 
    settings: AppSettings,
    forcedVendorRule?: { accountId?: string, taxCategoryValue?: string }
): ExtractedData => {
  const enriched = { ...data };
  const accounts = settings.accountDefinitions || [];
  const taxes = settings.taxDefinitions || [];

  // 1. Determine Account
  let matchedAccount: AccountDefinition | null | undefined = null;
  
  if (forcedVendorRule?.accountId) {
      matchedAccount = accounts.find(a => a.id === forcedVendorRule.accountId);
      if (matchedAccount) enriched.ruleApplied = true;
  }
  
  if (!matchedAccount) {
      matchedAccount = determineAccount(enriched, accounts);
  }

  // Set Account & SKR03
  if (matchedAccount) {
      enriched.kontierungskonto = matchedAccount.id;
      enriched.kontogruppe = matchedAccount.name; // Legacy compatibility
      
      // NEW: Set Soll / Haben
      enriched.sollKonto = matchedAccount.skr03 || '0000';
      
      // Default Haben for EÜR (Usually Bank 1200 or 70000 Creditors)
      // Since this is receipt processing, let's default to Bank 1200 as most are paid
      // Or we could try to guess from "zahlungsmethode"
      if (enriched.zahlungsmethode?.toLowerCase().includes('paypal')) enriched.habenKonto = '1200'; // Bank/Paypal
      else if (enriched.zahlungsmethode?.toLowerCase().includes('bar')) enriched.habenKonto = '1000'; // Kasse
      else enriched.habenKonto = '1200'; // Default Bank

  } else {
      enriched.kontierungskonto = 'sonstiges'; // Fallback
      enriched.kontogruppe = 'Sonstiges';
      enriched.sollKonto = '4900';
      enriched.habenKonto = '1200';
  }

  // 2. Determine Tax Category
  if (forcedVendorRule?.taxCategoryValue) {
      enriched.steuerkategorie = forcedVendorRule.taxCategoryValue;
  } else if (matchedAccount && matchedAccount.steuerkategorien.length === 1) {
      enriched.steuerkategorie = matchedAccount.steuerkategorien[0];
  } else {
      // Logic based on amounts
      if ((data.mwstBetrag19 || 0) > 0) enriched.steuerkategorie = '19_pv';
      else if ((data.mwstBetrag7 || 0) > 0) enriched.steuerkategorie = '7_pv';
      else if (data.mwstBetrag19 === 0 && data.bruttoBetrag > 0) enriched.steuerkategorie = '0_pv'; 
      else enriched.steuerkategorie = '19_pv'; 
  }

  // 3. Calculate Score
  const scoreResult = calculateOCRScore(enriched, taxes);
  enriched.ocr_score = scoreResult.score;
  enriched.ocr_rationale = scoreResult.rationale;

  return enriched;
};
