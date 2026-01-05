// services/elsterExport.ts
// ELSTER XML Export Service for manual upload to ELSTER Online Portal

export interface UstvaExportData {
  period: string; // e.g., "2024Q1" or "202401"
  base0: number;
  reverseChargeBase: number;
  base7: number;
  tax7: number;
  base19: number;
  tax19: number;
}

export interface ElsterExportRequest {
  stammdaten: {
    unternehmensName: string;
    land: string;
    plz: string;
    ort: string;
    strasse: string;
    hausnummer: string;
    eigeneSteuernummer: string;
    eigeneUstIdNr?: string;
    finanzamtName?: string;
    finanzamtNr?: string;
    rechtsform?: string;
    besteuerungUst?: string;
    kleinunternehmer?: boolean;
    iban?: string;
    kontaktEmail?: string;
  };
  ustvaData: UstvaExportData;
}

/**
 * Generate ELSTER-compatible XML for manual upload to ELSTER Online Portal
 */
export const generateElsterXml = (request: ElsterExportRequest): string => {
  const { stammdaten, ustvaData } = request;

  // Parse period
  const period = parsePeriod(ustvaData.period);

  // Generate XML in ELSTER/Coala format
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://www.elster.de/2002/XMLSchema" xmlns:elster="http://www.elster.de/2002/XMLSchema">
  <TransferHeader version="8">
    <Verfahren>ElsterAnmeldung</Verfahren>
    <DatenArt>UStVA</DatenArt>
    <Vorgang>send-NoSig</Vorgang>
    <Testmerker>000000000</Testmerker>
    <DatenLieferant>
      <Name>${escapeXml(stammdaten.unternehmensName)}</Name>
      <Strasse>${escapeXml(stammdaten.strasse)} ${escapeXml(stammdaten.hausnummer)}</Strasse>
      <PLZ>${escapeXml(stammdaten.plz)}</PLZ>
      <Ort>${escapeXml(stammdaten.ort)}</Ort>
      <Land>${escapeXml(stammdaten.land)}</Land>
      ${stammdaten.kontaktEmail ? `<Email>${escapeXml(stammdaten.kontaktEmail)}</Email>` : ''}
      ${stammdaten.iban ? `<IBAN>${escapeXml(stammdaten.iban)}</IBAN>` : ''}
    </DatenLieferant>
    <Datei>
      <Verschluesselung>CMSEncryptedData</Verschluesselung>
    </Datei>
  </TransferHeader>
  <DatenTeil>
    <Nutzdatenblock>
      <Nutzdatenheader version="10">
        <NutzdatenTicket>001</NutzdatenTicket>
        <Empfaenger id="F">${stammdaten.finanzamtNr || '0000'}</Empfaenger>
        <Hersteller>
          <ProduktName>ZOE Solar Accounting OCR</ProduktName>
          <ProduktVersion>1.0</ProduktVersion>
        </Hersteller>
        <DatenLieferant ds:DSSignatur="true">
          <Name>${escapeXml(stammdaten.unternehmensName)}</Name>
          <Strasse>${escapeXml(stammdaten.strasse)} ${escapeXml(stammdaten.hausnummer)}</Strasse>
          <PLZ>${escapeXml(stammdaten.plz)}</PLZ>
          <Ort>${escapeXml(stammdaten.ort)}</Ort>
          <Land>${escapeXml(stammdaten.land)}</Land>
          ${stammdaten.kontaktEmail ? `<Email>${escapeXml(stammdaten.kontaktEmail)}</Email>` : ''}
          ${stammdaten.iban ? `<IBAN>${escapeXml(stammdaten.iban)}</IBAN>` : ''}
        </DatenLieferant>
      </Nutzdatenheader>
      <Nutzdaten>
        <Umsatzsteuervoranmeldung>
          <Jahr>${period.year}</Jahr>
          <Zeitraum>${period.zeitraum}</Zeitraum>
          <Steuernummer>${escapeXml(stammdaten.eigeneSteuernummer)}</Steuernummer>
          ${stammdaten.eigeneUstIdNr ? `<UstId>${escapeXml(stammdaten.eigeneUstIdNr)}</UstId>` : ''}
          <Kz21>${formatCurrency(ustvaData.base0)}</Kz21>
          <Kz35>${formatCurrency(ustvaData.reverseChargeBase)}</Kz35>
          <Kz81>${formatCurrency(ustvaData.base7)}</Kz81>
          <Kz83>${formatCurrency(ustvaData.tax7)}</Kz83>
          <Kz86>${formatCurrency(ustvaData.base19)}</Kz86>
          <Kz89>${formatCurrency(ustvaData.tax19)}</Kz89>
          <Kz93>${formatCurrency(ustvaData.tax7 + ustvaData.tax19)}</Kz93>
        </Umsatzsteuervoranmeldung>
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>`;

  return xml;
};

/**
 * Download the generated XML as a file
 */
export const downloadElsterXml = (xml: string, filename: string) => {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parse period string into year and zeitraum
 */
const parsePeriod = (period: string) => {
  if (period.includes('Q')) {
    // Quarterly: 2024Q1 -> Jahr: 2024, Zeitraum: 41 (Q1), 42 (Q2), 43 (Q3), 44 (Q4)
    const [year, quarter] = period.split('Q');
    const zeitraum = 40 + parseInt(quarter);
    return { year, zeitraum: zeitraum.toString() };
  } else {
    // Monthly: 202401 -> Jahr: 2024, Zeitraum: 01
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    return { year, zeitraum: month };
  }
};

/**
 * Format currency value for ELSTER (German format with comma)
 */
const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};

/**
 * Escape XML special characters
 */
const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};