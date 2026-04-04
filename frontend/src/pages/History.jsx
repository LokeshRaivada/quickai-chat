import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { History as HistoryIcon, Target, Search as SearchIcon, GraduationCap, LayoutDashboard, Brain, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.email) return;
        const res = await axios.get(`http://localhost:8000/history?email=${user.email}`);
        setHistory(res.data.history || []);
      } catch (error) {
        toast.error("Failed to load history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getIcon = (feature) => {
    if (!feature) return <LayoutDashboard size={20} className="text-slate-400" />;
    const fStr = String(feature).toLowerCase();
    if (fStr.includes('interview')) return <Target className="text-emerald-400" size={20} />;
    if (fStr.includes('concept')) return <Brain className="text-indigo-400" size={20} />;
    if (fStr.includes('quiz')) return <GraduationCap className="text-purple-400" size={20} />;
    if (fStr.includes('planner')) return <BookOpen className="text-amber-400" size={20} />;
    return <LayoutDashboard className="text-blue-400" size={20} />;
  };

  const filteredHistory = history.filter(item => {
    const typeStr = (item.type || item.feature || "").toLowerCase();
    const titleStr = (item.title || item.input || "").toLowerCase();
    const contentStr = typeof item.content === 'object' ? JSON.stringify(item.content) : (item.result || "");
    const searchLow = searchTerm.toLowerCase();
    
    const matchesSearch = titleStr.includes(searchLow) || typeStr.includes(searchLow) || contentStr.toLowerCase().includes(searchLow);
    const matchesType = filterType === 'All' || typeStr.includes(filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-32">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 font-poppins">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 hidden md:block">
             <HistoryIcon size={32} className="text-blue-400" />
          </div>
          Knowledge <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-500">Vault</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
          Review all your past interactions, generated quizzes, and concept explanations.
        </p>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search your knowledge base..."
            className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-white/10 outline-none text-white font-medium rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 p-2 bg-[#0F172A] border border-white/10 rounded-2xl overflow-x-auto custom-scrollbar">
          {['All', 'Concept', 'Quiz', 'Interview', 'Planner'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2.5 rounded-xl font-bold tracking-wide text-sm transition-all whitespace-nowrap ${
                filterType === type 
                  ? 'bg-indigo-500 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
             <div key={i} className="animate-pulse bg-[#0F172A] h-24 rounded-2xl border border-white/5"></div>
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-[#0F172A] rounded-[2rem] border border-white/5 border-dashed">
          <HistoryIcon size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">Vault is empty</h3>
          <p className="text-slate-500 mt-2">Start exploring concepts to build your knowledge base.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistory.map((item, idx) => (
            <div key={idx} className="glass-card hover:-translate-y-1 transition-transform border border-white/5 duration-300 rounded-[20px] overflow-hidden group">
              <div 
                className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row gap-6 md:items-center justify-between"
                onClick={() => setExpandedId(expandedId === idx ? null : idx)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shrink-0 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-500">
                    {getIcon(item.type || item.feature)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors tracking-wide capitalize">{item.title || item.feature}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-md text-xs font-black tracking-widest uppercase">{item.type || "Legacy Data"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500 shrink-0 border-t border-white/5 md:border-0 pt-4 md:pt-0 mt-4 md:mt-0">
                   {new Date(item.created_at || item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                   <span className="md:hidden lg:inline text-slate-600">•</span>
                   {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {expandedId === idx && (
                <div className="p-8 border-t border-white/5 bg-[#070B14]/50 animate-fade-in custom-scrollbar overflow-x-hidden">
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 leading-relaxed
                     prose-h1:text-indigo-400 prose-h2:text-indigo-300 prose-h3:text-indigo-300 
                     prose-code:text-emerald-400 prose-code:bg-emerald-400/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded 
                     prose-pre:bg-[#0B1120] prose-pre:border prose-pre:border-white/10
                     prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/10 prose-blockquote:py-1">
                       {item.content && typeof item.content === 'object' ? (
                           <ReactMarkdown>
                               {`\`\`\`json\n${JSON.stringify(item.content, null, 2)}\n\`\`\``}
                           </ReactMarkdown>
                       ) : (
                           <ReactMarkdown>{item.content?.text || item.content?.data || item.result || String(item.content)}</ReactMarkdown>
                       )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
