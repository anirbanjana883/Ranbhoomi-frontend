import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../../App';
import { roadmaps } from '../../../utils/roadmapData'; 
import { FaMap, FaTrophy, FaChevronRight, FaCheckCircle } from 'react-icons/fa';

function RoadmapListPage() {
  const navigate = useNavigate();
  const [solvedIds, setSolvedIds] = useState(new Set()); // Store solved IDs for calculation (optional here, useful for detail page)
  
  // We won't fetch solved status here for simplicity, 
  // but you can add it to show "5/75 Solved" on the card later.

  // --- Theme Styles ---
  const cardStyle = `
    group relative overflow-hidden bg-black border border-orange-900/40 rounded-xl p-6
    transition-all duration-300 hover:border-orange-600/60 hover:-translate-y-1
    shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,69,0,0.2)]
    cursor-pointer flex flex-col justify-between h-full
  `;

  return (
    <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 [text-shadow:0_0_20px_rgba(255,69,0,0.6)]">
            Learning Paths
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Structured roadmaps to guide your preparation. Choose a path and start conquering the arena.
          </p>
        </div>

        {/* Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((roadmap) => (
            <div 
              key={roadmap.id} 
              className={cardStyle}
              onClick={() => navigate(`/roadmap/${roadmap.id}`)}
            >
              {/* Decorative Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-orange-600/20 transition-all" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-orange-900/20 border border-orange-700/30 text-orange-400">
                    <FaMap size={20} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 border border-gray-800 px-2 py-1 rounded">
                    {roadmap.category}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                  {roadmap.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {roadmap.description}
                </p>
              </div>

              {/* Stats / Footer */}
              <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-auto">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <FaTrophy className="text-yellow-600" />
                  <span>{roadmap.topics.reduce((acc, t) => acc + t.problems.length, 0)} Problems</span>
                </div>
                <span className="flex items-center gap-1 text-orange-500 font-bold text-sm group-hover:gap-2 transition-all">
                  Start <FaChevronRight size={10} />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default RoadmapListPage;