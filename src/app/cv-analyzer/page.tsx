'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CVAnalysisResult {
  total_score: number;
  compatibility_summary: string;
  score_breakdown: {
    skills_match_score: number;
    experience_relevance_score: number;
    education_alignment_score: number;
    format_and_clarity_score: number;
  };
  recommendations: string[];
  missing_keywords: string[];
}

export default function CVAnalyzerPage() {
  const [cvText, setCvText] = useState('');
  const [customCriteria, setCustomCriteria] = useState('');
  const [result, setResult] = useState<CVAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvFileName, setCvFileName] = useState('');

  const handleFileUpload = async (file: File) => {
    setUploadingCV(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في رفع الملف');
      }

      setCvText(data.text);
      setCvFileName(data.fileName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingCV(false);
    }
  };

  const handleAnalyze = async () => {
    if (!cvText) {
      setError('يرجى رفع ملف السيرة الذاتية');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/cv-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText,
          jobDescription: customCriteria || 'قم بتحليل السيرة الذاتية بشكل عام',
          customCriteria,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء التحليل');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">AI</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                تقييم السير الذاتية
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
            تقييم السيرة الذاتية
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            قم برفع السيرة الذاتية للحصول على تقييم شامل ودقيق مع توصيات للتحسين
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* CV Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <label className="block font-semibold text-gray-900 mb-4 text-lg">
                📄 رفع السيرة الذاتية (CV) *
              </label>

              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                  {uploadingCV ? (
                    <div className="flex flex-col items-center gap-3">
                      <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="text-blue-600 font-medium">جاري رفع الملف...</span>
                    </div>
                  ) : cvFileName ? (
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <div className="text-green-600 font-semibold">✓ تم رفع الملف بنجاح</div>
                      <div className="text-gray-600 text-sm">{cvFileName}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCvText('');
                          setCvFileName('');
                        }}
                        className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        حذف الملف
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      <div className="text-gray-700 font-medium">اضغط لرفع ملف السيرة الذاتية</div>
                      <div className="text-gray-500 text-sm">PDF أو DOCX - حتى 10MB</div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Custom Criteria Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block mb-3 font-semibold text-gray-900">
                📝 معايير إضافية (اختياري)
              </label>
              <textarea
                value={customCriteria}
                onChange={(e) => setCustomCriteria(e.target.value)}
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white"
                placeholder="أضف أي معايير أو ملاحظات تريد التركيز عليها في التقييم...
مثال: التركيز على المهارات التقنية، الخبرة في القيادة، إلخ."
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !cvText}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  جاري التحليل...
                </span>
              ) : (
                '🚀 تحليل السيرة الذاتية'
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
                {/* Total Score */}
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    الدرجة النهائية
                  </h3>
                  <div
                    className={`text-6xl font-bold mb-2 ${getScoreColor(
                      result.total_score
                    )}`}
                  >
                    {result.total_score}
                  </div>
                  <div className="text-gray-600">من 100</div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    📝 ملخص التوافق
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {result.compatibility_summary}
                  </p>
                </div>

                {/* Score Breakdown */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">
                    📊 تفصيل الدرجات
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        label: 'المهارات التقنية',
                        score: result.score_breakdown.skills_match_score,
                        max: 25,
                      },
                      {
                        label: 'الخبرة العملية',
                        score: result.score_breakdown.experience_relevance_score,
                        max: 35,
                      },
                      {
                        label: 'المؤهلات الأكاديمية',
                        score: result.score_breakdown.education_alignment_score,
                        max: 15,
                      },
                      {
                        label: 'التنسيق والوضوح',
                        score: result.score_breakdown.format_and_clarity_score,
                        max: 25,
                      },
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="font-semibold">
                            {item.score}/{item.max}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getScoreBgColor(
                              (item.score / item.max) * 100
                            )}`}
                            style={{
                              width: `${(item.score / item.max) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">
                      💡 توصيات للتحسين
                    </h3>
                    <ul className="space-y-3">
                      {result.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Keywords */}
                {result.missing_keywords.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">
                      🔍 الكلمات المفتاحية المفقودة
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  في انتظار التحليل
                </h3>
                <p className="text-gray-500">
                  قم برفع السيرة الذاتية واضغط على زر التحليل لعرض النتائج
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
