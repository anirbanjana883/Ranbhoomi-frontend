import React from 'react';
import { FaArrowLeft, FaFire } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function SheetHeader({ title, totalSolved, totalQuestions }) {
  const navigate = useNavigate();

  return (
    <header className="shrink-0 h-14 px-4 sm:px-6 bg-zinc-950/95 border-b border-zinc-800 flex items-center justify-between z-30 backdrop-blur-md">
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => navigate('/roadmaps')}
          className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
        >
          <FaArrowLeft size={13} />
        </button>

        <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-1 h-5 bg-red-600 rounded-full shrink-0" />
          <h1 className="text-base font-bold text-zinc-100 tracking-tight truncate">
            {title || 'Curriculum Matrix'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600/10 border border-red-500/20">
          <FaFire size={11} className="text-red-500" />
          <span className="text-xs font-bold text-red-400 font-mono">
            {totalSolved}/{totalQuestions}
          </span>
        </div>
      </div>
    </header>
  );
}