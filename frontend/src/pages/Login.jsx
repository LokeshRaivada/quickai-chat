import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import axios from 'axios';
import { ShieldCheck, Mail, Lock, User, GraduationCap, Building2, Terminal } from 'lucide-react';

const Login = ({ setLoggedIn, setUser }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

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
        } else {
          alert("Registration successful! Please login.");
          setIsRegister(false);
        }
      } else {
        alert(response.data.message || "Operation failed.");
      }
    } catch (error) {
      console.error("Auth error:", error);
      const serverMsg = error.response?.data?.message || error.message;
      alert("Authentication Service Error: " + serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-inter selection:bg-[#3b82f6] selection:text-white">
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#3b82f6]/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#8b5cf6]/10 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-10 group">
           <div className="p-4 bg-linear-to-br from-[#3b82f6] to-[#8b5cf6] rounded-[2rem] shadow-2xl group-hover:scale-110 transition-all duration-700 select-none">
              <GraduationCap size={48} className="text-white" />
           </div>
           <div className="flex flex-col">
              <span className="text-4xl font-black text-white tracking-tighter sm:text-5xl select-none">Smart <span className="text-[#3b82f6]">AI</span></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-1 select-none">Student Assistant Platform</span>
           </div>
        </div>

        <Card className="p-12 border-0 bg-slate-900/60 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] ring-1 ring-white/10 relative overflow-hidden group/form">
          <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ef4444] opacity-80"></div>
          
          <div className="flex justify-center gap-10 mb-12 border-b border-[#334155]/60 pb-8 h-12 items-center">
            <button 
              onClick={() => setIsRegister(false)}
              className={`text-xl font-black tracking-tight transition-all uppercase px-4 ${!isRegister ? 'text-white scale-110 border-b-4 border-b-[#3b82f6]' : 'text-slate-500 hover:text-slate-300 transform'}`}
            >
              Login
            </button>
            <div className="w-[2px] h-6 bg-[#334155]/60"></div>
            <button 
              onClick={() => setIsRegister(true)}
              className={`text-xl font-black tracking-tight transition-all uppercase px-4 ${isRegister ? 'text-white scale-110 border-b-4 border-b-[#8b5cf6]' : 'text-slate-500 hover:text-slate-300 transform'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {isRegister && (
              <div className="space-y-3 group/input">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 group-focus-within/input:text-[#3b82f6] transition-colors ml-1">
                  <User size={12} /> Full Name
                </label>
                <div className="relative overflow-hidden group">
                   <input
                    type="text"
                    name="name"
                    required
                    className="w-full h-16 px-6 bg-[#1e293b]/50 border border-[#334155] rounded-2xl focus:ring-8 focus:ring-[#3b82f6]/5 focus:border-[#3b82f6]/60 outline-none transition-all placeholder:text-slate-700 font-bold text-slate-200"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 select-none"><Terminal size={18} /></div>
                </div>
              </div>
            )}

            <div className="space-y-3 group/input">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 group-focus-within/input:text-[#3b82f6] transition-colors ml-1">
                <Mail size={12} /> GMRIT Email Address
              </label>
              <div className="relative group overflow-hidden">
                 <input
                  type="email"
                  name="email"
                  required
                  className="w-full h-16 px-6 bg-[#1e293b]/50 border border-[#334155] rounded-2xl focus:ring-8 focus:ring-[#3b82f6]/5 focus:border-[#3b82f6]/60 outline-none transition-all placeholder:text-slate-700 font-bold text-slate-200"
                  placeholder="student@gmrit.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 select-none">@</div>
              </div>
            </div>

            <div className="space-y-3 group/input">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 group-focus-within/input:text-[#3b82f6] transition-colors ml-1">
                <Lock size={12} /> Password
              </label>
              <div className="relative group overflow-hidden">
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full h-16 px-6 bg-[#1e293b]/50 border border-[#334155] rounded-2xl focus:ring-8 focus:ring-[#3b82f6]/5 focus:border-[#3b82f6]/60 outline-none transition-all placeholder:text-slate-700 font-bold text-slate-200"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 select-none"><ShieldCheck size={18} /></div>
              </div>
            </div>



            <div className="pt-6 relative group/btn">
              <div className="absolute -inset-1 bg-linear-to-r from-[#3b82f6] to-[#8b5cf6] rounded-3xl blur opacity-0 group-hover/btn:opacity-20 transition-all duration-700"></div>
              <Button
                loading={loading}
                className="h-20 text-2xl tracking-[0.1em] uppercase font-black rounded-3xl relative z-10"
              >
                {isRegister ? "Create Account" : "Access Platform"}
              </Button>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] select-none hover:text-[#3b82f6]/60 transition-colors cursor-default">
              Exclusive for GMR Institute of Technology
            </p>
          </form>
        </Card>
        
        {/* Footer info */}
        { !isRegister && (
           <div className="mt-12 text-center flex items-center justify-center gap-6 opacity-30 select-none grayscale hover:grayscale-0 transition-all hover:opacity-100 duration-1000">
               <div className="h-[1px] w-12 bg-slate-600"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={14} /> Powered by Secure AI Gateway
               </span>
               <div className="h-[1px] w-12 bg-slate-600"></div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Login;
