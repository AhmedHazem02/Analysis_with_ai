'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  job_title_target: string | null;
  experience_years_estimate: number;
  level: string | null;
  raw_notes: string | null;
  extraction_justification: string | null;
  conversation_text: string;
  created_at: string;
  updated_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_extractions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error('Error loading leads:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' ||
        (lead.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.job_title_target?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLevel = selectedLevel === '' || lead.level === selectedLevel;

      const matchesJobTitle = selectedJobTitle === '' || lead.job_title_target === selectedJobTitle;

      // Date filtering
      let matchesDate = true;
      if (fromDate || toDate) {
        const leadDate = new Date(lead.created_at);
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && leadDate >= from;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && leadDate <= to;
        }
      }

      return matchesSearch && matchesLevel && matchesJobTitle && matchesDate;
    });
  }, [leads, searchTerm, selectedLevel, selectedJobTitle, fromDate, toDate]);

  const levels = useMemo(() => {
    const uniqueLevels = new Set(leads.map(l => l.level).filter(Boolean));
    return Array.from(uniqueLevels).sort();
  }, [leads]);

  const jobTitles = useMemo(() => {
    const uniqueJobTitles = new Set(leads.map(l => l.job_title_target).filter(Boolean));
    return Array.from(uniqueJobTitles).sort();
  }, [leads]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      senior: leads.filter(l => l.level === 'Senior').length,
      midLevel: leads.filter(l => l.level === 'Mid-Level').length,
      junior: leads.filter(l => l.level === 'Junior').length,
      manager: leads.filter(l => l.level === 'Manager').length,
      avgExperience: leads.length > 0
        ? (leads.reduce((sum, l) => sum + (l.experience_years_estimate || 0), 0) / leads.length).toFixed(1)
        : 0,
    };
  }, [leads]);

  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'المسمى الوظيفي', 'سنوات الخبرة', 'المستوى', 'التبرير', 'تاريخ الإضافة'];
    const csvRows = [headers.join(',')];

    filteredLeads.forEach(lead => {
      const row = [
        lead.name || 'غير محدد',
        lead.email || 'غير محدد',
        lead.phone || 'غير محدد',
        lead.job_title_target || 'غير محدد',
        lead.experience_years_estimate || 0,
        lead.level || 'Unknown',
        (lead.extraction_justification || '').replace(/"/g, '""'),
        new Date(lead.created_at).toLocaleDateString('ar-EG'),
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `leads-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (filteredLeads.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    // Create HTML content for PDF
    const filterInfo = [];
    if (selectedJobTitle) filterInfo.push(`المسمى الوظيفي: ${selectedJobTitle}`);
    if (fromDate || toDate) filterInfo.push(`التاريخ: ${fromDate || 'البداية'} - ${toDate || 'النهاية'}`);
    if (selectedLevel) filterInfo.push(`المستوى: ${selectedLevel}`);

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #7c3aed; margin-bottom: 20px;">تقرير قاعدة بيانات العملاء المحتملين</h1>

        ${filterInfo.length > 0 ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #4b5563;">الفلاتر المطبقة:</h3>
            ${filterInfo.map(info => `<p style="margin: 5px 0;">${info}</p>`).join('')}
          </div>
        ` : ''}

        <div style="background: #eff6ff; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold;">إجمالي العملاء: ${filteredLeads.length}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: linear-gradient(to right, #7c3aed, #3b82f6); color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">#</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">الاسم</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">البريد الإلكتروني</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">الهاتف</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">المسمى الوظيفي</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">الخبرة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">المستوى</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLeads.map((lead, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${lead.name || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${lead.email || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${lead.phone || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${lead.job_title_target || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${lead.experience_years_estimate || 0} سنوات</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${lead.level || 'Unknown'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${new Date(lead.created_at).toLocaleDateString('ar-EG')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Create temporary element
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    // PDF options
    const opt = {
      margin: 10,
      filename: `leads-report-${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };

    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
    });
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case 'Senior': return 'bg-purple-100 text-purple-700';
      case 'Mid-Level': return 'bg-blue-100 text-blue-700';
      case 'Junior': return 'bg-green-100 text-green-700';
      case 'Manager': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">AI</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">قاعدة بيانات العملاء</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/lead-extractor"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                استخلاص جديد
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">📊 قاعدة بيانات العملاء المحتملين</h1>
          <p className="text-gray-600">جميع البيانات المستخرجة من محادثات الواتساب</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي العملاء</div>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.senior}</div>
            <div className="text-sm text-purple-600">Senior</div>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.midLevel}</div>
            <div className="text-sm text-blue-600">Mid-Level</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.junior}</div>
            <div className="text-sm text-green-600">Junior</div>
          </div>
          <div className="bg-red-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.manager}</div>
            <div className="text-sm text-red-600">Manager</div>
          </div>
          <div className="bg-gray-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.avgExperience}</div>
            <div className="text-sm text-gray-600">متوسط الخبرة</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* First row - Search and Level */}
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">جميع المستويات</option>
                {levels.map(level => (
                  <option key={level} value={level || ''}>{level}</option>
                ))}
              </select>
            </div>

            {/* Second row - Job Title and Date Range */}
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={selectedJobTitle}
                onChange={(e) => setSelectedJobTitle(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">جميع المسميات الوظيفية</option>
                {jobTitles.map(title => (
                  <option key={title} value={title || ''}>{title}</option>
                ))}
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="من تاريخ"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="إلى تاريخ"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            {/* Third row - Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={exportToPDF}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                📄 تصدير PDF
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                📥 تصدير CSV
              </button>
              <button
                onClick={loadLeads}
                disabled={loading}
                className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                🔄 تحديث
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLevel('');
                  setSelectedJobTitle('');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-all"
              >
                🔄 مسح الفلاتر
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">جاري التحميل...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">📭</p>
              <p>لا توجد بيانات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-right font-semibold">#</th>
                    <th className="px-6 py-4 text-right font-semibold">الاسم</th>
                    <th className="px-6 py-4 text-right font-semibold">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-right font-semibold">رقم الهاتف</th>
                    <th className="px-6 py-4 text-right font-semibold">المسمى الوظيفي</th>
                    <th className="px-6 py-4 text-right font-semibold">سنوات الخبرة</th>
                    <th className="px-6 py-4 text-right font-semibold">المستوى</th>
                    <th className="px-6 py-4 text-right font-semibold">تاريخ الإضافة</th>
                    <th className="px-6 py-4 text-center font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead, index) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {lead.name || <span className="text-gray-400 italic">غير محدد</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {lead.email || <span className="text-gray-400 italic">غير محدد</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {lead.phone || <span className="text-gray-400 italic">غير محدد</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {lead.job_title_target || <span className="text-gray-400 italic">غير محدد</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-blue-600">
                          {lead.experience_years_estimate > 0
                            ? `${lead.experience_years_estimate} سنوات`
                            : <span className="text-gray-400">-</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLevelColor(lead.level)}`}>
                          {lead.level || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Showing count */}
        {!loading && filteredLeads.length > 0 && (
          <div className="mt-4 text-center text-gray-600">
            عرض {filteredLeads.length} من {leads.length} عميل
          </div>
        )}
      </div>

      {/* Modal for Lead Details */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedLead(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">تفاصيل العميل</h2>
                <button onClick={() => setSelectedLead(null)} className="text-white hover:text-gray-200 text-2xl">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم</label>
                  <p className="text-lg text-gray-900">{selectedLead.name || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
                  <p className="text-lg text-gray-900">{selectedLead.email || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف</label>
                  <p className="text-lg text-gray-900">{selectedLead.phone || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المسمى الوظيفي</label>
                  <p className="text-lg text-gray-900">{selectedLead.job_title_target || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">سنوات الخبرة</label>
                  <p className="text-lg font-semibold text-blue-600">{selectedLead.experience_years_estimate || 0} سنوات</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المستوى المهني</label>
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${getLevelColor(selectedLead.level)}`}>
                    {selectedLead.level || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Justification */}
              {selectedLead.extraction_justification && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تبرير الاستخلاص</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{selectedLead.extraction_justification}</p>
                  </div>
                </div>
              )}

              {/* Conversation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">المحادثة الأصلية</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{selectedLead.conversation_text}</pre>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">تاريخ الإضافة</label>
                  <p className="text-sm text-gray-700">{formatDate(selectedLead.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">آخر تحديث</label>
                  <p className="text-sm text-gray-700">{formatDate(selectedLead.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
