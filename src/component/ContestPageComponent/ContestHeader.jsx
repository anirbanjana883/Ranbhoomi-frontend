import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaFlagCheckered, FaPlay, FaPaperPlane } from 'react-icons/fa';
import ContestTimer from './ContestTimer';

export default function ContestHeader({ 
  contest, 
  currentProblemSlug, 
  totalProblems,
  handleRun,       
  handleSubmit,    
  isSubmitting,
  isRunning,      // 👈 Added Prop for Run State
  runStatusText   // 👈 Added Prop for Run Progress
}) {
  const navigate = useNavigate();

  const currentIndex = contest?.problems?.findIndex(
    p => p.problem.slug === currentProblemSlug
  ) + 1 || 1;

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 shadow-sm">
      
      {/* LEFT: Navigation & Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/contest/${contest.slug}`)}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Back to Arena Dashboard"
        >
          <FaChevronLeft size={12} />
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 hidden md:block">
            {contest.title}
          </h1>
          <div className="h-3 w-px bg-zinc-800 hidden md:block"></div>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="text-zinc-200">Problem {currentIndex}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">{totalProblems}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Actions & Timer */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* 🚀 LIVE EXECUTION BUTTONS */}
        <div className="flex items-center gap-2 mr-1 sm:mr-2">
          
          {/* FAANG RUN BUTTON */}
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md font-semibold text-xs transition-colors duration-200 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <div className="w-3 h-3 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></div>
            ) : (
              <FaPlay size={10} className="text-emerald-500" />
            )}
            <span className="hidden sm:inline">
              {isRunning ? runStatusText || "Running..." : "Run"}
            </span>
            <span className="sm:hidden">{isRunning ? "..." : "Run"}</span>
          </button>

          {/* FAANG SUBMIT BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-4 sm:px-6 py-1.5 rounded-md font-semibold text-xs transition-colors duration-200 bg-red-600 text-white border border-transparent hover:bg-red-500 shadow-sm disabled:opacity-50 disabled:cursor-wait focus:outline-none"
          >
            {isSubmitting ? (
              <div className="w-3 h-3 border-2 border-red-200 border-t-white rounded-full animate-spin"></div>
            ) : (
              <FaPaperPlane size={10} />
            )}
            <span className="hidden sm:inline">{isSubmitting ? "Judging..." : "Submit"}</span>
            <span className="sm:hidden">{isSubmitting ? "..." : "Submit"}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>

        {/* Timer */}
        <ContestTimer 
          endTime={contest.endTime} 
          onTimeUp={() => {
            alert("Contest Ended!");
            navigate('/contests');
          }} 
        />
        
        {/* Finish Button */}
        <button 
          onClick={() => navigate('/contests')}
          className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <FaFlagCheckered size={12}/>
          <span>Finish</span>
        </button>

      </div>
    </header>
  );
}