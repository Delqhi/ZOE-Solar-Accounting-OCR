-- Supabase Schema für ZOE Solar Accounting
-- Ausführen auf VM: docker exec -it ngze-techstack-supabase-db-1 psql -U postgres -d postgres -f /path/to/supabase_schema.sql

-- 1. belege Tabelle - Haupttabelle für Belege
CREATE TABLE IF NOT EXISTS belege (
  id UUID PRIMARY KEY,
  file_data TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  lieferant_name VARCHAR(255),
  lieferant_adresse TEXT,
  beleg_datum DATE,
  brutto_betrag DECIMAL(10,2),
  mwst_betrag DECIMAL(10,2),
  mwst_satz NUMERIC(5,4),
  steuerkategorie VARCHAR(50),
  skr03_konto VARCHAR(50),
  line_items JSONB,
  status VARCHAR(50),
  score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. belege_privat Tabelle - Private Belege
CREATE TABLE IF NOT EXISTS belege_privat (
  id UUID PRIMARY KEY,
  file_data TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  vendor_name VARCHAR(255),
  document_date DATE,
  total_amount DECIMAL(10,2),
  line_items JSONB,
  private_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. app_settings Tabelle
CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(50) PRIMARY KEY,
  settings_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. vendor_rules Tabelle
CREATE TABLE IF NOT EXISTS vendor_rules (
  vendor_name VARCHAR(255) PRIMARY KEY,
  account_id VARCHAR(50),
  tax_category_value VARCHAR(50),
  use_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- 5. Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_belege_created_at ON belege(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_belege_status ON belege(status);
CREATE INDEX IF NOT EXISTS idx_belege_lieferant ON belege(lieferant_name);

-- Default-Einstellungen einfügen
INSERT INTO app_settings (id, settings_data) VALUES ('global', '{
  "taxDefinitions": [
    {"value": "19_pv", "label": "19% Vorsteuer", "ust_satz": 0.19, "vorsteuer": true},
    {"value": "7_pv", "label": "7% Vorsteuer", "ust_satz": 0.07, "vorsteuer": true},
    {"value": "0_pv", "label": "0% PV (Steuerfrei)", "ust_satz": 0.00, "vorsteuer": true}
  ],
  "accountDefinitions": []
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
