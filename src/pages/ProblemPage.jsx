import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
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

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div
      className="w-24 h-24 border-[10px] border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_40px_rgba(255,69,0,0.8),inset_0_0_10px_rgba(255,69,0,0.5)]"
    ></div>
  </div>
);

// --- Difficulty Badge ---
const DifficultyBadge = ({ difficulty }) => {
  let colorClasses = "";
  if (difficulty === "Easy")
    colorClasses =
      "bg-green-700/20 text-green-300 border-green-600/60 shadow-[0_0_12px_rgba(0,255,0,0.4)]";
  else if (difficulty === "Medium")
    colorClasses =
      "bg-yellow-600/20 text-yellow-300 border-yellow-500/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]";
  else if (difficulty === "Hard")
    colorClasses =
      "bg-red-700/20 text-red-400 border-red-600/60 shadow-[0_0_12px_rgba(255,0,0,0.4)]";
  else if (difficulty === "Super Hard")
    colorClasses =
      "bg-purple-700/20 text-purple-300 border-purple-600/60 shadow-[0_0_12px_rgba(168,85,247,0.5)]";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}
    >
      {difficulty}
    </span>
  );
};

// --- Test Case Display ---
const TestCaseDisplay = ({ testCase, index }) => (
  <div className="mb-4 bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 rounded-lg border border-gray-700/50 shadow-sm">
    <p className="font-bold text-gray-300 mb-2 text-sm">Example {index + 1}:</p>
    <div className="space-y-2 text-xs font-mono">
      <div>
        <strong className="text-gray-500 font-sans text-[11px] uppercase tracking-wider">
          Input:
        </strong>
        <code className="mt-1 block whitespace-pre-wrap bg-black/30 px-3 py-2 rounded text-orange-300/90 border border-gray-800/50">
          {testCase.input}
        </code>
      </div>
      <div>
        <strong className="text-gray-500 font-sans text-[11px] uppercase tracking-wider">
          Output:
        </strong>
        <code className="mt-1 block whitespace-pre-wrap bg-black/30 px-3 py-2 rounded text-orange-300/90 border border-gray-800/50">
          {testCase.expectedOutput}
        </code>
      </div>
    </div>
  </div>
);

