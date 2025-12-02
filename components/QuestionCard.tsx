'use client';

import { Volume2 } from 'lucide-react';

interface QuestionCardProps {
  question: string;
  category: string;
  difficulty: number;
  questionNumber: number;
  totalQuestions: number;
  onSpeak?: () => void;
}

export function QuestionCard({ question, category, difficulty, questionNumber, totalQuestions, onSpeak }: QuestionCardProps) {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-purple-100 text-purple-800';
      case 'system_design': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyStars = (diff: number) => {
    return '★'.repeat(diff) + '☆'.repeat(5 - diff);
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-500">Question {questionNumber} of {totalQuestions}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>{category.replace('_', ' ').toUpperCase()}</span>
            <span className="text-yellow-500 text-sm" title={`Difficulty: ${difficulty}/5`}>{getDifficultyStars(difficulty)}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">{question}</h2>
        </div>
        {onSpeak && (
          <button onClick={onSpeak} className="p-3 hover:bg-gray-100 rounded-full transition-colors ml-4 flex-shrink-0" title="Listen to question">
            <Volume2 size={24} className="text-primary-600" />
          </button>
        )}
      </div>
    </div>
  );
}