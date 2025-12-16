'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LeadData {
  name: string;
  job_title_target: string;
  experience_years_estimate: number;
  level: string;
  raw_notes: string;
  extraction_justification: string;
}

export default function LeadExtractorPage() {
  const [conversationText, setConversationText] = useState('');
  const [result, setResult] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    if (!conversationText) {
      setError('يرجى إدخال نص المحادثة');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/lead-extractor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء الاستخلاص');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Senior':
        return 'bg-purple-100 text-purple-700';
      case 'Mid-Level':
        return 'bg-blue-100 text-blue-700';
      case 'Junior':
        return 'bg-green-100 text-green-700';
      case 'Manager':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const fillSampleData = () => {
    setConversationText(`[12:30 PM] أحمد: مرحباً، اسمي أحمد عبدالله
[12:31 PM] أحمد: أنا مهتم بفرصة عمل كمطور برمجيات
[12:32 PM] المسؤول: أهلاً أحمد، كم سنة خبرة لديك؟
[12:33 PM] أحمد: لدي 5 سنوات خبرة في تطوير تطبيقات الويب
[12:34 PM] أحمد: عملت كـ Senior Developer في شركتين سابقاً
[12:35 PM] أحمد: وأتقن React و Node.js و Python`);
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
              <h1 className="text-xl font-bold text-gray-900">
                استخلاص بيانات العملاء
              </h1>
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            استخلاص بيانات العملاء
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            استخرج بيانات العملاء المحتملين تلقائياً من محادثات WhatsApp
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block font-semibold text-gray-900">
                  نص المحادثة (WhatsApp) *
                </label>
                <button
                  onClick={fillSampleData}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  تعبئة مثال
                </button>
              </div>
              <textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm text-gray-900 bg-white"
                placeholder="[12:30] أحمد: مرحباً، اسمي أحمد..."
              />
            </div>

            <button
              onClick={handleExtract}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  جاري الاستخلاص...
                </span>
              ) : (
                '🔍 استخلاص البيانات'
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                ❌ {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div>
            {result ? (
              <div className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {result.name || 'غير محدد'}
                      </h2>
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getLevelBadgeColor(
                          result.level
                        )}`}
                      >
                        {result.level}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          المسمى الوظيفي
                        </div>
                        <div className="font-semibold text-gray-900">
                          {result.job_title_target || 'غير محدد'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          سنوات الخبرة
                        </div>
                        <div className="font-semibold text-gray-900">
                          {result.experience_years_estimate > 0
                            ? `${result.experience_years_estimate} سنوات`
                            : 'غير محددة'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Justification */}
                {result.extraction_justification && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      تبرير الاستخلاص
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {result.extraction_justification}
                    </p>
                  </div>
                )}

                {/* Raw Notes */}
                {result.raw_notes && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      المحادثة الأصلية
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {result.raw_notes}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(result, null, 2);
                    const dataBlob = new Blob([dataStr], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `lead-${Date.now()}.json`;
                    link.click();
                  }}
                  className="w-full bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-900 transition-colors"
                >
                  📥 تصدير البيانات (JSON)
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <svg
                  className="w-24 h-24 mx-auto mb-6 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  في انتظار الاستخلاص
                </h3>
                <p className="text-gray-500">
                  أدخل نص المحادثة واضغط على زر الاستخلاص لعرض النتائج
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
