import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import {
  FaArrowLeft,
  FaPlay,
  FaPaperPlane,
  FaRobot,
  FaCog,
} from "react-icons/fa";
import { IoIosLock } from "react-icons/io";

// Import your components
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";
import AIChatPanel from "../../component/ProblemPageComponent/AIChatPanel";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-4">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin"></div>
    <p className="text-white text-lg">Loading Problem...</p>
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
  const [descPaneHeight, setDescPaneHeight] = useState(60);

  const [showAI, setShowAI] = useState(false);

  // --- Refs ---
  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);

  // --- 1. Fetch Problem ---
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/problems/getoneproblem/${slug}`,
          { withCredentials: true }
        );
        setProblem(data);
        if (data.starterCode?.length) {
          setSelectedLanguage(data.starterCode[0].language);
          setCode(data.starterCode[0].code);
        } else {
          setCode("// No starter code found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load problem.");
        toast.error("Failed to load problem.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  // --- 2. Fetch Submissions ---
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

  // --- 3. Resizing Logic ---
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
    // Horizontal: Left Pane vs Right Pane
    if (isResizingHorizontal.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      newWidth = Math.max(25, Math.min(75, newWidth));
      setLeftPaneWidth(newWidth);
    }
    // Vertical: Description vs Console (Left Pane)
    if (isResizingVertical.current && leftPaneRef.current) {
      const rect = leftPaneRef.current.getBoundingClientRect();
      let newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      newHeight = Math.max(20, Math.min(80, newHeight));
      setDescPaneHeight(newHeight);
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
    if (starter && window.confirm("Reset your code?")) setCode(starter.code);
  };

  // --- 5. Submission Logic ---
  const pollForResult = (submissionId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setActiveConsoleTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);

    const interval = setInterval(async () => {
      try {
        const { data: result } = await axios.get(
          `${serverUrl}/api/submissions/status/${submissionId}`,
          { withCredentials: true }
        );
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
        setSubmissionResult({ status: "Error checking status." });
      }
    }, 2000);
    setPollingInterval(interval);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.warn("Code cannot be empty.");
    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab("result");

    try {
      const { data: pendingSubmission } = await axios.post(
        `${serverUrl}/api/submissions`,
        { slug: problem.slug, language: selectedLanguage, code },
        { withCredentials: true }
      );
      if (pendingSubmission._id) pollForResult(pendingSubmission._id);
    } catch (err) {
      setIsSubmitting(false);
      toast.error("Submission failed.");
    }
  };

  const handleRun = () => {
    toast.info("Run feature coming soon!");
  };

  if (loading) return <LoadingSpinner />;
  if (error || !problem)
    return <div className="text-white text-center p-10">Problem not found</div>;

  // --- Styles ---
  const actionBtnStyle =
    "flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all transform active:scale-95";
  const runBtnStyle = `${actionBtnStyle} bg-gray-900 text-gray-300 border border-gray-700 hover:border-orange-500/50 hover:text-white hover:bg-gray-800 hover:shadow-[0_0_15px_rgba(255,165,0,0.1)]`;
  const submitBtnStyle = `${actionBtnStyle} bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500/50 shadow-[0_0_20px_rgba(255,69,0,0.4)] hover:shadow-[0_0_30px_rgba(255,69,0,0.6)] hover:scale-105`;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-[#050505] text-gray-200 overflow-hidden godfather-bg"
    >
      {/* ======================= TOP NAVBAR ======================= */}
      <header className="flex-shrink-0 flex items-center justify-between h-16 px-6 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-orange-900/60 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20 relative">
        {/* LEFT: Back Button & Title */}
        <div className="flex items-center gap-5 min-w-0 overflow-hidden">
          <button
            onClick={() => navigate("/practice")}
            className="group flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-wider 
                       bg-black/50 border border-gray-800 rounded-full py-2 px-4 
                       transition-all duration-300 
                       hover:border-orange-600/80 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(255,69,0,0.2)]"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Arena</span>
          </button>

          <div className="flex items-center gap-3 overflow-hidden">
            <h1
              className="text-xl font-black text-white whitespace-nowrap truncate 
                           [text-shadow:0_0_15px_rgba(255,69,0,0.3)] tracking-tight"
            >
              {problem.title}
            </h1>
            {problem.isPremium && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-1.5 rounded-md shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                <IoIosLock className="text-yellow-400 text-sm" />
              </div>
            )}
          </div>
        </div>

        {/* CENTER: ACTION BUTTONS */}
        <div className="flex items-center gap-4 mx-4">
          <button
            onClick={handleRun}
            disabled={isSubmitting}
            className={runBtnStyle}
          >
            <FaPlay size={10} /> <span className="uppercase">Run</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={submitBtnStyle}
          >
            <FaPaperPlane size={12} />{" "}
            <span className="uppercase">
              {isSubmitting ? "Judging..." : "Submit"}
            </span>
          </button>
        </div>

        {/* RIGHT: TOOLS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAI(!showAI)}
            title="Ask Bhoomi AI"
            className={`p-2 rounded-full transition ${
              showAI
                ? "text-orange-400 bg-gray-800"
                : "hover:text-orange-400 hover:bg-gray-900"
            }`}
          >
            <FaRobot size={18} />
          </button>
          <button
            title="Settings (Soon)"
            className="p-2.5 rounded-lg bg-gray-900/50 border border-transparent text-gray-400 
                       hover:border-orange-500/30 hover:text-orange-400 hover:bg-orange-900/10 
                       hover:shadow-[0_0_15px_rgba(255,69,0,0.15)] transition-all duration-300"
          >
            <FaCog size={18} />
          </button>
        </div>
      </header>

      {/* ======================= MAIN LAYOUT ======================= */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* --- LEFT PANE (Description + Console) --- */}
        <div
          ref={leftPaneRef}
          className="flex flex-col h-full border-r border-orange-900/40"
          style={{ width: `${leftPaneWidth}%` }}
        >
          {/* Top: Description */}
          <div
            className="flex flex-col overflow-hidden border-b border-orange-900/40"
            style={{ height: `${descPaneHeight}%` }}
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

          {/* Vertical Resizer */}
          <div
            onMouseDown={handleMouseDownVertical}
            className="w-full h-1.5 bg-gradient-to-r from-gray-900 via-orange-900/50 to-gray-900 hover:bg-orange-600/50 cursor-row-resize transition-colors z-10"
            title="Drag to resize"
          />

          {/* Bottom: Console */}
          <div className="flex-1 min-h-0 overflow-hidden bg-black">
            <ConsolePane
              problemTestCases={problem.testCases}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting}
              // Handlers passed but buttons are hidden/ignored in ConsolePane via logic below
              handleSubmit={() => {}}
              handleRun={() => {}}
              activeRightTab={activeConsoleTab}
              setActiveRightTab={setActiveConsoleTab}
            />
          </div>
        </div>

        {/* --- HORIZONTAL RESIZER --- */}
        <div
          onMouseDown={handleMouseDownHorizontal}
          className="w-1.5 h-full bg-gradient-to-b from-gray-900 via-orange-900/50 to-gray-900 hover:bg-orange-600/50 cursor-col-resize transition-colors z-10"
          title="Drag to resize"
        />

        {/* --- RIGHT PANE (Full Height Editor) --- */}
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{ width: `calc(${100 - leftPaneWidth}% - 6px)` }}
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

      {/* AI Overlay */}
      {showAI && (
        <AIChatPanel
          onClose={() => setShowAI(false)}
          problem={problem}
          userCode={code} // Passes current editor code
        />
      )}
    </div>
  );
}

export default ProblemPage;
