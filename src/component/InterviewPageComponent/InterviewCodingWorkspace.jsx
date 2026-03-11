import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaAngleDown, FaAngleUp, FaArrowsAltV } from "react-icons/fa";
import { toast } from "react-hot-toast";

import ProblemDescription from "../ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../ProblemPageComponent/ConsolePane";

const InterviewCodingWorkspace = ({
  problem,
  selectedLanguage,
  code,
  handleLanguageChange,
  handleEditorChange,
  setCode,
  submissionResult,
  isRunning = false,
  isSubmitting = false,
}) => {
  // --- UI Layout State ---
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");

  const [leftPaneWidth, setLeftPaneWidth] = useState(45);
  const [editorPaneHeight, setEditorPaneHeight] = useState(65);
  const [lastEditorHeight, setLastEditorHeight] = useState(65);
  
  const [isDragging, setIsDragging] = useState(false);

  // --- Refs ---
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);

  // ==========================================
  // 🚀 RESIZING LOGIC (Identical to ProblemPage)
  // ==========================================
  const handleMouseDownHorizontal = useCallback((e) => {
    e.preventDefault();
    isResizingHorizontal.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseDownVertical = useCallback((e) => {
    e.preventDefault();
    isResizingVertical.current = true;
    setIsDragging(true);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingHorizontal.current = false;
    isResizingVertical.current = false;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isResizingHorizontal.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      newWidth = Math.max(25, Math.min(75, newWidth));
      setLeftPaneWidth(newWidth);
    }

    if (isResizingVertical.current && rightPaneRef.current) {
      const rect = rightPaneRef.current.getBoundingClientRect();
      let newHeight = ((e.clientY - rect.top) / rect.height) * 100;

      if (newHeight < 10) newHeight = 0;
      else if (newHeight > 90) newHeight = 100;
      else newHeight = Math.max(10, Math.min(90, newHeight));

      setEditorPaneHeight(newHeight);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ==========================================
  // 🚀 CONSOLE TOGGLES
  // ==========================================
  const toggleConsole = (mode) => {
    if (mode === "hide") {
      if (editorPaneHeight > 0 && editorPaneHeight < 100) setLastEditorHeight(editorPaneHeight);
      setEditorPaneHeight(100);
    } else if (mode === "full") {
      if (editorPaneHeight > 0 && editorPaneHeight < 100) setLastEditorHeight(editorPaneHeight);
      setEditorPaneHeight(0);
    } else if (mode === "restore") {
      setEditorPaneHeight(lastEditorHeight || 60);
    }
  };

  // Auto-expand console when result arrives
  useEffect(() => {
    if (submissionResult && editorPaneHeight === 100) {
      setEditorPaneHeight(lastEditorHeight || 60);
      setActiveConsoleTab("result");
    }
  }, [submissionResult]);

  return (
    <div 
      ref={containerRef}
      className="flex w-full h-full bg-zinc-950 p-1 gap-1 overflow-hidden font-sans"
    >
      
      {/* ======================= LEFT: PROBLEM PANE ======================= */}
      <div
        className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm transition-all duration-75"
        style={{ 
          width: `${leftPaneWidth}%`,
          pointerEvents: isDragging ? 'none' : 'auto' // Prevents iframe text selection while dragging!
        }}
      >
        <ProblemDescription
          problem={problem}
          slug={problem?.slug}
          activeLeftTab={activeProblemTab}
          setActiveLeftTab={setActiveProblemTab}
          submissions={[]}
          loadingSubmissions={false}
          setSubmissions={() => {}}
          setLoadingSubmissions={() => {}}
          isContestMode={true} // True disables local premium locks if needed
        />
      </div>

      {/* ======================= HORIZONTAL RESIZER ======================= */}
      <div
        onMouseDown={handleMouseDownHorizontal}
        className="w-2 h-full cursor-col-resize flex flex-col justify-center items-center group z-10 hover:bg-zinc-800/50 rounded transition-colors shrink-0"
        title="Drag to resize panels"
      >
        <div className="h-8 w-[3px] bg-zinc-700 rounded-full group-hover:bg-red-500 transition-colors"></div>
      </div>

      {/* ======================= RIGHT: EDITOR & CONSOLE ======================= */}
      <div
        ref={rightPaneRef}
        className="flex flex-col h-full overflow-hidden flex-1 gap-1 transition-all duration-75"
        style={{ 
          width: `calc(${100 - leftPaneWidth}% - 8px)`,
          pointerEvents: isDragging ? 'none' : 'auto'
        }}
      >
        
        {/* TOP: Code Editor */}
        <div
          className="flex flex-col bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-all duration-200"
          style={{
            height: editorPaneHeight === 100 ? "calc(100% - 40px)" : `${editorPaneHeight}%`,
            display: editorPaneHeight === 0 ? "none" : "flex",
          }}
        >
          <CodeEditorPane
            problem={problem}
            selectedLanguage={selectedLanguage}
            code={code}
            handleLanguageChange={handleLanguageChange}
            handleEditorChange={handleEditorChange}
            resetCode={() => {
              const starter = problem?.starterCode?.find((s) => s.language === selectedLanguage);
              if (starter && window.confirm("Reset your code to initial state?")) setCode(starter.code);
            }}
          />
        </div>

        {/* MIDDLE: Resizer & Console Toggles */}
        <div
          onMouseDown={handleMouseDownVertical}
          className="h-[36px] shrink-0 w-full bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center px-4 cursor-row-resize z-10 group shadow-sm select-none"
          title="Drag to resize console"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
            <span className="w-8 h-[3px] bg-zinc-700 rounded-full group-hover:bg-red-500 transition-colors mr-2"></span>
            Console
          </div>

          <div className="flex items-center gap-1 text-zinc-500">
            {editorPaneHeight < 100 && (
              <button
                title="Minimize Console"
                onClick={(e) => { e.stopPropagation(); toggleConsole("hide"); }}
                className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              >
                <FaAngleDown size={14} />
              </button>
            )}
            {editorPaneHeight > 0 && editorPaneHeight < 100 && (
              <button
                title="Maximize Console"
                onClick={(e) => { e.stopPropagation(); toggleConsole("full"); }}
                className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              >
                <FaAngleUp size={14} />
              </button>
            )}
            {(editorPaneHeight === 0 || editorPaneHeight === 100) && (
              <button
                title="Restore Split"
                onClick={(e) => { e.stopPropagation(); toggleConsole("restore"); }}
                className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              >
                <FaArrowsAltV size={12} />
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM: Console / Test Cases */}
        <div 
            className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-all duration-200"
            style={{
              height: editorPaneHeight === 0 ? "calc(100% - 40px)" : `calc(${100 - editorPaneHeight}% - 40px)`,
              display: editorPaneHeight === 100 ? "none" : "flex",
            }}
        >
          <ConsolePane
            problemTestCases={problem?.testCases || []}
            submissionResult={submissionResult}
            isSubmitting={isSubmitting || isRunning}
            handleSubmit={() => toast.error("Please submit using the Top Header.", { id: 'submit' })}
            handleRun={() => toast.error("Please run code using the Top Header.", { id: 'run' })}
            activeRightTab={activeConsoleTab}
            setActiveRightTab={setActiveConsoleTab}
          />
        </div>

      </div>
    </div>
  );
};

export default InterviewCodingWorkspace;