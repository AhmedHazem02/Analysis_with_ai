-- ============================================
-- جدول Lead Extraction - بيانات العملاء المستخرجة
-- ============================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS lead_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    phone TEXT,
    job_title_target TEXT,
    experience_years_estimate INTEGER DEFAULT 0,
    level TEXT,
    raw_notes TEXT,
    extraction_justification TEXT,
    conversation_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_leads_name ON lead_extractions(name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON lead_extractions(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON lead_extractions(phone);
CREATE INDEX IF NOT EXISTS idx_leads_level ON lead_extractions(level);
CREATE INDEX IF NOT EXISTS idx_leads_experience ON lead_extractions(experience_years_estimate);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON lead_extractions(created_at DESC);

-- Full-text search على النصوص
CREATE INDEX IF NOT EXISTS idx_leads_text_search ON lead_extractions
    USING gin(to_tsvector('arabic', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(job_title_target, '') || ' ' || coalesce(raw_notes, '')));

-- RLS Policies (حسب احتياجاتك الأمنية)
ALTER TABLE lead_extractions ENABLE ROW LEVEL SECURITY;

-- مثال: السماح بالقراءة للجميع
CREATE POLICY "Allow public read access on leads" ON lead_extractions
    FOR SELECT USING (true);

-- السماح بالإدراج للجميع
CREATE POLICY "Allow public insert on leads" ON lead_extractions
    FOR INSERT WITH CHECK (true);

-- السماح بالتحديث للجميع
CREATE POLICY "Allow public update on leads" ON lead_extractions
    FOR UPDATE USING (true);

-- السماح بالحذف للجميع
CREATE POLICY "Allow public delete on leads" ON lead_extractions
    FOR DELETE USING (true);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at عند أي تعديل
CREATE TRIGGER update_lead_extractions_updated_at
    BEFORE UPDATE ON lead_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- إنشاء view للإحصائيات
CREATE OR REPLACE VIEW lead_statistics AS
SELECT
    COUNT(*) as total_leads,
    COUNT(DISTINCT level) as unique_levels,
    AVG(experience_years_estimate) as avg_experience_years,
    COUNT(CASE WHEN level = 'Senior' THEN 1 END) as senior_count,
    COUNT(CASE WHEN level = 'Mid-Level' THEN 1 END) as mid_level_count,
    COUNT(CASE WHEN level = 'Junior' THEN 1 END) as junior_count,
    COUNT(CASE WHEN level = 'Manager' THEN 1 END) as manager_count,
    COUNT(CASE WHEN level = 'Unknown' OR level IS NULL THEN 1 END) as unknown_count
FROM lead_extractions;
