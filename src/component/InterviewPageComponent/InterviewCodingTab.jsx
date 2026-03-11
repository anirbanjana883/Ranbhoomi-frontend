import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast"; // 🚀 Standardized on react-hot-toast
import { serverUrl } from "../../App";
import { FaPlay, FaPaperPlane } from "react-icons/fa";

// Import your components
import ProblemDescription from "../ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../ProblemPageComponent/ConsolePane";

function InterviewCodingTab({ problem, socket, roomID, code, setCode, selectedLanguage, setSelectedLanguage }) {
  
  // --- All state related to this tab ---
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // --- Resizing state ---
  const [leftPaneWidth, setLeftPaneWidth] = useState(45);
  const [problemHeight, setProblemHeight] = useState(60);
  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- Fetch Submissions ---
  useEffect(() => {
    const fetchSubs = async () => {
      if (activeProblemTab === "submissions" && problem) {
        setLoadingSubmissions(true);
        try {
          const { data } = await axios.get(
            `${serverUrl}/api/submissions/problem/${problem.slug}`,
            { withCredentials: true }
          );
          // Unwrap the ApiResponse if necessary
          const subs = data?.data || data;
          setSubmissions(Array.isArray(subs) ? subs : []);
        } catch {
          toast.error("Failed to load submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    fetchSubs();
  }, [activeProblemTab, problem]);

  // --- Resizing Logic ---
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
    if (isResizingVertical.current && leftPaneRef.current) {
      const rect = leftPaneRef.current.getBoundingClientRect();
      let newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      newHeight = Math.max(20, Math.min(80, newHeight));
      setProblemHeight(newHeight);
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

  // --- Editor Handlers ---
  const handleEditorChange = (newCode) => {
    setCode(newCode); 
    socket?.emit("code-change", { roomID, code: newCode });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang); 
    const starter = problem.starterCode.find((s) => s.language === newLang);
    const newCode = starter ? starter.code : `// ${newLang} starter code`;
    setCode(newCode); 
    socket?.emit("language-change", { roomID, language: newLang });
    socket?.emit("code-change", { roomID, code: newCode });
  };
  
  const resetCode = () => {
    const starter = problem.starterCode.find(
      (s) => s.language === selectedLanguage
    );
    if (starter) setCode(starter.code);
  };

  // --- Submission Logic ---
  const pollForResult = (submissionId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setActiveConsoleTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);
    socket?.emit("submission-update", { roomID, result: { status: "Judging" } });

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/submissions/status/${submissionId}`,
          { withCredentials: true }
        );
        const result = data?.data || data;

        socket?.emit("submission-update", { roomID, result });
        if (result.status !== "Judging" && result.status !== "Pending" && result.status !== "Queued") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsSubmitting(false);
          setSubmissionResult(result);
          
          if (result.status === "Accepted") toast.success("Solution Accepted!");
          else toast.error(`Submission: ${result.status}`);

          if (activeProblemTab === "submissions") {
            setActiveProblemTab("");
            setTimeout(() => setActiveProblemTab("submissions"), 50);
          }
        } else {
          setSubmissionResult(result);
        }
      } catch (err) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsSubmitting(false);
        const errorResult = { status: "Error checking status." };
        setSubmissionResult(errorResult);
        socket?.emit("submission-update", { roomID, result: errorResult });
      }
    }, 2000);
    setPollingInterval(interval);
  };

  const handleSubmit = async () => {
    if (!code.trim() || !problem) return toast.error("Code cannot be empty.");
    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab("result");
    socket?.emit("submission-update", { roomID, result: { status: "Judging" } });

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/submissions`,
        { slug: problem.slug, language: selectedLanguage, code },
        { withCredentials: true }
      );
      
      const pendingSubId = data?.data?.submissionId || data?.submissionId || data?.data?._id || data?._id;
      if (pendingSubId) pollForResult(pendingSubId);
      else throw new Error("No submission ID returned");

    } catch (err) {
      setIsSubmitting(false);
      toast.error(err?.response?.data?.message || "Submission failed.");
    }
  };
  
  const handleRun = () => toast.error("Please use the Run button in the Top Header.");

  // --- Listen for submission updates from partner ---
  useEffect(() => {
    if (!socket) return;
    const handleSubmissionUpdate = (result) => {
      if (!result) return;
      setSubmissionResult(result);
      if (result.status !== "Judging" && result.status !== "Pending" && result.status !== "Queued") {
        setIsSubmitting(false);
      }
    };
    socket.on("submission-update", handleSubmissionUpdate);
    return () => {
      socket.off("submission-update", handleSubmissionUpdate);
    };
  }, [socket]);
  
  // --- Strict TUF Styles ---
  const actionBtnStyle = "flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const runBtnStyle = `${actionBtnStyle} bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white`;
  const submitBtnStyle = `${actionBtnStyle} bg-red-600 text-white border border-transparent hover:bg-red-500 shadow-sm`;

  return (
    // 🚀 Added p-1 gap-1 for IDE-style pane separation
    <div 
      ref={containerRef} 
      className="flex w-full h-full bg-zinc-950 p-1 gap-1 font-sans overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ======================= LEFT PANE ======================= */}
      <div
        ref={leftPaneRef}
        className="h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm transition-all duration-75"
        style={{ width: `${leftPaneWidth}%` }}
      >
        {/* Top: Problem Description */}
        <div 
          className="flex flex-col border-b border-zinc-800" 
          style={{ height: `${problemHeight}%`, pointerEvents: isDragging ? 'none' : 'auto' }}
        >
           {/* Tab Header */}
           <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight truncate pr-4">{problem.title}</h2>
              <div className="flex gap-2">
                  <button onClick={handleRun} disabled={isSubmitting} className={runBtnStyle}>
                      <FaPlay size={10} className="text-emerald-500" /> <span className="hidden sm:inline">Run</span>
                  </button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className={submitBtnStyle}>
                      {isSubmitting ? (
                        <div className="w-3 h-3 border-2 border-red-200 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <FaPaperPlane size={10} />
                      )}
                      <span className="hidden sm:inline">{isSubmitting ? "Evaluating" : "Submit"}</span>
                  </button>
              </div>
           </div>

           <div className="flex-grow overflow-hidden bg-zinc-900">
              <ProblemDescription 
                  problem={problem} 
                  slug={problem.slug} 
                  activeLeftTab={activeProblemTab}
                  setActiveLeftTab={setActiveProblemTab}
                  submissions={submissions}
                  loadingSubmissions={loadingSubmissions}
                  setSubmissions={setSubmissions}
                  setLoadingSubmissions={setLoadingSubmissions}
                  isContestMode={true}
              />
           </div>
        </div>

        {/* Vertical Resizer */}
        <div
          onMouseDown={handleMouseDownVertical}
          className="w-full h-2 bg-zinc-900 flex items-center justify-center cursor-row-resize hover:bg-zinc-800 transition-colors z-10 group shrink-0"
        >
          <div className="w-8 h-[3px] bg-zinc-700 rounded-full group-hover:bg-red-500 transition-colors"></div>
        </div>

        {/* Bottom: Console */}
        <div 
          className="flex-1 min-h-0 overflow-hidden bg-zinc-900 rounded-b-lg"
          style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
        >
          <ConsolePane
            problemTestCases={problem.testCases}
            submissionResult={submissionResult}
            isSubmitting={isSubmitting}
            handleSubmit={() => {}} 
            handleRun={() => {}} 
            activeRightTab={activeConsoleTab}
            setActiveRightTab={setActiveConsoleTab}
          />
        </div>
      </div>

      {/* ======================= HORIZONTAL RESIZER ======================= */}
      <div
        onMouseDown={handleMouseDownHorizontal}
        className="w-2 h-full flex flex-col justify-center items-center cursor-col-resize hover:bg-zinc-800/50 rounded transition-colors z-10 group shrink-0"
      >
        <div className="h-8 w-[3px] bg-zinc-700 rounded-full group-hover:bg-red-500 transition-colors"></div>
      </div>

      {/* ======================= RIGHT PANE (Code Editor) ======================= */}
      <div
        className="flex flex-col h-full overflow-hidden bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm transition-all duration-75"
        style={{ width: `calc(${100 - leftPaneWidth}% - 8px)`, pointerEvents: isDragging ? 'none' : 'auto' }}
      >
        <CodeEditorPane
          problem={problem}
          selectedLanguage={selectedLanguage}
          code={code}
          handleLanguageChange={handleLanguageChange}
          handleEditorChange={handleEditorChange}
          resetCode={resetCode}
        />
      </div>

    </div>
  );
}

export default InterviewCodingTab;