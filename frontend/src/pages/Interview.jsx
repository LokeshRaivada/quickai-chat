import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Target, UploadCloud, Briefcase, FileText, CheckCircle2, AlertTriangle, AlertCircle, Video, ExternalLink, TrendingUp, Search, GraduationCap } from 'lucide-react';

const Interview = () => {
  const [company, setCompany] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  const handleGenerate = async () => {
    // We allow generation without company for generic review per user instructions
    setLoading(true);
    setRoadmap(null);
    const loadingToast = toast.loading("Executing advanced analysis...");

    const formData = new FormData();
    formData.append('company', company || "General Industry");
    if (file) formData.append('resume', file);
    formData.append('user_email', JSON.parse(localStorage.getItem('user'))?.email);
    formData.append('language', localStorage.getItem('language') || 'English');

    try {
      const response = await axios.post('http://localhost:8000/interview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRoadmap(response.data.roadmap);
      toast.success("Analysis Complete!", { id: loadingToast });
    } catch (error) {
      toast.error("AI Engine Offline", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score > 75) return '#34D399'; // Emerald
    if (score >= 50) return '#FBBF24'; // Amber
    return '#F87171'; // Red
  };

  const getScoreTextColor = (score) => {
    if (score > 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-32">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 font-poppins">
           <Target size={12} /> Target Locked
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter">
          Interview <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-teal-500 text-glow">Coach</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
          Upload your resume and enter your target tech company to receive a hyper-personalized execution strategy.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 border-0 bg-[#0F172A] shadow-2xl h-full flex flex-col justify-between group overflow-hidden">
           <div className="absolute top-0 right-0 p-6 text-emerald-500/5 group-hover:scale-110 group-hover:text-emerald-500/10 transition-all duration-700 pointer-events-none">
              <Briefcase size={120} strokeWidth={1} />
           </div>
           <div className="space-y-4 relative z-10">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Target size={14} className="text-emerald-400" />
                Target Company (Optional)
              </label>
              <input
                className="w-full px-6 py-4 bg-[#1E293B] border border-white/5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-white font-medium placeholder:text-slate-600 transition-all text-lg"
                placeholder="e.g. Google, Amazon, TCS..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
           </div>
           
           <div className="mt-8 relative z-10">
              <Button
                 loading={loading}
                 onClick={handleGenerate}
                 className="w-full h-14 bg-linear-to-r from-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border-0 text-lg uppercase tracking-widest font-black"
               >
                 {loading ? "Analyzing Profile..." : "Execute Analysis"}
               </Button>
           </div>
        </Card>

        <Card className="p-8 border-0 bg-[#0F172A] shadow-2xl flex flex-col items-center justify-center text-center group cursor-pointer border-dashed hover:border-emerald-500/50 transition-all relative overflow-hidden" 
              onClick={() => document.getElementById('resume-upload').click()}>
           <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <input 
             id="resume-upload" 
             type="file" 
             accept=".pdf,.docx,.txt" 
             className="hidden" 
             onChange={(e) => setFile(e.target.files[0])} 
           />
           <div className={`p-6 rounded-full border-2 border-dashed mb-4 transition-all duration-500 relative z-10 ${file ? 'border-emerald-500 bg-emerald-500/10 scale-110 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-slate-600 bg-[#1E293B]'}`}>
              {file ? <FileText size={40} className="text-emerald-400" /> : <UploadCloud size={40} className="text-slate-400 group-hover:text-emerald-400 group-hover:-translate-y-2 transition-transform" />}
           </div>
           <h3 className={`font-bold text-lg relative z-10 font-poppins ${file ? 'text-emerald-400' : 'text-white'}`}>{file ? file.name : 'Upload Detailed Resume'}</h3>
           <p className="text-sm text-slate-500 mt-2 font-medium relative z-10">
              {file ? 'File staged for AI processing.' : 'Drag & drop or browse. PDF, DOCX, TXT.'}
           </p>
           {file && (
              <div className="mt-4 inline-flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-4 py-1.5 rounded-full relative z-10 animate-fade-in">
                 <CheckCircle2 size={16} /> Attached Successfully
              </div>
           )}
        </Card>
      </div>

      {roadmap && typeof roadmap === 'object' && (
         <div className="space-y-8 animate-slide-up mt-16 pb-12">
            
            {/* Row 1: ATS & Section Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               
               <Card className="p-8 border-0 bg-[#0F172A] shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className={`absolute inset-0 opacity-5 ${roadmap.ats_score > 75 ? 'bg-emerald-500' : roadmap.ats_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                  <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6 relative z-10">ATS Screen Score</h3>
                  <div className="relative w-40 h-40 flex items-center justify-center relative z-10">
                     <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#1E293B" strokeWidth="10" />
                        <circle 
                           cx="50" cy="50" r="45" fill="none" 
                           stroke={getScoreColor(roadmap.ats_score)} 
                           strokeWidth="10" 
                           strokeDasharray="282.7" 
                           strokeDashoffset={282.7 - (282.7 * roadmap.ats_score) / 100} 
                           strokeLinecap="round" 
                           className="transition-all duration-1000" 
                        />
                     </svg>
                     <div className="absolute flex flex-col items-center">
                        <span className={`text-4xl font-black ${getScoreTextColor(roadmap.ats_score)}`}>{roadmap.ats_score}</span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">/ 100</span>
                     </div>
                  </div>
                  <p className="mt-6 text-sm text-slate-400 font-medium relative z-10">{roadmap.ats_explanation}</p>
               </Card>

               <Card className="p-8 border-0 bg-[#0F172A] shadow-xl md:col-span-2">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Target size={20} className="text-emerald-400"/> Resume Health Report</h3>
                  <div className="space-y-6">
                     <div>
                        <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2 mb-3"><AlertTriangle size={14} /> Missing Sections</h4>
                        <div className="flex flex-wrap gap-2">
                           {roadmap.missing_sections?.length > 0 ? roadmap.missing_sections.map((sec, i) => (
                              <span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-sm font-medium">{sec}</span>
                           )) : <span className="text-slate-500 text-sm italic">All standard sections exist!</span>}
                        </div>
                     </div>
                     <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-3"><AlertCircle size={14} /> Critical Improvements</h4>
                        <ul className="space-y-2">
                           {roadmap.improvements?.map((imp, i) => (
                              <li key={i} className="flex gap-3 text-sm text-slate-300 items-start">
                                 <span className="text-amber-500 mt-0.5">•</span> {imp}
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>
               </Card>
            </div>

            {/* Row 2: Company Intelligence & Industry Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {company && (
                 <Card className="p-8 border-0 bg-linear-to-br from-[#0F172A] to-[#1E293B]/30 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Search size={20} className="text-indigo-400"/> Company Analysis: {company}</h3>
                    <div className="space-y-4">
                       <div>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Required Core Skills</p>
                          <div className="flex flex-wrap gap-2">
                             {roadmap.company_analysis?.required_skills?.map((s, i) => (
                                <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold">{s}</span>
                             ))}
                          </div>
                       </div>
                       <div className="pt-4 border-t border-white/5">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">You Are Missing</p>
                          <div className="flex flex-wrap gap-2">
                             {roadmap.company_analysis?.missing_skills?.map((s, i) => (
                                <span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-xs font-bold">{s}</span>
                             ))}
                          </div>
                      </div>
                      <p className="text-sm text-slate-400 mt-4 bg-black/20 p-4 rounded-xl border border-white/5">{roadmap.company_analysis?.suggestions}</p>
                    </div>
                 </Card>
               )}
               
               <Card className={`p-8 border-0 bg-linear-to-br from-[#0F172A] to-[#1E293B]/30 shadow-xl ${!company && 'md:col-span-2'}`}>
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-purple-400"/> Industry Skill Gap</h3>
                  <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">{roadmap.skill_gap?.trends}</p>
                  
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Trending Tech Missing From Resume</p>
                  <div className="flex flex-wrap gap-2">
                      {roadmap.skill_gap?.missing?.map((s, i) => (
                         <span key={i} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(168,85,247,0.1)]">{s}</span>
                      ))}
                  </div>
               </Card>
            </div>

            {/* Row 3: Actionable Learning Roadmap */}
            {roadmap.learning_roadmap?.length > 0 && (
              <Card className="p-8 border-0 bg-[#0F172A] shadow-xl overflow-hidden relative">
                 <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/5 blur-[100px] pointer-events-none"></div>
                 <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 font-poppins"><GraduationCap size={24} className="text-blue-400"/> Interactive Learning Roadmap</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roadmap.learning_roadmap?.map((resource, i) => (
                       <div key={i} className="bg-[#1E293B]/40 border border-white/5 p-6 rounded-2xl hover:border-blue-500/30 transition-colors group">
                          <div className="flex justify-between items-start mb-4">
                             <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{resource.skill}</h4>
                             <span className="text-[10px] uppercase font-black tracking-widest px-2 py-1 bg-white/5 rounded-md text-slate-400">Target Concept</span>
                          </div>
                          <p className="text-sm text-slate-400 mb-6 line-clamp-2">{resource.explanation}</p>
                          <div className="flex gap-3">
                             {resource.youtube_link && (
                                <a href={resource.youtube_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                                   <Video size={14} /> YouTube
                                </a>
                             )}
                             {resource.platform_link && (
                                <a href={resource.platform_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                                   <ExternalLink size={14} /> {resource.platform_name || 'Course'}
                                </a>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </Card>
            )}

            {/* Readiness Score Footer */}
            <div className="text-center pt-8">
               <div className="inline-flex flex-col items-center justify-center p-8 bg-linear-to-b from-indigo-500/10 to-transparent rounded-[2rem] border border-indigo-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 relative z-10">Job Readiness Quotient</p>
                  <p className="text-6xl font-black text-white relative z-10">{roadmap.readiness_score}<span className="text-3xl text-slate-600">/10</span></p>
                  <p className="text-sm text-slate-400 mt-4 max-w-xs relative z-10">Follow the roadmap resources above to increase your quotient before the technical rounds.</p>
               </div>
            </div>
         </div>
      )}

      {/* Fallback for legacy Markdown strings */}
      {roadmap && typeof roadmap === 'string' && (
        <Card className="p-8 md:p-12 border-0 bg-[#0F172A] shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-slide-up mt-16 relative overflow-hidden">
          <div className="border-b border-white/5 pb-8 mb-8 flex items-center justify-between">
             <h2 className="text-2xl font-black text-white font-poppins flex items-center gap-3">
                <Target className="text-emerald-400" size={28} /> Analysis Results
             </h2>
          </div>
          <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed relative z-10">
             <ReactMarkdown>{roadmap}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Interview;
