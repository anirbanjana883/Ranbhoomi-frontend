import React, { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';

// Languages
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';

// Themes
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark } from '@uiw/codemirror-theme-github';

// Icons
import { FaSyncAlt, FaCog } from 'react-icons/fa';

function ContestEditorPane({
  problem,
  selectedLanguage,
  code,
  handleLanguageChange, // Expects (e) => ...
  handleEditorChange,   // Expects (val) => ...
  resetCode
}) {
  // --- Customization State ---
  const [fontSize, setFontSize] = useState(14);
  const [themeName, setThemeName] = useState("vscode");
  const [showSettings, setShowSettings] = useState(false);

  // --- Styles (Your Magma Theme) ---
  const paneHeaderStyle = `flex-none p-3 px-4 text-sm font-semibold text-gray-400 border-b border-orange-900/30 bg-[#050505] flex justify-between items-center z-20`;
  const iconButtonStyle = `p-2 rounded-lg bg-gray-900 border border-gray-700/50 text-orange-500 transition-all duration-200 ease-in-out transform focus:outline-none hover:text-orange-400 hover:border-orange-600/60 hover:bg-orange-900/20 hover:shadow-[0_0_15px_rgba(255,100,0,0.2)]`;

  // --- Helper: Get Extensions ---
  const extensions = useMemo(() => {
    switch (selectedLanguage.toLowerCase()) {
      case 'javascript': return [javascript({ jsx: true })];
      case 'python': return [python()];
      case 'java': return [java()];
      case 'c++':
      case 'cpp': return [cpp()];
      default: return [javascript()];
    }
  }, [selectedLanguage]);

  // --- Helper: Get Theme Object ---
  const getTheme = () => {
    switch (themeName) {
      case 'dracula': return dracula;
      case 'github': return githubDark;
      case 'vscode':
      default: return vscodeDark;
    }
  };

  // Safe check for starter code to prevent crashes
  const availableLanguages = problem?.starterCode || [
    { language: "javascript" }, 
    { language: "python" }, 
    { language: "java" }, 
    { language: "cpp" }
  ];

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      
      {/* --- HEADER SECTION --- */}
      <div className={paneHeaderStyle}>
        
        {/* Language Selector */}
        <div className="flex gap-2">
          <select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="bg-[#1e1e1e] border border-gray-700 text-gray-300 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600/50 appearance-none cursor-pointer hover:bg-[#252526]"
          >
            {availableLanguages.map((sc) => (
              <option key={sc.language} value={sc.language}>
                {sc.language.charAt(0).toUpperCase() + sc.language.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Tools & Settings */}
        <div className="flex items-center gap-2">
          <button onClick={resetCode} title="Reset Code" className={iconButtonStyle}>
            <FaSyncAlt size={12} />
          </button>
          
          <div className="relative">
            <button 
                onClick={() => setShowSettings(!showSettings)} 
                title="Editor Settings" 
                className={`${iconButtonStyle} ${showSettings ? 'bg-orange-900/30 border-orange-500/50' : ''}`}
            >
                <FaCog size={12} />
            </button>

            {/* --- DROPDOWN MENU --- */}
            {showSettings && (
            <div className="absolute top-10 right-0 z-50 w-64 bg-[#181818] border border-orange-900/40 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                    <h3 className="text-orange-500 text-xs font-bold uppercase tracking-widest">Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
                </div>
                
                {/* Theme Select */}
                <div className="mb-5">
                    <label className="text-gray-400 text-[10px] uppercase font-bold block mb-2">Theme</label>
                    <div className="grid grid-cols-1 gap-1">
                        {['vscode', 'dracula', 'github'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setThemeName(t)}
                                className={`text-left px-3 py-2 text-xs rounded border transition-all ${
                                    themeName === t 
                                    ? 'bg-orange-600/10 border-orange-600/50 text-orange-400 font-bold' 
                                    : 'bg-[#222] border-transparent text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
                                }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font Size Slider */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <label className="text-gray-400 font-bold text-[10px] uppercase">Font Size</label>
                        <span className="text-orange-400 font-mono">{fontSize}px</span>
                    </div>
                    <input 
                        type="range" min="12" max="24" step="1" value={fontSize} 
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-orange-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* --- EDITOR AREA --- */}
      <div 
        className="flex-1 min-h-0 relative overflow-hidden bg-[#1e1e1e]"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="absolute inset-0">
            <CodeMirror
              value={code}
              height="100%"
              width="100%"
              theme={getTheme()} 
              extensions={extensions}
              onChange={(value) => handleEditorChange(value)}
              className="h-full"
              basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  foldGutter: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  crosshairCursor: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  closeBracketsKeymap: true,
                  defaultKeymap: true,
                  searchKeymap: true,
                  historyKeymap: true,
                  foldKeymap: true,
                  completionKeymap: true,
                  lintKeymap: true,
              }}
            />
        </div>
      </div>
    </div>
  );
}

export default ContestEditorPane;