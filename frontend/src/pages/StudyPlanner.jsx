import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Calendar, CheckCircle2, Circle, Clock, Target, CalendarDays, RefreshCw, Mail, MessageCircle, Video, ExternalLink } from 'lucide-react';

const StudyPlanner = () => {
  const [topics, setTopics] = useState('');
  const [hours, setHours] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reminderType, setReminderType] = useState('email');
  const [loading, setLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  
  // Structured parsing state
  const [timeline, setTimeline] = useState([]);
  const [rawPlan, setRawPlan] = useState(null);
  const [completedStops, setCompletedStops] = useState([]);

  const handleGenerate = async () => {
    if (!topics || !hours || !deadline) {
      toast.error("Please fill in all planning fields.");
      return;
    }

    setLoading(true);
    setRawPlan(null);
    setTimeline([]);
    setCompletedStops([]);
    
    const loadingToast = toast.loading("Executing temporal AI calculations...");

    try {
      const language = localStorage.getItem('language') || 'English';
      const response = await axios.post('http://localhost:8000/study-plan', { 
        topics, hours, deadline, reminder_type: reminderType,
        user_email: JSON.parse(localStorage.getItem('user'))?.email,
        email: JSON.parse(localStorage.getItem('user'))?.email,
        language: language
      });
      
      if (Array.isArray(response.data.plan)) {
         setTimeline(response.data.plan);
      } else {
         setRawPlan(response.data.plan);
      }
      toast.success("Study Plan locked in!", { id: loadingToast });
    } catch (error) {
      toast.error("AI Engine Offline", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (timeline.length === 0) return;
    setRescheduling(true);
    const loadingToast = toast.loading("Recalculating mission plan constraints...");
    
    // figure out missed day
    let firstMissed = 1;
    for(let i = 0; i < timeline.length; i++) {
        if (!completedStops.includes(timeline[i].day)) {
            firstMissed = timeline[i].day;
            break;
        }
    }

    try {
      const response = await axios.post('http://localhost:8000/reschedule-plan', { 
        missed_day: firstMissed,
        plan_data: timeline.slice(firstMissed - 1),
        deadline: deadline
      });
      
      const updatedChunks = response.data.plan;
      if (Array.isArray(updatedChunks)) {
          const newTimeline = [...timeline.slice(0, firstMissed - 1), ...updatedChunks];
          setTimeline(newTimeline);
          toast.success("Timeline successfully rescheduled!", { id: loadingToast });
      } else {
          toast.error("AI returned malformed chunk", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Rescheduling Failed", { id: loadingToast });
    } finally {
      setRescheduling(false);
    }
  };

  const toggleStop = (id) => {
     if (completedStops.includes(id)) {
        setCompletedStops(prev => prev.filter(i => i !== id));
     } else {
        setCompletedStops(prev => [...prev, id]);
        toast.success(`Day completed! Epic work. 🚀`);
     }
  };

  const completionPct = timeline.length > 0 
    ? Math.round((completedStops.length / timeline.length) * 100) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-32">
      <header className="space-y-4 text-center">
        <h1 className="text-5xl font-black text-white tracking-tighter">
          Study <span className="bg-clip-text text-transparent bg-linear-to-r from-amber-400 to-orange-500 text-glow">Planner</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
          AI-generated battle plan tailored to your exam deadlines.
        </p>
      </header>

      <Card className="p-8 border-0 bg-[#0F172A] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4 md:col-span-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Target size={14} className="text-amber-400" /> Subjects to Cover
            </label>
            <input
              className="w-full px-6 py-4 bg-[#1E293B] border border-white/5 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none text-white font-medium placeholder:text-slate-600 transition-all text-lg"
              placeholder="e.g. Operating Systems, Arrays, Trees"
              onChange={(e) => setTopics(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-amber-400" /> Daily Committment
            </label>
            <input
              className="w-full px-6 py-4 bg-[#1E293B] border border-white/5 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none text-white font-medium placeholder:text-slate-600"
              placeholder="e.g. 4 Hours"
              onChange={(e) => setHours(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <CalendarDays size={14} className="text-amber-400" /> Interview/Exam Deadline
            </label>
            <input
              type="date"
              className="w-full px-6 py-4 bg-[#1E293B] border border-white/5 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none text-white font-medium text-slate-300"
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Mail size={14} className="text-amber-400" /> Notifications
            </label>
            <div className="flex gap-4">
               <button onClick={() => setReminderType('email')} className={`w-full py-4 flex flex-col items-center justify-center border-2 rounded-xl transition-all ${reminderType === 'email' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/5 bg-[#1E293B] text-slate-400 hover:border-white/10'}`}>
                  <Mail size={20} className="mb-1" />
                  <span className="text-xs font-bold uppercase tracking-widest">Email Alerts Enabled</span>
               </button>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/5 mt-4">
             <Button
                loading={loading}
                onClick={handleGenerate}
                className="w-full h-14 bg-linear-to-r from-amber-500 to-orange-600 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] border-0 text-lg uppercase tracking-widest font-black text-white"
              >
                {loading ? "Crunching Deadlines..." : "Synthesize Plan"}
              </Button>
        </div>
      </Card>

      {/* Structured Timeline UI */}
      {timeline.length > 0 && (
        <div className="space-y-12 animate-slide-up">
           
           <div className="bg-[#0F172A] p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none"></div>
               
               <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 relative z-10">
                  <h2 className="text-2xl font-bold text-white font-poppins flex items-center gap-3">
                     <Calendar className="text-amber-400" /> Mission Briefing
                  </h2>
                  <div className="flex items-center gap-6">
                     <Button 
                        loading={rescheduling}
                        onClick={handleReschedule}
                        fullWidth={false}
                        className="bg-[#1E293B] hover:bg-[#334155] border border-white/10 text-white font-bold h-12 px-6 gap-2"
                     >
                        <RefreshCw size={18} className={`${rescheduling && 'animate-spin'}`} />
                        {rescheduling ? "Shifting Tasks..." : "Reschedule Missed Days"}
                     </Button>
                     <div className="text-right">
                        <div className="text-2xl font-black text-amber-400 font-mono">{completionPct}%</div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Completion Rate</div>
                     </div>
                  </div>
               </div>

               {/* Progress Bar */}
               <div className="w-full h-4 bg-[#1E293B] rounded-full overflow-hidden mb-12 shadow-inner border border-white/5">
                  <div 
                     className="h-full bg-linear-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-out relative"
                     style={{ width: `${completionPct}%` }}
                  >
                     <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                  </div>
               </div>

               <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
                  {timeline.map((item, idx) => {
                     const isCompleted = completedStops.includes(item.day || item.id || idx);
                     return (
                     <div key={idx} className="relative flex flex-col md:flex-row items-start justify-between md:odd:flex-row-reverse group">
                        
                        <div 
                           onClick={() => toggleStop(item.day || item.id || idx)}
                           className={`flex items-center justify-center w-12 h-12 rounded-full border-[6px] border-[#0F172A] z-10 shrink-0 md:order-1 ml-0 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 cursor-pointer transition-colors duration-500 shadow-xl ${isCompleted ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'bg-[#1E293B] text-slate-500 hover:text-amber-400 hover:scale-110'}`}>
                           {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </div>
                        
                        <div className={`w-full md:w-[calc(50%-4rem)] pl-16 md:pl-0 mt-[-3rem] md:mt-0 transition-all duration-500 ${isCompleted ? 'opacity-50 blur-[1px] hover:blur-none hover:opacity-100' : ''}`}>
                           <Card className="p-6 border border-white/5 bg-[#1E293B]/60 hover:bg-[#1E293B] hover:border-amber-500/30 transition-all shadow-xl group-hover:-translate-y-1">
                              <div className="flex justify-between items-center mb-4">
                                 <h3 className="font-black text-xl text-white font-poppins">{item.title || `Day ${item.day}`}</h3>
                                 {item.time_required && (
                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-widest rounded-lg">
                                       {item.time_required}
                                    </span>
                                 )}
                              </div>
                              
                              <div className="space-y-4">
                                 {/* Tasks List */}
                                 {item.tasks && item.tasks.length > 0 && (
                                    <ul className="space-y-2">
                                       {item.tasks.map((task, tid) => (
                                          <li key={tid} className="flex gap-2 text-sm text-slate-300">
                                             <Target size={16} className="text-amber-500/60 shrink-0 mt-0.5" />
                                             <span className="leading-relaxed">{task}</span>
                                          </li>
                                       ))}
                                    </ul>
                                 )}

                                 {/* Resources Area */}
                                 {item.resources && item.resources.length > 0 && (
                                    <div className="pt-4 border-t border-white/5 flex flex-wrap gap-3">
                                       {item.resources.map((res, rid) => (
                                          <a key={rid} href={res.link} target="_blank" rel="noopener noreferrer" 
                                             className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${res.type?.toLowerCase() === 'youtube' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20'}`}>
                                             {res.type?.toLowerCase() === 'youtube' ? <Video size={14} /> : <ExternalLink size={14} />}
                                             {res.name || res.type}
                                          </a>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </Card>
                        </div>
                     </div>
                     )
                  })}
               </div>
           </div>
        </div>
      )}

      {/* Fallback Text Renderer */}
      {rawPlan && timeline.length === 0 && (
         <Card className="p-8 border-0 bg-[#0F172A] shadow-2xl animate-slide-up">
            <div className="prose prose-invert max-w-none">
               <ReactMarkdown>{rawPlan}</ReactMarkdown>
            </div>
         </Card>
      )}
    </div>
  );
};

export default StudyPlanner;
