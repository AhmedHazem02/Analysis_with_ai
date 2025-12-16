import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `أنت وكيل ذكاء اصطناعي متخصص في استخلاص وتنظيم بيانات العملاء المحتملين (Leads) من محادثات نصية غير منظمة. مهمتك هي قراءة النص المعطى (عادةً محادثة واتساب) واستخلاص المعلومات التالية فقط، مع تبرير الاستخلاص في قسم الملاحظات.

**المدخل:** نص خام غير منظم من محادثة واتساب.

**الهيكلية المطلوبة للمخرجات:**
يجب أن يكون ناتجك بتنسيق JSON حصراً، ويحتوي على الأقسام التالية:

1.  **name (string):** اسم العميل أو اسم الشخص الذي يتحدث. إذا لم يذكر صراحة، اتركه فارغاً.
2.  **email (string):** البريد الإلكتروني للشخص إذا تم ذكره في المحادثة. إذا لم يذكر، اتركه فارغاً.
3.  **phone (string):** رقم الهاتف إذا تم ذكره في المحادثة. إذا لم يذكر، اتركه فارغاً.
4.  **job_title_target (string):** المسمى الوظيفي الذي يبحث عنه العميل أو لديه خبرة فيه (أكثر تحديداً ممكن).
5.  **experience_years_estimate (integer):** تقدير لسنوات الخبرة بناءً على النص. إذا لم يُذكر، استخدم القيمة 0.
6.  **level (string):** المستوى المهني المقدر (اختر من: Junior, Mid-Level, Senior, Manager, Unknown).
7.  **raw_notes (string):** النص الخام الأصلي للمحادثة (للحفظ المرجعي).
8.  **extraction_justification (string):** جملة واحدة تشرح كيف تم استخلاص البيانات (خاصة الخبرة والمستوى).

**القواعد الأساسية للعمل:**
* يجب أن تكون النتائج موضوعية ومستندة فقط إلى النص المُدخل.
* إذا كانت معلومة مفقودة، لا تخترعها. استخدم "Unknown" للمستوى أو 0 للسنوات.
* **الإخراج الوحيد المسموح به هو JSON النظيف.**`;

async function callPerplexityAPI(prompt: string) {
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
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 4096,
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
    const { conversationText } = await request.json();

    // Validation
    if (!conversationText) {
      return NextResponse.json(
        { error: 'يجب توفير نص المحادثة' },
        { status: 400 }
      );
    }

    // Build user prompt
    const userPrompt = `قم بتحليل المحادثة التالية واستخراج البيانات المطلوبة:

---
**المحادثة:**
"""
${conversationText}
"""
---

قم الآن باستخلاص البيانات وإصدار النتيجة بصيغة JSON المطلوبة حصراً. أرجع JSON فقط بدون أي نص إضافي.`;

    // Call Perplexity API
    const resultText = await callPerplexityAPI(userPrompt);
    
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

    // Save to Supabase Database
    try {
      const { data: savedLead, error: dbError } = await supabase
        .from('lead_extractions')
        .insert([
          {
            name: result.name || null,
            email: result.email || null,
            phone: result.phone || null,
            job_title_target: result.job_title_target || null,
            experience_years_estimate: result.experience_years_estimate || 0,
            level: result.level || 'Unknown',
            raw_notes: result.raw_notes || conversationText,
            extraction_justification: result.extraction_justification || null,
            conversation_text: conversationText,
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Supabase Insert Error:', dbError);
        // لا نفشل الطلب إذا فشل الحفظ، نرجع البيانات على أي حال
      } else {
        result.id = savedLead.id;
        result.created_at = savedLead.created_at;
      }
    } catch (dbError) {
      console.error('Database Error:', dbError);
      // نستمر بإرجاع النتيجة حتى لو فشل الحفظ
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Lead Extraction Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء استخلاص البيانات', details: error.message },
      { status: 500 }
    );
  }
}
