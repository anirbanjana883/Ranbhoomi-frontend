import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux"; // Needed for user ID check
import { serverUrl } from "../../App";
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaPaperPlane, 
  FaTrash, 
  FaUserCircle 
} from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Import your existing helper components
import DifficultyBadge from '../../component/ProblemPageComponent/DifficultyBadge'
import TestCaseDisplay from '../../component/ProblemPageComponent/TestCaseDisplay';

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
    ? "text-green-400 border-green-700/50"
    : "text-red-400 border-red-700/50";
  const statusIcon = isAccepted ? <FaCheckCircle /> : <FaTimesCircle />;

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 
                 bg-black border border-orange-800/60 rounded-lg mb-2 
                 transition-all hover:bg-gray-950 hover:border-orange-700/80"
    >
      <div className={`flex items-center gap-2 text-sm font-semibold ${statusColor}`}>
        {statusIcon}
        <span>{submission.status}</span>
      </div>
      <div className="flex sm:flex-col sm:items-end text-right gap-x-3 sm:gap-x-0 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <span className="text-gray-300 text-xs sm:text-sm font-medium">
          {submission.language}
        </span>
        <span className="text-gray-500 text-xs">
          {new Date(submission.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// --- Main Component ---
function ProblemDescription({
  problem,
  slug,
  activeLeftTab,
  setActiveLeftTab,
  submissions,
  setSubmissions,
  loadingSubmissions,
  setLoadingSubmissions,
  isContestMode = false
}) {
  
  // Redux User State (for comments)
  const { userData } = useSelector((state) => state.user);

  // State for Solution Tab
  const [solution, setSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState(null);

  // State for Discussion Tab (Integrated)
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // --- EFFECTS ---

  useEffect(() => {
    // 1. Fetch Submissions
    const fetchSubmissions = async () => {
      if (setLoadingSubmissions) setLoadingSubmissions(true);
      try {
        const endpoint = isContestMode
          ? `${serverUrl}/api/contest-submissions/problem/${slug}`
          : `${serverUrl}/api/submissions/problem/${slug}`;
          
        const { data } = await axios.get(endpoint, { withCredentials: true });
        if (setSubmissions) setSubmissions(data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load submissions.");
      } finally {
        if (setLoadingSubmissions) setLoadingSubmissions(false);
      }
    };

    // 2. Fetch Solution
    const fetchSolution = async () => {
      setLoadingSolution(true);
      setSolutionError(null);
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/problems/getoneproblem/${slug}/solution`,
          { withCredentials: true }
        );
        setSolution(data.solution);
      } catch (err) {
        setSolution(null);
        setSolutionError(err.response?.data?.message || "Could not load solution.");
      } finally {
        setLoadingSolution(false);
      }
    };

    // 3. Fetch Comments (New)
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const { data } = await axios.get(`${serverUrl}/api/comments/${slug}`, {
          withCredentials: true
        });
        setComments(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load discussions");
      } finally {
        setLoadingComments(false);
      }
    };

    // Logic to decide what to fetch based on tab
    if (activeLeftTab === "submissions") {
      fetchSubmissions();
    } else if (activeLeftTab === "solution" && !solution && !solutionError) {
      fetchSolution();
    } else if (activeLeftTab === "discuss") {
      fetchComments();
    }

  }, [
    activeLeftTab,
    slug,
    solution,
    solutionError,
    setSubmissions,
    setLoadingSubmissions,
    isContestMode
  ]);

  // --- DISCUSSION HANDLERS ---

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/comments/${slug}`,
        { text: newComment },
        { withCredentials: true }
      );
      setComments([data, ...comments]); // Add new comment to top
      setNewComment("");
      toast.success("Comment posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if(!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`${serverUrl}/api/comments/${commentId}`, { withCredentials: true });
      setComments(comments.filter(c => c._id !== commentId));
      toast.success("Comment deleted");
    } catch(err) {
      toast.error("Failed to delete");
    }
  };

  const paneHeaderStyle = `p-3 px-4 text-sm font-semibold text-gray-400 border-b-2 border-orange-800/60 bg-gradient-to-t from-black/60 to-gray-950/60 backdrop-blur-sm flex justify-start items-center shrink-0`;

  return (
    <>
      {/* --- TAB HEADER --- */}
      <div className={`${paneHeaderStyle} !p-0 !px-2`}>
        <TabButton
          label="Description"
          isActive={activeLeftTab === "description"}
          onClick={() => setActiveLeftTab("description")}
        />
        {!isContestMode && (
            <TabButton 
              label="Solution" 
              isActive={activeLeftTab === "solution"} 
              onClick={() => setActiveLeftTab("solution")} 
            />
        )}
        <TabButton
          label="Submissions"
          isActive={activeLeftTab === "submissions"}
          onClick={() => setActiveLeftTab("submissions")}
        />
        <TabButton
          label="Discuss"
          isActive={activeLeftTab === "discuss"}
          onClick={() => setActiveLeftTab("discuss")}
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
                    {tag}
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

        {/* --- SOLUTION TAB --- */}
        {activeLeftTab === "solution" && (
          <div>
            {loadingSolution && (
              <div className="flex justify-center items-center h-48">
                <div className="w-12 h-12 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
              </div>
            )}
            {!loadingSolution && solution && (
              <article className="max-w-none text-gray-300 problem-description-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {solution}
                </ReactMarkdown>
              </article>
            )}
            {!loadingSolution && solutionError && (
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
                  <FaPaperPlane size={40} className="text-orange-500 mb-4 " />
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

        {/* --- DISCUSSION TAB (INTEGRATED) --- */}
        {activeLeftTab === "discuss" && (
          <div className="flex flex-col h-full">
            {/* Input Area */}
            <form onSubmit={handlePostComment} className="mb-6">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts, hints, or solution..."
                  className="w-full bg-gray-900/50 text-gray-200 border border-gray-700 rounded-lg p-3 pr-12 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm resize-none transition-all"
                  rows="3"
                />
                <button
                  type="submit"
                  disabled={isPosting || !newComment.trim()}
                  className="absolute bottom-3 right-3 text-orange-500 hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95"
                  title="Post Comment"
                >
                  <FaPaperPlane size={16} className="cursor-pointer"/>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="flex-grow space-y-4">
              {loadingComments ? (
                <div className="flex justify-center items-center py-10">
                   <div className="w-8 h-8 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-gray-600 py-10 opacity-60">
                   <p className="text-sm italic">No discussions yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 group">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {comment.user?.photoUrl ? (
                         <img src={comment.user.photoUrl} alt={comment.user.name} className="w-8 h-8 rounded-full border border-orange-900/50 object-cover" />
                      ) : (
                         <div className="w-8 h-8 rounded-full bg-orange-900/30 border border-orange-700/30 flex items-center justify-center text-orange-400 text-xs font-bold">
                            {comment.user?.name?.charAt(0).toUpperCase() || "?"}
                         </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-200">{comment.user?.name || "Anonymous"}</span>
                          <span className="text-xs text-gray-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 relative hover:border-gray-700 transition-colors">
                          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                              {comment.text}
                          </p>
                          
                          {/* Delete Button (Visible on hover for owner) */}
                          {userData && userData._id === comment.user?._id && (
                              <button 
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded"
                                  title="Delete Comment"
                              >
                                  <FaTrash size={12} />
                              </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default ProblemDescription;