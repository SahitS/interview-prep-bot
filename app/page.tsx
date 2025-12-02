/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResumeUpload } from '@/components/ResumeUpload';
import { Briefcase, Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateInterview = async () => {
    console.log('🚀 Starting interview creation...');
    
    if (!resumeText || !jobTitle || !jobDescription) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Generate a valid UUID for the user
      // Option 1: Use crypto.randomUUID() (modern browsers)
      const userId = crypto.randomUUID();
      
      console.log('📤 Sending request to /api/interviews');
      console.log('   - User ID (UUID):', userId);
      console.log('   - Resume length:', resumeText.length);
      console.log('   - Job title:', jobTitle);

      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,  // ✅ Now sending a valid UUID
          jobTitle, 
          company, 
          jobDescription, 
          resumeText 
        }),
      });

      console.log('📥 Response received:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to create interview';
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          console.error('❌ API Error Response:', errorData);
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || errorData.message || '';
        } catch (parseError) {
          const errorText = await response.text();
          console.error('❌ API Error (raw text):', errorText);
          errorDetails = errorText;
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }

      const data = await response.json();
      console.log('✅ Interview created successfully:', data.interview?.id);
      
      if (!data.interview?.id) {
        throw new Error('Interview created but no ID returned');
      }

      router.push(`/interview/${data.interview.id}`);
      
    } catch (err: any) {
      console.error('❌ Error in handleCreateInterview:', err);
      setError(err.message || 'Failed to create interview. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Briefcase className="text-primary-600" size={48} />
            <h1 className="text-5xl font-bold text-gray-900">AI Interview Prep</h1>
          </div>
          <p className="text-xl text-gray-600">Practice interviews with AI-powered feedback and improve your skills</p>
        </div>

        <div className="card space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Your Interview</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Your Resume *</label>
                <ResumeUpload onResumeText={setResumeText} isProcessing={isCreating} />
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input 
                  id="jobTitle" 
                  type="text" 
                  value={jobTitle} 
                  onChange={(e) => setJobTitle(e.target.value)} 
                  placeholder="e.g., Senior Software Engineer" 
                  className="input" 
                  disabled={isCreating} 
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                <input 
                  id="company" 
                  type="text" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)} 
                  placeholder="e.g., Google, Microsoft" 
                  className="input" 
                  disabled={isCreating} 
                />
              </div>

              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                <textarea 
                  id="jobDescription" 
                  value={jobDescription} 
                  onChange={(e) => setJobDescription(e.target.value)} 
                  placeholder="Paste the job description here..." 
                  rows={8} 
                  className="input resize-none" 
                  disabled={isCreating} 
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          <button 
            onClick={handleCreateInterview} 
            disabled={isCreating || !resumeText || !jobTitle || !jobDescription} 
            className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Generating Questions...
              </>
            ) : (
              <>Start Interview</>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center">
            This will generate 10 personalized questions based on your resume and the job requirements.
          </p>
        </div>
      </div>
    </div>
  );
}