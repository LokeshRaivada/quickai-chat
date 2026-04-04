import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hi! I am MentorAI. What are we studying today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Re-using the /concept endpoint for general Q&A
      const response = await axios.post('http://localhost:8000/concept', { 
        topic: userMessage.text,
        user_email: JSON.parse(localStorage.getItem('user'))?.email || 'guest'
      });
      
      const aiMessage = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: response.data.explanation 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: 'I am taking a quick break. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[380px] h-[550px] glass-panel border border-indigo-500/20 shadow-[0_10px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
          
          {/* Header */}
          <div className="gradient-primary p-4 flex items-center justify-between shadow-md relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight font-poppins">MentorAI Chat</h3>
                <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0B1120]/80">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-[#1E293B] border border-white/10'}`}>
                    {msg.sender === 'user' ? <User size={14} className="text-white"/> : <Sparkles size={14} className="text-indigo-400"/>}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-[#1E293B] border border-white/5 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 bg-[#1E293B] border border-white/10 flex items-center justify-center">
                    <Sparkles size={14} className="text-indigo-400"/>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#1E293B] border border-white/5 rounded-tl-none flex items-center gap-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#0F172A] border-t border-white/5">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask MentorAI anything..."
                className="w-full bg-[#1E293B] border border-white/10 rounded-full pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-white placeholder-slate-400 shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white disabled:opacity-50 transition-transform active:scale-95"
              >
                <Send size={16} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(79,70,229,0.5)] hover:scale-110 hover:shadow-[0_10px_40px_rgba(79,70,229,0.7)] transition-all animate-float relative group"
        >
          <MessageCircle size={28} className="text-white relative z-10" />
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#0B1120] rounded-full animate-ping"></span>
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#0B1120] rounded-full"></span>
        </button>
      )}
    </div>
  );
};

export default FloatingChat;
