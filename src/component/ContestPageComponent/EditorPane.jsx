import React, { useState } from 'react';
import { Play, CheckCircle, FileCode, Settings, Maximize2, ChevronRight } from 'lucide-react';

const EditorPane = () => {
  const [code, setCode] = useState('class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your solution here\n        \n    }\n}');

  return (
    <div className="flex-1 flex flex-col bg-gray-950 min-w-0">
      {/* Editor Toolbar */}
      <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded text-gray-300 text-xs hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700">
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Java</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Input Area */}
      <div className="flex-1 relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-900 border-r border-gray-800 text-gray-600 text-xs font-mono flex flex-col items-center pt-4 select-none">
          {/* Simple Mock Line Numbers */}
          <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full bg-[#0d1117] text-gray-300 font-mono text-sm p-4 pl-16 resize-none focus:outline-none leading-6"
          spellCheck="false"
        />
      </div>

      {/* Action Footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-3">
        <div className="flex items-center justify-between">
          <button className="text-gray-400 text-xs hover:text-white transition-colors font-medium flex items-center space-x-1 px-3 py-2 rounded hover:bg-gray-800">
              <ChevronRight className="w-4 h-4" />
              <span>Console</span>
          </button>
          
          <div className="flex space-x-3">
            <button className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2 border border-gray-700">
              <Play className="w-4 h-4" />
              <span>Run</span>
            </button>
            <button className="px-6 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPane;