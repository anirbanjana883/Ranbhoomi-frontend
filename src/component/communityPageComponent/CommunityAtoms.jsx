// CommunityAtoms.jsx — tiny shared UI primitives
import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { avatarColor, planBadgeClass } from './communityUtils.js';

/* ── Avatar ─────────────────────────────────────────────────── */
export function Avatar({ name = '?', size = 7, className = '' }) {
  const bg = avatarColor(name);
  const px = size <= 6 ? '10px' : size <= 8 ? '12px' : '14px';
  const dim = `${size * 4}px`;
  
  return (
    <div
      className={`${bg} rounded-md flex items-center justify-center font-mono text-white font-bold shrink-0 shadow-sm ${className}`}
      style={{ width: dim, height: dim, fontSize: px }}
    >
      {(name?.[0] || '?').toUpperCase()}
    </div>
  );
}

/* ── PlanBadge ──────────────────────────────────────────────── */
export function PlanBadge({ plan }) {
  const cls = planBadgeClass(plan);
  if (!cls) return null;
  
  return (
    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-widest ${cls}`}>
      {plan}
    </span>
  );
}

/* ── VoteWidget ─────────────────────────────────────────────── */
export function VoteWidget({ score = 0, userVote = 0, onUp, onDown, vertical = true }) {
  // Pure Tailwind configuration for strict contrast control
  const baseBtn = "p-1.5 rounded-md flex items-center justify-center transition-colors duration-200 border";
  
  const upCls = userVote === 1 
    ? `${baseBtn} text-emerald-400 bg-emerald-500/10 border-emerald-500/20` 
    : `${baseBtn} text-zinc-500 border-transparent hover:text-emerald-400 hover:bg-zinc-800 hover:border-zinc-700`;
    
  const downCls = userVote === -1 
    ? `${baseBtn} text-red-400 bg-red-500/10 border-red-500/20` 
    : `${baseBtn} text-zinc-500 border-transparent hover:text-red-400 hover:bg-zinc-800 hover:border-zinc-700`;
    
  const scoreCls = score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-zinc-400';

  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button className={upCls} onClick={onUp}> <FaArrowUp size={10} /> </button>
        <span className={`font-mono text-xs font-bold ${scoreCls}`}>{score}</span>
        <button className={downCls} onClick={onDown}> <FaArrowDown size={10} /> </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button className={upCls} onClick={onUp}> <FaArrowUp size={10} /> </button>
      <span className={`font-mono text-[11px] font-bold min-w-[20px] text-center ${scoreCls}`}>{score}</span>
      <button className={downCls} onClick={onDown}> <FaArrowDown size={10} /> </button>
    </div>
  );
}

/* ── DiffBadge ──────────────────────────────────────────────── */
export function DiffBadge({ difficulty }) {
  const map = {
    Easy:         'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Medium:       'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Hard:         'text-red-400 bg-red-500/10 border-red-500/20',
    'Super Hard': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  const themeCls = map[difficulty] || 'text-zinc-400 bg-zinc-800 border-zinc-700';
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest font-bold ${themeCls}`}>
      {difficulty}
    </span>
  );
}

/* ── SectionLabel ───────────────────────────────────────────── */
export function SectionLabel({ children }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500">
      {children}
    </span>
  );
}

/* ── LoadingSpinner ─────────────────────────────────────────── */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full py-16">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-red-500 rounded-full animate-spin" />
    </div>
  );
}

/* ── PostCardSkeleton ───────────────────────────────────────── */
export function PostCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Left: Score Column Skeleton */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="w-[28px] h-[28px] bg-zinc-800 rounded-md" />
          <div className="w-4 h-3 bg-zinc-800 rounded" />
          <div className="w-[28px] h-[28px] bg-zinc-800 rounded-md" />
        </div>
        
        {/* Right: Content Skeleton */}
        <div className="flex-1 space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-800 rounded-full shrink-0" />
            <div className="h-3 w-24 bg-zinc-800 rounded" />
            <div className="h-2 w-12 bg-zinc-800 rounded ml-1" />
          </div>
          <div className="h-5 w-3/4 bg-zinc-800 rounded" />
          <div className="h-3 w-full bg-zinc-800 rounded" />
          <div className="h-3 w-1/2 bg-zinc-800 rounded" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-14 bg-zinc-800 rounded border border-zinc-700/50" />
            <div className="h-5 w-16 bg-zinc-800 rounded border border-zinc-700/50" />
          </div>
        </div>
      </div>
    </div>
  );
}