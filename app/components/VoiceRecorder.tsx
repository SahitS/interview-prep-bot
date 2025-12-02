'use client';

import { useState, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { useSpeechRecognition } from '@/app/hooks/UseSpeechRecognition';

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  onRecordingComplete: (transcript: string, duration: number) => void;
  isActive: boolean;
}

export function VoiceRecorder({ onTranscriptChange, onRecordingComplete, isActive }: VoiceRecorderProps) {
  const { transcript, isListening, startListening, stopListening, resetTranscript, isSupported, error } = useSpeechRecognition();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening && startTime) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isListening, startTime]);

  const handleStart = () => {
    resetTranscript();
    setStartTime(Date.now());
    setDuration(0);
    startListening();
  };

  const handleStop = () => {
    stopListening();
    const finalDuration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    onRecordingComplete(transcript, finalDuration);
    setStartTime(null);
  };

  if (!isSupported) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600 font-medium">Speech recognition is not supported in your browser.</p>
        <p className="text-red-500 text-sm mt-2">Please use Chrome, Edge, or Safari for the best experience.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <button onClick={isListening ? handleStop : handleStart} disabled={!isActive} className={`relative p-8 rounded-full transition-all duration-300 shadow-lg ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary-600 hover:bg-primary-700'} ${!isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} disabled:opacity-50 disabled:cursor-not-allowed`}>
        {isListening ? <Square size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
      </button>

      <div className="text-center min-h-[60px]">
        {isListening && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Recording...</p>
            <p className="text-3xl font-bold text-primary-600">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</p>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {transcript && (
        <div className="w-full max-w-2xl p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-medium">Live Transcript:</p>
          <p className="text-sm text-gray-800 leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}