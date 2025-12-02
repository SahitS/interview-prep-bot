/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/app/lib/supabase';
import { AIService } from '@/app/lib/openai';

export async function POST(request: NextRequest) {
  console.log('\n=== CREATE INTERVIEW API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('❌ Failed to parse request body:', parseError.message);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError.message
      }, { status: 400 });
    }

    console.log('📥 Request body received:', {
      userId: body.userId ? '✓' : '✗',
      jobTitle: body.jobTitle ? '✓' : '✗',
      company: body.company ? '✓' : '✗',
      resumeLength: body.resumeText?.length || 0,
      jobDescLength: body.jobDescription?.length || 0
    });

    const { userId, jobTitle, company, jobDescription, resumeText } = body;

    // Validate inputs
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!jobTitle) missingFields.push('jobTitle');
    if (!jobDescription) missingFields.push('jobDescription');
    if (!resumeText) missingFields.push('resumeText');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: 'Missing required fields',
        missingFields
      }, { status: 400 });
    }

    console.log('✅ Validation passed');
    
    // Create interview record
    console.log('📝 Creating interview in database...');
    let interview;
    try {
      interview = await DB.createInterview({
        userId,
        jobTitle,
        company,
        jobDescription,
        resumeText,
      });
      console.log('✅ Interview created with ID:', interview.id);
    } catch (dbError: any) {
      console.error('❌ Database error creating interview:', dbError.message);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Generate questions using AI
    console.log('🤖 Generating questions with OpenAI...');
    let questions;
    try {
      questions = await AIService.generateQuestions(
        resumeText,
        jobDescription,
        jobTitle
      );
      console.log('✅ Questions generated:', questions.length);
    } catch (aiError: any) {
      console.error('❌ AI service error:', aiError.message);
      console.error('   Stack:', aiError.stack);
      
      // Try to clean up the interview record
      try {
        console.log('🧹 Attempting to delete incomplete interview...');
        // You may want to add a delete method to DB or leave it as incomplete
      } catch (cleanupError) {
        console.error('⚠️  Failed to cleanup interview:', cleanupError);
      }
      
      throw new Error(`AI generation failed: ${aiError.message}`);
    }

    // Save questions to database
    console.log('💾 Saving questions to database...');
    try {
      await DB.createQuestions(interview.id, questions);
      console.log('✅ Questions saved successfully');
    } catch (dbError: any) {
      console.error('❌ Database error saving questions:', dbError.message);
      throw new Error(`Failed to save questions: ${dbError.message}`);
    }

    // Fetch complete interview data
    console.log('📤 Fetching complete interview...');
    let completeInterview;
    try {
      completeInterview = await DB.getInterviewWithQuestionsAndAnswers(interview.id);
      console.log('✅ Complete interview fetched');
    } catch (dbError: any) {
      console.error('❌ Database error fetching interview:', dbError.message);
      throw new Error(`Failed to fetch interview: ${dbError.message}`);
    }

    console.log('🎉 Interview creation successful!');
    console.log('=== END ===\n');

    return NextResponse.json({
      success: true,
      interview: completeInterview
    });

  } catch (error: any) {
    console.error('\n❌ === ERROR IN CREATE INTERVIEW ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR ===\n');
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Failed to create interview';
    
    if (error.message?.includes('API key')) {
      statusCode = 500;
      errorMessage = 'OpenAI API configuration error';
    } else if (error.message?.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
    } else if (error.message?.includes('Database')) {
      statusCode = 500;
      errorMessage = 'Database error';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        type: error.constructor.name
      }, 
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const interviewId = searchParams.get('id');

  if (!interviewId) {
    return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });
  }

  try {
    const interview = await DB.getInterviewWithQuestionsAndAnswers(interviewId);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }
    return NextResponse.json({ interview });
  } catch (error: any) {
    console.error('Fetch interview error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch interview',
      details: error.message
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const interviewId = searchParams.get('id');

  if (!interviewId) {
    return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status, totalScore } = body;

    await DB.updateInterviewStatus(interviewId, status, totalScore);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update interview error:', error);
    return NextResponse.json({ 
      error: 'Failed to update interview',
      details: error.message
    }, { status: 500 });
  }
}