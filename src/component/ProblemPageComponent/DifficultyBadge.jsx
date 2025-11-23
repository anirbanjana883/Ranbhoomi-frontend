import React from 'react';

const DifficultyBadge = ({ difficulty }) => {
  let colorClasses = '';
  
  switch (difficulty) {
    case 'Easy':
      colorClasses = 'bg-green-900/20 text-green-400 border-green-600/50 shadow-[0_0_12px_rgba(74,222,128,0.2)]';
      break;
    case 'Medium':
      colorClasses = 'bg-yellow-900/20 text-yellow-400 border-yellow-600/50 shadow-[0_0_12px_rgba(250,204,21,0.2)]';
      break;
    case 'Hard':
      colorClasses = 'bg-red-900/20 text-red-400 border-red-600/50 shadow-[0_0_12px_rgba(248,113,113,0.2)]';
      break;
    case 'Super Hard':
      colorClasses = 'bg-purple-900/20 text-purple-400 border-purple-600/50 shadow-[0_0_12px_rgba(192,132,252,0.2)]';
      break;
    default:
      colorClasses = 'bg-gray-800 text-gray-400 border-gray-600';
  }

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}
    >
      {difficulty}
    </span>
  );
};

export default DifficultyBadge;