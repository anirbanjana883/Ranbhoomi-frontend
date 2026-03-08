import React, { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark } from '@uiw/codemirror-theme-github';
import { FaSyncAlt, FaCog, FaTimes } from 'react-icons/fa';

export default function ContestEditorPane({
  problem,
  selectedLanguage,
  code,
  handleLanguageChange, 
  handleEditorChange,   
  resetCode
}) {
  const [fontSize, setFontSize] = useState(14);
  const [themeName, setThemeName] = useState("vscode");
  const [showSettings, setShowSettings] = useState(false);

  const extensions = useMemo(() => {
    switch (selectedLanguage?.toLowerCase()) {
      case 'javascript': return [javascript({ jsx: true })];
      case 'python': return [python()];
      case 'java': return [java()];
      case 'c++':
      case 'cpp': return [cpp()];
      default: return [javascript()];
    }
  }, [selectedLanguage]);

  const getTheme = () => {
    switch (themeName) {
      case 'dracula': return dracula;
      case 'github': return githubDark;
      case 'vscode':
      default: return vscodeDark;
    }
  };

  const availableLanguages = problem?.starterCode || [
    { language: "javascript" }, { language: "python" }, { language: "java" }, { language: "cpp" }
  ];

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      
      {/* HEADER SECTION */}
      <div className="flex-none p-2 px-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center z-20 shadow-sm">
        
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
        >
          {availableLanguages.map((sc) => (
            <option key={sc.language} value={sc.language}>
              {sc.language === 'cpp' ? 'C++' : sc.language.charAt(0).toUpperCase() + sc.language.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button onClick={resetCode} title="Reset to Starter Code" className="p-2 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors focus:outline-none">
            <FaSyncAlt size={12} />
          </button>
          
          <div className="relative">
            <button 
                onClick={() => setShowSettings(!showSettings)} 
                title="Editor Settings" 
                className={`p-2 rounded-md transition-colors focus:outline-none ${showSettings ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}
            >
                <FaCog size={14} />
            </button>

            {/* DROPDOWN MENU */}
            {showSettings && (
            <div className="absolute top-10 right-0 z-50 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-5 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800/80">
                    <h3 className="text-zinc-100 text-[10px] font-bold uppercase tracking-widest">Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-red-400"><FaTimes size={10}/></button>
                </div>
                
                <div className="mb-5">
                    <label className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold block mb-2">Theme</label>
                    <div className="grid grid-cols-1 gap-2">
                        {['vscode', 'dracula', 'github'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setThemeName(t)}
                                className={`text-left px-3 py-2 text-xs rounded-md border transition-all ${
                                    themeName === t 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400 font-semibold' 
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <label className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Font Size</label>
                        <span className="text-red-400 font-mono font-bold">{fontSize}px</span>
                    </div>
                    <input 
                        type="range" min="12" max="24" step="1" value={fontSize} 
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* EDITOR AREA */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[#1e1e1e]" style={{ fontSize: `${fontSize}px` }}>
        <div className="absolute inset-0">
            <CodeMirror
              value={code}
              height="100%"
              width="100%"
              theme={getTheme()} 
              extensions={extensions}
              onChange={(value) => handleEditorChange(value)}
              className="h-full custom-scrollbar"
              basicSetup={{
                  lineNumbers: true, highlightActiveLineGutter: true, foldGutter: true, dropCursor: true,
                  allowMultipleSelections: true, indentOnInput: true, bracketMatching: true, closeBrackets: true,
                  autocompletion: true, rectangularSelection: true, crosshairCursor: true, highlightActiveLine: true,
                  highlightSelectionMatches: true, closeBracketsKeymap: true, defaultKeymap: true, searchKeymap: true,
                  historyKeymap: true, foldKeymap: true, completionKeymap: true, lintKeymap: true,
              }}
            />
        </div>
      </div>
    </div>
  );
}