// --- Tab Button Component ---
const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-200
                  ${
                    isActive
                      ? "text-orange-400 border-orange-500 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]"
                      : "text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700"
                  }`}
  >
    {label}
  </button>
);

// --- Main Problem Page Component ---
function ProblemPage() {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { slug } = useParams();
  const navigate = useNavigate();

  // --- Pane Resizing State ---
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [editorPaneHeight, setEditorPaneHeight] = useState(65); // Height of editor in right pane
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);
  const containerRef = useRef(null); // Horizontal container
  const rightPaneRef = useRef(null); // Right pane container

  // --- UI State ---
  const [activeLeftTab, setActiveLeftTab] = useState("description"); // 'description', 'solution', 'submissions'
  const [activeRightTab, setActiveRightTab] = useState("testcase"); // 'testcase', 'result'
  const [selectedLanguage, setSelectedLanguage] = useState("javascript"); // Placeholder
  const [code, setCode] = useState(""); // Holds the code in the editor

  // --- Fetch problem details ---
  useEffect(() => {
    const fetchProblem = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/problems/getoneproblem/${slug}`,
          { withCredentials: true }
        );
        setProblem(data);

        // --- 3. SET INITIAL STARTER CODE ---
        if (data.starterCode && data.starterCode.length > 0) {
          // Set editor to the first language in the list
          setSelectedLanguage(data.starterCode[0].language);
          setCode(data.starterCode[0].code);
        } else {
          // Fallback if no starter code is provided
          setCode(`// No starter code found for ${data.title}`);
        }
      } catch (err) {
        console.error("Error fetching problem:", err);
        setError(
          err.response?.data?.message || "Problem not found or failed to load."
        );
        toast.error(err.response?.data?.message || "Failed to load problem.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  // --- Resizing Handlers (Horizontal) ---
  const handleMouseDownHorizontal = useCallback(() => {
    isResizingHorizontal.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);
  const handleMouseMoveHorizontal = useCallback((e) => {
    if (!isResizingHorizontal.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidthPercent =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftPaneWidth(Math.max(20, Math.min(80, newWidthPercent)));
  }, []);

  // --- Resizing Handlers (Vertical) ---
  const handleMouseDownVertical = useCallback(() => {
    isResizingVertical.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);
  const handleMouseMoveVertical = useCallback((e) => {
    if (!isResizingVertical.current || !rightPaneRef.current) return;
    const containerRect = rightPaneRef.current.getBoundingClientRect();
    const newHeightPercent =
      ((e.clientY - containerRect.top) / containerRect.height) * 100;
    setEditorPaneHeight(Math.max(15, Math.min(85, newHeightPercent))); // Clamp height 15%-85%
  }, []);

  // --- 4. NEW EDITOR HANDLERS ---
  const handleEditorChange = (value) => {
    setCode(value || "");
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    // Find the starter code for the new language
    const newStarterCode = problem.starterCode.find(
      (sc) => sc.language === newLang
    );
    if (newStarterCode) {
      setCode(newStarterCode.code);
    } else {
      setCode(`// Starter code for ${newLang} not found.`);
    }
  };

  const resetCode = () => {
    const starterCode = problem.starterCode.find(
      (sc) => sc.language === selectedLanguage
    );
    if (starterCode) {
      if (
        window.confirm(
          "Are you sure you want to reset your code? All changes will be lost."
        )
      ) {
        setCode(starterCode.code);
      }
    }
  };

  // Global MouseUp to stop both resizers
  const handleMouseUp = useCallback(() => {
    if (isResizingHorizontal.current || isResizingVertical.current) {
      isResizingHorizontal.current = false;
      isResizingVertical.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, []);

  // Add/remove global mouse listeners
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

  // --- Render Logic ---
  if (loading) return <LoadingSpinner />;
  if (error || !problem) {
    return (
      <div className="bg-black flex flex-col items-center justify-center min-h-screen text-center p-4">
        <button
          onClick={() => navigate("/practice")}
          className="fixed top-24 left-6 z-10"
        >
          {" "}
        </button>
        <h1 className="text-4xl font-bold text-red-500 animate-pulse [text-shadow:0_0_15px_rgba(255,0,0,0.6)]">
          {" "}
          Error Loading Problem{" "}
        </h1>
        <p className="text-xl text-gray-400 mt-4">
          {error || "The requested problem could not be found."}
        </p>
      </div>
    );
  }

  // --- Godfather Styles ---
  const paneStyle = `bg-gradient-to-b from-black via-gray-950/70 to-black border-2 border-orange-800/60 rounded-xl shadow-[0_0_50px_rgba(255,69,0,0.35),inset_0_2px_10px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col`;
  const paneHeaderStyle = `p-3 px-4 text-sm font-semibold text-gray-400 border-b-2 border-orange-800/60 bg-gradient-to-t from-black/60 to-gray-950/60 backdrop-blur-sm flex justify-between items-center shrink-0`;
  const actionButtonStyle = `px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black`;
  const runButtonStyle = `bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600/80 text-gray-300 hover:from-gray-600 hover:to-gray-700 hover:text-white hover:border-gray-500 hover:scale-[1.03] shadow-[0_0_12px_rgba(150,150,150,0.4)] focus:ring-gray-500`;
  const submitButtonStyle = `bg-gradient-to-r from-orange-600 to-red-700 text-white shadow-[0_0_18px_rgba(255,69,0,0.6)] hover:from-orange-700 hover:to-red-800 hover:shadow-[0_0_30px_rgba(255,69,0,0.8)] hover:scale-[1.03] focus:ring-orange-500`;
  const iconButtonStyle = `p-2 rounded-full bg-black/40 border border-gray-700/50  text-yellow-400
                       transition-all duration-200 
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black 
                       shadow-sm
                       hover:text-orange-400 hover:border-orange-600/60 hover:bg-orange-900/20 
                       hover:shadow-[0_0_15px_rgba(255,100,0,0.3)]
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-black/40`;

  return (
    <>
      {/* --- Top Bar --- */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-black border-b-2 border-orange-800/60 shadow-[0_5px_25px_rgba(255,69,0,0.4)] flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="flex items-center gap-2 text-orange-500 font-bold text-xs sm:text-sm transition-all duration-300 transform hover:text-orange-400 hover:scale-105"
          >
            <FaArrowLeft /> <span className="hidden sm:inline">Problems</span>
          </button>
          <div className="h-6 w-px bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white truncate [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
              {problem.title}
            </h1>
            {problem.isPremium && (
              <span
                title="Premium Problem"
                className="text-yellow-400 text-base [text-shadow:0_0_10px_rgba(255,215,0,0.7)]"
              >
                <IoIosLock />
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-gray-500">
          <button title="Timer (Coming Soon)" className={iconButtonStyle}>
            <FaClock size={16} />
          </button>
          <button
            title="Invite Friend (Coming Soon)"
            className={iconButtonStyle}
          >
            <FaUsers size={16} />
          </button>
          <button title="AI Helper (Coming Soon)" className={iconButtonStyle}>
            <FaRobot size={16} />
          </button>
          <button
            title="Layout Settings (Coming Soon)"
            className={iconButtonStyle}
          >
            <FaCog size={16} />
          </button>
        </div>
      </div>

      {/* --- Main Resizable Layout --- */}
      <div
        ref={containerRef}
        className="flex w-full h-screen bg-black text-gray-300 px-4 pt-20 pb-4 box-border"
        onMouseUp={handleMouseUp}
      >
        {/* --- Left Pane (Problem Description) --- */}

        <div className={paneStyle} style={{ width: `${leftPaneWidth}%` }}>
          <div className={`${paneHeaderStyle} !p-0 !px-2`}>
            <TabButton
              label="Description"
              isActive={activeLeftTab === "description"}
              onClick={() => setActiveLeftTab("description")}
            />
            <TabButton
              label="Solution"
              isActive={activeLeftTab === "solution"}
              onClick={() => setActiveLeftTab("solution")}
            />
            <TabButton
              label="Submissions"
              isActive={activeLeftTab === "submissions"}
              onClick={() => setActiveLeftTab("submissions")}
            />
          </div>

          {/* --- Scrollable Content Area --- */}
          <div className="p-5 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-orange-800/50 scrollbar-track-black/50 scrollbar-thin scrollbar-thumb-orange-800/50 scrollbar-track-black/50 no-scrollbar">
            {/* --- DESCRIPTION TAB --- */}
            {activeLeftTab === "description" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        // Applied a consistent, glowing tag style
                        className="inline-block px-2.5 py-1 bg-black border border-orange-800/60 text-orange-400/90 rounded shadow-[0_0_8px_rgba(255,100,0,0.3)] text-[11px] font-semibold whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <article className="prose prose-sm prose-invert max-w-none text-gray-300 problem-description-markdown prose-code:text-orange-300 prose-strong:text-yellow-400">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {problem.description}
                  </ReactMarkdown>
                </article>
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-white mb-4 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                    Examples
                  </h2>
                  {problem.testCases && problem.testCases.length > 0 ? (
                    problem.testCases.map((tc, index) => (
                      <TestCaseDisplay
                        key={tc._id || index}
                        testCase={tc}
                        index={index}
                      />
                    ))
                  ) : (
                    <p className="text-gray-600 italic">
                      No sample test cases provided.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* --- SOLUTION TAB (ENHANCED PLACEHOLDER) --- */}
            {activeLeftTab === "solution" && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="p-8 bg-black border-2 border-orange-800/60 rounded-xl shadow-[0_0_40px_rgba(255,69,0,0.3)]">
                  <IoIosLock
                    size={50}
                    className="text-yellow-400 mb-3 [text-shadow:0_0_15px_rgba(255,215,0,0.7)]"
                  />
                  <h2 className="text-xl font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                    Solution Unavailable
                  </h2>
                  <p className="text-gray-400 mt-2 text-sm max-w-xs">
                    The solution for this problem is not available yet or is
                    locked.
                    <br />
                    (This feature is coming soon!)
                  </p>
                </div>
              </div>
            )}

            {/* --- SUBMISSIONS TAB (ENHANCED PLACEHOLDER) --- */}
            {activeLeftTab === "submissions" && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="p-8 bg-black border-2 border-orange-800/60 rounded-xl shadow-[0_0_40px_rgba(255,69,0,0.3)]">
                  <FaPaperPlane size={40} className="text-orange-500 mb-4" />
                  <h2 className="text-xl font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                    No Submissions Yet
                  </h2>
                  <p className="text-gray-400 mt-2 text-sm max-w-xs">
                    You have not submitted any solutions for this problem.
                    <br />
                    Run or Submit your code to see results here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Horizontal Resizer Handle --- */}
        <div
          className="w-2.5 cursor-col-resize bg-gradient-to-r from-orange-900/30 via-orange-700/60 to-orange-900/30 hover:via-orange-600/80 transition-colors duration-150 flex-shrink-0 border-l border-r border-orange-800/50 shadow-[0_0_10px_rgba(255,100,0,0.4)]"
          onMouseDown={handleMouseDownHorizontal}
        ></div>

        {/* --- Right Pane (Editor & Actions) --- */}
        <div
          ref={rightPaneRef}
          className={paneStyle}
          style={{ width: `${100 - leftPaneWidth}%` }}
        >
          {/* Top Part: Editor */}
          {/* --- THIS IS THE CORRECTED SECTION --- */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ height: `${editorPaneHeight}%` }}
          >
            <div className={paneHeaderStyle}>
              <select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="bg-gray-800/50 border border-gray-700/80 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-orange-600/80 focus:ring-1 focus:ring-orange-600/50 appearance-none shadow-inner cursor-pointer"
              >
                {problem.starterCode.map((sc) => (
                  <option key={sc.language} value={sc.language}>
                    {sc.language.charAt(0).toUpperCase() + sc.language.slice(1)}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-4 text-gray-500">
                <button
                  onClick={resetCode}
                  title="Reset Code"
                  className={iconButtonStyle}
                >
                  <FaSyncAlt size={14} />
                </button>
                <button
                  title="Complexity Analysis (Soon)"
                  className={`${iconButtonStyle} hidden sm:block`}
                  disabled
                >
                  <FaBrain size={15} />
                </button>
              </div>
            </div>

            <div className="flex-grow bg-gray-900 overflow-hidden">
              <Editor
                height="100%"
                language={selectedLanguage}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                  fontSize: 14,
                  fontFamily: '"Roboto Mono", monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  padding: { top: 10 },
                }}
              />
            </div>
          </div>
          {/* --- END OF CORRECTED SECTION --- */}

          {/* Vertical Resizer Handle */}
          <div
            className="h-2.5 cursor-row-resize bg-gradient-to-t from-orange-900/30 via-orange-700/60 to-orange-900/30 hover:via-orange-600/80 transition-colors duration-150 flex-shrink-0 border-t border-b border-orange-800/50 shadow-[0_0_10px_rgba(255,100,0,0.4)]"
            onMouseDown={handleMouseDownVertical}
          ></div>

          {/* Bottom Part: Console & Actions */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ height: `${100 - editorPaneHeight}%` }}
          >
            <div className={`${paneHeaderStyle} !p-0 !px-2`}>
              <TabButton
                label="Testcase"
                isActive={activeRightTab === "testcase"}
                onClick={() => setActiveRightTab("testcase")}
              />
              <TabButton
                label="Run Result"
                isActive={activeRightTab === "result"}
                onClick={() => setActiveRightTab("result")}
              />
            </div>

            {/* Console/Output Placeholder */}
            <div className="flex-grow p-3 overflow-y-auto text-xs font-mono bg-black/40 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black/50 scrollbar-thin scrollbar-thumb-orange-800/50 scrollbar-track-black/50 no-scrollbar">
              {activeRightTab === "testcase" && (
                <div>
                  <p className="text-gray-400 mb-2">
                    Run against sample test cases:
                  </p>
                  {problem.testCases.map((tc, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-900/50 border border-gray-700/50 rounded mb-2"
                    >
                      <p className="text-gray-500 font-semibold text-xs">
                        Case {index + 1}:{" "}
                        <code className="text-orange-400">{tc.input}</code>
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {activeRightTab === "result" && (
                <div>
                  <p className="text-gray-600 italic">
                    (Run results will appear here...)
                  </p>
                  {/* Example: <p className='text-green-400'>Test Case 1: Passed</p> */}
                  {/* Example: <p className='text-red-400'>Test Case 2: Wrong Answer</p> */}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="p-3 flex justify-end items-center gap-4 bg-gradient-to-t from-black via-gray-950/60 to-black/40 border-t-2 border-orange-800/60">
              <button
                disabled
                className={`${actionButtonStyle} ${runButtonStyle}`}
              >
                <FaPlay /> Run
              </button>
              <button
                disabled
                className={`${actionButtonStyle} ${submitButtonStyle}`}
              >
                <FaPaperPlane /> Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProblemPage;
