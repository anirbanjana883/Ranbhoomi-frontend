import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App"; // Adjust path if needed
import { FaCheckCircle, FaTimesCircle, FaPaperPlane } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// --- Helper Component: Difficulty Badge ---
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
      {" "}
      {difficulty}{" "}
    </span>
  );
};

// --- Helper Component: Test Case Display ---
// --- Helper Component: Test Case Display ---
const TestCaseDisplay = ({ testCase, index }) => (
  <div className="mb-4 bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 rounded-lg border border-gray-700/50 shadow-sm">
    <p className="font-bold text-gray-300 mb-2 text-sm">Example {index + 1}:</p>

    <div className="space-y-2 text-xs font-mono">
      <div>
        <strong className="text-gray-500 font-sans text-[11px] uppercase tracking-wider">
          Input:
        </strong>
        <pre className="mt-1 whitespace-pre-wrap bg-black/30 px-3 py-2 rounded text-orange-300/90 border border-gray-800/50">
          {testCase.input?.replace(/\\n/g, "\n")}
        </pre>
      </div>

      <div>
        <strong className="text-gray-500 font-sans text-[11px] uppercase tracking-wider">
          Output:
        </strong>
        <pre className="mt-1 whitespace-pre-wrap bg-black/30 px-3 py-2 rounded text-orange-300/90 border border-gray-800/50">
          {testCase.expectedOutput?.replace(/\\n/g, "\n")}
        </pre>
      </div>
    </div>
  </div>
);


