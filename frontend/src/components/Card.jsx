import React from 'react';

const Card = ({ children, className = "", hoverable = true, glow = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
      glass-card p-6 relative overflow-hidden
      ${glow ? 'shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const StatCard = ({ value, label, icon, trend }) => (
  <Card hoverable={true} className="flex flex-col relative group">
    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
        {icon}
      </div>
      {trend && (
        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
          {trend}
        </span>
      )}
    </div>
    <div>
      <div className="text-3xl font-black text-white tracking-tight mb-1 font-poppins">{value}</div>
      <div className="text-sm text-slate-400 font-medium">{label}</div>
    </div>
  </Card>
);

export default Card;
