// 'use client';

// import { useState } from 'react';
// import { Upload, FileText, X, Loader2 } from 'lucide-react';

// interface ResumeUploadProps {
//   onResumeText: (text: string) => void;
//   isProcessing: boolean;
// }

// export function ResumeUpload({ onResumeText, isProcessing }: ResumeUploadProps) {
//   const [fileName, setFileName] = useState<string>('');
//   const [isDragging, setIsDragging] = useState(false);
//   const [error, setError] = useState<string>('');

//   const handleFile = async (file: File) => {
//     if (file.type !== 'application/pdf') {
//       setError('Please upload a PDF file');
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       setError('File size must be less than 10MB');
//       return;
//     }

//     setError('');
//     setFileName(file.name);

//     try {
//       const formData = new FormData();
//       formData.append('resume', file);

//       const response = await fetch('/api/parse-resume', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error('Failed to parse resume');
//       }

//       const data = await response.json();
//       onResumeText(data.text);
      
//     } catch (err) {
//       console.error('Error parsing resume:', err);
//       setError('Failed to parse resume. Please try again.');
//       setFileName('');
//     }
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);

//     const file = e.dataTransfer.files[0];
//     if (file) {
//       handleFile(file);
//     }
//   };

//   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       handleFile(file);
//     }
//   };

//   const clearFile = () => {
//     setFileName('');
//     onResumeText('');
//     setError('');
//   };

//   return (
//     <div className="w-full">
//       {!fileName ? (
//         <div
//           onDrop={handleDrop}
//           onDragOver={(e) => {
//             e.preventDefault();
//             setIsDragging(true);
//           }}
//           onDragLeave={() => setIsDragging(false)}
//           className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
//         >
//           <input type="file" accept=".pdf" onChange={handleFileInput} className="hidden" id="resume-upload" disabled={isProcessing} />
//           <label htmlFor="resume-upload" className="cursor-pointer">
//             <Upload className="mx-auto mb-4 text-gray-400" size={48} />
//             <p className="text-lg font-medium text-gray-700 mb-2">Drop your resume here or click to browse</p>
//             <p className="text-sm text-gray-500">PDF format only • Max 10MB</p>
//           </label>
//         </div>
//       ) : (
//         <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
//           <div className="flex items-center gap-3">
//             <FileText className="text-green-600" size={24} />
//             <div>
//               <p className="font-medium text-gray-900">{fileName}</p>
//               <p className="text-sm text-gray-600">Resume uploaded successfully</p>
//             </div>
//           </div>
//           {!isProcessing && (
//             <button onClick={clearFile} className="p-2 hover:bg-green-100 rounded-full transition-colors">
//               <X size={20} className="text-gray-600" />
//             </button>
//           )}
//         </div>
//       )}
//       {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
//     </div>
//   );
// }



'use client';

import { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FileText, X, AlertCircle, Check } from 'lucide-react';

interface ResumeUploadProps {
  onResumeText: (text: string) => void;
  isProcessing: boolean;
}

export function ResumeUpload({ onResumeText, isProcessing }: ResumeUploadProps) {
  const [resumeText, setResumeText] = useState('');
  const [error, setError] = useState<string>('');
  const [isValidated, setIsValidated] = useState(false);

  const handleValidate = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text');
      return;
    }

    if (resumeText.trim().length < 50) {
      setError('Resume is too short. Please enter at least 50 characters.');
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Validation failed');
      }

      const data = await response.json();
      onResumeText(data.text);
      setIsValidated(true);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Validation error:', err);
      setError(err.message || 'Failed to validate resume');
    }
  };

  const handleClear = () => {
    setResumeText('');
    setIsValidated(false);
    setError('');
    onResumeText('');
  };

  const useSampleData = () => {
    const sampleResume = `JOHN SMITH
Full Stack Software Engineer
john.smith@email.com | +1-234-567-8900 | LinkedIn: linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Software engineer with 5 years of experience building scalable web applications using React, Node.js, and cloud technologies. Passionate about clean code, system design, and delivering user-centric solutions.

TECHNICAL SKILLS
- Languages: JavaScript, TypeScript, Python, Java, SQL
- Frontend: React, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express, Django, REST APIs, GraphQL
- Databases: PostgreSQL, MongoDB, Redis, MySQL
- Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD
- Tools: Git, Jest, Webpack, Postman, Jira

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
- Led development of microservices architecture serving 100K+ daily active users
- Implemented real-time features using WebSockets and Redis, reducing latency by 40%
- Mentored 5 junior developers and conducted code reviews
- Collaborated with product team to design and launch 3 major features

Software Engineer | StartupXYZ | Jun 2019 - Dec 2020
- Built responsive web applications using React and Node.js
- Designed and implemented RESTful APIs handling 10M+ requests per day
- Optimized database queries reducing load times by 60%
- Integrated third-party payment systems (Stripe, PayPal)

EDUCATION
Bachelor of Science in Computer Science | State University | 2015-2019
GPA: 3.8/4.0

PROJECTS
- E-commerce Platform: Built full-stack marketplace with React, Node.js, and PostgreSQL
- AI Chat Application: Developed real-time chat with OpenAI integration
- Task Management System: Created Trello-like app with drag-and-drop features

CERTIFICATIONS
- AWS Certified Developer - Associate
- MongoDB Certified Developer`;

    setResumeText(sampleResume);
  };

  return (
    <div className="w-full">
      {!isValidated ? (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                setError('');
              }}
              placeholder="Paste your resume content here...

Include:
- Contact information
- Technical skills
- Work experience
- Education
- Projects (optional)"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
              disabled={isProcessing}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {resumeText.length} characters
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={useSampleData}
              className="text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Use sample resume
            </button>
            {resumeText && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleValidate}
            disabled={!resumeText.trim() || isProcessing}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Validate Resume
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Check className="text-green-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">Resume validated successfully</p>
              <p className="text-sm text-gray-600">{resumeText.length} characters</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={handleClear}
              className="p-2 hover:bg-green-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}