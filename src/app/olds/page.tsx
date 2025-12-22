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

interface OldCustomer {
  id: number;
  customer_name: string | null;
  created_at: string | null;
  status: string | null;
  moderator: string | null;
  designer: string | null;
  individual_service_1: string | null;
  individual_service_2: string | null;
  individual_service_3: string | null;
  individual_service_4: string | null;
  individual_service_5: string | null;
  individual_service_6: string | null;
  important_notes: string | null;
  job_title: string | null;
  old_cv: string | null;
  email: string | null;
  phone: string | null;
  customer_whatsapp: string | null;
  address: string | null;
  birth_date: string | null;
  education: string | null;
  work_experience: string | null;
  personal_skills: string | null;
  all_services: string | null;
  ad_source_whatsapp: number | null;
  payment_number: string | null;
  total_amount: number | null;
}

export default function OldsPage() {
  const [customers, setCustomers] = useState<OldCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<OldCustomer | null>(null);
  const [editCustomer, setEditCustomer] = useState<OldCustomer | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      console.log('Starting to load customers from Olds table...');

      // Load all data using pagination to avoid the 1000 record limit
      let allData: OldCustomer[] = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('Olds')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + limit - 1);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += limit;
          hasMore = data.length === limit;
          console.log(`Loaded ${allData.length} records so far...`);
        } else {
          hasMore = false;
        }
      }

      console.log('Total records loaded:', allData.length);
      setCustomers(allData);
      console.log('Customers loaded successfully:', allData.length);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(`فشل في تحميل البيانات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = searchTerm === '' ||
        (customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.customer_whatsapp?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.address?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesJobTitle = selectedJobTitle === '' || customer.job_title?.toLowerCase().includes(selectedJobTitle.toLowerCase());

      // Date filtering
      let matchesDate = true;
      if (fromDate || toDate) {
        const customerDate = new Date(customer.created_at || '');
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && customerDate >= from;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && customerDate <= to;
        }
      }

      return matchesSearch && matchesJobTitle && matchesDate;
    });
  }, [customers, searchTerm, selectedJobTitle, fromDate, toDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedJobTitle, fromDate, toDate, itemsPerPage]);

  const jobTitles = useMemo(() => {
    const uniqueJobTitles = new Set(customers.map(c => c.job_title).filter(Boolean));
    return Array.from(uniqueJobTitles).sort();
  }, [customers]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      withWhatsapp: customers.filter(c => c.customer_whatsapp).length,
      withPhone: customers.filter(c => c.phone).length,
      withAddress: customers.filter(c => c.address).length,
    };
  }, [customers]);

  const exportToCSV = () => {
    if (filteredCustomers.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Show confirmation message with filtered data count
    const isFiltered = filteredCustomers.length !== customers.length;
    const message = isFiltered
      ? `سيتم تصدير ${filteredCustomers.length} سجل فقط (من أصل ${customers.length}) حسب الفلترة المطبقة.\n\nهل تريد المتابعة؟`
      : `سيتم تصدير جميع السجلات (${filteredCustomers.length} سجل).\n\nهل تريد المتابعة؟`;

    if (!confirm(message)) {
      return;
    }

    const headers = ['الاسم', 'رقم الواتساب', 'رقم التواصل', 'المسمى الوظيفي', 'العنوان', 'تاريخ الإضافة'];
    const csvRows = [headers.join(',')];

    filteredCustomers.forEach(customer => {
      const row = [
        customer.customer_name || 'غير محدد',
        customer.customer_whatsapp || 'غير محدد',
        customer.phone || 'غير محدد',
        customer.job_title || 'غير محدد',
        customer.address || 'غير محدد',
        customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `old-customers-filtered-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (filteredCustomers.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Show confirmation message with filtered data count
    const isFiltered = filteredCustomers.length !== customers.length;
    const message = isFiltered
      ? `سيتم تصدير ${filteredCustomers.length} سجل فقط (من أصل ${customers.length}) حسب الفلترة المطبقة.\n\nهل تريد المتابعة؟`
      : `سيتم تصدير جميع السجلات (${filteredCustomers.length} سجل).\n\nهل تريد المتابعة؟`;

    if (!confirm(message)) {
      return;
    }

    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    const filterInfo = [];
    if (searchTerm) filterInfo.push(`البحث: "${searchTerm}"`);
    if (selectedJobTitle) filterInfo.push(`المسمى الوظيفي: ${selectedJobTitle}`);
    if (fromDate || toDate) filterInfo.push(`التاريخ: ${fromDate || 'البداية'} - ${toDate || 'النهاية'}`);

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #7c3aed; margin-bottom: 20px;">تقرير قاعدة بيانات العملاء القدامى</h1>

        ${filterInfo.length > 0 ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #4b5563;">الفلاتر المطبقة:</h3>
            ${filterInfo.map(info => `<p style="margin: 5px 0;">${info}</p>`).join('')}
          </div>
        ` : ''}

        <div style="background: #eff6ff; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold;">إجمالي العملاء: ${filteredCustomers.length}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: linear-gradient(to right, #7c3aed, #3b82f6); color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">#</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">الاسم</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">رقم الواتساب</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">رقم التواصل</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">المسمى الوظيفي</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">العنوان</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCustomers.map((customer, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${customer.customer_name || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${customer.customer_whatsapp || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${customer.phone || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${customer.job_title || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${customer.address || 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
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
      filename: `old-customers-report-${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };

    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
    });
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Olds')
        .delete()
        .eq('id', id)
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('Delete error details:', error);
        alert(`فشل في حذف العميل: ${error.message}\n\nالتفاصيل: ${JSON.stringify(error)}`);
        return;
      }

      setCustomers(customers.filter(customer => customer.id !== id));
      alert('تم حذف العميل بنجاح');
      await loadCustomers();
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      alert(`حدث خطأ: ${err.message}`);
    }
  };

  const updateCustomer = async () => {
    if (!editCustomer) return;

    try {
      const { error } = await supabase
        .from('Olds')
        .update({
          customer_name: editCustomer.customer_name,
          job_title: editCustomer.job_title,
          phone: editCustomer.phone,
          customer_whatsapp: editCustomer.customer_whatsapp,
          address: editCustomer.address,
          email: editCustomer.email,
          important_notes: editCustomer.important_notes,
        })
        .eq('id', editCustomer.id);

      if (error) throw error;

      setCustomers(customers.map(customer => customer.id === editCustomer.id ? editCustomer : customer));
      setIsEditing(false);
      setEditCustomer(null);
      alert('تم تحديث البيانات بنجاح');
    } catch (err: any) {
      console.error('Error updating customer:', err);
      alert('فشل في تحديث البيانات');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
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
              <h1 className="text-xl font-bold text-gray-900">قاعدة بيانات العملاء القدامى</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/leads" className="text-purple-600 hover:text-purple-700 font-medium">
                العملاء الجدد
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
          <h1 className="text-4xl font-bold mb-4 gradient-text">قاعدة بيانات العملاء القدامى</h1>
          <p className="text-gray-600">جميع بيانات العملاء القدامى</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي العملاء</div>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.withWhatsapp}</div>
            <div className="text-sm text-purple-600">لديهم واتساب</div>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.withPhone}</div>
            <div className="text-sm text-blue-600">لديهم هاتف</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.withAddress}</div>
            <div className="text-sm text-green-600">لديهم عنوان</div>
          </div>
        </div>

        {/* Filtered Results Banner */}
        {(searchTerm || selectedJobTitle || fromDate || toDate) && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-orange-600 text-xl">🔍</div>
              <div className="flex-1">
                <h3 className="font-bold text-orange-900 mb-2">فلترة نشطة</h3>
                <div className="text-sm text-orange-800">
                  <p className="mb-1">
                    <span className="font-semibold">عدد النتائج:</span> {filteredCustomers.length} من أصل {customers.length} عميل
                  </p>
                  {searchTerm && (
                    <p className="mb-1">
                      <span className="font-semibold">البحث:</span> "{searchTerm}"
                    </p>
                  )}
                  {selectedJobTitle && (
                    <p className="mb-1">
                      <span className="font-semibold">المسمى الوظيفي:</span> {selectedJobTitle}
                    </p>
                  )}
                  {(fromDate || toDate) && (
                    <p>
                      <span className="font-semibold">التاريخ:</span> {fromDate || 'البداية'} - {toDate || 'النهاية'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* First row - Search and Job Title */}
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="🔍 ابحث بالاسم، رقم الهاتف، البريد الإلكتروني، أو العنوان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                suppressHydrationWarning
              />
              <input
                type="text"
                placeholder="💼 ابحث بالمسمى الوظيفي..."
                value={selectedJobTitle}
                onChange={(e) => setSelectedJobTitle(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                suppressHydrationWarning
              />
            </div>

            {/* Second row - Date Range */}
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="من تاريخ"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                suppressHydrationWarning
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="إلى تاريخ"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                suppressHydrationWarning
              />
            </div>

            {/* Third row - Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={exportToPDF}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                تصدير PDF
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                تصدير CSV
              </button>
              <button
                onClick={loadCustomers}
                disabled={loading}
                className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                تحديث
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedJobTitle('');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-all"
              >
                مسح الفلاتر
              </button>
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-4">
              <label className="text-gray-700 font-medium">عدد العناصر في الصفحة:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                suppressHydrationWarning
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
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
          ) : filteredCustomers.length === 0 ? (
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
                    <th className="px-6 py-4 text-right font-semibold">رقم الواتساب</th>
                    <th className="px-6 py-4 text-right font-semibold">المسمى الوظيفي</th>
                    <th className="px-6 py-4 text-right font-semibold">تاريخ الإضافة</th>
                    <th className="px-6 py-4 text-right font-semibold">العنوان</th>
                    <th className="px-6 py-4 text-right font-semibold">رقم التواصل</th>
                    <th className="px-6 py-4 text-center font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700">{startIndex + index + 1}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {customer.customer_name || <span className="text-gray-400 italic">غير محدد</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {customer.customer_whatsapp || <span className="text-gray-400 italic">غير محدد</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {customer.job_title || <span className="text-gray-400 italic">غير محدد</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {customer.address || <span className="text-gray-400 italic">غير محدد</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {customer.phone || <span className="text-gray-400 italic">غير محدد</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                            title="عرض التفاصيل"
                          >
                            عرض
                          </button>
                          <button
                            onClick={() => {
                              setEditCustomer(customer);
                              setIsEditing(true);
                            }}
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                            title="تعديل"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                            title="حذف"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Showing info */}
            <div className="text-gray-600">
              عرض {startIndex + 1} - {Math.min(endIndex, filteredCustomers.length)} من {filteredCustomers.length} عميل
              {filteredCustomers.length !== customers.length && ` (إجمالي ${customers.length})`}
            </div>

            {/* Pagination buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* First page button */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="الصفحة الأولى"
                >
                  «
                </button>

                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="السابق"
                >
                  ‹
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          currentPage === pageNumber
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Next button */}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="التالي"
                >
                  ›
                </button>

                {/* Last page button */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="الصفحة الأخيرة"
                >
                  »
                </button>
              </div>
            )}

            {/* Page info */}
            <div className="text-gray-600">
              الصفحة {currentPage} من {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Customer Details */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">تفاصيل العميل</h2>
                <button onClick={() => setSelectedCustomer(null)} className="text-white hover:text-gray-200 text-2xl">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.customer_name || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.email || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.phone || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">رقم الواتساب</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.customer_whatsapp || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المسمى الوظيفي</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.job_title || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">العنوان</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.address || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">تاريخ الميلاد</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.birth_date || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الحالة</label>
                  <p className="text-lg text-gray-900">{selectedCustomer.status || <span className="text-gray-400 italic">غير محدد</span>}</p>
                </div>
              </div>

              {/* Additional Info */}
              {selectedCustomer.education && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">التعليم</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{selectedCustomer.education}</p>
                  </div>
                </div>
              )}

              {selectedCustomer.work_experience && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الخبرة العملية</label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{selectedCustomer.work_experience}</p>
                  </div>
                </div>
              )}

              {selectedCustomer.important_notes && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات هامة</label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{selectedCustomer.important_notes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">تاريخ الإضافة</label>
                  <p className="text-sm text-gray-700">{formatDate(selectedCustomer.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">المبلغ الإجمالي</label>
                  <p className="text-sm text-gray-700">{selectedCustomer.total_amount || 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Edit Customer */}
      {isEditing && editCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => {
          setIsEditing(false);
          setEditCustomer(null);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">تعديل بيانات العميل</h2>
                <button onClick={() => {
                  setIsEditing(false);
                  setEditCustomer(null);
                }} className="text-white hover:text-gray-200 text-2xl">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Edit Form */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم</label>
                  <input
                    type="text"
                    value={editCustomer.customer_name || ''}
                    onChange={(e) => setEditCustomer({...editCustomer, customer_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editCustomer.email || ''}
                    onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={editCustomer.phone || ''}
                    onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الواتساب</label>
                  <input
                    type="tel"
                    value={editCustomer.customer_whatsapp || ''}
                    onChange={(e) => setEditCustomer({...editCustomer, customer_whatsapp: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المسمى الوظيفي</label>
                  <input
                    type="text"
                    value={editCustomer.job_title || ''}
                    onChange={(e) => setEditCustomer({...editCustomer, job_title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان</label>
                  <input
                    type="text"
                    value={editCustomer.address || ''}
                    onChange={(e) => setEditCustomer({...editCustomer, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات هامة</label>
                <textarea
                  value={editCustomer.important_notes || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, important_notes: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  suppressHydrationWarning
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={updateCustomer}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditCustomer(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
