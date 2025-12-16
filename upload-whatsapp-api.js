/**
 * API لرفع ومعالجة ملفات محادثات الواتساب
 * يمكن استخدامه مع Next.js API Routes أو Express.js
 */

import { createClient } from '@supabase/supabase-js';
import { parseWhatsAppChat } from './whatsapp-parser.js';
import formidable from 'formidable';
import fs from 'fs/promises';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * معالجة رفع ملف محادثة واتساب
 * @param {Request} req - الطلب
 * @param {Response} res - الاستجابة
 */
export async function handleWhatsAppUpload(req, res) {
    try {
        // تحليل الملف المرفوع
        const { file, fileName } = await parseUploadedFile(req);

        // قراءة محتوى الملف
        const content = await fs.readFile(file.filepath, 'utf-8');

        // تحليل محادثة الواتساب
        const parsedData = parseWhatsAppChat(content);

        if (parsedData.messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'لم يتم العثور على رسائل في الملف. تأكد من أن الملف بتنسيق واتساب الصحيح.'
            });
        }

        // رفع الملف إلى Supabase Storage
        const fileBuffer = await fs.readFile(file.filepath);
        const storagePath = `chats/${Date.now()}-${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('whatsapp-chats')
            .upload(storagePath, fileBuffer, {
                contentType: 'text/plain',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error('فشل في رفع الملف إلى التخزين');
        }

        // إنشاء سجل المحادثة
        const { data: conversation, error: convError } = await supabase
            .from('whatsapp_conversations')
            .insert([{
                file_name: fileName,
                total_messages: parsedData.totalMessages,
                participants: parsedData.participants,
                start_date: parsedData.startDate?.toISOString(),
                end_date: parsedData.endDate?.toISOString(),
                file_path: storagePath
            }])
            .select('id')
            .single();

        if (convError) {
            console.error('Conversation insert error:', convError);
            throw new Error('فشل في حفظ بيانات المحادثة');
        }

        // إدراج الرسائل على دفعات لتحسين الأداء
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < parsedData.messages.length; i += batchSize) {
            const batch = parsedData.messages.slice(i, i + batchSize);

            const messagesData = batch.map(msg => ({
                conversation_id: conversation.id,
                message_date: msg.date?.toISOString(),
                sender_name: msg.sender,
                message_text: msg.text,
                message_type: msg.type
            }));

            const { error: msgError } = await supabase
                .from('whatsapp_messages')
                .insert(messagesData);

            if (msgError) {
                console.error('Messages insert error:', msgError);
                throw new Error(`فشل في حفظ الرسائل (Batch ${i / batchSize + 1})`);
            }

            insertedCount += batch.length;
        }

        // حذف الملف المؤقت
        await fs.unlink(file.filepath).catch(console.error);

        // إرجاع النتيجة
        return res.status(200).json({
            success: true,
            data: {
                conversationId: conversation.id,
                totalMessages: parsedData.totalMessages,
                participants: parsedData.participants,
                startDate: parsedData.startDate,
                endDate: parsedData.endDate,
                insertedMessages: insertedCount
            }
        });

    } catch (error) {
        console.error('Upload handler error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'حدث خطأ أثناء معالجة الملف'
        });
    }
}

/**
 * تحليل الملف المرفوع باستخدام formidable
 * @param {Request} req - الطلب
 * @returns {Promise<Object>} - كائن يحتوي على الملف واسمه
 */
async function parseUploadedFile(req) {
    return new Promise((resolve, reject) => {
        const form = formidable({
            maxFileSize: 50 * 1024 * 1024, // 50MB
            keepExtensions: true
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
                return;
            }

            const file = files.file?.[0] || files.file;
            if (!file) {
                reject(new Error('لم يتم رفع أي ملف'));
                return;
            }

            const fileName = file.originalFilename || 'whatsapp-chat.txt';

            resolve({ file, fileName });
        });
    });
}

/**
 * استرجاع جميع المحادثات مع إحصائياتها
 * @param {Request} req - الطلب
 * @param {Response} res - الاستجابة
 */
export async function getConversations(req, res) {
    try {
        const { data, error } = await supabase
            .from('whatsapp_conversations')
            .select('*')
            .order('upload_date', { ascending: false });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * استرجاع رسائل محادثة معينة مع البحث والفلترة
 * @param {Request} req - الطلب
 * @param {Response} res - الاستجابة
 */
export async function getMessages(req, res) {
    try {
        const { conversationId } = req.query;
        const { search, sender, dateFrom, dateTo, limit = 100, offset = 0 } = req.query;

        let query = supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact' })
            .eq('conversation_id', conversationId)
            .order('message_date', { ascending: true });

        // البحث في النص
        if (search) {
            query = query.ilike('message_text', `%${search}%`);
        }

        // الفلترة حسب المرسل
        if (sender) {
            query = query.eq('sender_name', sender);
        }

        // الفلترة حسب التاريخ
        if (dateFrom) {
            query = query.gte('message_date', dateFrom);
        }
        if (dateTo) {
            query = query.lte('message_date', dateTo);
        }

        // التصفح (pagination)
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            data,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get messages error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Export للاستخدام في Next.js
export default async function handler(req, res) {
    // تعطيل bodyParser الافتراضي لـ Next.js
    if (req.method === 'POST') {
        return handleWhatsAppUpload(req, res);
    } else if (req.method === 'GET') {
        if (req.query.conversationId) {
            return getMessages(req, res);
        } else {
            return getConversations(req, res);
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

export const config = {
    api: {
        bodyParser: false, // ضروري لاستخدام formidable
    },
};
