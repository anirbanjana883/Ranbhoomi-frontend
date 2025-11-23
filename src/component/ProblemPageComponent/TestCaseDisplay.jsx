import React from 'react';

const TestCaseDisplay = ({ testCase, index }) => (
  <div className="mb-4 bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 rounded-lg border border-orange-800/40 shadow-sm hover:border-orange-600/60 transition-colors">
    <p className="font-bold text-orange-400 mb-2 text-sm">Example {index + 1}:</p>

    <div className="space-y-3 text-xs font-mono">
      <div>
        <strong className="text-gray-500 font-sans text-[11px] uppercase tracking-wider">
          Input:
        </strong>
        <pre className="mt-1 whitespace-pre-wrap bg-black/40 px-3 py-2 rounded text-gray-300 border border-gray-800">
          {testCase.input?.replace(/\\n/g, "\n")}
        </pre>
      </div>

      <div>
        <strong className="text-gray-500 font-sans text-[11px] uppercase tracking-wider">
          Output:
        </strong>
        <pre className="mt-1 whitespace-pre-wrap bg-black/40 px-3 py-2 rounded text-gray-300 border border-gray-800">
          {testCase.expectedOutput?.replace(/\\n/g, "\n")}
        </pre>
      </div>
    </div>
  </div>
);

export default TestCaseDisplay;