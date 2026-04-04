import React, { useState, useEffect } from 'react';
import Card, { StatCard } from '../components/Card';
import { Target, GraduationCap, Search, Calendar, Zap, TrendingUp, Brain, Award, Sparkles, ArrowRight, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user = { name: "Student" } }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    quizzes: 0,
    concepts: 0,
    interviews: 0,
    streak: 0,
    analysis: { weak: "...", focus: "...", progress: "..." }
  });
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const u = JSON.parse(localStorage.getItem('user'));
        const language = localStorage.getItem('language') || 'English';
        const response = await axios.get(`http://localhost:8000/dashboard-stats?email=${u?.email}&language=${language}`);
        setStats(response.data);
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      }
    };
    fetchStats();
  }, [language]);

  const toggleLanguage = () => {
    const next = language === 'English' ? 'Telugu' : 'English';
    setLanguage(next);
    localStorage.setItem('language', next);
  };

  const quickActions = [
    { title: "Interview Prep", desc: "AI-powered company-specific preparation", icon: <Target className="text-blue-400" size={28} />, path: "/interview", glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:border-blue-500/50" },
    { title: "Quiz Mode", desc: "Interactive game-mode quizzes", icon: <GraduationCap className="text-purple-400" size={28} />, path: "/quiz", glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:border-purple-500/50" },
    { title: "Concept Explainer", desc: "Break down complex topics intelligently", icon: <Search className="text-emerald-400" size={28} />, path: "/concept", glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] group-hover:border-emerald-500/50" },
    { title: "Study Planner", desc: "AI-powered daily roadmap & tracking", icon: <Calendar className="text-amber-400" size={28} />, path: "/study-planner", glow: "group-hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] group-hover:border-amber-500/50" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
             <Sparkles size={12} className="animate-pulse" /> Welcome to MentorAI
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight font-poppins">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl font-medium">
            Your AI intelligence layer for mastering academics & placements ({language} Active)
          </p>
        </div>

        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl text-indigo-400 font-black transition-all group active:scale-95"
        >
          <Languages size={18} className="group-hover:rotate-12 transition-transform" />
          {language === 'English' ? 'Switch to Telugu' : 'Switch to English'}
        </button>
      </header>

      {/* Intelligent Insights Section */}
      <Card className="border-0 bg-linear-to-r from-indigo-900/40 to-purple-900/20 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-all"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
           <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
             <Brain size={48} className="text-indigo-400" />
           </div>
           <div className="space-y-3 flex-1">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" /> AI Performance Analysis
             </h3>
             <ul className="space-y-2 text-slate-300 font-medium">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> You are currently weak in <b>{stats.analysis.weak}</b>.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Focus your next session on <b>{stats.analysis.focus}</b> for upcoming interviews.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Excellent work! You improved <b>{stats.analysis.progress}</b>.</li>
             </ul>
           </div>
           <div className="w-full md:w-auto">
              <button onClick={() => navigate('/study-planner')} className="w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 group-hover:border-indigo-400/50">
                 Update Planner <ArrowRight size={16} />
              </button>
           </div>
        </div>
      </Card>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard value={String(stats.quizzes)} label="Quizzes Taken" icon={<GraduationCap size={20} className="text-blue-400" />} />
        <StatCard value={String(stats.concepts)} label="Concepts Learned" icon={<Brain size={20} className="text-purple-400" />} />
        <StatCard value={String(stats.interviews)} label="Interview Sessions" icon={<Target size={20} className="text-emerald-400" />} />
        <StatCard value={String(stats.streak)} label="Activity Streak" icon={<Zap size={20} className="text-amber-400" />} trend="Active 🔥" />
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
           Launchpad
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <button 
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`group text-left p-6 glass-panel border border-white/5 bg-[#0F172A]/40 hover:-translate-y-2 transition-all duration-500 ease-out active:scale-95 flex flex-col items-start gap-4 ${action.glow}`}
            >
              <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-white/5">
                {action.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:to-slate-400 transition-all">{action.title}</h3>
                <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
