import React from 'react';

export default function ProgressBanner({ progressStats, stats }) {
  const { percent, totalSolved, totalQuestions, totalE, totalM, totalH } = progressStats;

  const breakdown = [
    { label: 'Easy',   color: 'bg-emerald-500', solved: stats.easy   || 0, total: totalE },
    { label: 'Medium', color: 'bg-amber-500',   solved: stats.medium || 0, total: totalM },
    { label: 'Hard',   color: 'bg-red-500',     solved: stats.hard   || 0, total: totalH },
  ];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar">

      {/* Ring + label */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" stroke="#27272a" strokeWidth="3" fill="none" />
            <circle
              cx="22" cy="22" r="18"
              stroke="#dc2626"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={113.1}
              strokeDashoffset={113.1 - (113.1 * percent) / 100}
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>
          <span className="absolute text-[10px] font-black text-white">{percent}%</span>
        </div>

        <div>
          <p className="text-sm font-bold text-zinc-200 leading-none mb-1.5">Overall Progress</p>
          <p className="text-xs font-mono text-zinc-500 leading-none">
            <span className="text-white font-bold">{totalSolved}</span>
            <span className="text-zinc-700"> / </span>
            {totalQuestions} solved
          </p>
        </div>
      </div>

      <div className="hidden sm:block w-px h-9 bg-zinc-800 shrink-0" />

      {/* Stats breakdown */}
      <div className="flex items-center gap-7 shrink-0 ml-auto">
        {breakdown.map(({ label, color, solved, total }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 leading-none">{label}</span>
              <span className="text-sm font-mono text-zinc-300 leading-none">
                <span className="text-zinc-100 font-bold">{solved}</span>
                <span className="text-zinc-600">/{total}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}