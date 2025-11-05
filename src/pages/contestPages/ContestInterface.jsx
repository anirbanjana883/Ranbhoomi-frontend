import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App"; 
import {
  FaArrowLeft,
  FaPlay,
  FaPaperPlane,
  FaClock,
  FaBrain,
  FaRobot,
  FaLock,
  FaUsers,
  FaCog,
  FaCheckCircle,
  FaTimesCircle,
  FaSyncAlt,
} from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor from "@monaco-editor/react";
import rehypeRaw from "rehype-raw";

// --- Import Child Components ---
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";
import ContestHeader from "../../component/ContestPageComponent/ContestHeader";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-24 h-24 border-[10px] border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_40px_rgba(255,69,0,0.8),inset_0_0_10px_rgba(255,69,0,0.5)]"></div>
  </div>
);

// --- Main Contest Interface Page ---
function ContestInterface() {
  const [contest, setContest] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { slug, problemSlug } = useParams();
  const navigate = useNavigate();

  // Pane Resizing State
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [editorPaneHeight, setEditorPaneHeight] = useState(65);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Code & Submission State
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  // State for tabs
  const [activeLeftTab, setActiveLeftTab] = useState("description");
  const [activeRightTab, setActiveRightTab] = useState("testcase");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // --- Fetch BOTH Contest and Problem Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !problemSlug) return;
      setLoading(true);
      setError(null);
      try {
        const contestPromise = axios.get(`${serverUrl}/api/contests/${slug}`, {
          withCredentials: true,
        });
        const problemPromise = axios.get(
          `${serverUrl}/api/problems/getoneproblem/${problemSlug}`,
          { withCredentials: true }
        );
        const [contestRes, problemRes] = await Promise.all([
          contestPromise,
          problemPromise,
        ]);
        const fetchedContest = contestRes.data;
        const fetchedProblem = problemRes.data;

        // --- Validation ---
        const now = new Date();
        if (new Date(fetchedContest.endTime) <= now) {
          toast.error("This contest has ended.");
          navigate(`/contests`);
          return;
        }
        if (new Date(fetchedContest.startTime) > now) {
          toast.error("This contest has not started yet.");
          navigate(`/contest/${slug}`);
          return;
        }
        if (!fetchedContest.isRegistered) {
          toast.error("You are not registered for this contest.");
          navigate(`/contest/${slug}`);
          return;
        }
        const isProblemInContest = fetchedContest.problems.some(
          (p) => p.problem.slug === problemSlug
        );
        if (!isProblemInContest) {
          toast.error("This problem is not part of the contest.");
          navigate(`/contest/${slug}`);
          return;
        }
        // --- End Validation ---

        setContest(fetchedContest);
        setProblem(fetchedProblem);
        if (fetchedProblem.starterCode?.length) {
          setSelectedLanguage(fetchedProblem.starterCode[0].language);
          setCode(fetchedProblem.starterCode[0].code);
        } else {
          setCode(`// No starter code found.`);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Data not found.");
        toast.error(err.response?.data?.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, problemSlug, navigate]);

  // --- Fetch Submissions for Contest ---
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (activeLeftTab === "submissions" && problem?._id) {
        setLoadingSubmissions(true);
        try {
          // --- UPDATED to use correct endpoint ---
          const { data } = await axios.get(
            `${serverUrl}/api/contest-submissions/problem/${problem.slug}`, // Use problem slug
            { withCredentials: true }
          );
          setSubmissions(data); // Backend now filters by user, we just display
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Failed to load submissions."
          );
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    if (problem) {
      fetchSubmissions();
    }
  }, [activeLeftTab, problem, slug]); // Re-run if problem changes

  // --- Resizing Handlers (Desktop Only) ---
  const handleMouseDownHorizontal = useCallback((e) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    isResizingHorizontal.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
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
    document.body.style.userSelect = "none";
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
    document.body.style.userSelect = "";
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

  // --- Editor Handlers ---
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

  // --- Polling & Submit Logic (UPDATED) ---
  const pollForResult = (submissionId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setActiveRightTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);
    const interval = setInterval(async () => {
      try {
        // --- UPDATED --- Use contest submission status route
        const { data: result } = await axios.get(
          `${serverUrl}/api/contest-submissions/status/${submissionId}`,
          { withCredentials: true }
        );

        if (result.status !== "Judging" && result.status !== "Pending") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsSubmitting(false);
          setSubmissionResult(result);
          toast.success(`Submission ${result.status}!`);
          if (activeLeftTab === "submissions") {
           
            setActiveLeftTab(""); // Simple state toggle to re-trigger useEffect
            setTimeout(() => setActiveLeftTab("submissions"), 10);
          }
        } else {
          setSubmissionResult(result);
        }
      } catch (err) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsSubmitting(false);
        toast.error("Error checking submission status.");
        setSubmissionResult({ status: "Error checking status." });
      }
    }, 2000);
    setPollingInterval(interval);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.warn("Code cannot be empty.");
    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveRightTab("result");
    try {
      // --- UPDATED --- Use contest submission route
      const { data: pendingSubmission } = await axios.post(
        `${serverUrl}/api/contest-submissions`,
        {
          slug: contest.slug, // Pass contest slug
          problemSlug: problem.slug, // Pass problem slug
          language: selectedLanguage,
          code: code,
        },
        { withCredentials: true }
      );
      pollForResult(pendingSubmission._id); // Poll using the new submission ID
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (loading || !problem || !contest) return <LoadingSpinner />;
  if (error) {
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
  }

  // --- Godfather Styles ---
  const paneStyle = `bg-gradient-to-b from-black via-gray-950/70 to-black border-2 border-orange-800/60 rounded-xl shadow-[0_0_50px_rgba(255,69,0,0.35),inset_0_2px_10px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col`;
  const iconButtonStyle = `p-2 rounded-full bg-black/40 border border-gray-700/50 text-gray-500 transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black shadow-sm hover:text-orange-400 hover:border-orange-600/60 hover:bg-orange-900/20 hover:shadow-[0_0_15px_rgba(255,100,0,0.3)] hover:scale-110 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-black/40 disabled:hover:scale-100 disabled:hover:translate-y-0`;

  return (
    <>
      {/* Global Markdown Styles */}
      <style global jsx>{`
        .godfather-bg {
          background: radial-gradient(
            ellipse at center,
            rgba(10, 5, 5, 1) 0%,
            rgba(0, 0, 0, 1) 70%
          );
        }
        .problem-description-markdown p {
          margin-bottom: 0.85rem;
          line-height: 1.65;
        }
        .problem-description-markdown code {
          background-color: rgba(255, 100, 0, 0.15);
          color: #ffa500;
          padding: 0.15em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
          border: 1px solid rgba(255, 100, 0, 0.2);
        }
        .problem-description-markdown pre {
          background-color: #0c0c0f;
          padding: 0.8rem 1rem;
          border-radius: 0.375rem;
          border: 1px solid rgba(255, 69, 0, 0.3);
          overflow-x: auto;
          box-shadow: 0 0 15px rgba(255, 69, 0, 0.1);
        }
        .problem-description-markdown pre code {
          all: unset;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
        .problem-description-markdown strong {
          color: #ffd700;
          font-weight: 700;
        }
        .problem-description-markdown h1,
        h2,
        h3 {
          margin-bottom: 0.5rem;
          margin-top: 1.25rem;
          color: white;
          font-weight: 700;
          border-bottom: 1px solid rgba(255, 100, 0, 0.3);
          padding-bottom: 4px;
        }
        .problem-description-markdown ul,
        ol {
          margin-left: 1.5rem;
          margin-bottom: 0.85rem;
        }
        .problem-description-markdown li {
          margin-bottom: 0.3rem;
        }
      `}</style>

      {/* --- Contest Header --- */}
      <ContestHeader contest={contest} currentProblemSlug={problemSlug} />

      {/* --- Main Layout --- (Responsive) */}
      <div
        ref={containerRef}
        className="flex flex-col lg:flex-row w-full min-h-screen bg-black text-gray-300 px-4 pt-20 pb-4 box-border gap-2 godfather-bg lg:h-screen lg:pt-20 lg:pb-4"
        onMouseUp={handleMouseUp}
      >
        {/* --- Left Pane (Problem Description) --- */}
        <div
          className={`${paneStyle} w-full lg:h-full`}
          style={
            window.innerWidth >= 1024
              ? { width: `calc(${leftPaneWidth}% - 0.3125rem)` }
              : {}
          }
        >
          {/* --- UPDATED --- Pass all state props */}
          <ProblemDescription
            problem={problem}
            slug={problem.slug} 
            activeLeftTab={activeLeftTab}
            setActiveLeftTab={setActiveLeftTab}
            submissions={submissions}
            loadingSubmissions={loadingSubmissions}
            setSubmissions={setSubmissions} 
            setLoadingSubmissions={setLoadingSubmissions} 
            isContestMode={true}
          />
        </div>

        {/* --- Horizontal Resizer Handle --- */}
        <div
          className={`hidden lg:flex w-2.5 cursor-col-resize bg-gradient-to-r from-orange-900/30 via-orange-700/60 to-orange-900/30 hover:via-orange-600/80 transition-colors duration-150 flex-shrink-0 border-l border-r border-orange-800/50 shadow-[0_0_10px_rgba(255,100,0,0.4)]
          ${isDragging ? "animate-pulse !via-orange-500 scale-x-150" : ""}`}
          onMouseDown={handleMouseDownHorizontal}
        ></div>

        {/* --- Right Pane (Editor & Actions) --- */}
        <div
          ref={rightPaneRef}
          className={`${paneStyle} w-full h-[80vh] lg:h-full lg:flex-grow-0`}
          style={
            window.innerWidth >= 1024
              ? { width: `calc(${100 - leftPaneWidth}% - 0.25rem)` }
              : {}
          }
        >
          {/* Top Part: Editor */}
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

          {/* Vertical Resizer Handle */}
          <div
            className={`hidden lg:flex h-2.5 cursor-row-resize bg-gradient-to-t from-orange-900/30 via-orange-700/60 to-orange-900/30 hover:via-orange-600/80 transition-colors duration-150 flex-shrink-0 border-t border-b border-orange-800/50 shadow-[0_0_10px_rgba(255,100,0,0.4)]
            ${isDragging ? "animate-pulse !via-orange-500 scale-y-150" : ""}`}
            onMouseDown={handleMouseDownVertical}
          ></div>

          {/* Bottom Part: Console & Actions */}
          <div
            className="flex flex-col overflow-hidden flex-grow"
            style={
              window.innerWidth >= 1024
                ? { height: `${100 - editorPaneHeight}%` }
                : {}
            }
          >
            <ConsolePane
              problemTestCases={problem.testCases}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit} 
              handleRun={() =>
                toast.info("'Run Code' is disabled during contests.")
              }
              activeRightTab={activeRightTab}
              setActiveRightTab={setActiveRightTab}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ContestInterface;
