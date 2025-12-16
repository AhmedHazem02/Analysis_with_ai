# 🤖 نظام الذكاء الاصطناعي المتكامل - AI Analysis System

نظام متكامل مبني على **Next.js 14** و **OpenAI GPT-4** لتقييم السير الذاتية واستخلاص بيانات العملاء المحتملين من محادثات WhatsApp.

![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-cyan)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)

## ✨ المميزات

### 📊 تقييم السير الذاتية (CV Analyzer)
- ✅ تحليل شامل للسيرة الذاتية ومقارنتها بالوصف الوظيفي
- ✅ درجة نهائية من 100 مع تفصيل للدرجات (المهارات، الخبرة، التعليم، التنسيق)
- ✅ توصيات محددة وقابلة للتنفيذ للتحسين
- ✅ استخراج الكلمات المفتاحية المفقودة
- ✅ تقرير JSON شامل

### 👥 استخلاص بيانات العملاء (Lead Extractor)
- ✅ استخلاص تلقائي من محادثات WhatsApp
- ✅ تحديد: الاسم، المسمى الوظيفي، سنوات الخبرة، المستوى المهني
- ✅ تبرير للاستخلاص
- ✅ تصدير البيانات بصيغة JSON

### 💬 محلل محادثات الواتساب (WhatsApp Analyzer) - جديد!
- ✅ رفع ملفات محادثات الواتساب تلقائياً
- ✅ تحليل شامل وتخزين جميع الرسائل في Supabase
- ✅ عرض البيانات في جدول تفاعلي وجميل
- ✅ البحث الفوري في الرسائل والمحتوى
- ✅ فلترة حسب المشاركين
- ✅ تصدير البيانات كملف CSV
- ✅ إحصائيات شاملة للمحادثات
- ✅ دعم كامل للغة العربية والتنسيقات المختلفة

## 🚀 البدء السريع

### المتطلبات
- Node.js 18+ و npm
- مفتاح OpenAI API
- حساب Supabase (مجاني) - لمحلل الواتساب

### 1. التثبيت

```bash
# تنزيل المشروع
git clone <repository-url>
cd Analysis

# تثبيت الحزم
npm install
```

### 2. إعداد Supabase (لمحلل الواتساب)

#### أ. إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ حساب مجاني
2. أنشئ مشروع جديد واحتفظ بـ:
   - **Project URL**
   - **Anon/Public Key**

#### ب. إنشاء قاعدة البيانات
1. في لوحة تحكم Supabase، اذهب إلى **SQL Editor**
2. افتح ملف `supabase-schema.sql` من المشروع
3. انسخ محتوى الملف والصقه في SQL Editor
4. اضغط **Run** لإنشاء الجداول

#### ج. إنشاء Storage Bucket
1. اذهب إلى **Storage** في Supabase
2. أنشئ bucket جديد باسم `whatsapp-chats`
3. اضبط الـ permissions على `public` (أو حسب احتياجاتك)

### 3. إعداد المتغيرات البيئية

أنشئ ملف `.env.local` في المجلد الجذر:

```env
# OpenAI
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Supabase (للـ API Routes)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Supabase (للـ Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

للحصول على مفتاح OpenAI API:
1. اذهب إلى [platform.openai.com](https://platform.openai.com)
2. قم بإنشاء حساب أو تسجيل الدخول
3. اذهب إلى **API Keys** وأنشئ مفتاح جديد

### 3. تشغيل المشروع

```bash
# وضع التطوير
npm run dev

# فتح المتصفح على
# http://localhost:3000
```

### 4. البناء للإنتاج

```bash
# بناء المشروع
npm run build

# تشغيل النسخة المبنية
npm start
```

## 📁 هيكل المشروع

```
Analysis/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cv-analyzer/route.ts      # API تقييم السير الذاتية
│   │   │   └── lead-extractor/route.ts   # API استخلاص البيانات
│   │   ├── cv-analyzer/page.tsx          # صفحة تقييم السير الذاتية
│   │   ├── lead-extractor/page.tsx       # صفحة استخلاص البيانات
│   │   ├── layout.tsx                    # التخطيط الأساسي
│   │   ├── page.tsx                      # الصفحة الرئيسية
│   │   └── globals.css                   # الأنماط العامة
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## 🎯 كيفية الاستخدام

### تقييم السيرة الذاتية

1. اذهب إلى صفحة **تقييم السير الذاتية**
2. أدخل نص السيرة الذاتية في الحقل الأول
3. أدخل الوصف الوظيفي في الحقل الثاني
4. (اختياري) أضف معايير إضافية
5. اضغط على **تحليل السيرة الذاتية**
6. ستظهر النتائج على الجانب الأيمن:
   - الدرجة النهائية
   - ملخص التوافق
   - تفصيل الدرجات
   - التوصيات
   - الكلمات المفتاحية المفقودة

