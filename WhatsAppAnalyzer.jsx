/**
 * مكون React شامل لتحليل وعرض محادثات الواتساب
 * يتضمن: رفع الملفات، عرض الجدول، البحث، وتصدير CSV
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function WhatsAppAnalyzer() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSender, setSelectedSender] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');

    // تحميل المحادثات عند بدء المكون
    useEffect(() => {
        loadConversations();
    }, []);

    // تحميل الرسائل عند اختيار محادثة
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    // تحميل جميع المحادثات
    const loadConversations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('whatsapp_conversations')
                .select('*')
                .order('upload_date', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (error) {
            console.error('Error loading conversations:', error);
            alert('فشل في تحميل المحادثات');
        } finally {
            setLoading(false);
        }
    };

    // تحميل رسائل محادثة معينة
    const loadMessages = async (conversationId) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('whatsapp_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('message_date', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
            alert('فشل في تحميل الرسائل');
        } finally {
            setLoading(false);
        }
    };

    // رفع ملف محادثة جديد
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setUploadProgress('جاري قراءة الملف...');

            const formData = new FormData();
            formData.append('file', file);

            setUploadProgress('جاري تحليل المحادثة...');

            const response = await fetch('/api/whatsapp/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            setUploadProgress('تم الرفع بنجاح!');
            alert(`تم رفع المحادثة بنجاح!\n${result.data.totalMessages} رسالة من ${result.data.participants.length} مشارك`);

            // إعادة تحميل المحادثات
            await loadConversations();
            setUploadProgress('');
        } catch (error) {
            console.error('Upload error:', error);
            alert('فشل في رفع الملف: ' + error.message);
            setUploadProgress('');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    // الحصول على قائمة المشاركين الفريدة
    const uniqueSenders = useMemo(() => {
        const senders = new Set(messages.map(m => m.sender_name));
        return Array.from(senders).sort();
    }, [messages]);

    // فلترة الرسائل حسب البحث والمشارك
    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            const matchesSearch = searchTerm === '' ||
                msg.message_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.sender_name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSender = selectedSender === '' || msg.sender_name === selectedSender;

            return matchesSearch && matchesSender;
        });
    }, [messages, searchTerm, selectedSender]);

    // تصدير البيانات كـ CSV
    const exportToCSV = () => {
        if (filteredMessages.length === 0) {
            alert('لا توجد رسائل للتصدير');
            return;
        }

        // إنشاء محتوى CSV
        const headers = ['التاريخ', 'الوقت', 'المرسل', 'الرسالة', 'النوع'];
        const csvRows = [headers.join(',')];

        filteredMessages.forEach(msg => {
            const date = new Date(msg.message_date);
            const dateStr = date.toLocaleDateString('ar-EG');
            const timeStr = date.toLocaleTimeString('ar-EG');
            const sender = msg.sender_name;
            const text = (msg.message_text || '').replace(/"/g, '""').replace(/\n/g, ' ');
            const type = msg.message_type;

            csvRows.push(`"${dateStr}","${timeStr}","${sender}","${text}","${type}"`);
        });

        const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `whatsapp-chat-${Date.now()}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // تنسيق التاريخ والوقت
    const formatDateTime = (dateString) => {
        if (!dateString) return 'غير متوفر';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="whatsapp-analyzer" dir="rtl">
            <style jsx>{`
                .whatsapp-analyzer {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .header {
                    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2em;
                }

                .upload-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .upload-button {
                    background: #25D366;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: background 0.3s;
                }

                .upload-button:hover {
                    background: #20BA5A;
                }

                .upload-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }

                .conversations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .conversation-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    border: 2px solid transparent;
                }

                .conversation-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                .conversation-card.selected {
                    border-color: #25D366;
                }

                .conversation-card h3 {
                    margin: 0 0 10px 0;
                    color: #128C7E;
                }

                .conversation-stats {
                    display: flex;
                    gap: 15px;
                    margin-top: 10px;
                    font-size: 14px;
                    color: #666;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .messages-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .controls {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .search-input,
                .filter-select {
                    padding: 10px 15px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    flex: 1;
                    min-width: 200px;
                }

                .search-input:focus,
                .filter-select:focus {
                    outline: none;
                    border-color: #25D366;
                }

                .export-button {
                    background: #128C7E;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background 0.3s;
                }

                .export-button:hover {
                    background: #0E6D62;
                }

                .messages-table {
                    width: 100%;
                    border-collapse: collapse;
                    overflow-x: auto;
                }

                .messages-table th {
                    background: #f5f5f5;
                    padding: 12px;
                    text-align: right;
                    font-weight: bold;
                    border-bottom: 2px solid #ddd;
                    position: sticky;
                    top: 0;
                }

                .messages-table td {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                    vertical-align: top;
                }

                .messages-table tr:hover {
                    background: #f9f9f9;
                }

                .message-text {
                    max-width: 600px;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }

                .message-type {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .type-text { background: #E3F2FD; color: #1976D2; }
                .type-image { background: #FFF3E0; color: #F57C00; }
                .type-video { background: #F3E5F5; color: #7B1FA2; }
                .type-audio { background: #E8F5E9; color: #388E3C; }
                .type-document { background: #FBE9E7; color: #D84315; }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #999;
                }

                .progress-message {
                    color: #128C7E;
                    margin-top: 10px;
                    font-weight: bold;
                }

                .stats-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 6px;
                }

                .stat-box {
                    text-align: center;
                }

                .stat-box .label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }

                .stat-box .value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #128C7E;
                }
            `}</style>

            {/* Header */}
            <div className="header">
                <h1>📊 محلل محادثات الواتساب</h1>
                <p>قم برفع ملف محادثة الواتساب لتحليله واستكشاف البيانات</p>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
                <h2>رفع محادثة جديدة</h2>
                <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                    id="file-upload"
                />
                <label htmlFor="file-upload">
                    <span className="upload-button" style={{ display: 'inline-block' }}>
                        {uploading ? 'جاري الرفع...' : '📤 اختر ملف المحادثة'}
                    </span>
                </label>
                {uploadProgress && <p className="progress-message">{uploadProgress}</p>}
                <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                    💡 لتصدير محادثة من واتساب: افتح المحادثة ← الخيارات ← المزيد ← تصدير المحادثة
                </p>
            </div>

            {/* Conversations List */}
            {conversations.length > 0 && (
                <div>
                    <h2>المحادثات المرفوعة ({conversations.length})</h2>
                    <div className="conversations-grid">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`conversation-card ${selectedConversation?.id === conv.id ? 'selected' : ''}`}
                                onClick={() => setSelectedConversation(conv)}
                            >
                                <h3>📱 {conv.file_name}</h3>
                                <div className="conversation-stats">
                                    <div className="stat-item">
                                        <span>💬</span>
                                        <span>{conv.total_messages} رسالة</span>
                                    </div>
                                    <div className="stat-item">
                                        <span>👥</span>
                                        <span>{conv.participants?.length || 0} مشارك</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                                    تم الرفع: {formatDateTime(conv.upload_date)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages Section */}
            {selectedConversation && (
                <div className="messages-section">
                    <h2>رسائل المحادثة: {selectedConversation.file_name}</h2>

                    {/* Statistics Summary */}
                    <div className="stats-summary">
                        <div className="stat-box">
                            <div className="label">إجمالي الرسائل</div>
                            <div className="value">{messages.length}</div>
                        </div>
                        <div className="stat-box">
                            <div className="label">الرسائل المعروضة</div>
                            <div className="value">{filteredMessages.length}</div>
                        </div>
                        <div className="stat-box">
                            <div className="label">المشاركون</div>
                            <div className="value">{uniqueSenders.length}</div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="controls">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="🔍 ابحث في الرسائل..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <select
                            className="filter-select"
                            value={selectedSender}
                            onChange={(e) => setSelectedSender(e.target.value)}
                        >
                            <option value="">جميع المشاركين</option>
                            {uniqueSenders.map(sender => (
                                <option key={sender} value={sender}>{sender}</option>
                            ))}
                        </select>

                        <button className="export-button" onClick={exportToCSV}>
                            📥 تصدير CSV
                        </button>
                    </div>

                    {/* Messages Table */}
                    {loading ? (
                        <div className="loading">جاري التحميل...</div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="empty-state">
                            <h3>لا توجد رسائل</h3>
                            <p>جرب تغيير البحث أو الفلتر</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="messages-table">
                                <thead>
                                    <tr>
                                        <th>التاريخ والوقت</th>
                                        <th>المرسل</th>
                                        <th>الرسالة</th>
                                        <th>النوع</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMessages.map((msg, index) => (
                                        <tr key={msg.id || index}>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                {formatDateTime(msg.message_date)}
                                            </td>
                                            <td>{msg.sender_name}</td>
                                            <td className="message-text">{msg.message_text}</td>
                                            <td>
                                                <span className={`message-type type-${msg.message_type}`}>
                                                    {msg.message_type === 'text' ? 'نص' :
                                                     msg.message_type === 'image' ? 'صورة' :
                                                     msg.message_type === 'video' ? 'فيديو' :
                                                     msg.message_type === 'audio' ? 'صوت' :
                                                     msg.message_type === 'document' ? 'مستند' :
                                                     msg.message_type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {conversations.length === 0 && !loading && (
                <div className="empty-state">
                    <h3>👋 مرحباً!</h3>
                    <p>ابدأ برفع ملف محادثة واتساب لتحليله</p>
                </div>
            )}
        </div>
    );
}
