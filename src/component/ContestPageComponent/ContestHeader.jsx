import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaFlagCheckered, FaList } from 'react-icons/fa';
import ContestTimer from './ContestTimer';

const ContestHeader = ({ contest, currentProblemSlug, totalProblems }) => {
  const navigate = useNavigate();

  // Find current index (1-based for display)
  const currentIndex = contest?.problems?.findIndex(
    p => p.problem.slug === currentProblemSlug
  ) + 1 || 1;

  return (
    <header className="h-16 bg-[#050505] border-b border-orange-900/30 flex items-center justify-between px-6 z-20 shrink-0">
      {/* LEFT: Navigation & Title */}
      <div className="flex items-center gap-5">
        <button 
          onClick={() => navigate(`/contest/${contest.slug}`)}
          className="p-2 rounded-full border border-gray-800 text-gray-400 hover:text-orange-500 hover:border-orange-500/50 hover:bg-orange-950/20 transition-all"
        >
          <FaChevronLeft size={14} />
        </button>

        <div>
          <h1 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">
            {contest.title}
          </h1>
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-orange-500">Problem {currentIndex}</span>
            <span className="text-gray-700">/</span>
            <span className="text-gray-400">{totalProblems}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Timer & Actions */}
      <div className="flex items-center gap-6">
        <ContestTimer 
          endTime={contest.endTime} 
          onTimeUp={() => {
            alert("Contest Ended!");
            navigate('/contests');
          }} 
        />
        
        <button 
          onClick={() => navigate('/contests')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-900/10 border border-red-600/30 text-red-400 text-sm font-bold hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all"
        >
          <FaFlagCheckered />
          <span className="hidden sm:inline">Finish</span>
        </button>
      </div>
    </header>
  );
};

export default ContestHeader;