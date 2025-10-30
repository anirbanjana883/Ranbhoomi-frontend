import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App"; // Adjust path
import { FaPlay, FaPaperPlane, FaLock } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor from "@monaco-editor/react";
import rehypeRaw from 'rehype-raw';

// --- Import Child Components ---
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";
import ContestHeader from "../../component/ContestPageComponent/ContestHeader"; // Import new header

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#050505]">
    <div className="w-16 h-16 border-4 border-t-transparent border-orange-500 rounded-full animate-spin" />
  </div>
);


// --- Main Contest Interface Page ---
function ContestInterface() {
  // --- State ---
  const [contest, setContest] = useState(null); // For contest info (timer, problem list)
  const [problem, setProblem] = useState(null); // For specific problem details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { slug, problemSlug } = useParams(); // Get both slugs
  const navigate = useNavigate();

  // Pane Resizing State
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [editorPaneHeight, setEditorPaneHeight] = useState(65);
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Code & Submission State
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  // --- Fetch BOTH Contest and Problem Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !problemSlug) return;
      setLoading(true); setError(null);
      
      try {
        // Fetch contest details (for timer, problem list, validation)
        const contestPromise = axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
        // Fetch specific problem details
        const problemPromise = axios.get(`${serverUrl}/api/problems/getoneproblem/${problemSlug}`, { withCredentials: true });

        const [contestRes, problemRes] = await Promise.all([contestPromise, problemPromise]);
        
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
        // Check if problem is part of the contest
        const isProblemInContest = fetchedContest.problems.some(p => p.problem.slug === problemSlug);
        if (!isProblemInContest) {
             toast.error("This problem is not part of the contest.");
             navigate(`/contest/${slug}`);
             return;
        }
        // --- End Validation ---


        setContest(fetchedContest);
        setProblem(fetchedProblem);

        // Set starter code
        if (fetchedProblem.starterCode && fetchedProblem.starterCode.length > 0) {
          const defaultLang = fetchedProblem.starterCode[0].language;
          setSelectedLanguage(defaultLang);
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
  }, [slug, problemSlug, navigate]); // Refetch if problemSlug changes

  // fetch submission
  useEffect(() => {
    const fetchSubmissions = async () => {
      // Use the *contest* slug
      if (activeLeftTab === 'submissions' && slug) { 
        setLoadingSubmissions(true);
        try {
          const { data } = await axios.get(
            `${serverUrl}/api/contest-submissions/problem/${slug}`, 
            { withCredentials: true }
          );
          // Filter for *this* problem
          setSubmissions(data.filter(s => s.problem === problem._id));
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to load submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    fetchSubmissions();
  }, [activeLeftTab, slug, problem]); // Re-run if problem changes

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


  // --- Polling & Submit Logic ---
  const pollForResult = (submissionId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setActiveRightTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);
    const interval = setInterval(async () => {
      try {
        
        const { data: result } = await axios.get(`${serverUrl}/api/contest-submissions/status/${submissionId}`, { withCredentials: true });
        
        if (result.status !== "Judging" && result.status !== "Pending") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsSubmitting(false);
          setSubmissionResult(result);
          toast.success(`Submission ${result.status}!`);
          if(activeLeftTab === 'submissions') {
             setActiveLeftTab('');
             setTimeout(() => setActiveLeftTab('submissions'), 10);
          }
        } else {
          setSubmissionResult(result);
        }
      } catch (err) {
        clearInterval(interval); setPollingInterval(null); setIsSubmitting(false);
        toast.error("Error checking submission status.");
        setSubmissionResult({ status: "Error checking status." });
      }
    }, 2000);
    setPollingInterval(interval);
  };


  const handleSubmit = async () => {
    if (!code.trim()) { toast.warn("Code cannot be empty."); return; }
    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveRightTab("result");
    try {
      
      const { data: pendingSubmission } = await axios.post(
        `${serverUrl}/api/contest-submissions`,
        { 
          slug: contest.slug, 
          problemSlug: problem.slug, 
          language: selectedLanguage, 
          code: code 
        },
        { withCredentials: true }
      );
      pollForResult(pendingSubmission._id); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (loading || !problem || !contest) return <LoadingSpinner />;
   if (error )
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

  // --- Godfather Styles --- 
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
    <>
      
      {/* --- NEW Contest Header --- */}
      <ContestHeader contest={contest} currentProblemSlug={problemSlug} />

      {/* --- Main Layout ---  */}
      <div
        ref={containerRef}
        className="flex flex-col lg:flex-row w-full min-h-screen bg-black text-gray-300 px-4 pt-20 pb-4 box-border gap-2 godfather-bg lg:h-screen lg:pt-20 lg:pb-4"
        onMouseUp={handleMouseUp}
      >
        {/* --- Left Pane  --- */}
        <div
          className={`${paneStyle} w-full lg:h-full`}
          style={ window.innerWidth >= 1024 ? { width: `calc(${leftPaneWidth}% - 0.3125rem)` } : {} }
        >
          {/* --- Pass problem, but HIDE solution/submissions tabs --- */}
          <ProblemDescription
            problem={problem}
            slug={slug} 
            activeLeftTab={activeLeftTab}
            setActiveLeftTab={setActiveLeftTab}
            submissions={submissions}
            loadingSubmissions={loadingSubmissions}
            isContestMode={true} 
          />
        </div>

        {/* --- Horizontal Resizer Handle --- */}
        <div
          className={`hidden lg:flex w-2.5 cursor-col-resize ... ${isDragging ? 'animate-pulse ...' : ''}`}
          onMouseDown={handleMouseDownHorizontal}
        ></div>

        {/* --- Right Pane (Editor & Actions) --- */}
        <div
          ref={rightPaneRef}
          className={`${paneStyle} w-full h-[80vh] lg:h-full lg:flex-grow-0`}
          style={ window.innerWidth >= 1024 ? { width: `calc(${100 - leftPaneWidth}% - 0.25rem)` } : {} }
        >
          <CodeEditorPane
            problem={problem}
            selectedLanguage={selectedLanguage}
            code={code}
            handleLanguageChange={handleLanguageChange}
            resetCode={resetCode}
            handleEditorChange={handleEditorChange}
          />
          <div
            className={`hidden lg:flex h-2.5 cursor-row-resize ... ${isDragging ? 'animate-pulse ...' : ''}`}
            onMouseDown={handleMouseDownVertical}
          ></div>
          <ConsolePane
            problemTestCases={problem.testCases}
            submissionResult={submissionResult}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            // handleRun={handleRun} // Pass this when you implement it
          />
        </div>
      </div>
    </>
  );
}

export default ContestInterface;