/**
 * محلل ملفات محادثات الواتساب
 * يدعم التنسيقات المختلفة للواتساب
 */

/**
 * تحليل ملف محادثة واتساب
 * @param {string} content - محتوى الملف النصي
 * @returns {Object} - كائن يحتوي على معلومات المحادثة والرسائل
 */
function parseWhatsAppChat(content) {
    const lines = content.split('\n');
    const messages = [];
    const participants = new Set();

    // نماذج regex لدعم تنسيقات مختلفة
    // تنسيق: [DD/MM/YYYY, HH:MM:SS] اسم المرسل: نص الرسالة
    const pattern1 = /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]\s+([^:]+):\s*(.*)/i;

    // تنسيق: DD/MM/YYYY, HH:MM - اسم المرسل: نص الرسالة
    const pattern2 = /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s*-\s*([^:]+):\s*(.*)/i;

    // تنسيق: DD/MM/YYYY, HH:MM:SS - اسم المرسل: نص الرسالة
    const pattern3 = /(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}:\d{2})\s+-\s+([^:]+):\s+(.*)/;

    let currentMessage = null;

    for (const line of lines) {
        if (!line.trim()) continue;

        // محاولة مطابقة السطر مع أحد التنسيقات
        let match = line.match(pattern1) || line.match(pattern2) || line.match(pattern3);

        if (match) {
            // حفظ الرسالة السابقة إن وجدت
            if (currentMessage) {
                messages.push(currentMessage);
            }

            const [, dateStr, timeStr, sender, text] = match;

            // تحويل التاريخ والوقت
            const messageDate = parseWhatsAppDate(dateStr, timeStr);

            // التحقق من نوع الرسالة
            const messageType = detectMessageType(text);

            participants.add(sender.trim());

            currentMessage = {
                date: messageDate,
                sender: sender.trim(),
                text: text.trim(),
                type: messageType
            };
        } else if (currentMessage) {
            // إذا لم يطابق النمط، فهو استكمال للرسالة السابقة (رسالة متعددة الأسطر)
            currentMessage.text += '\n' + line.trim();
        }
    }

    // إضافة آخر رسالة
    if (currentMessage) {
        messages.push(currentMessage);
    }

    // حساب تواريخ البداية والنهاية
    const dates = messages.map(m => m.date).filter(d => d);
    const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    return {
        totalMessages: messages.length,
        participants: Array.from(participants),
        startDate,
        endDate,
        messages
    };
}

/**
 * تحويل تاريخ ووقت الواتساب إلى كائن Date
 * @param {string} dateStr - التاريخ بصيغة DD/MM/YYYY
 * @param {string} timeStr - الوقت بصيغة HH:MM:SS أو HH:MM
 * @returns {Date}
 */
function parseWhatsAppDate(dateStr, timeStr) {
    try {
        // تحليل التاريخ
        const [day, month, year] = dateStr.split('/').map(Number);
        const fullYear = year < 100 ? 2000 + year : year;

        // تحليل الوقت
        let hours, minutes, seconds = 0;
        const timeParts = timeStr.trim().split(':');
        hours = parseInt(timeParts[0]);
        minutes = parseInt(timeParts[1]);

        if (timeParts.length > 2) {
            const secPart = timeParts[2].replace(/[^\d]/g, '');
            seconds = parseInt(secPart) || 0;
        }

        // التعامل مع صيغة AM/PM
        if (timeStr.toUpperCase().includes('PM') && hours < 12) {
            hours += 12;
        } else if (timeStr.toUpperCase().includes('AM') && hours === 12) {
            hours = 0;
        }

        return new Date(fullYear, month - 1, day, hours, minutes, seconds);
    } catch (error) {
        console.error('Error parsing date:', dateStr, timeStr, error);
        return new Date();
    }
}

/**
 * اكتشاف نوع الرسالة
 * @param {string} text - نص الرسالة
 * @returns {string} - نوع الرسالة
 */
function detectMessageType(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('<media omitted>') || lowerText.includes('‎صورة محذوفة') || lowerText.includes('‎فيديو محذوف')) {
        return 'media_omitted';
    }

    if (lowerText.match(/\.(jpg|jpeg|png|gif)$/)) {
        return 'image';
    }

    if (lowerText.match(/\.(mp4|avi|mov)$/)) {
        return 'video';
    }

    if (lowerText.match(/\.(mp3|wav|ogg|opus)$/)) {
        return 'audio';
    }

    if (lowerText.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/)) {
        return 'document';
    }

    if (lowerText.includes('‎الموقع:') || lowerText.includes('location:')) {
        return 'location';
    }

    if (lowerText.includes('missed voice call') || lowerText.includes('مكالمة صوتية فائتة')) {
        return 'call';
    }

    return 'text';
}

// Export للاستخدام في Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseWhatsAppChat,
        parseWhatsAppDate,
        detectMessageType
    };
}
