-- Supabase Schema for ZOE Solar Accounting OCR
-- Database: postgres on supabase.aura-call.de
-- Execute this via: docker exec -it ngze-techstack-supabase-db-1 psql -U postgres -d postgres

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS beleg_positionen CASCADE;
DROP TABLE IF EXISTS belege CASCADE;
DROP TABLE IF EXISTS steuerkategorien CASCADE;
DROP TABLE IF EXISTS kontierungskonten CASCADE;
DROP TABLE IF EXISTS lieferanten_regeln CASCADE;
DROP TABLE IF EXISTS einstellungen CASCADE;

-- ============================================
-- Table: belege (Main invoice document table)
-- ============================================
CREATE TABLE belege (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Datei-Informationen
    dateiname VARCHAR(255) NOT NULL,
    dateityp VARCHAR(50),
    dateigroesse BIGINT,
    file_hash VARCHAR(64), -- SHA-256 für Duplikaterkennung
    gitlab_storage_url TEXT, -- URL zur PDF in GitLab Storage

    -- Status
    status VARCHAR(50) DEFAULT 'PROCESSING',
    fehler TEXT,

    -- OCR-Qualität
    ocr_score INTEGER,
    ocr_rationale TEXT,

    -- Kerndaten
    document_type VARCHAR(100),
    beleg_datum DATE,
    belegnummer_lieferant VARCHAR(255),
    lieferant_name VARCHAR(255),
    lieferant_adresse TEXT,
    steuernummer VARCHAR(100),

    -- Finanzdaten
    netto_betrag DECIMAL(12,2),
    brutto_betrag DECIMAL(12,2),
    mwst_satz_0 NUMERIC(5,4),
    mwst_betrag_0 DECIMAL(12,2),
    mwst_satz_7 NUMERIC(5,4),
    mwst_betrag_7 DECIMAL(12,2),
    mwst_satz_19 NUMERIC(5,4),
    mwst_betrag_19 DECIMAL(12,2),
    zahlungsmethode VARCHAR(50),

    -- Buchung
    eigene_beleg_nummer VARCHAR(50),
    kontierungskonto VARCHAR(50),
    steuerkategorie VARCHAR(50),
    kontierung_begruendung TEXT,
    soll_konto VARCHAR(10),
    haben_konto VARCHAR(10),

    -- Zahlung
    zahlungs_datum DATE,
    zahlungs_status VARCHAR(50),

    -- Aufbewahrung
    aufbewahrungs_ort VARCHAR(255),
    rechnungs_empfaenger VARCHAR(255),

    -- Flags
    kleinbetrag BOOLEAN DEFAULT FALSE,
    vorsteuerabzug BOOLEAN DEFAULT FALSE,
    reverse_charge BOOLEAN DEFAULT FALSE,
    privatanteil BOOLEAN DEFAULT FALSE,

    -- Duplikat-Erkennung
    duplicate_of_id UUID REFERENCES belege(id),
    duplicate_confidence DECIMAL(5,4),
    duplicate_reason TEXT,

    -- Zeitstempel
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for belege
CREATE INDEX idx_belege_datum ON belege(beleg_datum);
CREATE INDEX idx_belege_lieferant ON belege(lieferant_name);
CREATE INDEX idx_belege_status ON belege(status);
CREATE INDEX idx_belege_file_hash ON belege(file_hash);
CREATE INDEX idx_belege_uploaded_at ON belege(uploaded_at DESC);

-- ============================================
-- Table: beleg_positionen (Line items)
-- ============================================
CREATE TABLE beleg_positionen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beleg_id UUID REFERENCES belege(id) ON DELETE CASCADE,
    position_index INTEGER NOT NULL,
    beschreibung TEXT,
    menge DECIMAL(12,4),
    einzelpreis DECIMAL(12,2),
    gesamtbetrag DECIMAL(12,2),
    mwst_satz NUMERIC(5,4),
    konto VARCHAR(50),
    steuerkategorie VARCHAR(50),

    PRIMARY KEY (beleg_id, position_index)
);

CREATE INDEX idx_beleg_positionen_beleg_id ON beleg_positionen(beleg_id);

