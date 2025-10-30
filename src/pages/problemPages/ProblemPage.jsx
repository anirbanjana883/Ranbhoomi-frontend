import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import { FaArrowLeft, FaClock, FaUsers, FaRobot, FaCog } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#050505]">
    <div className="w-16 h-16 border-4 border-t-transparent border-orange-500 rounded-full animate-spin" />
  </div>
);

function ProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Pane State ---
  const [leftPaneWidth, setLeftPaneWidth] = useState(45);
  const [editorPaneHeight, setEditorPaneHeight] = useState(65);
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- UI State ---
  const [activeLeftTab, setActiveLeftTab] = useState("description");
  const [activeRightTab, setActiveRightTab] = useState("testcase");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // --- Fetch Problem ---
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/problems/getoneproblem/${slug}`,
          {
            withCredentials: true,
          }
        );
        setProblem(data);
        if (data.starterCode?.length) {
          setSelectedLanguage(data.starterCode[0].language);
          setCode(data.starterCode[0].code);
        } else setCode("// No starter code found for this problem.");
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

  // --- Fetch Submissions when “Submissions” tab active ---
  useEffect(() => {
    const fetchSubs = async () => {
      if (activeLeftTab === "submissions") {
        setLoadingSubmissions(true);
        try {
          const { data } = await axios.get(
            `${serverUrl}/api/submissions/problem/${slug}`,
            {
              withCredentials: true,
            }
          );
          setSubmissions(data);
        } catch {
          toast.error("Failed to load submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    fetchSubs();
  }, [activeLeftTab, slug]);

  // --- Resizing Logic ---
  const handleMouseDownHorizontal = useCallback((e) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    isResizingHorizontal.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
  }, []);

  const handleMouseMoveHorizontal = useCallback(
    (e) => {
      if (!isResizingHorizontal.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPaneWidth(Math.max(25, Math.min(75, newWidth)));
    },
    [containerRef]
  );

  const handleMouseDownVertical = useCallback((e) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    isResizingVertical.current = true;
    setIsDragging(true);
    document.body.style.cursor = "row-resize";
  }, []);

  const handleMouseMoveVertical = useCallback(
    (e) => {
      if (!isResizingVertical.current || !rightPaneRef.current) return;
      const rect = rightPaneRef.current.getBoundingClientRect();
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      setEditorPaneHeight(Math.max(20, Math.min(80, newHeight)));
    },
    [rightPaneRef]
  );

  const handleMouseUp = useCallback(() => {
    isResizingHorizontal.current = false;
    isResizingVertical.current = false;
    setIsDragging(false);
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMoveHorizontal);
    document.addEventListener("mousemove", handleMouseMoveVertical);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMoveHorizontal);
      document.removeEventListener("mousemove", handleMouseMoveVertical);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMoveHorizontal, handleMouseMoveVertical, handleMouseUp]);

  // --- Editor Events ---
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

  // --- Polling Logic ---
  const pollForResult = (submissionId) => {
    // Clear any existing poll
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set status to Judging in the UI
    setActiveRightTab("result"); // Switch to the result tab
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);

    const interval = setInterval(async () => {
      try {
        const { data: result } = await axios.get(
          `${serverUrl}/api/submissions/status/${submissionId}`,
          { withCredentials: true }
        );

        // Check for a final status
        if (result.status !== "Judging" && result.status !== "Pending") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsSubmitting(false);
          setSubmissionResult(result);
          toast.success(`Submission ${result.status}!`);

          // Auto-refresh the submissions tab list if it's active
          if (activeLeftTab === "submissions") {
            // Trigger a refetch
            setActiveLeftTab(""); // This simple state toggle will re-trigger the submissions useEffect
            setActiveLeftTab("submissions");
          }
        } else {
          // Still judging...
          setSubmissionResult(result);
        }
      } catch (err) {
        // Stop polling on error
        clearInterval(interval);
        setPollingInterval(null);
        setIsSubmitting(false);
        toast.error("Error checking submission status.");
        setSubmissionResult({ status: "Error checking status." });
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // --- Submission Logic ---
  const handleSubmit = async () => {
    if (!code.trim()) return toast.warn("Code cannot be empty.");

    setIsSubmitting(true);
    setSubmissionResult(null); // Clear old results
    setActiveRightTab("result"); // Switch to result tab immediately

    try {
      // 1. Send submission to OUR backend
      const { data: pendingSubmission } = await axios.post(
        `${serverUrl}/api/submissions`,
        { slug: problem.slug, language: selectedLanguage, code: code },
        { withCredentials: true }
      );

      // 2. Start polling for the result using OUR submission ID
      pollForResult(pendingSubmission._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
      setIsSubmitting(false);
    }
  };
  if (loading) return <LoadingSpinner />;
  if (error || !problem)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#050505] text-white">
        <button
          onClick={() => navigate("/practice")}
          className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-all"
        >
          <FaArrowLeft /> Go Back
        </button>
        <h1 className="text-3xl font-bold mt-4 text-red-500">
          {error || "Problem not found"}
        </h1>
      </div>
    );

  // --- Neon Pane Base Style ---
  const paneStyle = `
    bg-[#0a0a0a] 
    border border-orange-500/20 
    rounded-xl 
    flex flex-col overflow-hidden 
    transition-all duration-300 
    shadow-[0_0_10px_rgba(255,100,0,0.1)] 
    hover:shadow-[0_0_25px_rgba(255,120,0,0.4)]
    hover:border-orange-400/70
  `;

  const iconButtonStyle = `p-2 rounded-full bg-black/40 border border-gray-700/50 text-orange-500 transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black shadow-sm hover:text-orange-400 hover:border-orange-600/60 hover:bg-orange-900/20 hover:shadow-[0_0_15px_rgba(255,100,0,0.3)] hover:scale-110 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-black/40 disabled:hover:scale-100 disabled:hover:translate-y-0`;

  return (
    <div
      className="flex flex-col h-screen bg-[#050505] text-gray-300"
      ref={containerRef}
    >
      {/* Top Navbar */}
      <header className="h-14 border-b border-orange-500/20 bg-[#0c0c0c]/90 backdrop-blur-sm flex justify-between items-center px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="flex items-center gap-2 text-orange-500 font-bold text-xs sm:text-sm 
             bg-black/80 backdrop-blur-md 
             border border-orange-600/40 
             shadow-[0_0_20px_rgba(255,69,0,0.25)] 
             rounded-full py-1.5 px-3 sm:py-2 sm:px-4 
             transition-all duration-300 transform 
             hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] 
             hover:text-orange-400 hover:scale-105"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Problems</span>
          </button>
          <h1 className="text-lg sm:text-xl font-semibold font-black text-white [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
            {problem.title}
          </h1>
          {problem.isPremium && <IoIosLock className="text-yellow-400" />}
        </div>
        <div className="flex items-center gap-4 text-orange-500 ">
          <button
            // onClick={}
            title="Timer (Soon)"
            className={iconButtonStyle}
          >
            <FaClock size={14} />
          </button>
          <button
            // onClick={}
            title="Community (Soon)"
            className={iconButtonStyle}
          >
            <FaUsers size={14} />
          </button>
          <button
            // onClick={}
            title="Chat With Bhoomi AI (Soon)"
            className={iconButtonStyle}
          >
            <FaRobot size={14} />
          </button>
          <button
            // onClick={}
            title="Settings (Soon)"
            className={iconButtonStyle}
          >
            <FaCog size={14} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden gap-2 p-2">
        {/* Left: Problem Description */}
        <div
          className={`${paneStyle} w-full`}
          style={
            window.innerWidth >= 1024 ? { width: `${leftPaneWidth}%` } : {}
          }
        >
          <ProblemDescription
            problem={problem}
            slug={slug}
            activeLeftTab={activeLeftTab}
            setActiveLeftTab={setActiveLeftTab}
            submissions={submissions}
            loadingSubmissions={loadingSubmissions}
          />
        </div>

        {/* Resize Divider */}
        <div
          onMouseDown={handleMouseDownHorizontal}
          className={`hidden lg:block w-[2px] bg-orange-500/20 hover:bg-orange-400 cursor-col-resize transition-all ${
            isDragging ? "shadow-[0_0_15px_rgba(255,120,0,0.5)]" : ""
          }`}
        />

        {/* Right: Editor + Console */}
        <div
          ref={rightPaneRef}
          className={`${paneStyle} flex-grow w-full`}
          style={
            window.innerWidth >= 1024
              ? { width: `${100 - leftPaneWidth}%` }
              : {}
          }
        >
          {/* Code Editor */}
          <div
            className="flex flex-col overflow-hidden"
            style={{
              height: window.innerWidth < 1024 ? "65%" : `${editorPaneHeight}%`,
            }}
          >
            <CodeEditorPane
              problem={problem}
              selectedLanguage={selectedLanguage}
              code={code}
              handleLanguageChange={handleLanguageChange}
              resetCode={resetCode}
              handleEditorChange={handleEditorChange}
            />
          </div>

          {/* Divider */}
          <div
            onMouseDown={handleMouseDownVertical}
            className="hidden lg:block h-[2px] bg-orange-500/20 hover:bg-orange-400 cursor-row-resize transition-all"
          />

          {/* Console */}
          <div
            className="flex flex-col flex-grow overflow-hidden"
            style={{
              height:
                window.innerWidth >= 1024
                  ? `${100 - editorPaneHeight}%`
                  : "35%",
            }}
          >
            <ConsolePane
              problemTestCases={problem.testCases}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              activeRightTab={activeRightTab}
              setActiveRightTab={setActiveRightTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemPage;
