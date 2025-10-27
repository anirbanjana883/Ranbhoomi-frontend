import React from 'react';
import Editor from '@monaco-editor/react';
import { FaSyncAlt, FaBrain } from 'react-icons/fa';

// --- Main Component for the Top-Right Pane ---
function CodeEditorPane({
  problem,
  selectedLanguage,
  code,
  handleLanguageChange,
  resetCode,
  handleEditorChange
}) {


  // --- Godfather Styles ---
  const paneHeaderStyle = `p-3 px-4 text-sm font-semibold text-gray-400 border-b-2 border-orange-800/60 bg-gradient-to-t from-black/60 to-gray-950/60 backdrop-blur-sm flex justify-between items-center shrink-0`;
  const iconButtonStyle = `p-2 rounded-full bg-black/40 border border-gray-700/50 text-orange-500 transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black shadow-sm hover:text-orange-400 hover:border-orange-600/60 hover:bg-orange-900/20 hover:shadow-[0_0_15px_rgba(255,100,0,0.3)] hover:scale-110 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-black/40 disabled:hover:scale-100 disabled:hover:translate-y-0`;

  return (
    <>
      <div className={paneHeaderStyle}>
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="bg-gray-800/50 border border-gray-700/80 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-orange-600/80 focus:ring-1 focus:ring-orange-600/50 appearance-none shadow-inner cursor-pointer"
        >
          {problem.starterCode.map((sc) => (
            <option key={sc.language} value={sc.language}>
              {sc.language.charAt(0).toUpperCase() + sc.language.slice(1)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-4 ">
          <button onClick={resetCode} title="Reset Code" className={iconButtonStyle}>
            <FaSyncAlt size={14} />
          </button>
          <button
            title="Complexity Analysis (Soon)"
            className={`${iconButtonStyle} hidden sm:block`}
            
          >
            <FaBrain size={15} />
          </button>
        </div>
      </div>
      <div className="flex-grow bg-gray-900 overflow-hidden">
        <Editor
          height="100%"
          language={selectedLanguage}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            fontFamily: '"Roboto Mono", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            padding: { top: 10 },
          }}
        />
      </div>
    </>
  );
}

export default CodeEditorPane;