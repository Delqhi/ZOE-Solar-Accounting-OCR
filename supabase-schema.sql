-- ============================================
-- ZOE Solar Accounting - Supabase Schema
-- ============================================
-- Execute this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Main Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- File metadata
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_hash VARCHAR(64),

    -- Source information
    source_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'gmail', 'upload', 'pending_queue'
    source_id VARCHAR(255),

    -- GitLab storage reference
    gitlab_file_path VARCHAR(1000),
    gitlab_project_id VARCHAR(100),
    gitlab_commit_sha VARCHAR(64),

    -- OCR Data
    document_type VARCHAR(100),
    beleg_datum DATE,
    beleg_nummer_lieferant VARCHAR(255),
    lieferant_name VARCHAR(500),
    lieferant_adresse TEXT,
    steuernummer VARCHAR(100),

    -- Financial data
    netto_betrag DECIMAL(12, 2),
    mwst_satz_0 NUMERIC(5, 4),
    mwst_betrag_0 DECIMAL(12, 2),
    mwst_satz_7 NUMERIC(5, 4),
    mwst_betrag_7 DECIMAL(12, 2),
    mwst_satz_19 NUMERIC(5, 4),
    mwst_betrag_19 DECIMAL(12, 2),
    brutto_betrag DECIMAL(12, 2),
    zahlungsmethode VARCHAR(100),

    -- Accounting classification
    steuerkategorie VARCHAR(50),
    kontierungskonto VARCHAR(50),
    soll_konto VARCHAR(10),
    haben_konto VARCHAR(10),
    konto_skr03 VARCHAR(10),

    -- Status tracking
    status VARCHAR(50) DEFAULT 'processing',
    ocr_score INTEGER,
    ocr_rationale TEXT,

    -- Flags
    reverse_charge BOOLEAN DEFAULT FALSE,
    vorsteuerabzug BOOLEAN DEFAULT FALSE,
    kleinbetrag BOOLEAN DEFAULT FALSE,
    privatanteil BOOLEAN DEFAULT FALSE,

    -- JSONB for flexible data
    raw_data JSONB,
    line_items JSONB DEFAULT '[]'::jsonb
);

-- ZOE Reference (e.g., ZOE-202501-ABC123)
CREATE INDEX idx_documents_zoe_reference ON documents(zoe_reference);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_source_type ON documents(source_type);
CREATE INDEX idx_documents_beleg_datum ON documents(beleg_datum);
CREATE INDEX idx_documents_lieferant_name ON documents(lieferant_name);

-- ============================================
-- Pending Queue Table (for Gmail workflow)
-- ============================================
CREATE TABLE IF NOT EXISTS pending_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Reference to document (if confirmed)
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

    -- Source tracking
    source_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'gmail'
    source_message_id VARCHAR(255),
    sender_email VARCHAR(255),
    sender_phone VARCHAR(50),

    -- Extracted metadata (preliminary)
    preliminary_data JSONB NOT NULL,
    extracted_amount DECIMAL(12, 2),
    extracted_vendor VARCHAR(500),
    extracted_date DATE,

    -- Notification tracking
    notification_sent_at TIMESTAMPTZ,
    notification_id VARCHAR(255),

    -- Review tracking
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(255),
    review_action VARCHAR(20), -- 'confirmed', 'rejected'
    review_notes TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' -- pending, confirmed, rejected, expired
);

CREATE INDEX idx_pending_queue_status ON pending_queue(status);
CREATE INDEX idx_pending_queue_source_type ON pending_queue(source_type);
CREATE INDEX idx_pending_queue_created_at ON pending_queue(created_at);

-- ============================================
-- Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,

    -- Target (for specific user targeting)
    target_user_id VARCHAR(255),

    -- Read tracking
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- Processed Messages Table (Idempotency)
-- ============================================
CREATE TABLE IF NOT EXISTS processed_messages (
    id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    message_type VARCHAR(50),
    processing_status VARCHAR(50),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_processed_messages_id ON processed_messages(id);
CREATE INDEX idx_processed_messages_created_at ON processed_messages(created_at);

-- ============================================
-- Vendor Rules Table
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_rules (
    vendor_name VARCHAR(500) PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Classification rules
    account_id VARCHAR(100),
    tax_category_value VARCHAR(50),

    -- Usage tracking
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_rules ENABLE ROW LEVEL SECURITY;

-- Public read access (app can read all data)
CREATE POLICY "Public read access documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Public read access pending_queue" ON pending_queue FOR SELECT USING (true);
CREATE POLICY "Public read access notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public read access processed_messages" ON processed_messages FOR SELECT USING (true);
CREATE POLICY "Public read access vendor_rules" ON vendor_rules FOR SELECT USING (true);

-- n8n service role can write (anon key for client-side)
CREATE POLICY "Service insert documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update documents" ON documents FOR UPDATE USING (true);
CREATE POLICY "Service insert pending_queue" ON pending_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update pending_queue" ON pending_queue FOR UPDATE USING (true);
CREATE POLICY "Service insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Service insert processed_messages" ON processed_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update vendor_rules" ON vendor_rules FOR UPDATE USING (true);

-- React app can update pending queue (for confirm/reject actions)
CREATE POLICY "App can update pending queue" ON pending_queue
    FOR UPDATE USING (true);

-- ============================================
-- Storage Buckets (Create via Dashboard)
-- ============================================
-- Go to Supabase Dashboard → Storage → New Bucket
--
-- Bucket 1: "documents"
--   - Path structure: {year}/{month}/{document_id}/{filename}
--   - Public access: enabled
--   - Max file size: 50MB
--   - Allowed MIME types: application/pdf, image/*
--
-- Bucket 2: "thumbnails"
--   - Path structure: {document_id}/thumbnail.jpg
--   - Public access: enabled
--   - Max file size: 5MB

-- ============================================
-- Realtime Settings
-- ============================================
-- Enable Realtime for tables:
-- 1. Supabase Dashboard → Database → Replication
-- 2. Enable replication for: documents, pending_queue, notifications

-- ============================================
-- Sample Data (Optional)
-- ============================================
-- INSERT INTO vendor_rules (vendor_name, account_id, tax_category_value, use_count)
-- VALUES
--   ('SolarTech GmbH', 'wareneingang', '19_pv', 5),
--   ('Energie Beratung GmbH', 'beratung', '19_pv', 3);
