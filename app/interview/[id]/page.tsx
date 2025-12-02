'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { QuestionCard } from '@/components/QuestionCard';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { useSpeechSynthesis } from '@/app/hooks/UseSpeechSynthesis';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import type { Question, AnswerEvaluation } from '@/app/lib/types';

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<AnswerEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { speak, cancel, isSpeaking } = useSpeechSynthesis();
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    async function loadInterview() {
      try {
        const response = await fetch(`/api/interviews?id=${interviewId}`);
        const data = await response.json();
        setQuestions(data.interview.questions || []);
        setLoading(false);

        if (data.interview.questions?.[0]) {
          setTimeout(() => speak(data.interview.questions[0].question_text), 1000);
        }
      } catch (error) {
        console.error('Failed to load interview:', error);
        setLoading(false);
      }
    }
    loadInterview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const handleRecordingComplete = async (finalTranscript: string, duration: number) => {
    if (!finalTranscript.trim()) {
      alert('Please provide an answer before continuing.');
      return;
    }

    setIsEvaluating(true);
    cancel();

    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQuestion.id, answerText: finalTranscript, durationSeconds: duration }),
      });

      const data = await response.json();
      setCurrentFeedback(data.evaluation);
      setShowFeedback(true);
      setTimeout(() => speak(`Your score is ${data.evaluation.score.toFixed(1)} out of 10. ${data.evaluation.improvements[0]}`), 500);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      alert('Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    cancel();
    setShowFeedback(false);
    setCurrentFeedback(null);
    setTranscript('');

    if (isLastQuestion) {
      router.push(`/results/${interviewId}`);
    } else {
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => {
        if (questions[currentIndex + 1]) {
          speak(questions[currentIndex + 1].question_text);
        }
      }, 500);
    }
  };

  const handleSpeakQuestion = () => {
    if (currentQuestion) {
      speak(currentQuestion.question_text);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
          <p className="text-xl text-gray-600">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">No questions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Interview in Progress</h1>
            <span className="text-sm font-medium text-gray-600">Question {currentIndex + 1} of {questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-600 h-full rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
          </div>
        </div>

        <QuestionCard question={currentQuestion.question_text} category={currentQuestion.category} difficulty={currentQuestion.difficulty} questionNumber={currentIndex + 1} totalQuestions={questions.length} onSpeak={handleSpeakQuestion} />

        <div className="mt-8">
          {!showFeedback ? (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Record Your Answer</h3>
              {isEvaluating ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
                  <p className="text-lg text-gray-600">Evaluating your answer...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                </div>
              ) : (
                <VoiceRecorder onTranscriptChange={setTranscript} onRecordingComplete={handleRecordingComplete} isActive={!isEvaluating} />
              )}
            </div>
          ) : (
            <div>
              {currentFeedback && <FeedbackDisplay score={currentFeedback.score} strengths={currentFeedback.strengths} improvements={currentFeedback.improvements} followUp={currentFeedback.followUp} />}
              <div className="mt-6 flex justify-end">
                <button onClick={handleNextQuestion} className="btn-primary flex items-center gap-2">
                  {isLastQuestion ? (
                    <>
                      <CheckCircle size={20} />
                      Complete Interview
                    </>
                  ) : (
                    <>
                      Next Question
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}