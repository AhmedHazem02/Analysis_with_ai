-- ============================================
-- جداول تحليل محادثات الواتساب
-- ============================================

-- جدول المحادثات (كل ملف محادثة)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_messages INTEGER DEFAULT 0,
    participants TEXT[], -- قائمة بأسماء المشاركين
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    file_path TEXT, -- مسار الملف في storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الرسائل
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    message_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sender_name TEXT NOT NULL,
    message_text TEXT,
    message_type TEXT DEFAULT 'text', -- text, image, video, audio, document, etc.
    media_url TEXT, -- رابط الوسائط إن وجدت
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_date ON whatsapp_messages(message_date);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON whatsapp_messages(sender_name);
CREATE INDEX IF NOT EXISTS idx_messages_text ON whatsapp_messages USING gin(to_tsvector('arabic', message_text));

-- إنشاء storage bucket للملفات
-- قم بتنفيذ هذا من لوحة تحكم Supabase:
-- 1. اذهب إلى Storage
-- 2. أنشئ bucket جديد باسم 'whatsapp-chats'
-- 3. اضبط الـ permissions حسب احتياجاتك

-- RLS Policies (حسب احتياجاتك الأمنية)
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- مثال: السماح بالقراءة للجميع (عدّل حسب احتياجاتك)
CREATE POLICY "Allow public read access on conversations" ON whatsapp_conversations
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on messages" ON whatsapp_messages
    FOR SELECT USING (true);

-- السماح بالإدراج للجميع (عدّل حسب احتياجاتك)
CREATE POLICY "Allow public insert on conversations" ON whatsapp_conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on messages" ON whatsapp_messages
    FOR INSERT WITH CHECK (true);
