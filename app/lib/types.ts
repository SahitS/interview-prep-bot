export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Interview {
  id: string;
  user_id: string;
  job_title: string;
  company?: string;
  job_description?: string;
  resume_text?: string;
  resume_url?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  total_score?: number;
  created_at: string;
  completed_at?: string;
}

export interface Question {
  id: string;
  interview_id: string;
  question_text: string;
  category: 'technical' | 'behavioral' | 'system_design';
  difficulty: number;
  expected_skills?: string[];
  question_order: number;
  created_at: string;
  answer?: Answer;
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text?: string;
  audio_url?: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  follow_up_question?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface InterviewWithQuestions extends Interview {
  questions: Question[];
}

export interface QuestionGeneration {
  text: string;
  category: 'technical' | 'behavioral' | 'system_design';
  difficulty: number;
  expectedSkills: string[];
}

export interface AnswerEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  followUp: string;
}