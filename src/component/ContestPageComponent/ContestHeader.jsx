import React from 'react';
import { ChevronLeft } from 'lucide-react';
import ContestTimer from './ContestTimer';

const ContestHeader = ({ contestTitle, problemIndex, totalProblems, onFinish }) => {
  return (
    <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-semibold text-xs uppercase tracking-wider text-gray-500">
            {contestTitle || "Weekly Contest"}
          </h1>
          <div className="flex items-center text-white font-bold text-lg">
            <span>Problem {problemIndex + 1}</span>
            <span className="mx-2 text-gray-600">/</span>
            <span className="text-gray-400">{totalProblems}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Timer is embedded here */}
        <ContestTimer durationSeconds={5400} onTimeUp={() => alert("Contest Ended!")} />
        
        <button 
          onClick={onFinish}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-red-900/20"
        >
          Finish Contest
        </button>
      </div>
    </header>
  );
};

export default ContestHeader;