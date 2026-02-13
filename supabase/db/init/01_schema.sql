-- ============================================
-- SUPABASE SCHEMA FOR ZOE SOLAR ACCOUNTING OCR
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BELEGE (DOCUMENTS) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.belege (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  content TEXT,
  extracted_data JSONB,
  type TEXT,
  document_date DATE,
  total_amount DECIMAL(10,2),
  vat_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  creditor TEXT,
  vat_rate DECIMAL(5,2),
  iban TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  ai_confidence DECIMAL(5,2),
  ocr_engine TEXT,
  processing_time INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.belege ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
CREATE POLICY "Users can view own documents" ON public.belege
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.belege
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.belege
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.belege
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_belege_user_id ON public.belege(user_id);
CREATE INDEX IF NOT EXISTS idx_belege_uploaded_at ON public.belege(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_belege_document_date ON public.belege(document_date);

-- ============================================
-- AUTO-UPDATE UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_belege_updated_at
  BEFORE UPDATE ON public.belege
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- ============================================
-- INSERT INTO public.belege (user_id, file_name, file_type, content, type, document_date, total_amount, vat_amount, net_amount, creditor, status)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1),
--   'sample_invoice.pdf',
--   'application/pdf',
--   '{"text": "Sample invoice content"}',
--   'RECHNUNG',
--   '2024-01-15',
--   119.00,
--   19.00,
--   100.00,
--   'Example GmbH',
--   'processed'
-- );