// --- Helper Component: Tab Button ---
const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200
                  ${
                    isActive
                      ? "text-orange-400 border-orange-500 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]"
                      : "text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700"
                  }`}
  >
    {label}
  </button>
);

// --- Helper Component: Submission Row ---
const SubmissionRow = ({ submission }) => {
  const isAccepted = submission.status === "Accepted";
  const statusColor = isAccepted
    ? "text-green-400 border-green-700/50 [text-shadow:0_0_8px_rgba(0,255,0,0.4)]"
    : "text-red-400 border-red-700/50 [text-shadow:0_0_8px_rgba(255,0,0,0.4)]";
  const statusIcon = isAccepted ? <FaCheckCircle /> : <FaTimesCircle />;

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 
                       bg-gray-950/50 border border-gray-700/50 rounded-lg mb-2 
                       transition-all hover:bg-gray-900 hover:border-gray-600"
    >
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${statusColor}`}
      >
        {statusIcon}
        <span>{submission.status}</span>
      </div>
      <div className="flex sm:flex-col sm:items-end text-right gap-x-3 sm:gap-x-0 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <span className="text-gray-400 text-xs sm:text-sm font-medium">
          {submission.language}
        </span>
        <span className="text-gray-500 text-xs">
          {new Date(submission.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// --- Main Component for the Left Pane ---
function ProblemDescription({
  problem,
  slug,
  activeLeftTab,
  setActiveLeftTab,
  submissions,
  setSubmissions,
  loadingSubmissions,
  setLoadingSubmissions,
}) {
  // --- NEW STATE for Solution ---
  const [solution, setSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState(null);

  // --- Fetch Submissions OR Solution when Tab is Clicked ---
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoadingSubmissions(true);
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/submissions/problem/${slug}`,
          { withCredentials: true }
        );
        setSubmissions(data);
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to load submissions."
        );
      } finally {
        setLoadingSubmissions(false);
      }
    };

    const fetchSolution = async () => {
      setLoadingSolution(true);
      setSolutionError(null);
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/problems/getoneproblem/${slug}/solution`, // Use the new endpoint
          { withCredentials: true }
        );
        setSolution(data.solution); // Set the solution string
      } catch (err) {
        setSolution(null); // Ensure no old solution is shown
        setSolutionError(
          err.response?.data?.message || "Could not load solution."
        );
      } finally {
        setLoadingSolution(false);
      }
    };

    if (activeLeftTab === "submissions") {
      fetchSubmissions();
    } else if (activeLeftTab === "solution" && !solution && !solutionError) {
      // Only fetch if not already fetched or errored
      fetchSolution();
    }
  }, [
    activeLeftTab,
    slug,
    solution,
    solutionError,
    setSubmissions,
    setLoadingSubmissions,
  ]); // Added all dependencies

  // --- Godfather Styles ---
  const paneStyle = `bg-gradient-to-b from-black via-gray-950/70 to-black border-2 border-orange-800/60 rounded-xl shadow-[0_0_50px_rgba(255,69,0,0.35),inset_0_2px_10px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col`;
  const paneHeaderStyle = `p-3 px-4 text-sm font-semibold text-gray-400 border-b-2 border-orange-800/60 bg-gradient-to-t from-black/60 to-gray-950/60 backdrop-blur-sm flex justify-between items-center shrink-0`;

  return (
    // This div is now the root element of this component
    <>
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
      <div className="p-5 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-orange-800/50 scrollbar-track-black/50 no-scrollbar">
        {/* --- DESCRIPTION TAB --- */}
        {activeLeftTab === "description" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <DifficultyBadge difficulty={problem.difficulty} />
              <div className="flex flex-wrap gap-1.5">
                {problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2.5 py-1 bg-black border border-orange-800/60 text-orange-400/90 rounded shadow-[0_0_8px_rgba(255,100,0,0.3)] text-[11px] font-semibold whitespace-nowrap"
                  >
                    {" "}
                    {tag}{" "}
                  </span>
                ))}
              </div>
            </div>
            <article className="max-w-none text-gray-300 problem-description-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {problem.description}
              </ReactMarkdown>
            </article>
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-4 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                {" "}
                Examples{" "}
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
                  {" "}
                  No sample test cases provided.{" "}
                </p>
              )}
            </div>
          </>
        )}

        {/* --- SOLUTION TAB --- */}
{/* --- SOLUTION TAB (Refined) --- */}
{activeLeftTab === "solution" && (
  <div>
    {loadingSolution && (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
      </div>
    )}

    {!loadingSolution && solution && (
      (() => {
        // --- Logic to split the solution string ---
        const codeBlockIndex = solution.indexOf("```");
        let explanation = solution;
        let codeSolution = "";

        if (codeBlockIndex !== -1) {
          explanation = solution.substring(0, codeBlockIndex);
          codeSolution = solution.substring(codeBlockIndex);
        }
        // --- End of logic ---

        return (
          <>
            {/* --- 1. The Explanation --- */}
            <h2 className="text-xl font-bold text-white mb-3 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
              Approach
            </h2>
            <article className="max-w-none text-gray-300 problem-description-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {explanation}
              </ReactMarkdown>
            </article>

            {/* --- 2. The Code Block --- */}
            {codeSolution && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-white mb-3 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                  Code Solution
                </h2>
                {/* This <article> will now *only* contain the code block(s) */}
                <article className="max-w-none text-gray-300 problem-description-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {codeSolution}
                  </ReactMarkdown>
                </article>
              </div>
            )}
          </>
        );
      })()
    )}

    {!loadingSolution && solutionError && (
      /* --- Placeholder for "Solution Locked" --- */
      <div className="flex flex-col items-center justify-center h-full text-center p-4 mt-10">
        <div className="p-8 bg-black border-2 border-orange-800/60 rounded-xl shadow-[0_0_40px_rgba(255,69,0,0.3)]">
          <IoIosLock
            size={50}
            className="text-yellow-400 mb-3 [text-shadow:0_0_15px_rgba(255,215,0,0.7)]"
          />
          <h2 className="text-xl font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
            Solution Locked
          </h2>
          <p className="text-gray-400 mt-2 text-sm max-w-xs">
            {solutionError} 
          </p>
        </div>
      </div>
    )}
  </div>
)}

        {/* --- SUBMISSIONS TAB --- */}
        {activeLeftTab === "submissions" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
              My Submissions
            </h2>
            {loadingSubmissions ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-12 h-12 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 mt-10">
                <div className="p-8 bg-black border-2 border-orange-800/60 rounded-xl shadow-[0_0_40px_rgba(255,69,0,0.3)]">
                  <FaPaperPlane size={40} className="text-orange-500 mb-4" />
                  <h2 className="text-xl font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                    No Submissions Yet
                  </h2>
                  <p className="text-gray-400 mt-2 text-sm max-w-xs">
                    You have not submitted any solutions for this problem.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <SubmissionRow key={sub._id} submission={sub} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default ProblemDescription;
