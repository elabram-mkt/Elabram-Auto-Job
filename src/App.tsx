import React, { useState, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  ListChecks, 
  Loader2, 
  Copy, 
  CheckCircle2, 
  Globe,
  Sparkles,
  Pencil,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';

interface JobDetails {
  jobTitle: string;
  jobLocation: string;
  jobDescription: string;
  jobRequirements: string[];
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [customEmail, setCustomEmail] = useState('recruitment@elabram.com');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setJobDetails(null);

    try {
      const response = await fetch('/api/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate job listing.');
      }

      setJobDetails(data.data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!jobDetails) return;
    
    const textToCopy = `
Job Title: ${jobDetails.jobTitle}
Location: ${jobDetails.jobLocation}

Job Description:
${jobDetails.jobDescription}

Requirements:
${jobDetails.jobRequirements.map(req => `- ${req}`).join('\n')}

Submit Your CV and Resume to ${customEmail}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    try {
      setDownloadingPoster(true);
      const dataUrl = await htmlToImage.toPng(posterRef.current, { 
        quality: 0.95,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          boxShadow: 'none',
        }
      });
      download(dataUrl, `job-vacancy-${jobDetails?.jobTitle.toLowerCase().replace(/\s+/g, '-')}.png`);
    } catch (err) {
      setError('Failed to generate poster format.');
    } finally {
      setDownloadingPoster(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">
              VacancyAI
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500 hidden sm:block">
            Professional Job Listings in Seconds
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Transform URLs into <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
              Perfect Job Specs
            </span>
          </h2>
          <p className="text-lg text-slate-600">
            Paste any company career page or job listing URL below. Our AI will scrape, parse, and format it into a clean, professional vacancy document.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="max-w-3xl mx-auto mb-16 relative">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="url"
                required
                placeholder="https://company.com/careers/software-engineer..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="block w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-2xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Extracting...
                </>
              ) : (
                'Generate Listing'
              )}
            </button>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-red-600 bg-red-50 py-2 px-4 rounded-lg inline-block"
            >
              {error}
            </motion.p>
          )}
        </form>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {jobDetails && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 px-2">
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4 text-slate-400" />
                      Copy Listing
                    </>
                  )}
                </button>
                <button
                  onClick={downloadPoster}
                  disabled={downloadingPoster}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-indigo-600 border border-transparent hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingPoster ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4 text-indigo-200" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4 text-indigo-100" />
                      Download Poster
                    </>
                  )}
                </button>
              </div>

              {/* Poster Canvas */}
              <div 
                ref={posterRef}
                className="relative bg-[#1e2043] rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px] z-0"
              >
                {/* Template Background Image */}
                <div 
                  className="absolute inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: 'url("/template.png")',
                  }}
                />

                <div className="relative z-10 flex flex-col p-8 sm:px-12 pt-40 border-b border-white/10">
                  <h3 className="text-3xl sm:text-5xl font-extrabold text-white flex items-center gap-4">
                    <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-orange-400" />
                    {jobDetails.jobTitle}
                  </h3>
                  <div className="mt-5 flex items-center text-indigo-100 gap-3 font-medium text-lg">
                    <MapPin className="w-6 h-6 text-orange-400" />
                    {jobDetails.jobLocation}
                  </div>
                </div>

              <div className="relative z-10 p-8 sm:p-12 space-y-12">
                <section>
                  <h4 className="flex items-center text-xl font-semibold text-white mb-5 border-b border-white/10 pb-3">
                    <Building2 className="w-6 h-6 mr-3 text-orange-400" />
                    Job Description
                  </h4>
                  <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-indigo-100/90 leading-relaxed">
                    <Markdown>{jobDetails.jobDescription}</Markdown>
                  </div>
                </section>

                <section>
                  <h4 className="flex items-center text-xl font-semibold text-white mb-5 border-b border-white/10 pb-3">
                    <ListChecks className="w-6 h-6 mr-3 text-orange-400" />
                    Key Requirements
                  </h4>
                  <ul className="space-y-4">
                    {jobDetails.jobRequirements.map((req, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 className="h-6 w-6 text-orange-400" />
                        </div>
                        <p className="ml-4 text-indigo-100/90 leading-relaxed font-medium">
                          {req}
                        </p>
                      </motion.li>
                    ))}
                  </ul>
                </section>

                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-6 backdrop-blur-sm">
                  <div className="flex-1 w-full">
                    <h4 className="text-xl font-semibold text-white mb-2">
                      Ready to Apply?
                    </h4>
                    {isEditingEmail ? (
                      <div className="flex items-center gap-2 mt-3 w-full sm:max-w-md">
                        <input
                          type="email"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="flex-1 px-4 py-2 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white/10 text-white placeholder-indigo-200"
                          autoFocus
                          onBlur={() => setIsEditingEmail(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingEmail(false);
                          }}
                        />
                        <button
                          onClick={() => setIsEditingEmail(false)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center sm:justify-start gap-3 group mt-3">
                        <p className="text-indigo-100 font-medium text-lg">
                          Submit Your CV and Resume to <br className="sm:hidden" /><a href={`mailto:${customEmail}`} className="font-bold text-orange-400 underline hover:text-orange-300 transition-colors ml-1">{customEmail}</a>
                        </p>
                        <button
                          onClick={() => setIsEditingEmail(true)}
                          className="p-2 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Edit email"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="animate-pulse bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                  <div className="space-y-3 flex-1">
                    <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-4 mb-10">
                  <div className="h-4 bg-slate-200 rounded-md w-full"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-4/6"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-5 bg-slate-200 rounded-md w-1/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

