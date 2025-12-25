import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import {
  FaPlay,
  FaPaperPlane,
  FaCog,
  FaList,
  FaArrowLeft,
} from "react-icons/fa";
import { IoIosLock } from "react-icons/io";

// --- Import Child Components ---
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";
import ContestHeader from "../../component/ContestPageComponent/ContestHeader";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-4">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_30px_rgba(255,69,0,0.7),inset_0_0_8px_rgba(255,69,0,0.4)]"></div>
    <p className="text-white text-lg">Entering the Arena...</p>
  </div>
);

function ContestInterface() {
  const { slug, problemSlug } = useParams();
  const navigate = useNavigate();

  // --- Data State ---
  const [contest, setContest] = useState(null);
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

  // --- Layout State (GFG Style) ---
  const [leftPaneWidth, setLeftPaneWidth] = useState(45); // % width of Left Pane
  const [descPaneHeight, setDescPaneHeight] = useState(60); // % height of Description (inside Left Pane)

  // --- Refs ---
  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);

  // --- 1. Fetch Contest & Problem Data ---
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

        // Validation
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
        // Verify problem belongs to contest
        const isProblemInContest = fetchedContest.problems.some(
          (p) => p.problem.slug === problemSlug
        );
        if (!isProblemInContest) {
          toast.error("This problem is not part of the contest.");
          navigate(`/contest/${slug}`);
          return;
        }

        setContest(fetchedContest);
        setProblem(fetchedProblem);

        // Init Code
        if (fetchedProblem.starterCode?.length) {
          setSelectedLanguage(fetchedProblem.starterCode[0].language);
          setCode(fetchedProblem.starterCode[0].code);
        } else {
          setCode(`// No starter code found.`);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Data not found.");
        toast.error("Failed to load contest data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, problemSlug, navigate]);

  // --- 2. Fetch CONTEST Submissions ---
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (activeProblemTab === "submissions" && problem?._id) {
        setLoadingSubmissions(true);
        try {
          // Use the CONTEST specific endpoint
          const { data } = await axios.get(
            `${serverUrl}/api/contest-submissions/problem/${problem.slug}`,
            { withCredentials: true }
          );
          setSubmissions(Array.isArray(data) ? data : []);
        } catch (err) {
          toast.error("Failed to load submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    if (problem) fetchSubmissions();
  }, [activeProblemTab, problem, slug]);

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

  // --- 5. Submission Logic (Contest Specific) ---
  const pollForResult = (submissionId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setActiveConsoleTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);

    const interval = setInterval(async () => {
      try {
        const { data: result } = await axios.get(
          `${serverUrl}/api/contest-submissions/status/${submissionId}`, // Contest Endpoint
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
        `${serverUrl}/api/contest-submissions`, // Contest Endpoint
        { 
            slug: contest.slug, 
            problemSlug: problem.slug, 
            language: selectedLanguage, 
            code: code 
        },
        { withCredentials: true }
      );
      if (pendingSubmission._id) pollForResult(pendingSubmission._id);
    } catch (err) {
      setIsSubmitting(false);
      toast.error("Submission failed.");
    }
  };

  const handleRun = () => {
    toast.info("Run feature is disabled in contests.");
  };

  if (loading) return <LoadingSpinner />;
  if (error || !problem || !contest) return <div className="text-white text-center p-10">Data not found</div>;

  // --- Styles ---
  const actionBtnStyle = "flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all duration-300 transform active:scale-95 tracking-wide";
  const runBtnStyle = `${actionBtnStyle} bg-gray-900 text-gray-300 border border-gray-700 hover:border-orange-500/50 opacity-50 cursor-not-allowed`; // Disabled look
  const submitBtnStyle = `${actionBtnStyle} bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500/50 shadow-[0_0_20px_rgba(255,69,0,0.4)] hover:shadow-[0_0_30px_rgba(255,69,0,0.6)] hover:scale-105`;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-[#050505] text-gray-200 overflow-hidden godfather-bg"
    >
      {/* ======================= CONTEST HEADER ======================= */}
      {/* Contains Timer, Contest Title, A/B/C Links */}
      <ContestHeader contest={contest} currentProblemSlug={problemSlug} />

      {/* ======================= PROBLEM TOOLBAR ======================= */}
      <div className="flex-shrink-0 flex items-center justify-between h-14 px-6 bg-[#0a0a0a]/90 border-b border-orange-900/60 z-10">
         <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="text-lg font-bold text-white whitespace-nowrap truncate tracking-tight">
              {problem.title}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-400 bg-gray-900">
                {problem.difficulty}
            </span>
         </div>

         {/* Action Buttons */}
         <div className="flex items-center gap-4">
            {/* Run is disabled visually in contest */}
            <button onClick={handleRun} className={runBtnStyle}>
                <FaPlay size={10} /> RUN
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className={submitBtnStyle}>
                <FaPaperPlane size={12} /> {isSubmitting ? "JUDGING..." : "SUBMIT"}
            </button>
         </div>

         {/* Settings (AI Removed for Contest Fairness) */}
         <div className="flex items-center gap-3 text-gray-400">
            <button title="Settings" className="p-2 hover:text-orange-400 hover:bg-gray-900 rounded-full transition">
                <FaCog size={18} />
            </button>
         </div>
      </div>

      {/* ======================= MAIN 3-PANE LAYOUT ======================= */}
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
              isContestMode={true} // Hides Solution tab
            />
          </div>

          {/* Vertical Resizer */}
          <div
            onMouseDown={handleMouseDownVertical}
            className="w-full h-1.5 bg-gradient-to-r from-gray-900 via-orange-900/50 to-gray-900 hover:bg-orange-600/50 cursor-row-resize transition-colors z-10"
            title="Drag to resize"
          />

          {/* Bottom: Console */}
          <div className="flex-1 min-h-0 overflow-hidden bg-black flex flex-col">
            <ConsolePane
              problemTestCases={problem.testCases}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting}
              handleSubmit={() => {}} // Handled in toolbar
              handleRun={() => {}}    // Handled in toolbar
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
    </div>
  );
}

export default ContestInterface;