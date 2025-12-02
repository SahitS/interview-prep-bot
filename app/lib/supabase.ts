import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export class DB {
  
  // Create a new interview
  static async createInterview(data: {
    userId: string;
    jobTitle: string;
    company?: string;
    jobDescription?: string;
    resumeText?: string;
    resumeUrl?: string;
  }) {
    const { data: interview, error } = await supabase
      .from('interviews')
      .insert([
        {
          user_id: data.userId,
          job_title: data.jobTitle,
          company: data.company,
          job_description: data.jobDescription,
          resume_text: data.resumeText,
          resume_url: data.resumeUrl,
          status: 'in_progress',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return interview;
  }

  // Get interview by ID
  static async getInterview(id: string) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create multiple questions
  static async createQuestions(
    interviewId: string,
    questions: Array<{
      text: string;
      category: string;
      difficulty: number;
      expectedSkills?: string[];
    }>
  ) {
    const questionsToInsert = questions.map((q, index) => ({
      interview_id: interviewId,
      question_text: q.text,
      category: q.category,
      difficulty: q.difficulty,
      expected_skills: q.expectedSkills || [],
      question_order: index,
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (error) throw error;
    return data;
  }

  // Get all questions for an interview
  static async getQuestions(interviewId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('interview_id', interviewId)
      .order('question_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Get single question by ID
  static async getQuestion(questionId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;
    return data;
  }

  // Save an answer
  static async saveAnswer(data: {
    questionId: string;
    answerText?: string;
    audioUrl?: string;
    score?: number;
    strengths?: string[];
    improvements?: string[];
    followUp?: string;
    durationSeconds?: number;
  }) {
    const { data: answer, error } = await supabase
      .from('answers')
      .insert([
        {
          question_id: data.questionId,
          answer_text: data.answerText,
          audio_url: data.audioUrl,
          score: data.score,
          strengths: data.strengths || [],
          improvements: data.improvements || [],
          follow_up_question: data.followUp,
          duration_seconds: data.durationSeconds,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return answer;
  }

  // Get answer for a question
  static async getAnswer(questionId: string) {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  // Get interview with all questions and answers
  static async getInterviewWithQuestionsAndAnswers(interviewId: string) {
    // Get interview
    const interview = await this.getInterview(interviewId);
    
    // Get questions
    const questions = await this.getQuestions(interviewId);
    
    // Get answers for each question
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answer = await this.getAnswer(question.id);
        return { ...question, answer };
      })
    );

    return {
      ...interview,
      questions: questionsWithAnswers,
    };
  }

  // Update interview status
  static async updateInterviewStatus(
    id: string,
    status: string,
    totalScore?: number
  ) {
    const updateData: Record<string, unknown> = { status };
    
    if (totalScore !== undefined) {
      updateData.total_score = totalScore;
    }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  // Get all interviews for a user
  static async getUserInterviews(userId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}