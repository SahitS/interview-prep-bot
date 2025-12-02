import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/app/lib/supabase';
import { AIService } from '@/app/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answerText, durationSeconds } = body;

    if (!questionId || !answerText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const question = await DB.getQuestion(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const evaluation = await AIService.evaluateAnswer(question.question_text, answerText, question.category, question.expected_skills);
    const answer = await DB.saveAnswer({ questionId, answerText, score: evaluation.score, strengths: evaluation.strengths, improvements: evaluation.improvements, followUp: evaluation.followUp, durationSeconds });

    return NextResponse.json({ success: true, evaluation, answerId: answer.id });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Answer evaluation error:', error);
    return NextResponse.json({ error: 'Failed to evaluate answer', details: error.message }, { status: 500 });
  }
}