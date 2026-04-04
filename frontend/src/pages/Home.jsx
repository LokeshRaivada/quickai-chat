import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, User, GraduationCap, Building2, Terminal, Target, Search, Calendar, LayoutDashboard, Sparkles, ChevronRight, CheckCircle2, X, Play, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';

const Home = ({ loggedIn, user, setLoggedIn, setUser }) => {
   const [showModal, setShowModal] = useState(false);
   const [isRegister, setIsRegister] = useState(false);
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({ name: '', email: '', password: '' });
   const navigate = useNavigate();

   const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
         const endpoint = isRegister ? '/register' : '/login';
         const response = await axios.post(`http://localhost:8000${endpoint}`, formData);
         if (response.data.success) {
            if (!isRegister) {
               localStorage.setItem('user', JSON.stringify(response.data.user));
               setUser(response.data.user);
               setLoggedIn(true);
               setShowModal(false);
               toast.success("Successfully logged in!");
               navigate('/dashboard');
            } else {
               toast.success("Registration successful! Please login.");
               setIsRegister(false);
            }
         } else {
            toast.error(response.data.message || "Operation failed.");
         }
      } catch (error) {
         toast.error("Auth server error: " + (error.response?.data?.message || error.message));
      } finally {
         setLoading(false);
      }
   };

   const handleLogout = () => {
      localStorage.removeItem('user');
      setUser(null);
      setLoggedIn(false);
      toast.success("Logged out successfully");
   };

   const scrollToSection = (e, targetId) => {
      e.preventDefault();
      if (targetId === 'top') {
         window.scrollTo({ top: 0, behavior: 'smooth' });
         return;
      }
      const element = document.getElementById(targetId);
      if (element) {
         element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
   };

   const handleFeatureClick = (path) => {
      if (loggedIn) {
         navigate(path);
      } else {
         toast.error("Authentication required! Please sign in to access Platform engines.");
         setShowModal(true);
      }
   };

   return (
      <div className="min-h-screen bg-[#0B1120] relative overflow-hidden font-inter selection:bg-indigo-500/30 selection:text-white">
         {/* Background Particles/Glow */}
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none"></div>
         <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none"></div>

         {/* Navbar */}
         <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-white/5 bg-[#0B1120]/50 backdrop-blur-3xl">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <GraduationCap size={24} className="text-white" />
               </div>
               <span className="text-xl font-black text-white tracking-tighter">
                  Mentor <span className="text-blue-400">AI</span>
               </span>
            </div>

            <div className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-300">
               <a href="#" onClick={(e) => scrollToSection(e, 'top')} className="hover:text-white transition-colors">Home</a>
               <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors">Features</a>
               <a href="#how" onClick={(e) => scrollToSection(e, 'how')} className="hover:text-white transition-colors">How it Works</a>
            </div>

            <div className="flex items-center gap-4">
               {loggedIn ? (
                  <div className="flex items-center gap-4">
                     <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-black">
                           {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-bold text-white tracking-wide">{user?.name}</div>
                     </div>
                     <Button onClick={() => navigate('/dashboard')} fullWidth={false} className="px-6 py-2 h-10 text-xs">
                        Dashboard
                     </Button>
                     <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest px-4">
                        Logout
                     </button>
                  </div>
               ) : (
                  <Button onClick={() => setShowModal(true)} fullWidth={false} className="px-8 py-2.5 h-11 text-sm bg-linear-to-r from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                     Login Access
                  </Button>
               )}
            </div>
         </nav>

         {/* Main Content */}
         <main className="relative z-10 pt-20 pb-32 px-6 lg:px-12 animate-fade-in">
            <div className="max-w-5xl mx-auto text-center space-y-8">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                  <Sparkles size={16} className="animate-pulse" /> Welcome to the future of learning
               </div>

               <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter font-poppins leading-tight">
                  Your AI Study Companion <span className="inline-block animate-bounce">🚀</span>
               </h1>

               <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                  Prepare smarter for interviews, ace complex quizzes, and master intricate concepts instantly with our intelligence layer.
               </p>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button onClick={() => loggedIn ? navigate('/dashboard') : setShowModal(true)} fullWidth={false} className="h-14 px-12 text-lg w-full sm:w-auto bg-linear-to-r from-blue-500 to-purple-600 border-0 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all">
                     {loggedIn ? "Go to Dashboard" : "Get Started Now"}
                  </Button>
               </div>

               {/* Pro Tip Glow Box */}
               <div className="mt-16 relative group max-w-xl mx-auto border border-white/10 p-6 rounded-3xl bg-white/5 overflow-hidden ring-1 ring-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.1)] hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] transition-shadow">
                  <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 opacity-50"></div>
                  <p className="relative z-10 text-indigo-200 font-medium flex items-center justify-center gap-3">
                     <span className="px-3 py-1 bg-indigo-500 rounded-lg text-xs font-black text-white uppercase tracking-widest">Pro Tip</span>
                     Upload your resume to generate targeted interview strategies instantly!
                  </p>
               </div>
            </div>

            {/* Features Matrix */}
            <div id="features" className="max-w-6xl mx-auto mt-40">
               <h2 className="text-3xl font-black text-white mb-12 text-center font-poppins tracking-tight">Core Functionalities</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     { icon: <Target className="text-emerald-400" size={32} />, title: "Interview Prep", desc: "AI-driven corporate strategy mockups.", path: "/interview" },
                     { icon: <Brain className="text-indigo-400" size={32} />, title: "Concept Explainer", desc: "Break down complex topics elegantly.", path: "/concept" },
                     { icon: <GraduationCap className="text-purple-400" size={32} />, title: "Quiz Generator", desc: "Game-mode timed quizzes from PDFs.", path: "/quiz" },
                     { icon: <Calendar className="text-amber-400" size={32} />, title: "Study Planner", desc: "AI roadmaps with daily task tracking.", path: "/study-planner" }
                  ].map((f, i) => (
                     <Card key={i} onClick={() => handleFeatureClick(f.path)} className="p-8 border-0 bg-[#1E293B]/40 hover:-translate-y-2 transition-transform duration-500 group border border-white/5 hover:border-indigo-500/30 shadow-none hover:shadow-[0_10px_40px_rgba(99,102,241,0.1)] cursor-pointer">
                        <div className="p-4 bg-white/5 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">{f.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">{f.title} <ChevronRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-400" /></h3>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">{f.desc}</p>
                     </Card>
                  ))}
               </div>
            </div>

            {/* How It Works */}
            <div id="how" className="max-w-4xl mx-auto mt-40 mb-20 text-center">
               <h2 className="text-3xl font-black text-white mb-16 font-poppins">How It Works</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 -z-10"></div>
                  {[
                     { step: "1", title: "Upload Material", desc: "Drop your notes or PDFs perfectly into our module generators." },
                     { step: "2", title: "AI Computation", desc: "Our core LLM logic extracts, processes, and structures it." },
                     { step: "3", title: "Master It", desc: "Play quizzes, check off study tasks, and ace your placements." }
                  ].map((h, i) => (
                     <div key={i} className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6 ring-4 ring-[#0B1120]">
                           {h.step}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{h.title}</h3>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">{h.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </main>

         {/* Premium Footer */}
         <footer className="relative z-10 border-t border-white/5 bg-[#0F172A]/80 backdrop-blur-3xl py-16 px-6 lg:px-12">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
               <div className="space-y-6 md:col-span-2">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl">
                        <GraduationCap size={24} className="text-white" />
                     </div>
                     <span className="text-xl font-black text-white tracking-tighter">
                        Smart <span className="text-blue-400">AI</span>
                     </span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                     Revolutionizing student learning with next-generation AI intelligence. Built for champions, powered by excellence.
                  </p>
                  <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-400/50 transition-all cursor-pointer">
                        <Mail size={18} />
                     </div>
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-400/50 transition-all cursor-pointer">
                        <Target size={18} />
                     </div>
                  </div>
               </div>

               <div>
                  <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
                  <ul className="space-y-4 text-slate-400 text-sm font-medium">
                     <li><a href="#" className="hover:text-indigo-400 transition-colors">Core Engine</a></li>
                     <li><a href="#" className="hover:text-indigo-400 transition-colors">Career Analytics</a></li>
                     <li><a href="#" className="hover:text-indigo-400 transition-colors">Roadmap Logic</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Resources</h4>
                  <ul className="space-y-4 text-slate-400 text-sm font-medium">
                     <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
                     <li><a href="#" className="hover:text-indigo-400 transition-colors">API Keys</a></li>
                     <li><a href="#" className="hover:text-indigo-400 transition-colors">Support Portal</a></li>
                  </ul>
               </div>
            </div>
            <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">© 2026 SMART AI INTELLIGENCE. ALL RIGHTS RESERVED.</p>
               <div className="flex gap-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
                  <a href="#" className="hover:text-white transition-colors">Terms of Access</a>
               </div>
            </div>
         </footer>

         {/* Auth Modal */}
         {showModal && !loggedIn && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               {/* Backdrop */}
               <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-xl animate-fade-in" onClick={() => setShowModal(false)}></div>

               <Card className="w-full max-w-md p-10 relative z-10 animate-slide-up border border-indigo-500/30 bg-[#0F172A] shadow-[0_0_100px_rgba(99,102,241,0.2)]">
                  <button
                     onClick={() => setShowModal(false)}
                     className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                     <X size={20} />
                  </button>

                  <div className="text-center mb-8">
                     <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mx-auto flex items-center justify-center mb-4">
                        <ShieldCheck size={28} className="text-indigo-400" />
                     </div>
                     <h2 className="text-2xl font-black font-poppins text-white uppercase tracking-widest">{isRegister ? 'New Access' : 'Secure Protocol'}</h2>
                  </div>

                  <div className="flex bg-[#1E293B] p-1.5 rounded-2xl mb-8 border border-white/5">
                     <button onClick={() => setIsRegister(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${!isRegister ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}>Sign In</button>
                     <button onClick={() => setIsRegister(true)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isRegister ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}>Create Profile</button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                     {isRegister && (
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Identity Tag</label>
                           <div className="relative group/field">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-indigo-400 transition-colors" size={18} />
                              <input type="text" name="name" required className="w-full h-14 pl-12 pr-4 bg-[#1E293B]/50 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white font-medium" placeholder="E.g. Student Name" value={formData.name} onChange={handleChange} />
                           </div>
                        </div>
                     )}
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Secure Email</label>
                        <div className="relative group/field">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-indigo-400 transition-colors" size={18} />
                           <input type="email" name="email" required className="w-full h-14 pl-12 pr-4 bg-[#1E293B]/50 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white font-medium" placeholder="student@university.edu" value={formData.email} onChange={handleChange} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Access Key</label>
                        <div className="relative group/field">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-indigo-400 transition-colors" size={18} />
                           <input type="password" name="password" required className="w-full h-14 pl-12 pr-4 bg-[#1E293B]/50 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white font-medium" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                        </div>
                     </div>

                     <Button loading={loading} className="h-14 mt-4 w-full text-lg tracking-widest uppercase font-black bg-linear-to-r from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        Access Platform
                     </Button>
                  </form>
               </Card>
            </div>
         )}
      </div>
   );
};

export default Home;
