import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App'; 
import { FaPlay, FaPaperPlane } from 'react-icons/fa';

// Import Components
import ContestHeader from '../../component/ContestPageComponent/ContestHeader';
import ContestProblemPane from '../../component/ContestPageComponent/ContestProblemPane';
import ContestEditorPane from '../../component/ContestPageComponent/ContestEditorPane';
import ContestConsolePane from '../../component/ContestPageComponent/ContestConsolePane';

const LoadingScreen = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 border-4 border-orange-900 border-t-orange-500 rounded-full animate-spin"></div>
    <p className="text-orange-500 font-mono text-sm animate-pulse">ENTERING ARENA...</p>
  </div>
);

const ContestInterface = () => {
  const { slug, problemSlug } = useParams();
  const navigate = useNavigate();

  // --- Data State ---
  const [contest, setContest] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- UI State (Tabs) ---
  const [activeLeftTab, setActiveLeftTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");

  // --- Editor State ---
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  
  // --- Submission State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // --- Layout State ---
  const [leftWidth, setLeftWidth] = useState(45); // % width of Left Column
  const [descHeight, setDescHeight] = useState(60); // % height of Description Pane
  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contestRes, problemRes] = await Promise.all([
          axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true }),
          axios.get(`${serverUrl}/api/problems/getoneproblem/${problemSlug}`, { withCredentials: true })
        ]);

        const contestData = contestRes.data;
        const problemData = problemRes.data;

        // Validation
        if (new Date(contestData.endTime) <= new Date()) {
          toast.error("Contest has ended.");
          navigate('/contests');
          return;
        }

        setContest(contestData);
        setProblem(problemData);
        
        // Initialize Code if starter code exists
        if (problemData.starterCode && problemData.starterCode.length > 0) {
          const starter = problemData.starterCode[0];
          setLanguage(starter.language);
          setCode(starter.code);
        } else {
          setCode("// No starter code available");
        }

      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load contest data");
        navigate('/contests');
      } finally {
        setLoading(false);
      }
    };

    if (slug && problemSlug) fetchData();
  }, [slug, problemSlug, navigate]);

  // --- 2. Layout Resizing Logic ---
  const handleMouseMove = (e) => {
    // Horizontal Resize (Left vs Right)
    if (isResizingHorizontal.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 25 && newWidth < 75) setLeftWidth(newWidth);
    }
    // Vertical Resize (Description vs Console)
    if (isResizingVertical.current && leftPaneRef.current) {
      const paneRect = leftPaneRef.current.getBoundingClientRect();
      const newHeight = ((e.clientY - paneRect.top) / paneRect.height) * 100;
      if (newHeight > 20 && newHeight < 80) setDescHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    isResizingHorizontal.current = false;
    isResizingVertical.current = false;
    document.body.style.userSelect = 'auto'; // Re-enable text selection
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // --- 3. Handlers ---
  const resetCode = () => {
    if (!problem) return;
    const starter = problem.starterCode.find(s => s.language === language);
    if (starter && window.confirm("Reset code to default?")) {
      setCode(starter.code);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const starter = problem.starterCode.find(s => s.language === newLang);
    if (starter) setCode(starter.code);
  };

  // --- 4. Submission Logic ---
  const handleSubmit = async () => {
    if (!code.trim()) return toast.warning("Code cannot be empty");
    
    setIsSubmitting(true);
    setSubmissionResult(null); 
    setActiveConsoleTab("result"); 
    
    try {
      const { data } = await axios.post(`${serverUrl}/api/contest-submissions`, {
        slug,
        problemSlug,
        language,
        code
      }, { withCredentials: true });

      setSubmissionResult(data); 
      
      if (data.status === "Accepted") {
        toast.success("Correct Answer!");
      } else {
        toast.error(`Verdict: ${data.status}`);
      }

      // Refresh submissions list if tab is open
      if (activeLeftTab === "submissions") {
        setActiveLeftTab("description"); 
        setTimeout(() => setActiveLeftTab("submissions"), 50);
      }
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Execution Error";
      setSubmissionResult({ status: "Error", message: errorMsg });
      toast.error("Submission Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-[#050505] overflow-hidden text-gray-200 font-sans">
      
      {/* HEADER */}
      <ContestHeader 
        contest={contest} 
        currentProblemSlug={problemSlug} 
        totalProblems={contest.problems.length}
      />

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        
        {/* === LEFT COLUMN (Description + Console) === */}
        <div 
          ref={leftPaneRef}
          style={{ width: `${leftWidth}%` }} 
          className="flex flex-col h-full border-r border-orange-900/30"
        >
          {/* Top: Description */}
          <div style={{ height: `${descHeight}%` }} className="overflow-hidden">
            <ContestProblemPane 
              problem={problem}
              slug={problemSlug}
              activeLeftTab={activeLeftTab}
              setActiveLeftTab={setActiveLeftTab}
              submissions={submissions}
              setSubmissions={setSubmissions}
              loadingSubmissions={loadingSubmissions}
              setLoadingSubmissions={setLoadingSubmissions}
            />
          </div>

          {/* Vertical Resizer (Added e.preventDefault) */}
          <div 
            onMouseDown={(e) => { 
                e.preventDefault(); 
                isResizingVertical.current = true;
                document.body.style.userSelect = 'none'; // Disable text selection while dragging
            }}
            className="h-1.5 w-full bg-[#111] border-y border-orange-900/20 hover:bg-orange-600/50 cursor-row-resize transition-colors z-10 flex items-center justify-center"
          >
             <div className="w-8 h-0.5 bg-gray-600 rounded-full"></div>
          </div>

          {/* Bottom: Console */}
          <div className="flex-1 min-h-0 bg-[#0a0a0a]">
            <ContestConsolePane 
               problemTestCases={problem.testCases}
               submissionResult={submissionResult}
               isSubmitting={isSubmitting}
               activeRightTab={activeConsoleTab}
               setActiveRightTab={setActiveConsoleTab}
            />
          </div>
        </div>

        {/* Horizontal Resizer (Added e.preventDefault) */}
        <div 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            isResizingHorizontal.current = true;
            document.body.style.userSelect = 'none'; // Disable text selection while dragging
          }}
          className="w-1.5 h-full bg-[#050505] hover:bg-orange-600/50 cursor-col-resize transition-colors z-10 flex items-center justify-center"
        >
          <div className="h-8 w-0.5 bg-gray-700 rounded"></div>
        </div>

        {/* === RIGHT COLUMN (Editor) === */}
        <div style={{ width: `calc(${100 - leftWidth}% - 6px)` }} className="h-full flex flex-col min-w-0">
          
          {/* EDITOR */}
          <div className="flex-1 min-h-0">
            <ContestEditorPane 
              problem={problem}
              code={code} 
              handleEditorChange={setCode}
              selectedLanguage={language}
              handleLanguageChange={handleLanguageChange}
              resetCode={resetCode}
            />
          </div>

          {/* ACTION FOOTER */}
          <div className="h-14 bg-[#111] border-t border-orange-900/30 flex items-center justify-between px-6 shrink-0">
            <div className="text-xs text-gray-500 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => toast.info("Run is disabled in strict contest mode.")}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold text-gray-400 border border-gray-700 hover:border-gray-500 transition-all opacity-50 cursor-not-allowed"
              >
                <FaPlay size={10} /> Run
              </button>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 rounded bg-orange-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(255,69,0,0.4)] hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Judging...</span>
                ) : (
                  <>
                    <FaPaperPlane size={12} /> Submit
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContestInterface;