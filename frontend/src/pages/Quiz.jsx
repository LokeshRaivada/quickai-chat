import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { GraduationCap, FileText, UploadCloud, Brain, CheckCircle, XCircle, ArrowRight, Play, RefreshCw, AlertTriangle } from 'lucide-react';

const Quiz = () => {
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizText, setQuizText] = useState(null);
  const [mode, setMode] = useState('notes'); // 'notes' or 'document'

  // Game State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answeredState, setAnsweredState] = useState(null); // 'correct' or 'wrong'
  const [quizFinished, setQuizFinished] = useState(false);
  const [timer, setTimer] = useState(30);

  // Parse Backend Text into Structured Questions
  const parseQuizText = (text) => {
    // Highly resilient regex parser to extract questions from raw LLM output
    const rawQuestions = text.split(/(?=\d+\.\s)/g).filter(q => q.trim().length > 20);
    const parsed = [];

    rawQuestions.forEach(qBlock => {
      // Look for the answer key somewhere in the block
      const answerMatch = qBlock.match(/Answer:\s*([A-D])/i) || qBlock.match(/Correct Answer:\s*([A-D])/i);
      if (!answerMatch) return;
      
      const correctKey = answerMatch[1].toUpperCase();
      
      // Clean up the block to remove the answer line to just show the options
      let cleanQBlock = qBlock.replace(/Answer:.*$/gmi, '').trim();
      
      // Extract options roughly
      const options = [];
      ['A', 'B', 'C', 'D'].forEach(letter => {
         const optRegex = new RegExp(`[${letter}][.)]\\s*(.+?)(?=[A-D][.)]|\n|$)`, 'i');
         const match = cleanQBlock.match(optRegex);
         if (match) {
            options.push({ letter, text: match[1].trim() });
            cleanQBlock = cleanQBlock.replace(match[0], ''); // Remove from question body
         }
      });

      if (options.length >= 2) {
        // Find question title
        const qTitle = cleanQBlock.replace(/^\d+\.\s*/, '').trim();
        parsed.push({ question: qTitle, options, correctKey });
      }
    });

    return parsed;
  };

  const handleGenerate = async () => {
    if (mode === 'notes' && !notes) {
      toast.error("Please paste your study notes.");
      return;
    }
    if (mode === 'document' && !file) {
      toast.error("Please upload a document.");
      return;
    }
    
    if (mode === 'document' && file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'txt', 'docx'].includes(ext)) {
        toast.error("Unsupported file type! Only PDF, DOCX, TXT allowed.");
        return;
      }
    }

    setLoading(true);
    setQuizFinished(false);
    
    // UI improvement requirement: show different loading messages
    const loadingMessage = mode === 'document' 
       ? "Analyzing document & generating quiz..." 
       : "Formulating competitive questions...";
    const loadingToast = toast.loading(loadingMessage);

    try {
      const userEmail = JSON.parse(localStorage.getItem('user'))?.email;
      let response;

      if (mode === 'document' && file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('user_email', userEmail);
          formData.append('language', localStorage.getItem('language') || 'English');
          
          response = await axios.post('http://localhost:8000/generate-quiz', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
      } else {
          response = await axios.post('http://localhost:8000/generate-quiz', { 
            text: notes,
            user_email: userEmail,
            language: localStorage.getItem('language') || 'English'
          });
      }
      
      const rawText = response.data.quiz;
      setQuizText(rawText);
      const parsed = parseQuizText(rawText);
      
      if (parsed.length > 0) {
         setQuestions(parsed);
         setCurrentIndex(0);
         setScore(0);
         setTimer(30);
         setAnsweredState(null);
         setSelectedAnswer(null);
         toast.success("Game Mode Activated!", { id: loadingToast });
      } else {
         toast.success("Quiz Generated! (Text Mode)", { id: loadingToast });
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error(error.response?.data?.error || "AI Engine Offline", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (questions.length > 0 && !quizFinished && !answeredState && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && !answeredState && !quizFinished) {
      // Time out! Mark wrong
      handleAnswerSelect('TIMEOUT');
    }
    return () => clearInterval(interval);
  }, [timer, answeredState, quizFinished, questions.length]);

  const handleAnswerSelect = (letter) => {
    if (answeredState) return;
    
    setSelectedAnswer(letter);
    const currentQ = questions[currentIndex];
    
    if (letter === currentQ.correctKey) {
       setAnsweredState('correct');
       setScore(prev => prev + 1);
       if(navigator.vibrate) navigator.vibrate(50);
    } else {
       setAnsweredState('wrong');
       if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
       setCurrentIndex(prev => prev + 1);
       setSelectedAnswer(null);
       setAnsweredState(null);
       setTimer(30);
    } else {
       setQuizFinished(true);
       triggerConfetti();
       analyzeWeakness();
    }
  };
  
  const triggerConfetti = () => {
    const end = Date.now() + 2 * 1000;
    const colors = ['#6366f1', '#a855f7', '#ec4899'];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const analyzeWeakness = () => {
     if (score < questions.length / 2) {
       toast.error("You need more practice on these topics!", { duration: 4000 });
     } else {
       toast.success("Excellent Mastery!", { duration: 4000 });
     }
  };

  if (quizFinished) {
     return (
       <div className="max-w-3xl mx-auto py-20 text-center animate-slide-up">
         <div className="w-32 h-32 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center border-4 border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.5)] mb-8">
            <h1 className="text-5xl font-black text-white">{Math.round((score/questions.length)*100)}%</h1>
         </div>
         <h2 className="text-4xl font-black text-white font-poppins mb-4">Quiz Completed!</h2>
         <p className="text-xl text-slate-400 font-medium mb-12">You answered {score} out of {questions.length} accurately.</p>
         
         <Card className="p-8 text-left border-l-4 border-indigo-500 bg-indigo-500/5 mb-12">
            <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400 mb-2">
               <Brain size={20} /> AI Weakness Analysis
            </h3>
            <p className="text-slate-300">
               {score === questions.length 
                 ? "Perfect score! Your foundational knowledge is extremely solid." 
                 : `Based on your missed questions, focus heavily on revising the concepts you missed. Spend 20 minutes revisiting the source material.`}
            </p>
         </Card>

         <Button onClick={() => { setQuestions([]); setQuizText(null); }} className="mx-auto w-64 uppercase tracking-widest text-sm">
            <RefreshCw size={16} /> New Session
         </Button>
       </div>
     )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-2 md:px-6 space-y-12 animate-fade-in pb-32">
      { questions.length === 0 && !quizText && (
        <>
          <header className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold uppercase tracking-widest mb-2 font-poppins">
              <Play size={12} className="fill-purple-400" />
              Game Mode
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">
              Quiz <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-500 text-glow">Generator</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
              Transform your raw study notes into an interactive, timed intelligence assessment.
            </p>
          </header>

          <Card className="p-10 border-0 bg-[#0F172A] shadow-2xl relative">
            <div className="space-y-8">
              {/* Optional Bonus: Toggle Mode */}
              <div className="flex bg-[#1E293B] p-1.5 rounded-2xl w-fit border border-white/5 mx-auto md:mx-0">
                 <button onClick={() => setMode('notes')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${mode === 'notes' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}>Generate from Notes</button>
                 <button onClick={() => setMode('document')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${mode === 'document' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}><UploadCloud size={16} className={mode === 'document' ? 'text-white' : ''} /> Generate from Document</button>
              </div>

              {mode === 'notes' ? (
                <div className="space-y-4 animate-fade-in">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText size={14} className="text-indigo-400" />
                    Study Material
                  </label>
                  <textarea
                    className="w-full h-64 px-6 py-5 bg-[#1E293B] border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium text-[15px] leading-relaxed text-slate-200 resize-none"
                    placeholder="Paste your study notes here... The AI will instantly generate an interactive quiz session."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in group/doc">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <UploadCloud size={14} className="text-indigo-400" />
                    Upload Document
                  </label>
                  <Card onClick={() => document.getElementById('quiz-doc-upload').click()} className="p-12 border-2 border-dashed border-slate-600 bg-[#1E293B]/50 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-center cursor-pointer transition-all flex flex-col items-center justify-center group overflow-hidden relative rounded-3xl">
                     <input 
                       id="quiz-doc-upload" 
                       type="file" 
                       accept=".pdf,.docx,.txt" 
                       className="hidden" 
                       onChange={(e) => setFile(e.target.files[0])} 
                     />
                     <div className={`p-5 rounded-full mb-6 transition-all duration-500 ${file ? 'bg-emerald-500/20 text-emerald-400 scale-110 shadow-[0_0_30px_rgba(52,211,153,0.3)]' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:-translate-y-2'}`}>
                        {file ? <CheckCircle size={40} /> : <UploadCloud size={40} />}
                     </div>
                     <h3 className={`font-bold text-lg mb-2 font-poppins ${file ? 'text-emerald-400' : 'text-white'}`}>{file ? file.name : "Upload study material (PDF, DOCX, TXT)"}</h3>
                     <p className="text-slate-500 text-sm font-medium">{file ? "Ready to generate quiz... Click ENTER ARENA!" : "Drag & drop or browse to extract intelligent data."}</p>
                  </Card>
                  {file && (
                     <div className="flex justify-end mt-2">
                       <button onClick={() => setFile(null)} className="text-xs uppercase tracking-widest text-red-400 hover:text-red-300 font-bold px-4 py-2 border border-red-500/20 bg-red-500/10 rounded-lg transition-colors">Reset File</button>
                     </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button
                  loading={loading}
                  onClick={handleGenerate}
                  className="h-16 text-lg tracking-widest uppercase font-black px-12 shrink-0 bg-linear-to-r from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  fullWidth={false}
                >
                  Enter Arena
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Game Mode UI */}
      {questions.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-slide-in-right">
           <div className="flex items-center justify-between">
              <div className="flex gap-2">
                 {questions.map((_, idx) => (
                    <div key={idx} className={`h-2 w-12 rounded-full transition-all duration-500 ${idx < currentIndex ? 'bg-indigo-500' : idx === currentIndex ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`}></div>
                 ))}
              </div>
              <div className={`font-mono text-2xl font-black ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                 00:{timer.toString().padStart(2, '0')}
              </div>
           </div>

           <Card className="p-10 md:p-14 border-0 bg-linear-to-b from-[#1E293B]/80 to-[#0F172A] shadow-2xl">
              <span className="text-indigo-400 font-black tracking-widest uppercase text-sm mb-4 block">Question {currentIndex + 1} of {questions.length}</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-snug font-poppins">{questions[currentIndex].question}</h2>
              
              <div className="space-y-4">
                 {questions[currentIndex].options.map(opt => {
                    let btnClass = "bg-[#1E293B] border-white/5 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10";
                    if (answeredState) {
                       if (opt.letter === questions[currentIndex].correctKey) {
                          btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)]";
                       } else if (opt.letter === selectedAnswer) {
                          btnClass = "bg-red-500/20 border-red-500 text-red-300";
                       } else {
                          btnClass = "bg-[#1E293B] border-white/5 opacity-40 grayscale pointer-events-none";
                       }
                    }

                    return (
                      <button 
                         key={opt.letter}
                         disabled={answeredState !== null}
                         onClick={() => handleAnswerSelect(opt.letter)}
                         className={`w-full text-left p-5 border rounded-2xl transition-all duration-300 flex items-center gap-4 text-lg font-medium group ${btnClass}`}
                      >
                         <div className={`w-8 h-8 rounded-full border border-current flex items-center justify-center shrink-0 font-bold ${answeredState===null ? 'text-slate-500 group-hover:text-indigo-400' : ''}`}>
                            {opt.letter}
                         </div>
                         {opt.text}
                      </button>
                    )
                 })}
              </div>

              {answeredState && (
                 <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                       {answeredState === 'correct' ? <CheckCircle className="text-emerald-400" size={28}/> : <XCircle className="text-red-400" size={28}/>}
                       <span className={`font-bold text-lg ${answeredState === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {answeredState === 'correct' ? 'Perfect! +1 Point' : 'Incorrect.'}
                       </span>
                    </div>
                    <Button onClick={handleNext} fullWidth={false} className="px-8">
                       {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'} <ArrowRight size={18} />
                    </Button>
                 </div>
              )}
           </Card>
        </div>
      )}

      {/* Fallback Text Renderer if Parser failed entirely */}
      {quizText && questions.length === 0 && !loading && (
        <div className="space-y-6 animate-slide-up">
           <Card className="p-10 border-0 bg-[#0F172A] shadow-2xl">
             <div className="prose prose-invert prose-lg max-w-none">
                 <ReactMarkdown>{quizText}</ReactMarkdown>
             </div>
           </Card>
        </div>
      )}
    </div>
  );
};

export default Quiz;
