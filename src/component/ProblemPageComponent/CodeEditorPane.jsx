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
import { FaSyncAlt, FaCog, FaBrain } from 'react-icons/fa';

function CodeEditorPane({
  problem,
  selectedLanguage,
  code,
  handleLanguageChange,
  resetCode,
  handleEditorChange
}) {
  // --- Customization State ---
  const [fontSize, setFontSize] = useState(14);
  const [themeName, setThemeName] = useState("vscode");
  const [showSettings, setShowSettings] = useState(false);

  // --- Styles ---
  const paneHeaderStyle = `flex-none p-3 px-4 text-sm font-semibold text-gray-400 border-b-2 border-orange-800/60 bg-gradient-to-t from-black/60 to-gray-950/60 backdrop-blur-sm flex justify-between items-center z-20`;
  const iconButtonStyle = `p-2 rounded-full bg-black/40 border border-gray-700/50 text-orange-500 transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black shadow-sm hover:text-orange-400 hover:border-orange-600/60 hover:bg-orange-900/20 hover:shadow-[0_0_15px_rgba(255,100,0,0.3)] hover:scale-110 hover:-translate-y-0.5`;
  
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

  return (
    // Use a fragment here, but ensure parent is a flex container
    <>
      {/* Header Section (flex-none prevents it from shrinking/growing) */}
      <div className={paneHeaderStyle}>
        <div className="flex gap-2">
          <select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="bg-gray-800/50 border border-gray-700/80 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-orange-600/80 focus:ring-1 focus:ring-orange-600/50 appearance-none shadow-inner cursor-pointer"
          >
            {problem?.starterCode?.map((sc) => (
              <option key={sc.language} value={sc.language}>
                {sc.language.charAt(0).toUpperCase() + sc.language.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={resetCode} title="Reset Code" className={iconButtonStyle}>
            <FaSyncAlt size={12} />
          </button>
          
          {/* Settings Toggle */}
          <div className="relative">
            <button 
                onClick={() => setShowSettings(!showSettings)} 
                title="Editor Settings" 
                className={`${iconButtonStyle} ${showSettings ? 'bg-orange-900/40 border-orange-600' : ''}`}
            >
                <FaCog size={12} />
            </button>

            {/* --- SETTINGS DROPDOWN MENU --- */}
            {showSettings && (
            <div className="absolute top-8 right-0 z-50 w-64 bg-[#1e1e1e] border border-orange-700/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
                    <h3 className="text-orange-400 text-xs font-bold uppercase tracking-wider">Editor Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
                </div>
                
                {/* Theme Select */}
                <div className="mb-4">
                    <label className="text-gray-400 text-xs block mb-1.5 font-medium">Theme</label>
                    <div className="grid grid-cols-1 gap-2">
                        {['vscode', 'dracula', 'github'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setThemeName(t)}
                                className={`text-left px-3 py-2 text-xs rounded border transition-all ${
                                    themeName === t 
                                    ? 'bg-orange-600/20 border-orange-500 text-orange-300' 
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font Size Slider */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <label className="text-gray-400 font-medium">Font Size</label>
                        <span className="text-orange-400 font-mono">{fontSize}px</span>
                    </div>
                    <input 
                        type="range" min="12" max="24" step="1" value={fontSize} 
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-orange-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Section */}
      {/* FIX: flex-1 ensures it takes remaining space. min-h-0 allows scrolling. relative handles internal absolute pos. */}
      <div 
        className="flex-1 min-h-0 relative overflow-hidden bg-[#1e1e1e]"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="absolute inset-0">
            <CodeMirror
            value={code}
            height="100%" // Important!
            width="100%"
            theme={getTheme()} 
            extensions={extensions}
            onChange={(value, viewUpdate) => {
                handleEditorChange(value);
            }}
            className="h-full" // Tailwind height full
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
    </>
  );
}

export default CodeEditorPane;