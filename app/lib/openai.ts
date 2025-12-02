import OpenAI from 'openai';
import { QuestionGeneration, AnswerEvaluation } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Utility function to clean and parse JSON responses from OpenAI
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanAndParseJSON(content: string): any {
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Remove any leading/trailing whitespace again
  cleanContent = cleanContent.trim();
  
  try {
    return JSON.parse(cleanContent);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ JSON Parse Error. Content preview:', cleanContent.substring(0, 200));
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}

export class AIService {
  
  /**
   * Generate interview questions based on resume and job description
   */
  static async generateQuestions(
    resumeText: string,
    jobDescription: string,
    jobTitle: string
  ): Promise<QuestionGeneration[]> {
    
    console.log('📝 Starting question generation...');
    console.log('  - Resume length:', resumeText.length);
    console.log('  - Job description length:', jobDescription.length);
    console.log('  - Job title:', jobTitle);
    
    const prompt = `You are an expert technical interviewer. Generate 10 interview questions for this candidate.

RESUME:
${resumeText.substring(0, 3000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

JOB TITLE: ${jobTitle}

Generate exactly 10 questions covering:
- 4 technical questions based on skills in resume and job requirements
- 4 behavioral questions using STAR method (Situation, Task, Action, Result)
- 2 system design or problem-solving questions

For each question, provide:
- text: The question itself
- category: "technical", "behavioral", or "system_design"
- difficulty: Integer from 1-5 (1=easy, 5=hard)
- expectedSkills: Array of 2-4 specific skills this question tests

Return ONLY valid JSON in this exact format with no additional text:
{
  "questions": [
    {
      "text": "Can you explain the difference between REST and GraphQL APIs?",
      "category": "technical",
      "difficulty": 3,
      "expectedSkills": ["API Design", "REST", "GraphQL", "Backend"]
    }
  ]
}`;

    try {
      console.log('🔄 Calling OpenAI API...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert technical interviewer who creates insightful, relevant interview questions. You MUST respond with ONLY valid JSON, no markdown formatting, no explanatory text before or after."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('✅ Received response from OpenAI');
      console.log('   Response length:', content.length);
      console.log('   Response preview:', content.substring(0, 150));
      
      const parsed = cleanAndParseJSON(content);
      
      // Validate response structure
      if (!parsed.questions) {
        console.error('❌ Response missing "questions" key');
        console.error('   Keys found:', Object.keys(parsed));
        throw new Error('Invalid response format: missing questions array');
      }

      if (!Array.isArray(parsed.questions)) {
        console.error('❌ "questions" is not an array');
        console.error('   Type:', typeof parsed.questions);
        throw new Error('Invalid response format: questions is not an array');
      }

      if (parsed.questions.length === 0) {
        throw new Error('No questions generated');
      }

      // Validate each question
      for (let i = 0; i < parsed.questions.length; i++) {
        const q = parsed.questions[i];
        const missingFields = [];
        
        if (!q.text) missingFields.push('text');
        if (!q.category) missingFields.push('category');
        if (typeof q.difficulty !== 'number') missingFields.push('difficulty');
        if (!Array.isArray(q.expectedSkills)) missingFields.push('expectedSkills');
        
        if (missingFields.length > 0) {
          console.error(`❌ Question ${i} is missing fields:`, missingFields);
          console.error('   Question data:', JSON.stringify(q));
          throw new Error(`Question ${i} is missing required fields: ${missingFields.join(', ')}`);
        }
      }

      console.log('✅ Generated questions:', parsed.questions.length);
      return parsed.questions;
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error generating questions:', error);
      
      // Provide more specific error messages
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to OpenAI API. Please check your internet connection.');
      }
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
      }
      
      if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
      }
      
      if (error.status === 500) {
        throw new Error('OpenAI API is experiencing issues. Please try again later.');
      }
      
      // Re-throw with original message if not a known error
      throw new Error(`Failed to generate interview questions: ${error.message}`);
    }
  }

  /**
   * Evaluate a candidate's answer
   */
  static async evaluateAnswer(
    question: string,
    answer: string,
    category: string,
    expectedSkills?: string[]
  ): Promise<AnswerEvaluation> {
    
    console.log('📊 Starting answer evaluation...');
    
    const prompt = `Evaluate this interview answer professionally and constructively.

QUESTION: ${question}
CATEGORY: ${category}
EXPECTED SKILLS: ${expectedSkills?.join(', ') || 'Not specified'}

CANDIDATE ANSWER:
${answer}

Provide a detailed evaluation in JSON format:
{
  "score": <number from 0-10>,
  "strengths": [<array of 2-3 specific positive points>],
  "improvements": [<array of 2-3 specific areas to improve>],
  "followUp": "<one insightful follow-up question>"
}

Scoring criteria (out of 10):
- Technical accuracy and completeness (if applicable)
- Clear communication and structure
- Depth of understanding vs surface-level knowledge
- Use of examples or specific details
- For behavioral: Use of STAR method

Return ONLY valid JSON with no additional text.`;

    try {
      console.log('🔄 Calling OpenAI API for evaluation...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an experienced interviewer who provides constructive, specific feedback. You always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('✅ Received evaluation from OpenAI');
      
      const evaluation = cleanAndParseJSON(content);

      // Validate response structure
      if (
        typeof evaluation.score !== 'number' ||
        !Array.isArray(evaluation.strengths) ||
        !Array.isArray(evaluation.improvements) ||
        typeof evaluation.followUp !== 'string'
      ) {
        console.error('❌ Invalid evaluation format:', evaluation);
        throw new Error('Invalid evaluation format from OpenAI');
      }

      console.log('✅ Evaluation complete. Score:', evaluation.score);
      return evaluation;
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error evaluating answer:', error);
      throw new Error(`Failed to evaluate answer: ${error.message}`);
    }
  }

  /**
   * Generate a summary of the interview performance
   */
  static async generateInterviewSummary(
    questions: Array<{
      text: string;
      category: string;
      answer?: {
        score: number;
        strengths: string[];
        improvements: string[];
      };
    }>
  ): Promise<{
    overallAssessment: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  }> {
    
    console.log('📈 Generating interview summary...');
    
    const answeredQuestions = questions.filter(q => q.answer);
    
    if (answeredQuestions.length === 0) {
      throw new Error('No answered questions to summarize');
    }
    
    const avgScore = answeredQuestions.reduce((sum, q) => sum + (q.answer?.score || 0), 0) / answeredQuestions.length;

    const prompt = `Analyze this interview performance and provide a comprehensive summary.

AVERAGE SCORE: ${avgScore.toFixed(1)}/10
QUESTIONS ANSWERED: ${answeredQuestions.length}

QUESTIONS AND PERFORMANCE:
${answeredQuestions.map((q, i) => `
Question ${i + 1} (${q.category}): ${q.text}
Score: ${q.answer?.score}/10
Strengths: ${q.answer?.strengths.join('; ')}
Improvements: ${q.answer?.improvements.join('; ')}
`).join('\n')}

Provide a summary in JSON format:
{
  "overallAssessment": "<2-3 sentence overall performance summary>",
  "keyStrengths": [<array of 3-4 main strengths across all answers>],
  "areasForImprovement": [<array of 3-4 key areas to work on>],
  "recommendations": [<array of 3-4 specific actionable recommendations>]
}

Return ONLY valid JSON with no additional text.`;

    try {
      console.log('🔄 Calling OpenAI API for summary...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ 
          role: "system",
          content: "You provide interview analysis in JSON format only."
        }, {
          role: "user", 
          content: prompt 
        }],
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('✅ Received summary from OpenAI');
      
      const summary = cleanAndParseJSON(content);
      
      // Validate structure
      if (!summary.overallAssessment || !Array.isArray(summary.keyStrengths) ||
          !Array.isArray(summary.areasForImprovement) || !Array.isArray(summary.recommendations)) {
        throw new Error('Invalid summary format from OpenAI');
      }
      
      console.log('✅ Summary generated successfully');
      return summary;
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error generating summary:', error);
      throw new Error(`Failed to generate interview summary: ${error.message}`);
    }
  }
}