import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  GraduationCap, 
  Search, 
  Calendar, 
  History as HistoryIcon,
  LogOut,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ user = { name: "GMRIT Student", email: "student@gmrit.edu" }, setLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLoggedIn(false);
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Interview Prep", path: "/interview", icon: <Target size={20} /> },
    { name: "Quiz Mode", path: "/quiz", icon: <GraduationCap size={20} /> },
    { name: "Concept Explainer", path: "/concept", icon: <Search size={20} /> },
    { name: "Study Planner", path: "/study-planner", icon: <Calendar size={20} /> },
    { name: "History", path: "/history", icon: <HistoryIcon size={20} /> }
  ];

  return (
    <div className="w-[280px] h-screen bg-[#070B14]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Brand */}
      <div className="flex items-center gap-3 p-8 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer">
           <Sparkles size={20} className="text-white z-10" />
           <div className="absolute inset-0 bg-white/20 blur-md rounded-full translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </div>
        <div>
           <h1 className="text-2xl font-black text-white tracking-tight font-poppins">Mentor<span className="text-indigo-400">AI</span></h1>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Intelligence Layer</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-medium group relative overflow-hidden
               ${isActive 
                ? "bg-indigo-500/10 text-indigo-400 font-bold shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] border border-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-400'}`}>
                   {item.icon}
                </div>
                <span className="text-[15px]">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Area */}
      <div className="mt-auto p-4 border-t border-white/5 bg-[#0F172A]/50">
        <div className="glass-card mb-3 p-3 flex items-center gap-4 border-0 bg-white/5 ring-1 ring-white/10 hover:ring-indigo-500/30 group cursor-pointer transition-all">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white uppercase shadow-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-shadow">
            {user.name ? user.name[0] : "S"}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{user.name}</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">{user.email}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm font-bold tracking-wide uppercase"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
