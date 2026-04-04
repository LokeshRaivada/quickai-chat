import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Search, Lightbulb, BookOpen, Sparkles, Volume2, Copy, Languages } from 'lucide-react';

const ConceptExplainer = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');

  const toggleLanguage = () => {
    const next = language === 'English' ? 'Telugu' : 'English';
    setLanguage(next);
    localStorage.setItem('language', next);
    toast.success(`Language set to ${next}`);
  };

  const handleExplain = async () => {
    if (!topic) {
      toast.error("Please enter a topic to explore.");
      return;
    }

    setLoading(true);
    setResult(null);
    const loadingToast = toast.loading("AI is dissecting the concept...");

    try {
      const response = await axios.post('http://localhost:8000/concept', { 
        topic,
        user_email: JSON.parse(localStorage.getItem('user'))?.email,
        language: localStorage.getItem('language') || 'English'
      });
      setResult(response.data.explanation);
      toast.success("Concept explained!", { id: loadingToast });
    } catch (error) {
      console.error("Error:", error);
      setResult("AI Engine Offline: " + error.message);
      toast.error("Explanation failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("Copied to clipboard!");
    }
  };

  const handleSpeak = () => {
    if (result && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = result.replace(/[*#]/g, ''); // Strip markdown chars
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      toast('Reading aloud...', { icon: '🔊' });
    } else {
      toast.error("Text-to-speech not supported in this browser.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in text-center pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between items-center gap-6">
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-3 px-6 py-2 pb-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-black uppercase tracking-widest mb-2 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <Sparkles size={14} className="animate-pulse" />
            AI Learning Engine
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter sm:text-6xl font-poppins">
            Concept <span className="heading-gradient">Explainer</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl">
            Analyze any topic in {language === 'English' ? 'English' : 'Telugu'}. 
          </p>
        </div>

        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 font-bold transition-all group active:scale-95"
        >
          <Languages size={18} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
          {language === 'English' ? 'English' : 'Telugu'}
        </button>
      </header>

      <div className="relative group max-w-3xl mx-auto">
        <div className="absolute -inset-1.5 bg-linear-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition-all duration-1000"></div>
        <div className="relative p-3 border-0 bg-[#0F172A] rounded-[2.2rem] shadow-2xl flex items-center overflow-hidden h-[90px] ring-1 ring-white/10 group-focus-within:ring-indigo-500/50 transition-all">
          <div className="pl-6 text-slate-500 group-focus-within:text-indigo-400 transition-all">
            <Search size={28} />
          </div>
          <input
            className="flex-1 h-full px-6 bg-transparent border-none outline-none text-xl font-bold text-slate-100 placeholder:text-slate-600 tracking-tight"
            placeholder="e.g. Memory Paging, Polymorphism, Thermodynamics..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
            disabled={loading}
          />
          <div className="pr-3 h-full flex items-center">
             <Button
                loading={loading}
                onClick={handleExplain}
                className="h-full px-10 text-lg tracking-wide uppercase font-black rounded-[1.5rem]"
                fullWidth={false}
              >
                {loading ? "Dissecting..." : "Explain"}
              </Button>
          </div>
        </div>
      </div>

      {/* Results Section Using Structured Markdown */}
      {result && (
        <div className="space-y-8 animate-slide-up text-left mt-16">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-poppins">
              <Lightbulb className="text-indigo-400" size={28} />
              Structured Breakdown
            </h2>
            <div className="flex gap-3">
              <button onClick={handleSpeak} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 hover:text-indigo-400 transition-all" title="Listen">
                 <Volume2 size={20} />
              </button>
              <button onClick={handleCopy} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 hover:text-indigo-400 transition-all" title="Copy">
                 <Copy size={20} />
              </button>
            </div>
          </div>
          
          <div className="glass-panel p-8 md:p-12 relative overflow-hidden group/res border-t-4 border-indigo-500">
            <div className="absolute top-0 right-0 p-8 text-indigo-500/5 group-hover/res:scale-110 transition-all duration-700 pointer-events-none">
               <BookOpen size={160} strokeWidth={1} />
            </div>
            
            <div className="relative z-10 prose prose-invert prose-lg max-w-none prose-headings:font-poppins prose-headings:font-bold prose-h1:text-indigo-400 prose-h2:text-indigo-300 prose-h3:text-indigo-200 prose-a:text-blue-400 prose-strong:text-white prose-code:text-emerald-400 prose-code:bg-emerald-400/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-[#0B1120] prose-pre:border prose-pre:border-white/10 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-li:marker:text-indigo-500">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptExplainer;
