// import { NextRequest, NextResponse } from 'next/server';
// import * as pdfjsLib from 'pdfjs-dist';

// export const runtime = 'nodejs';

// export async function POST(request: NextRequest) {
//   console.log('=== PDF PARSING API CALLED ===');
  
//   try {
//     const formData = await request.formData();
//     const file = formData.get('resume') as File;
    
//     if (!file) {
//       console.log('❌ No file uploaded');
//       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//     }

//     console.log('📄 File received:', {
//       name: file.name,
//       type: file.type,
//       size: `${(file.size / 1024).toFixed(2)} KB`
//     });

//     if (file.type !== 'application/pdf') {
//       return NextResponse.json(
//         { error: 'Invalid file type. Please upload a PDF.' }, 
//         { status: 400 }
//       );
//     }

//     const bytes = await file.arrayBuffer();
//     const uint8Array = new Uint8Array(bytes);
    
//     console.log('⏳ Parsing PDF with pdfjs...');
    
//     // Load PDF document
//     const loadingTask = pdfjsLib.getDocument({
//       data: uint8Array,
//       useWorkerFetch: false,
//       isEvalSupported: false,
//       useSystemFonts: true,
//     });
    
//     const pdf = await loadingTask.promise;
    
//     let fullText = '';
    
//     console.log(`⏳ Extracting text from ${pdf.numPages} pages...`);
    
//     // Extract text from all pages
//     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//       const page = await pdf.getPage(pageNum);
//       const textContent = await page.getTextContent();
      
//       const pageText = textContent.items
//         .map((item) => {
//           if ('str' in item) {
//             return item.str;
//           }
//           return '';
//         })
//         .join(' ');
      
//       fullText += pageText + '\n';
//     }

//     console.log('✅ PDF parsed successfully:', {
//       pages: pdf.numPages,
//       textLength: fullText.length,
//       preview: fullText.substring(0, 100)
//     });

//     if (!fullText || fullText.trim().length < 50) {
//       return NextResponse.json(
//         { 
//           error: 'PDF contains insufficient text',
//           hint: 'Make sure the PDF contains selectable text, not just images.'
//         }, 
//         { status: 400 }
//       );
//     }

//     return NextResponse.json({ 
//       text: fullText.trim(), 
//       pages: pdf.numPages, 
//       success: true 
//     });
    
//   } catch (error) {
//     console.error('❌ PDF parsing error:', error);
    
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
//     return NextResponse.json(
//       { 
//         error: 'Failed to parse PDF', 
//         details: errorMessage,
//         hint: 'Make sure the PDF is not password-protected'
//       }, 
//       { status: 500 }
//     );
//   }
// }




import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('=== RESUME TEXT API CALLED ===');
  
  try {
    const body = await request.json();
    const { resumeText } = body;
    
    if (!resumeText || typeof resumeText !== 'string') {
      console.log('❌ No resume text provided');
      return NextResponse.json({ error: 'No resume text provided' }, { status: 400 });
    }

    console.log('📄 Resume text received:', {
      length: resumeText.length,
      preview: resumeText.substring(0, 100) + '...'
    });

    // Validate minimum length
    if (resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Resume text is too short. Please provide at least 50 characters.' },
        { status: 400 }
      );
    }

    console.log('✅ Resume text validated successfully');

    return NextResponse.json({ 
      text: resumeText.trim(), 
      success: true 
    });
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to process resume text', 
        details: error.message
      }, 
      { status: 500 }
    );
  }
}