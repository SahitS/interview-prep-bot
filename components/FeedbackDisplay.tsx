'use client';

import { CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';

interface FeedbackDisplayProps {
  score: number;
  strengths: string[];
  improvements: string[];
  followUp: string;
}

export function FeedbackDisplay({ score, strengths, improvements, followUp }: FeedbackDisplayProps) {
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
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border-2 ${getScoreBg(score)}`}>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Your Score</p>
            <p className={`text-5xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</p>
            <p className="text-sm text-gray-500">out of 10</p>
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(score / 10) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-green-50 border border-green-200">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">What You Did Well</h3>
        </div>
        <ul className="space-y-2 ml-9">
          {strengths.map((strength, index) => (
            <li key={index} className="text-gray-700 leading-relaxed">• {strength}</li>
          ))}
        </ul>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
        </div>
        <ul className="space-y-2 ml-9">
          {improvements.map((improvement, index) => (
            <li key={index} className="text-gray-700 leading-relaxed">• {improvement}</li>
          ))}
        </ul>
      </div>

      {followUp && (
        <div className="card bg-purple-50 border border-purple-200">
          <div className="flex items-start gap-3">
            <MessageCircle className="text-purple-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Follow-up Question</h3>
              <p className="text-gray-700 leading-relaxed italic">&quot;{followUp}&quot;</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}