-- ============================================
-- Table: steuerkategorien (Tax categories lookup)
-- ============================================
CREATE TABLE steuerkategorien (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wert VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    ust_satz NUMERIC(5,4) NOT NULL,
    vorsteuer BOOLEAN DEFAULT FALSE,
    reverse_charge BOOLEAN DEFAULT FALSE,
    aktiv BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: kontierungskonten (SKR03 accounts)
-- ============================================
CREATE TABLE kontierungskonten (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    konto_nr VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    steuerkategorie VARCHAR(50),
    aktiv BOOLEAN DEFAULT TRUE
);

-- ============================================
-- Table: lieferanten_regeln (Vendor rules)
-- ============================================
CREATE TABLE lieferanten_regeln (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lieferant_name_pattern VARCHAR(255) NOT NULL,
    standard_konto VARCHAR(50),
    standard_steuerkategorie VARCHAR(50),
    prioritaet INTEGER DEFAULT 100,
    aktiv BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lieferanten_regeln_pattern ON lieferanten_regeln(lieferant_name_pattern);
CREATE INDEX idx_lieferanten_regeln_prioritaet ON lieferanten_regeln(prioritaet);

-- ============================================
-- Table: einstellungen (App settings)
-- ============================================
CREATE TABLE einstellungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schluessel VARCHAR(100) UNIQUE NOT NULL,
    wert TEXT,
    typ VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Insert default tax categories
-- ============================================
INSERT INTO steuerkategorien (wert, label, ust_satz, vorsteuer, reverse_charge) VALUES
('19_pv', '19% Vorsteuer', 0.19, TRUE, FALSE),
('7_pv', '7% Vorsteuer', 0.07, TRUE, FALSE),
('0_pv', '0% PV (Steuerfrei)', 0.00, TRUE, FALSE),
('0_igl_rc', '0% IGL / Reverse Charge', 0.00, FALSE, TRUE),
('steuerfrei_kn', 'Steuerfrei (Kleinunternehmer)', 0.00, FALSE, FALSE),
('keine_pv', 'Keine Vorsteuer (Privatanteil)', 0.00, FALSE, FALSE);

-- ============================================
-- Insert default SKR03 accounts
-- ============================================
INSERT INTO kontierungskonten (konto_nr, name, steuerkategorie) VALUES
('3400', 'Wareneingang (SKR03)', '19_pv'),
('3100', 'Fremdleistung (SKR03)', '19_pv'),
('4964', 'Software (SKR03)', '19_pv'),
('4920', 'Internet/Telefon (SKR03)', '19_pv'),
('4210', 'Miete (SKR03)', '19_pv'),
('4900', 'Sonstiges (SKR03)', '19_pv'),
('1800', 'Privatentnahme (SKR03)', 'keine_pv'),
('6000', 'Buchungskonto 6000 (SKR03)', NULL),
('1400', 'Vorsteuer 19% (SKR03)', '19_pv'),
('1401', 'Vorsteuer 7% (SKR03)', '7_pv'),
('1571', 'Abziehbare Vorsteuer (SKR03)', NULL),
('1600', 'Forderungen aus LL (SKR03)', NULL),
('1700', 'Sonstige Vermögensgegenstände (SKR03)', NULL),
('2100', 'Verbindlichkeiten aus LL (SKR03)', NULL),
('2600', 'Umsatzsteuer (SKR03)', NULL),
('2610', 'Umsatzsteuer 19% (SKR03)', NULL),
('2611', 'Umsatzsteuer 7% (SKR03)', NULL);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE belege ENABLE ROW LEVEL SECURITY;
ALTER TABLE beleg_positionen ENABLE ROW LEVEL SECURITY;
ALTER TABLE steuerkategorien ENABLE ROW LEVEL SECURITY;
ALTER TABLE kontierungskonten ENABLE ROW LEVEL SECURITY;
ALTER TABLE lieferanten_regeln ENABLE ROW LEVEL SECURITY;
ALTER TABLE einstellungen ENABLE ROW LEVEL SECURITY;

-- For now: Allow public read/write (can be restricted later with auth)
CREATE POLICY "Allow public access" ON belege FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow public access" ON beleg_positionen FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow public access" ON steuerkategorien FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow public access" ON kontierungskonten FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow public access" ON lieferanten_regeln FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow public access" ON einstellungen FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE belege IS 'Haupttabelle für alle Belege/Rechnungen';
COMMENT ON TABLE beleg_positionen IS 'Positionen/Zeilen eines Belegs';
COMMENT ON TABLE steuerkategorien IS 'Steuerkategorien (19% Vorsteuer, 7% Vorsteuer, etc.)';
COMMENT ON TABLE kontierungskonten IS 'SKR03 Kontierungskonten';
COMMENT ON TABLE lieferanten_regeln IS 'Automatische Buchungsregeln nach Lieferant';
COMMENT ON TABLE einstellungen IS 'Anwendungseinstellungen';

COMMENT ON COLUMN belege.gitlab_storage_url IS 'URL zur PDF-Datei in GitLab Storage';
COMMENT ON COLUMN belege.file_hash IS 'SHA-256 Hash für Duplikaterkennung';
COMMENT ON COLUMN belege.ocr_score IS 'OCR Qualitätsscore (0-10)';
