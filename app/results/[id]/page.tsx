'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Award, TrendingUp, AlertCircle, Home, Loader2, BarChart3 } from 'lucide-react';
import type { InterviewWithQuestions } from '@/app/lib/types';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<InterviewWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch(`/api/interviews?id=${interviewId}`);
        const data = await response.json();
        setInterview(data.interview);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const answeredQuestions = data.interview.questions.filter((q: any) => q.answer);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const avgScore = answeredQuestions.reduce((sum: number, q: any) => sum + (q.answer.score || 0), 0) / answeredQuestions.length;
        
        await fetch(`/api/interviews?id=${interviewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', totalScore: avgScore }),
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load results:', error);
        setLoading(false);
      }
    }
    loadResults();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
          <p className="text-xl text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Failed to load results</p>
        </div>
      </div>
    );
  }

  const answeredQuestions = interview.questions.filter(q => q.answer);
  const avgScore = answeredQuestions.reduce((sum, q) => sum + (q.answer?.score || 0), 0) / answeredQuestions.length;
  
  const categoryScores = {
    technical: 0,
    behavioral: 0,
    system_design: 0,
  };
  const categoryCounts = {
    technical: 0,
    behavioral: 0,
    system_design: 0,
  };

  answeredQuestions.forEach(q => {
    if (q.answer && q.category in categoryScores) {
      categoryScores[q.category as keyof typeof categoryScores] += q.answer.score || 0;
      categoryCounts[q.category as keyof typeof categoryCounts]++;
    }
  });

  const categoryAverages = {
    technical: categoryCounts.technical > 0 ? categoryScores.technical / categoryCounts.technical : 0,
    behavioral: categoryCounts.behavioral > 0 ? categoryScores.behavioral / categoryCounts.behavioral : 0,
    system_design: categoryCounts.system_design > 0 ? categoryScores.system_design / categoryCounts.system_design : 0,
  };

  const allStrengths = answeredQuestions.flatMap(q => q.answer?.strengths || []);
  const allImprovements = answeredQuestions.flatMap(q => q.answer?.improvements || []);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-50 border-green-200';
    if (score >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Award className="text-primary-600 mx-auto mb-4" size={64} />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
          <p className="text-xl text-gray-600">Here&apos;s how you performed</p>
        </div>

        <div className={`card mb-8 border-2 ${getScoreBg(avgScore)}`}>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600 mb-2">Overall Score</p>
            <p className={`text-7xl font-bold ${getScoreColor(avgScore)} mb-4`}>{avgScore.toFixed(1)}</p>
            <p className="text-gray-500">out of 10</p>
            <div className="w-full max-w-md mx-auto mt-6 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${avgScore >= 8 ? 'bg-green-500' : avgScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(avgScore / 10) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-blue-50 border border-blue-200">
            <BarChart3 className="text-blue-600 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Technical</h3>
            <p className={`text-3xl font-bold ${getScoreColor(categoryAverages.technical)}`}>{categoryAverages.technical.toFixed(1)}/10</p>
            <p className="text-sm text-gray-600 mt-1">{categoryCounts.technical} questions</p>
          </div>

          <div className="card bg-purple-50 border border-purple-200">
            <BarChart3 className="text-purple-600 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Behavioral</h3>
            <p className={`text-3xl font-bold ${getScoreColor(categoryAverages.behavioral)}`}>{categoryAverages.behavioral.toFixed(1)}/10</p>
            <p className="text-sm text-gray-600 mt-1">{categoryCounts.behavioral} questions</p>
          </div>

          <div className="card bg-green-50 border border-green-200">
            <BarChart3 className="text-green-600 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">System Design</h3>
            <p className={`text-3xl font-bold ${getScoreColor(categoryAverages.system_design)}`}>{categoryAverages.system_design.toFixed(1)}/10</p>
            <p className="text-sm text-gray-600 mt-1">{categoryCounts.system_design} questions</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-green-50 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-green-600" size={28} />
              <h2 className="text-xl font-bold text-gray-900">Key Strengths</h2>
            </div>
            <ul className="space-y-2">
              {allStrengths.slice(0, 5).map((strength, index) => (
                <li key={index} className="text-gray-700 leading-relaxed">• {strength}</li>
              ))}
            </ul>
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-blue-600" size={28} />
              <h2 className="text-xl font-bold text-gray-900">Areas to Improve</h2>
            </div>
            <ul className="space-y-2">
              {allImprovements.slice(0, 5).map((improvement, index) => (
                <li key={index} className="text-gray-700 leading-relaxed">• {improvement}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Question-by-Question Breakdown</h2>
          <div className="space-y-4">
            {answeredQuestions.map((question, index) => (
              <div key={question.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">Q{index + 1}: {question.question_text}</h3>
                  <span className={`text-2xl font-bold ${getScoreColor(question.answer?.score || 0)} ml-4`}>{question.answer?.score?.toFixed(1)}</span>
                </div>
                <div className="flex gap-2 text-xs mt-2">
                  <span className="px-2 py-1 bg-white rounded border">{question.category}</span>
                  <span className="px-2 py-1 bg-white rounded border">Difficulty: {question.difficulty}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button onClick={() => router.push('/')} className="btn-primary flex items-center gap-2">
            <Home size={20} />
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}