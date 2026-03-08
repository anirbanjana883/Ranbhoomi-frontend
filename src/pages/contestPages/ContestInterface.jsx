import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import { serverUrl } from "../../App";
import { FaAngleDown, FaAngleUp, FaArrowsAltV } from "react-icons/fa";
import API from "../../api/axios.js";

// 1. Import Contest-Specific Header (Keeps the Timer & Top Action Buttons)
import ContestHeader from "../../component/ContestPageComponent/ContestHeader";

// 2. Import UNIFIED Shared Components
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";

const SOCKET_URL = "http://localhost:5000";

// --- Loading Spinner (TUF Minimalist) ---
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 space-y-4">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold animate-pulse">
      Initializing Secure Arena...
    </p>
  </div>
);

export default function ContestInterface() {
  const { slug, problemSlug } = useParams();
  const navigate = useNavigate();

  // --- Data State ---
  const [contest, setContest] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- UI State ---
  const [activeLeftTab, setActiveLeftTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");

  // --- Editor State ---
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [code, setCode] = useState("");

  // --- Execution & Submission State ---
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // System 1: Run Code (Fast Path)
  const [isRunning, setIsRunning] = useState(false); 
  const [runStatusText, setRunStatusText] = useState("");
  
  // System 2: Submit Code (Formal Path)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // --- Layout State ---
  const [leftPaneWidth, setLeftPaneWidth] = useState(45);
  const [editorPaneHeight, setEditorPaneHeight] = useState(65);
  const [lastEditorHeight, setLastEditorHeight] = useState(65);

  // --- Refs ---
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  const activeSubIdRef = useRef(null);
  const socketRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);

  // --- 1. Fetch Contest & Problem ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contestRes, problemRes] = await Promise.all([
          API.get(`/contests/${slug}`),
          API.get(`/problems/${problemSlug}`)
        ]);

        const contestData = contestRes.data?.data || contestRes.data;
        const problemData = problemRes.data?.data || problemRes.data;

        // Strict Contest Validation
        if (new Date(contestData.endTime) <= new Date()) {
          toast.error("This contest has ended.");
          navigate(`/contest/${slug}`);
          return;
        }

        setContest(contestData);
        setProblem(problemData);

        if (problemData?.starterCode?.length > 0) {
          setSelectedLanguage(problemData.starterCode[0].language);
          setCode(problemData.starterCode[0].code);
        } else {
          setCode("// No starter code found.");
        }
      } catch (err) {
        setError("Failed to load secure arena.");
        toast.error(err.response?.data?.message || "Failed to load arena.");
        navigate('/contests');
      } finally {
        setLoading(false);
      }
    };

    if (slug && problemSlug) fetchData();
  }, [slug, problemSlug, navigate]);

  // --- 2. Fetch Contest Submissions ---
  const fetchSubs = useCallback(async () => {
    if (problem) {
      setLoadingSubmissions(true);
      try {
        const { data } = await API.get(`/contest-submissions/problem/${problem.slug}`);
        const fetchedSubs = data?.data || data;
        setSubmissions(Array.isArray(fetchedSubs) ? fetchedSubs : []);
      } catch {
        // Silently fail if no submissions yet
      } finally {
        setLoadingSubmissions(false);
      }
    }
  }, [problem]);

  useEffect(() => {
    if (activeLeftTab === "submissions" && problem) {
      fetchSubs();
    }
  }, [activeLeftTab, problem, fetchSubs]);

  // --- 3. SOCKET.IO INITIALIZATION ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    // RUN CODE LISTENERS
    socketRef.current.on("run_status", (data) => {
      setRunStatusText(data.status);
    });

    socketRef.current.on("run_result", (data) => {
      setIsRunning(false);
      setRunStatusText("");
      setSubmissionResult(data); 
      setActiveConsoleTab("result");

      if (data.status === "Accepted") toast.success("Sample Cases Passed!");
      else toast.error("Some Sample Cases Failed.");
    });

    socketRef.current.on("run_error", (data) => {
      setIsRunning(false);
      setRunStatusText("");
      toast.error(data.message || "Failed to run code.");
    });

    // SUBMIT CODE LISTENER (Event from BullMQ Worker)
    socketRef.current.on("submission-events", async (data) => {
      if (activeSubIdRef.current === data.submissionId) {
        activeSubIdRef.current = null; 
        setIsSubmitting(false);
        setActiveConsoleTab("result");

        try {
          const statusRes = await API.get(`/contest-submissions/${data.submissionId}`);
          const result = statusRes.data?.data || statusRes.data;
          setSubmissionResult(result);

          if (result.status === "Accepted") toast.success("Solution Accepted! 🎉");
          else toast.error(`Verdict: ${result.status}`);

          fetchSubs();
          setActiveLeftTab("submissions");
        } catch (err) {
          toast.error("Failed to fetch final submission details.");
        }
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchSubs]);

  // --- 4. Layout & Resizing Logic ---
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

  const autoExpandConsole = () => {
    if (editorPaneHeight === 100) setEditorPaneHeight(lastEditorHeight || 60);
    else if (editorPaneHeight > 75) setEditorPaneHeight(60);
  };

  // --- 5. Editor Handlers ---
  const handleEditorChange = (val) => setCode(val || "");

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    const starter = problem?.starterCode?.find((s) => s.language === lang);
    setCode(starter ? starter.code : `// No starter code for ${lang}`);
  };

  const resetCode = () => {
    const starter = problem?.starterCode?.find((s) => s.language === selectedLanguage);
    if (starter && window.confirm("Reset your code to initial state?")) setCode(starter.code);
  };

  // --- 6. Execution Flow ---

  // FAANG RUN LOGIC
  const handleRun = () => {
    if (!code.trim()) return toast.error("Code cannot be empty.");

    setIsRunning(true);
    setRunStatusText("Initializing...");
    setSubmissionResult(null);
    setActiveConsoleTab("result");
    autoExpandConsole();

    socketRef.current.emit("run_code", {
      slug: problem.slug,
      language: selectedLanguage,
      code,
    });
  };

  // FAANG SUBMIT LOGIC
  const handleSubmit = async () => {
    if (!code.trim()) return toast.error("Code cannot be empty.");

    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab("result");
    autoExpandConsole();

    try {
      const { data } = await API.post(`/contest-submissions`, {
        slug: contest.slug,
        problemSlug: problem.slug,
        language: selectedLanguage,
        code,
      });

      const submissionId = data?.submissionId || data?.data?.submissionId || data?.data?._id;

      if (submissionId) {
        activeSubIdRef.current = submissionId;
        toast.success("Submission Queued! Evaluating...");

        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            if (activeSubIdRef.current !== submissionId) {
              clearInterval(pollInterval);
              return;
            }

            const statusRes = await API.get(`/contest-submissions/${submissionId}`);
            const result = statusRes.data?.data || statusRes.data;

            if (result.status !== "Judging" && result.status !== "Pending" && result.status !== "Queued") {
              clearInterval(pollInterval);

              if (activeSubIdRef.current === submissionId) {
                activeSubIdRef.current = null;
                setIsSubmitting(false);
                setSubmissionResult(result);

                if (result.status === "Accepted") toast.success("Solution Accepted! 🎉");
                else toast.error(`Verdict: ${result.status}`);

                fetchSubs();
                setActiveLeftTab("submissions");
              }
            }
          } catch (err) {
            console.error("Polling error", err);
          }

          if (attempts >= 15) {
            clearInterval(pollInterval);
            if (activeSubIdRef.current === submissionId) {
              activeSubIdRef.current = null;
              setIsSubmitting(false);
              toast.error("Evaluation is taking too long. Check submissions tab later.");
            }
          }
        }, 3000);
      } else {
        setIsSubmitting(false);
        toast.error("Failed to retrieve submission ID.");
      }
    } catch (err) {
      setIsSubmitting(false);
      if (err.response?.status === 429) toast.error("You are submitting too fast!");
      else toast.error(err.response?.data?.message || "Submission failed.");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !problem || !contest) return <div className="text-zinc-500 text-center p-10 font-medium bg-zinc-950 min-h-screen">Problem not found or Contest unavailable.</div>;

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-sans selection:bg-red-500/30">
      
      {/* 🚀 HEADER WITH TIMER & NEW ACTIONS */}
      <ContestHeader 
        contest={contest} 
        currentProblemSlug={problemSlug} 
        totalProblems={contest.problems?.length || 0}
        handleRun={handleRun}
        handleSubmit={handleSubmit}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        runStatusText={runStatusText}
      />

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-zinc-950 p-1 gap-1">
        
        {/* --- LEFT PANE (Problem Description & Submissions) --- */}
        <div
          className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm relative z-10"
          style={{ width: `${leftPaneWidth}%` }}
        >
          {/* ♻️ REUSED COMPONENT */}
          <ProblemDescription
            problem={problem}
            slug={problem.slug}
            activeLeftTab={activeLeftTab}
            setActiveLeftTab={setActiveLeftTab}
            submissions={submissions}
            loadingSubmissions={loadingSubmissions}
            setSubmissions={setSubmissions}
            setLoadingSubmissions={setLoadingSubmissions}
            isContestMode={true} // 🛡️ LOCKS DOWN TABS & SHOWS WARNING
          />
        </div>

        {/* --- HORIZONTAL RESIZER --- */}
        <div
          onMouseDown={handleMouseDownHorizontal}
          className="w-1.5 h-full bg-zinc-950 border-x border-zinc-900 hover:bg-zinc-800 cursor-col-resize transition-colors z-20 flex items-center justify-center shrink-0 group"
        >
          <div className="h-8 w-0.5 bg-zinc-700 group-hover:bg-red-500 transition-colors rounded-full"></div>
        </div>

        {/* --- RIGHT PANE (Editor Top + Console Bottom) --- */}
        <div
          ref={rightPaneRef}
          className="flex flex-col h-full overflow-hidden gap-1"
          style={{ width: `calc(${100 - leftPaneWidth}% - 8px)` }}
        >
          {/* TOP: Code Editor */}
          <div
            className="flex flex-col bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-all duration-200 relative"
            style={{
              height: editorPaneHeight === 100 ? "calc(100% - 40px)" : `${editorPaneHeight}%`,
              display: editorPaneHeight === 0 ? "none" : "flex",
            }}
          >
            {/* ♻️ REUSED COMPONENT */}
            <CodeEditorPane
              problem={problem}
              selectedLanguage={selectedLanguage}
              code={code}
              handleLanguageChange={handleLanguageChange}
              handleEditorChange={handleEditorChange}
              resetCode={resetCode}
            />
          </div>

          {/* MIDDLE: Resizer / Console Header */}
          <div
            onMouseDown={handleMouseDownVertical}
            className="h-[36px] shrink-0 w-full bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center px-4 cursor-row-resize z-10 group shadow-sm select-none"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
              <span className="w-8 h-[3px] bg-zinc-700 rounded-full group-hover:bg-red-500 transition-colors mr-2"></span>
              Console
            </div>

            <div className="flex items-center gap-1 text-zinc-500">
              {editorPaneHeight < 100 && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleConsole("hide"); }}
                  className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                >
                  <FaAngleDown size={14} />
                </button>
              )}
              {editorPaneHeight > 0 && editorPaneHeight < 100 && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleConsole("full"); }}
                  className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                >
                  <FaAngleUp size={14} />
                </button>
              )}
              {(editorPaneHeight === 0 || editorPaneHeight === 100) && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleConsole("restore"); }}
                  className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                >
                  <FaArrowsAltV size={12} />
                </button>
              )}
            </div>
          </div>

          {/* BOTTOM: Console Output */}
          <div
            className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-all duration-200"
            style={{
              height: editorPaneHeight === 0 ? "calc(100% - 40px)" : `calc(${100 - editorPaneHeight}% - 40px)`,
              display: editorPaneHeight === 100 ? "none" : "flex",
            }}
          >
            {/* ♻️ REUSED COMPONENT */}
            <ConsolePane
              problemTestCases={problem.testCases}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting || isRunning}
              activeRightTab={activeConsoleTab}
              setActiveRightTab={setActiveConsoleTab}
            />
          </div>
        </div>
      </div>

    </div>
  );
}