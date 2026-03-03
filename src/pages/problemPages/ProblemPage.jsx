import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { serverUrl } from "../../App";
import {
  FaArrowLeft,
  FaPlay,
  FaPaperPlane,
  FaRobot,
  FaCog,
  FaAngleDown,
  FaAngleUp,
  FaArrowsAltV
} from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import API from "../../api/axios.js"

// Import your components
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";
import AIChatPanel from "../../component/ProblemPageComponent/AIChatPanel";

// --- Loading Spinner (Clean TUF Style) ---
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 space-y-4">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
    <p className="text-zinc-400 text-sm font-medium">Loading Workspace...</p>
  </div>
);

function ProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // --- Data State ---
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- UI State ---
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");

  // --- Editor State ---
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [code, setCode] = useState("");

  // --- Submission State ---
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // --- Layout State ---
  const [leftPaneWidth, setLeftPaneWidth] = useState(45);
  const [editorPaneHeight, setEditorPaneHeight] = useState(65); 
  const [lastEditorHeight, setLastEditorHeight] = useState(65); // Remembers height for restoring

  const [showAI, setShowAI] = useState(false);

  // --- Refs ---
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null); 
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);

  // --- 1. Fetch Problem ---
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/problems/${slug}`);
        const problemData = data?.data || data;
        
        setProblem(problemData);
        
        if (problemData?.starterCode?.length > 0) {
          setSelectedLanguage(problemData.starterCode[0].language);
          setCode(problemData.starterCode[0].code);
        } else {
          setCode("// No starter code found.");
        }
      } catch (err) {
        console.error("Problem Fetch Error:", err);
        setError("Failed to load problem.");
        toast.error(err.response?.data?.message || "Failed to load problem.");
      } finally {
        setLoading(false);
      }
    };
    
    if (slug && slug !== "undefined") {
        fetchProblem();
    } else {
        setLoading(false);
        setError("Invalid problem URL.");
    }
  }, [slug]);

  // --- 2. Fetch Submissions ---
  useEffect(() => {
    const fetchSubs = async () => {
      if (activeProblemTab === "submissions" && problem) {
        setLoadingSubmissions(true);
        try {
          const { data } = await API.get(`/submissions/problem/${problem.slug}`);
          const fetchedSubs = data?.data || data;
          setSubmissions(Array.isArray(fetchedSubs) ? fetchedSubs : []);
        } catch {
          toast.error("Failed to load submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    fetchSubs();
  }, [activeProblemTab, problem]);

  // --- 3. Layout & Resizing Logic ---
  const handleMouseDownHorizontal = useCallback((e) => {
    e.preventDefault();
    isResizingHorizontal.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseDownVertical = useCallback((e) => {
    e.preventDefault();
    isResizingVertical.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingHorizontal.current = false;
    isResizingVertical.current = false;
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
      
      // Snapping mechanics for smooth UX
      if (newHeight < 10) newHeight = 0; // Snap to full console
      else if (newHeight > 90) newHeight = 100; // Snap to hidden console
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

  // Console Toggle Helpers
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

  // --- 4. Editor Handlers ---
  const handleEditorChange = (val) => setCode(val || "");
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    const starter = problem.starterCode.find((s) => s.language === lang);
    setCode(starter ? starter.code : `// No starter code for ${lang}`);
  };
  const resetCode = () => {
    const starter = problem.starterCode.find(
      (s) => s.language === selectedLanguage
    );
    if (starter && window.confirm("Reset your code to initial state?")) setCode(starter.code);
  };

  // --- 5. Submission Logic ---
  const pollForResult = (submissionId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setActiveConsoleTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);

    const interval = setInterval(async () => {
      try {
        const { data } = await API.get(`/submissions/status/${submissionId}`);
        const result = data?.data || data;

        if (result.status !== "Judging" && result.status !== "Pending") {
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
        setSubmissionResult({ status: "Error checking status." });
      }
    }, 2000);
    setPollingInterval(interval);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error("Code cannot be empty.");
    
    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab("result"); 

    //  Auto-expand console if it's hidden when user submits
    if (editorPaneHeight === 100) {
      setEditorPaneHeight(lastEditorHeight || 60); 
    } else if (editorPaneHeight > 75) {
      setEditorPaneHeight(60); // Pop up a bit more to see results clearly
    }

    try {
      const { data } = await API.post(`/submissions`, { 
          slug: problem.slug, 
          language: selectedLanguage, 
          code 
      });
      const pendingSubmission = data?.data || data;

      if (pendingSubmission._id) {
         toast.success("Submission Queued!");
         pollForResult(pendingSubmission._id);
      }

    } catch (err) {
      setIsSubmitting(false);
      if (err.response?.status === 429) {
        toast.error("You are submitting too fast!");
      } else {
        toast.error(err.response?.data?.message || "Submission failed.");
      }
    }
  };

  const handleRun = () => {
    toast.error("Run feature coming soon!");
  };

  if (loading) return <LoadingSpinner />;
  if (error || !problem)
    return <div className="text-zinc-400 text-center p-10 font-medium tracking-wide bg-zinc-950 min-h-screen">Problem not found</div>;

  // --- Styles  ---
  const actionBtnStyle = "flex items-center gap-2 px-4 py-1.5 rounded-md font-semibold text-xs transition-colors duration-200 focus:outline-none";
  const runBtnStyle = `${actionBtnStyle} bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white`;
  const submitBtnStyle = `${actionBtnStyle} bg-red-600 text-white border border-transparent hover:bg-red-500 shadow-sm`;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-sans"
    >
      {/* ======================= TOP NAVBAR ======================= */}
      <header className="shrink-0 flex items-center justify-between h-14 px-5 bg-zinc-950 border-b border-zinc-800 z-20 shadow-sm">
        
        {/* LEFT: Back Button & Title */}
        <div className="flex items-center gap-5 min-w-0 overflow-hidden">
          <button
            onClick={() => navigate("/practice")}
            className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider 
                       bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 
                       transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="uppercase">List</span>
          </button>

          <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="text-[15px] font-bold text-zinc-100 whitespace-nowrap truncate tracking-tight">
              {problem.title}
            </h1>
            {problem.isPremium && (
              <div className="bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md flex items-center shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <IoIosLock className="text-amber-500 text-sm" />
              </div>
            )}
          </div>
        </div>

        {/* CENTER: ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <button onClick={handleRun} disabled={isSubmitting} className={runBtnStyle}>
            <FaPlay size={10} className="text-emerald-500" /> <span>Run</span>
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className={submitBtnStyle}>
            <FaPaperPlane size={10} />
            <span>{isSubmitting ? "Judging..." : "Submit"}</span>
          </button>
        </div>

        {/* RIGHT: TOOLS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAI(!showAI)}
            title="Ask AI"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold transition-all ${
              showAI 
                ? "border-red-500/50 bg-red-500/10 text-red-400" 
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <FaRobot size={14} /> AI Tutor
          </button>
          <button title="Settings" className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <FaCog size={15} />
          </button>
        </div>
      </header>

      {/* ======================= MAIN LAYOUT ======================= */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-zinc-950 p-1 gap-1">
        
        {/* --- LEFT PANE (Problem Description Only) --- */}
        <div
          className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm"
          style={{ width: `${leftPaneWidth}%` }}
        >
          <ProblemDescription
            problem={problem}
            slug={problem.slug}
            activeLeftTab={activeProblemTab}
            setActiveLeftTab={setActiveProblemTab}
            submissions={submissions}
            loadingSubmissions={loadingSubmissions}
            setSubmissions={setSubmissions}
            setLoadingSubmissions={setLoadingSubmissions}
            isContestMode={false}
          />
        </div>

        {/* --- HORIZONTAL RESIZER --- */}
        <div
          onMouseDown={handleMouseDownHorizontal}
          className="w-2 h-full cursor-col-resize flex flex-col justify-center items-center group z-10 hover:bg-zinc-800/50 rounded transition-colors"
          title="Drag to resize panels"
        >
          <div className="h-8 w-[3px] bg-zinc-700 rounded-full group-hover:bg-red-500 transition-colors"></div>
        </div>

        {/* --- RIGHT PANE (Editor Top + Console Bottom) --- */}
        <div
          ref={rightPaneRef}
          className="flex flex-col h-full overflow-hidden gap-1"
          style={{ width: `calc(${100 - leftPaneWidth}% - 8px)` }} 
        >
          
          {/* TOP: Code Editor */}
          <div 
            className="flex flex-col bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-all duration-200"
            style={{ 
              height: editorPaneHeight === 100 ? 'calc(100% - 40px)' : `${editorPaneHeight}%`,
              display: editorPaneHeight === 0 ? 'none' : 'flex'
            }}
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

          {/* MIDDLE: Stylish Console Handle / Resizer */}
          <div
            onMouseDown={handleMouseDownVertical}
            className="h-[36px] shrink-0 w-full bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center px-4 cursor-row-resize z-10 group shadow-sm select-none"
            title="Drag to resize console"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
              <span className="w-8 h-[3px] bg-zinc-700 rounded-full group-hover:bg-red-500 transition-colors mr-2"></span>
              Console
            </div>
            
            {/* Console Toggle Controls */}
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

          {/* BOTTOM: Console */}
          <div 
            className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-all duration-200"
            style={{ 
              height: editorPaneHeight === 0 ? 'calc(100% - 40px)' : `calc(${100 - editorPaneHeight}% - 40px)`,
              display: editorPaneHeight === 100 ? 'none' : 'flex'
            }}
          >
            <ConsolePane
              problemTestCases={problem.testCases}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              handleRun={handleRun}
              activeRightTab={activeConsoleTab}
              setActiveRightTab={setActiveConsoleTab}
            />
          </div>

        </div>
      </div>

      {/* ======================= AI OVERLAY ======================= */}
      {showAI && (
        <div className="absolute top-16 right-6 bottom-6 w-[400px] shadow-2xl z-50 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col">
          <AIChatPanel
            onClose={() => setShowAI(false)}
            problem={problem}
            userCode={code} 
          />
        </div>
      )}
    </div>
  );
}

export default ProblemPage;