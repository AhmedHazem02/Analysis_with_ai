import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم إرفاق ملف' },
        { status: 400 }
      );
    }

    // التحقق من نوع الملف
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    let extractedText = '';

    // قراءة الملف كـ Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // استخراج النص حسب نوع الملف
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // معالجة PDF
      try {
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text;
      } catch (error) {
        return NextResponse.json(
          { error: 'فشل في قراءة ملف PDF. تأكد من أن الملف غير محمي بكلمة مرور.' },
          { status: 400 }
        );
      }
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      // معالجة DOCX
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (error) {
        return NextResponse.json(
          { error: 'فشل في قراءة ملف DOCX' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو DOCX فقط.' },
        { status: 400 }
      );
    }

    // التحقق من أن النص تم استخراجه بنجاح
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'الملف فارغ أو لا يحتوي على نص قابل للقراءة' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('File Upload Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الملف', details: error.message },
      { status: 500 }
    );
  }
}

// Route segment config for Next.js 14 App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