### استخلاص بيانات العملاء

1. اذهب إلى صفحة **استخلاص بيانات العملاء**
2. أدخل نص محادثة WhatsApp
3. أو اضغط على **تعبئة مثال** لتجربة سريعة
4. اضغط على **استخلاص البيانات**
5. ستظهر النتائج:
   - الاسم والمسمى الوظيفي
   - سنوات الخبرة والمستوى
   - تبرير الاستخلاص
   - المحادثة الأصلية
6. يمكنك تصدير البيانات بصيغة JSON

### محلل محادثات الواتساب (جديد!)

#### تصدير محادثة من الواتساب
1. افتح المحادثة في تطبيق واتساب
2. اضغط على القائمة (⋮) أو اسم المحادثة
3. اختر **المزيد** ← **تصدير المحادثة**
4. اختر **بدون وسائط** (أسرع) أو **مع الوسائط**
5. احفظ الملف `.txt`

#### رفع وتحليل المحادثة
1. اذهب إلى صفحة **محلل الواتساب** (استخدم مكون `WhatsAppAnalyzer.jsx`)
2. اضغط على **اختر ملف المحادثة**
3. اختر ملف `.txt` الذي صدّرته
4. انتظر حتى يتم الرفع والتحليل (يظهر شريط تقدم)
5. سترى تأكيد بعدد الرسائل والمشاركين

#### استكشاف البيانات
1. بعد الرفع، اضغط على بطاقة المحادثة لفتحها
2. ستظهر جميع الرسائل في جدول منظم
3. استخدم شريط البحث للبحث في النصوص
4. استخدم القائمة المنسدلة لفلترة رسائل مشارك معين
5. شاهد الإحصائيات: إجمالي الرسائل، المشاركين، إلخ

#### تصدير البيانات
1. بعد فتح المحادثة، اضغط **تصدير CSV**
2. سيتم تنزيل ملف CSV يحتوي على:
   - التاريخ والوقت
   - اسم المرسل
   - نص الرسالة
   - نوع الرسالة
3. يمكنك فتح الملف في Excel أو Google Sheets

## 🔌 API Endpoints

### POST /api/cv-analyzer

**Request Body:**
```json
{
  "cvText": "نص السيرة الذاتية...",
  "jobDescription": "الوصف الوظيفي...",
  "customCriteria": "معايير إضافية (اختياري)"
}
```

**Response:**
```json
{
  "total_score": 85,
  "compatibility_summary": "ملخص التوافق...",
  "score_breakdown": {
    "skills_match_score": 20,
    "experience_relevance_score": 30,
    "education_alignment_score": 12,
    "format_and_clarity_score": 23
  },
  "recommendations": ["توصية 1", "توصية 2"],
  "missing_keywords": ["كلمة1", "كلمة2"]
}
```

### POST /api/lead-extractor

**Request Body:**
```json
{
  "conversationText": "نص المحادثة..."
}
```

**Response:**
```json
{
  "name": "أحمد عبدالله",
  "job_title_target": "مطور برمجيات",
  "experience_years_estimate": 5,
  "level": "Senior",
  "raw_notes": "المحادثة الأصلية...",
  "extraction_justification": "تبرير الاستخلاص..."
}
```

## 🎨 التقنيات المستخدمة

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** OpenAI GPT-4 Turbo
- **UI:** React 18

## 📝 ملاحظات مهمة

- تأكد من وجود رصيد كافٍ في حساب OpenAI
- النموذج الافتراضي هو `gpt-4-turbo-preview` (يمكن تغييره من `.env.local`)
- يتم معالجة جميع الطلبات على الخادم لحماية مفتاح API
- النظام يدعم اللغة العربية بالكامل (RTL)

## 🔒 الأمان

- مفتاح OpenAI API محمي ولا يُرسل للمتصفح أبداً
- جميع المعالجات تتم على الخادم (Server-Side)
- لا يتم حفظ أي بيانات مدخلة

## 🐛 استكشاف الأخطاء

### خطأ: API Key غير صالح
- تأكد من أن `.env.local` موجود
- تحقق من صحة المفتاح في [platform.openai.com](https://platform.openai.com)
- أعد تشغيل الخادم بعد تغيير المتغيرات البيئية

### خطأ: Rate Limit
- لديك الكثير من الطلبات، انتظر قليلاً
- أو قم بالترقية لحساب OpenAI مدفوع

### الواجهة لا تعمل
```bash
# امسح الـ cache وأعد البناء
rm -rf .next
npm run build
npm run dev
```

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام التعليمي والتجاري.

## 🤝 المساهمة

المساهمات مرحب بها! لا تتردد في فتح Issues أو Pull Requests.

## 📧 التواصل

لأي استفسارات أو مشاكل، يرجى فتح Issue في المشروع.

---

**صُنع بـ ❤️ باستخدام Next.js و OpenAI**
