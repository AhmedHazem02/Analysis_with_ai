import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `أنت وكيل ذكاء اصطناعي (AI Agent) خبير ومحترف في تقييم السير الذاتية (CV) وتحديد مدى توافقها مع الوصف الوظيفي المحدد (Job Description - JD). مهمتك الأساسية هي تحليل السيرة الذاتية المقدمة بتفصيل، ومقارنتها بدقة مع الوصف الوظيفي ومتطلبات الـ Prompt الإضافية التي يقدمها المستخدم، ومن ثم إصدار تقرير شامل ودرجة نهائية (Score).

**الهيكلية المطلوبة للمخرجات:**
يجب أن يكون ناتجك بتنسيق JSON حصراً، ويحتوي على الأقسام التالية:

1.  **total_score (integer):** الدرجة النهائية من 100، تمثل مدى التوافق الكلي.
2.  **compatibility_summary (string):** ملخص عام يشرح بأقل من 3 جمل سبب الدرجة.
3.  **score_breakdown (object):** تفصيل للدرجات لأقسام رئيسية (مجموعها لا يتجاوز 100):
    * skills_match_score (من 25): مدى تطابق المهارات التقنية المذكورة في الـ CV مع الـ JD.
    * experience_relevance_score (من 35): مدى صلة الخبرة السابقة بالوظيفة المطلوبة وعمقها.
    * education_alignment_score (من 15): مدى توافق المؤهلات الأكاديمية المطلوبة.
    * format_and_clarity_score (من 25): جودة التنظيم، سهولة القراءة، واللغة المستخدمة في الـ CV.
4.  **recommendations (array of strings):** قائمة بنقاط محددة وقابلة للتنفيذ لتحسين الـ CV لزيادة التوافق مع هذا الـ JD بالتحديد (3-5 نقاط).
5.  **missing_keywords (array of strings):** قائمة بالكلمات المفتاحية الهامة المذكورة في الـ JD وغير الموجودة في الـ CV.

**القواعد الأساسية للعمل:**
* كن موضوعياً، استخدم لغة احترافية، ولا تختلق معلومات غير موجودة في الـ CV.
* ركز على مدى التوافق وليس فقط على جودة الـ CV العامة.
* **الإخراج الوحيد المسموح به هو JSON النظيف.**`;

async function callPerplexityAPI(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  const model = process.env.PERPLEXITY_MODEL || 'sonar';

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 8192,
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const { cvText, jobDescription, customCriteria } = await request.json();

    // Validation
    if (!cvText || !jobDescription) {
      return NextResponse.json(
        { error: 'يجب توفير نص السيرة الذاتية والوصف الوظيفي' },
        { status: 400 }
      );
    }

    // Build user prompt
    const userPrompt = `إليك البيانات المطلوبة لإجراء التقييم:

---
### 1. الوصف الوظيفي (Job Description - JD):
"""
${jobDescription}
"""

---
### 2. نص السيرة الذاتية (CV Text):
"""
${cvText}
"""

---
### 3. التعليمات والمعايير الإضافية:
${customCriteria || 'لا توجد تعليمات إضافية.'}

---

قم الآن بتحليل هذه المدخلات وإصدار التقرير بصيغة JSON المطلوبة حصراً. أرجع JSON فقط بدون أي نص إضافي.`;

    // Call Perplexity API
    const resultText = await callPerplexityAPI(SYSTEM_PROMPT, userPrompt);
    
    // Parse JSON from response
    let result;
    try {
      // Clean the response text
      let cleanedText = resultText.trim();

      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      // Try to extract JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(cleanedText);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', resultText);
      return NextResponse.json(
        { error: 'فشل في تحليل الاستجابة', rawResponse: resultText },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('CV Analysis Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحليل السيرة الذاتية', details: error.message },
      { status: 500 }
    );
  }
}
