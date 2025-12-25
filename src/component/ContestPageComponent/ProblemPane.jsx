import React from 'react';
import { AlertCircle } from 'lucide-react';

const ProblemPane = ({ problem }) => {
  return (
    <div className="flex-1 bg-gray-900 text-gray-300 overflow-y-auto custom-scrollbar border-r border-gray-800 flex flex-col">
      {/* Restricted Navigation Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <button className="px-6 py-3 text-sm font-medium text-white border-b-2 border-blue-500 bg-gray-800/30">
          Description
        </button>
        <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors">
          Submissions
        </button>
      </div>

      <div className="p-6 space-y-8 flex-1">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">{problem.title}</h2>
          <div className="flex space-x-3 mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Hard</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">10 Points</span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="leading-relaxed text-gray-300">{problem.description}</p>
          </div>
        </div>

        {/* Examples Section */}
        <div className="space-y-4">
          {problem.examples.map((ex, i) => (
            <div key={i} className="bg-gray-800/40 rounded-xl p-4 border border-gray-800">
              <h3 className="text-sm font-bold text-white mb-3">Example {i + 1}</h3>
              <div className="space-y-3 font-mono text-sm">
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Input</span>
                  <div className="bg-gray-950 p-2.5 rounded-lg text-gray-300 border border-gray-800">{ex.input}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Output</span>
                  <div className="bg-gray-950 p-2.5 rounded-lg text-gray-300 border border-gray-800">{ex.output}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Anti-Cheating / Rules Notice */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mt-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-200/80">
              <p className="font-bold mb-1 text-blue-400">Contest Mode Active</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>AI Assistance is disabled.</li>
                <li>Solutions are hidden.</li>
                <li>Plagiarism checks are active.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPane;