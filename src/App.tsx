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
  Download,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const posterRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          setScale(1);
          setOffsetX(0);
          setOffsetY(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
                <input 
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                >
                  <ImageIcon className="mr-2 h-4 w-4 text-slate-400" />
                  Upload Image
                </button>
                {imageUrl && (
                  <button
                    onClick={() => {
                      setImageUrl(null);
                      setScale(1);
                      setOffsetX(0);
                      setOffsetY(0);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 hover:text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition shadow-sm"
                  >
                    Remove Image
                  </button>
                )}
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

              {/* Image Adjustment Panel */}
              {imageUrl && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                        <Move className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">Adjust Uploaded Image</h4>
                        <p className="text-xs text-slate-500">Fine-tune your image position and scale inside the circular design frame</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setScale(1);
                        setOffsetX(0);
                        setOffsetY(0);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Position
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                    {/* Size Control */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                          Size / Zoom
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {Math.round(scale * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setScale(s => Math.max(0.1, Number((s - 0.1).toFixed(2))))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-sm font-semibold shadow-sm"
                          title="Zoom Out"
                        >
                          -
                        </button>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="3" 
                          step="0.05"
                          value={scale} 
                          onChange={(e) => setScale(parseFloat(e.target.value))} 
                          className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-slate-200 focus:outline-none"
                        />
                        <button 
                          onClick={() => setScale(s => Math.min(3, Number((s + 0.1).toFixed(2))))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-sm font-semibold shadow-sm"
                          title="Zoom In"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Move Control */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <Move className="w-3.5 h-3.5 text-slate-400" />
                          Horizontal Position
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {offsetX}px
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setOffsetX(x => Math.max(-150, x - 5))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-sm font-semibold shadow-sm"
                          title="Move Left"
                        >
                          ←
                        </button>
                        <input 
                          type="range" 
                          min="-150" 
                          max="150" 
                          step="1"
                          value={offsetX} 
                          onChange={(e) => setOffsetX(parseInt(e.target.value))} 
                          className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-slate-200 focus:outline-none"
                        />
                        <button 
                          onClick={() => setOffsetX(x => Math.min(150, x + 5))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-sm font-semibold shadow-sm"
                          title="Move Right"
                        >
                          →
                        </button>
                      </div>
                    </div>

                    {/* Vertical Move Control */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <Move className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                          Vertical Position
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {offsetY}px
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setOffsetY(y => Math.max(-150, y - 5))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-sm font-semibold shadow-sm"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <input 
                          type="range" 
                          min="-150" 
                          max="150" 
                          step="1"
                          value={offsetY} 
                          onChange={(e) => setOffsetY(parseInt(e.target.value))} 
                          className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-slate-200 focus:outline-none"
                        />
                        <button 
                          onClick={() => setOffsetY(y => Math.min(150, y + 5))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-sm font-semibold shadow-sm"
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

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

                {/* Top-Left Circular Design */}
                <div className="absolute -top-20 -left-20 w-72 h-72 sm:w-96 sm:h-96 select-none z-0 pointer-events-none">
                  {/* Yellow crescent shape on bottom-left */}
                  <div className="absolute inset-0 bg-[#fce01a] rounded-full transform translate-x-[-15px] translate-y-[15px] opacity-90"></div>
                  {/* Orange crescent shape on top-right */}
                  <div className="absolute inset-0 bg-[#f05323] rounded-full transform translate-x-[18px] translate-y-[-18px] opacity-95"></div>
                  {/* Main White Circle */}
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="absolute inset-[10px] bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto cursor-pointer group overflow-hidden"
                    title="Click to upload image"
                  >
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt="Uploaded Space/Image" 
                        className="w-full h-full object-cover pointer-events-none transition-transform duration-75 ease-out" 
                        referrerPolicy="no-referrer"
                        style={{
                          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                        }}
                      />
                    ) : (
                      <div className="text-center p-4 flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white relative group-hover:from-indigo-950 group-hover:via-slate-900 group-hover:to-slate-950 transition-all duration-500">
                        {/* Star particles */}
                        <div className="absolute top-4 left-6 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" />
                        <div className="absolute top-10 right-8 w-1.5 h-1.5 bg-indigo-300 rounded-full opacity-40 animate-ping" />
                        <div className="absolute bottom-6 left-10 w-0.5 h-0.5 bg-white rounded-full opacity-80" />
                        <div className="absolute bottom-8 right-6 w-1 h-1 bg-violet-400 rounded-full opacity-50 animate-pulse" />
                        
                        <div className="relative z-10">
                          <ImageIcon className="w-8 h-8 text-indigo-300 mx-auto mb-1.5 group-hover:text-white transition-all group-hover:scale-110 duration-300" />
                          <span className="text-[11px] text-indigo-200 font-extrabold tracking-widest uppercase select-none block group-hover:text-white transition-colors">
                            Image Space
                          </span>
                          <span className="text-[8px] text-indigo-300/70 font-medium tracking-normal select-none block mt-0.5">
                            Click to Upload
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-end p-8 sm:px-12 pt-40 border-b border-white/10 text-right">
                  <h3 className="text-3xl sm:text-5xl font-extrabold text-[#f9ed1f] w-[350px]">
                    {jobDetails.jobTitle}
                  </h3>
                  <div className="mt-5 flex items-center justify-end text-indigo-100 gap-3 font-medium text-lg">
                    <MapPin className="w-6 h-6 text-orange-400" />
                    {jobDetails.jobLocation}
                  </div>
                </div>

              <div className="relative z-10 p-8 sm:p-12 space-y-12">
                <section>
                  <h4 className="flex items-center text-xl font-semibold text-[#f9ed1f] mb-5 border-b border-white/10 pb-3">
                    <Building2 className="w-6 h-6 mr-3 text-orange-400" />
                    Job Description
                  </h4>
                  <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-indigo-100/90 leading-relaxed">
                    <Markdown>{jobDetails.jobDescription}</Markdown>
                  </div>
                </section>

                <section>
                  <h4 className="flex items-center text-xl font-semibold text-[#f9ed1f] mb-5 border-b border-white/10 pb-3">
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

