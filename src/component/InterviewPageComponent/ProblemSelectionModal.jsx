import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { FaTimes, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function ProblemSelectionModal({ isOpen, onClose, onProblemSelect }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Advanced Filters ---
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  // Fetch all problems once, then filter client-side for speed
  useEffect(() => {
    if (isOpen) {
      const fetchProblems = async () => {
        setLoading(true);
        try {
          const { data } = await axios.get(`${serverUrl}/api/problems`, {
            withCredentials: true,
          });
          const problemsData = data?.data || data;
          setProblems(Array.isArray(problemsData) ? problemsData : []);
        } catch (err) {
          toast.error("Failed to fetch problems.");
        } finally {
          setLoading(false);
        }
      };
      fetchProblems();
    }
  }, [isOpen]);

  // --- Filtering Logic ---
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  if (!isOpen) return null;

  // --- Styles ---
  const basePillStyle = "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border cursor-pointer select-none";
  
  const diffPillActive = (d) => {
    if (difficultyFilter !== d) return `${basePillStyle} bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200`;
    return ({
      All:          `${basePillStyle} bg-zinc-200 border-zinc-300 text-zinc-900 shadow-sm`,
      Easy:         `${basePillStyle} bg-emerald-500/10 border-emerald-500/30 text-emerald-400`,
      Medium:       `${basePillStyle} bg-amber-500/10 border-amber-500/30 text-amber-400`,
      Hard:         `${basePillStyle} bg-red-500/10 border-red-500/30 text-red-400`,
      "Super Hard": `${basePillStyle} bg-purple-500/10 border-purple-500/30 text-purple-400`,
    })[d] ?? "";
  };

  const getDifficultyBadge = (difficulty) => {
    const badgeStyle = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border";
    switch (difficulty?.toLowerCase()) {
      case 'easy': return <span className={`${badgeStyle} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Easy</span>;
      case 'medium': return <span className={`${badgeStyle} bg-amber-500/10 text-amber-400 border-amber-500/20`}>Medium</span>;
      case 'hard': return <span className={`${badgeStyle} bg-red-500/10 text-red-400 border-red-500/20`}>Hard</span>;
      default: return <span className={`${badgeStyle} bg-zinc-800 text-zinc-400 border-zinc-700`}>{difficulty || 'Unknown'}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 font-sans">
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            Select an Interview Problem
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors duration-200 p-1 rounded-md hover:bg-zinc-800">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Filters Area */}
        <div className="p-6 pb-4 shrink-0 border-b border-zinc-800/50 bg-zinc-900">
          <div className="flex flex-col gap-4">
            
            {/* Difficulty Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2">Difficulty</span>
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <button key={d} onClick={() => setDifficultyFilter(d)} className={diffPillActive(d)}>
                  {d}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
              <input
                type="text"
                placeholder="Search problems by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 placeholder:text-zinc-600 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Problem List Area */}
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar bg-zinc-950/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className="w-8 h-8 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-sm font-medium">Loading problem repository...</p>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm space-y-2">
              <FaSearch size={24} className="text-zinc-700" />
              <p>No problems found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredProblems.map(problem => (
                <div 
                  key={problem._id} 
                  // 🚀 CRITICAL FIX: Passing the entire problem object, not just the ID!
                  onClick={() => onProblemSelect(problem)}
                  className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-800/80 cursor-pointer transition-colors duration-200 flex justify-between items-center group"
                >
                  <span className="text-zinc-300 font-semibold text-sm tracking-tight group-hover:text-zinc-100 transition-colors">
                    {problem.title}
                  </span>
                  {getDifficultyBadge(problem.difficulty)}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProblemSelectionModal;