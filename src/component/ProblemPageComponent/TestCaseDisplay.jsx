import React from 'react';

export default function TestCaseDisplay({ testCase, index }) {
  return (
    <div className="mb-5 bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-sm hover:border-zinc-700 transition-colors">
      <p className="font-bold text-zinc-100 mb-4 text-sm tracking-tight">
        Example {index + 1}
      </p>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1.5">
            Input
          </p>
          <pre className="whitespace-pre-wrap bg-zinc-950 px-4 py-3 rounded-md border border-zinc-800 text-zinc-300 font-mono text-xs leading-relaxed custom-scrollbar">
            {testCase.input?.replace(/\\n/g, "\n")}
          </pre>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1.5">
            Output
          </p>
          {/* Using emerald tint for output to signify the "expected/correct" result */}
          <pre className="whitespace-pre-wrap bg-zinc-950 px-4 py-3 rounded-md border border-zinc-800 text-emerald-400/90 font-mono text-xs leading-relaxed custom-scrollbar">
            {testCase.expectedOutput?.replace(/\\n/g, "\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}