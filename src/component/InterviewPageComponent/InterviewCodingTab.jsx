import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import { FaPlay, FaPaperPlane } from "react-icons/fa";

// Import your components
import ProblemDescription from "../ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../ProblemPageComponent/ConsolePane";

function InterviewCodingTab({ problem, socket, roomID, code, setCode, selectedLanguage, setSelectedLanguage }) {
  
  // --- All state related to this tab is now MOVED here ---
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // --- Resizing state is MOVED here ---
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
          setSubmissions(Array.isArray(data) ? data : []);
        } catch {
          toast.error("Failed to load submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    fetchSubs();
  }, [activeProblemTab, problem]);

  // --- Resizing Logic (MOVED here) ---
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

  // --- Editor Handlers (Uses props) ---
  const handleEditorChange = (newCode) => {
    setCode(newCode); // Update parent state
    socket?.emit("code-change", { roomID, code: newCode });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang); // Update parent state
    const starter = problem.starterCode.find((s) => s.language === newLang);
    const newCode = starter ? starter.code : `// ${newLang} starter code`;
    setCode(newCode); // Update parent state
    socket?.emit("language-change", { roomID, language: newLang });
    socket?.emit("code-change", { roomID, code: newCode });
  };
  
  const resetCode = () => {
    const starter = problem.starterCode.find(
      (s) => s.language === selectedLanguage
    );
    if (starter) setCode(starter.code);
  };

  // --- Submission Logic (MOVED here) ---
  const pollForResult = (submissionId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setActiveConsoleTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);
    socket?.emit("submission-update", { roomID, result: { status: "Judging" } });

    const interval = setInterval(async () => {
      try {
        const { data: result } = await axios.get(
          `${serverUrl}/api/submissions/status/${submissionId}`,
          { withCredentials: true }
        );
        socket?.emit("submission-update", { roomID, result });
        if (result.status !== "Judging" && result.status !== "Pending") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsSubmitting(false);
          setSubmissionResult(result);
          toast.success(`Submission ${result.status}!`);
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
    setPollingInterval(pollingInterval);
  };

  const handleSubmit = async () => {
    if (!code.trim() || !problem) return toast.warn("Code cannot be empty.");
    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab("result");
    socket?.emit("submission-update", { roomID, result: { status: "Judging" } });

    try {
      const { data: pendingSubmission } = await axios.post(
        `${serverUrl}/api/submissions`,
        { slug: problem.slug, language: selectedLanguage, code },
        { withCredentials: true }
      );
      if (pendingSubmission._id) pollForResult(pendingSubmission._id);
    } catch (err) {
      setIsSubmitting(false);
      toast.error(err?.response?.data?.message || "Submission failed.");
    }
  };
  
  const handleRun = () => toast.info("Run functionality coming soon!");

  // --- Listen for submission updates from partner ---
  useEffect(() => {
    if (!socket) return;
    const handleSubmissionUpdate = (result) => {
      if (!result) return;
      setSubmissionResult(result);
      if (result.status !== "Judging" && result.status !== "Pending") {
        setIsSubmitting(false);
      }
    };
    socket.on("submission-update", handleSubmissionUpdate);
    return () => {
      socket.off("submission-update", handleSubmissionUpdate);
    };
  }, [socket]);
  
  // --- Styles ---
  const actionBtnStyle = "flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all transform active:scale-95";
  const runBtnStyle = `${actionBtnStyle} bg-gray-900 text-gray-300 border border-gray-700 hover:border-orange-500/50 hover:text-white hover:bg-gray-800 hover:shadow-[0_0_15px_rgba(255,165,0,0.1)]`;
  const submitBtnStyle = `${actionBtnStyle} bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500/50 shadow-[0_0_20px_rgba(255,69,0,0.4)] hover:shadow-[0_0_30px_rgba(255,69,0,0.6)] hover:scale-105`;


  return (
    <div 
      ref={containerRef} 
      className="flex w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* LEFT PANE: Problem (Top) + Console (Bottom) */}
      <div
        ref={leftPaneRef}
        className="h-full flex flex-col border-r border-orange-900/40"
        style={{ width: `${leftPaneWidth}%` }}
      >
        {/* Top: Problem Description (and Header Controls) */}
        <div 
          className="flex flex-col" 
          style={{ height: `${problemHeight}%`, pointerEvents: isDragging ? 'none' : 'auto' }}
        >
           <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-orange-900/40">
              <h2 className="text-sm font-bold text-white truncate max-w-[200px]">{problem.title}</h2>
              <div className="flex gap-2">
                  <button onClick={handleRun} disabled={isSubmitting} className={runBtnStyle}>
                      <FaPlay size={10} /> Run
                  </button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className={submitBtnStyle}>
                      <FaPaperPlane size={10} /> Submit
                  </button>
              </div>
           </div>

           <div className="flex-grow overflow-auto">
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
          className="w-full h-1.5 bg-gradient-to-r from-gray-900 via-orange-900/50 to-gray-900 hover:bg-orange-600/50 cursor-row-resize transition-colors z-10"
        />

        {/* Bottom: Console */}
        <div 
          className="flex-1 min-h-0 overflow-hidden bg-black"
          style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
        >
          <ConsolePane
            problemTestCases={problem.testCases}
            submissionResult={submissionResult}
            isSubmitting={isSubmitting}
            handleSubmit={() => {}} // Handled in header
            handleRun={() => {}} // Handled in header
            activeRightTab={activeConsoleTab}
            setActiveRightTab={setActiveConsoleTab}
          />
        </div>
      </div>

      {/* HORIZONTAL RESIZER */}
      <div
        onMouseDown={handleMouseDownHorizontal}
        className="w-1.5 h-full bg-gradient-to-b from-gray-900 via-orange-900/50 to-gray-900 hover:bg-orange-600/50 cursor-col-resize transition-colors z-10"
      />

      {/* RIGHT PANE: Code Editor (Full Height) */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `calc(${100 - leftPaneWidth}% - 6px)`, pointerEvents: isDragging ? 'none' : 'auto' }}
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