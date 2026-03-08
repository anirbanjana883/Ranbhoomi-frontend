import React, { useState, useEffect } from "react";
import toast from "react-hot-toast"; 
import { useSelector } from "react-redux";
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaPaperPlane, 
  FaTrash,
  FaStickyNote
} from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import API from "../../api/axios.js"; 

import DifficultyBadge from '../../component/ProblemPageComponent/DifficultyBadge';
import TestCaseDisplay from '../../component/ProblemPageComponent/TestCaseDisplay';
import NotesPanel from './NotesPanel'; 

// --- Helper Component: Tab Button  ---
const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200
      ${
        isActive
          ? "text-red-400 border-red-500"
          : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
      }`}
  >
    {label}
  </button>
);

// --- Helper Component: Submission Row  ---
const SubmissionRow = ({ submission }) => {
  const isAccepted = submission.status === "Accepted";
  const statusColor = isAccepted
    ? "text-emerald-400"
    : "text-red-400";
  const statusIcon = isAccepted ? <FaCheckCircle /> : <FaTimesCircle />;

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 
                 bg-zinc-900 border border-zinc-800 rounded-lg mb-2.5 
                 transition-colors hover:bg-zinc-800/80 hover:border-zinc-700"
    >
      <div className={`flex items-center gap-2 text-sm font-semibold ${statusColor}`}>
        {statusIcon}
        <span>{submission.status}</span>
      </div>
      <div className="flex sm:flex-col sm:items-end text-right gap-x-3 sm:gap-x-0 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <span className="text-zinc-300 text-xs font-medium bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700 mb-1">
          {submission.language}
        </span>
        <span className="text-zinc-500 text-[11px]">
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
  const { userData } = useSelector((state) => state.user);

  const [solution, setSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState(null);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // --- EFFECTS (API & Wrapper Unpacking) ---
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (setLoadingSubmissions) setLoadingSubmissions(true);
      try {
        const endpoint = isContestMode
          ? `/contest-submissions/problem/${slug}`
          : `/submissions/problem/${slug}`;
          
        const { data } = await API.get(endpoint);
        const unwrappedData = data?.data || data || [];
        if (setSubmissions) setSubmissions(unwrappedData);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load submissions.");
      } finally {
        if (setLoadingSubmissions) setLoadingSubmissions(false);
      }
    };

    const fetchSolution = async () => {
      setLoadingSolution(true);
      setSolutionError(null);
      try {
        const { data } = await API.get(`/problems/${slug}/solution`);
        const unwrappedData = data?.data || data;
        setSolution(unwrappedData.solution);
      } catch (err) {
        setSolution(null);
        setSolutionError(err.response?.data?.message || "Could not load solution.");
      } finally {
        setLoadingSolution(false);
      }
    };

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const { data } = await API.get(`/comments/${slug}`);
        const unwrappedData = data?.data || data || [];
        setComments(unwrappedData);
      } catch (err) {
        console.error("Comments fetch error:", err);
        toast.error("Failed to load discussions");
      } finally {
        setLoadingComments(false);
      }
    };

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
      const { data } = await API.post(`/comments/${slug}`, { text: newComment });
      const unwrappedData = data?.data || data;
      setComments([unwrappedData, ...comments]); 
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
      await API.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
      toast.success("Comment deleted");
    } catch(err) {
      toast.error("Failed to delete comment");
    }
  };

  const paneHeaderStyle = `px-2 border-b border-zinc-800 bg-zinc-950 flex justify-start items-center shrink-0 overflow-x-auto custom-scrollbar`;

  return (
    <>
      {/* --- TAB HEADER --- */}
      <div className={paneHeaderStyle}>
        <TabButton label="Description" isActive={activeLeftTab === "description"} onClick={() => setActiveLeftTab("description")} />
        {!isContestMode && (
          <TabButton label="Solution" isActive={activeLeftTab === "solution"} onClick={() => setActiveLeftTab("solution")} />
        )}
        {!isContestMode && (
          <TabButton label="Discuss" isActive={activeLeftTab === "discuss"} onClick={() => setActiveLeftTab("discuss")} />
        )}
        <TabButton label="Submissions" isActive={activeLeftTab === "submissions"} onClick={() => setActiveLeftTab("submissions")} />
          <TabButton label="Notes" icon={FaStickyNote} isActive={activeLeftTab === "notes"} onClick={() => setActiveLeftTab("notes")} />
      </div>

      {/* --- Scrollable Content Area --- */}
      <div className="p-5 flex-grow overflow-y-auto custom-scrollbar bg-zinc-950">
        
        {/* --- DESCRIPTION TAB --- */}
        {activeLeftTab === "description" && (
          <div className="animate-in fade-in duration-300">
            {/* Badges */}
            <div className="flex items-center gap-3 mb-5">
              <DifficultyBadge difficulty={problem.difficulty} />
              <div className="flex flex-wrap gap-1.5">
                {problem.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 bg-zinc-900 border border-zinc-700/60 text-zinc-300 rounded-md text-[11px] font-medium whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            {/*  EYE-SOOTHING MATTE BLACK BOX FOR DESCRIPTION */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 md:p-6 shadow-sm mb-8">
              <article className="max-w-none text-zinc-300 problem-description-markdown leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {problem.description}
                </ReactMarkdown>
              </article>
            </div>

            {/* Examples Section */}
            <div className="mt-8 border-t border-zinc-800/60 pt-6">
              <h2 className="text-lg font-bold text-zinc-100 mb-4 tracking-tight">Examples</h2>
              {problem.testCases && problem.testCases.length > 0 ? (
                problem.testCases.map((tc, index) => (
                  <TestCaseDisplay key={tc._id || index} testCase={tc} index={index} />
                ))
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg p-6 text-center">
                  <p className="text-zinc-500 italic text-sm">No sample test cases provided.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/*  NOTES TAB */}
        {activeLeftTab === "notes" && (
           <NotesPanel slug={slug} />
        )}

        {/* --- SOLUTION TAB --- */}
        {activeLeftTab === "solution" && (
          <div className="animate-in fade-in duration-300">
            {loadingSolution && (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
              </div>
            )}
            
            {!loadingSolution && solution && (
              /* 🛡️ EYE-SOOTHING MATTE BLACK BOX FOR SOLUTION */
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 md:p-6 shadow-sm">
                <article className="max-w-none text-zinc-300 problem-description-markdown leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {solution}
                  </ReactMarkdown>
                </article>
              </div>
            )}
            
            {!loadingSolution && solutionError && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 mt-10">
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full shadow-lg">
                  <IoIosLock size={44} className="text-amber-500 mb-4 mx-auto" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Solution Locked</h2>
                  <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
                    {solutionError}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- SUBMISSIONS TAB --- */}
        {activeLeftTab === "submissions" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold text-zinc-100 mb-4 tracking-tight">My Submissions</h2>
            {loadingSubmissions ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
              </div>
            ) : !submissions || submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4 mt-10">
                <div className="p-8 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl max-w-sm w-full">
                  <FaPaperPlane size={32} className="text-zinc-700 mb-4 mx-auto" />
                  <h2 className="text-sm font-bold text-zinc-300 tracking-tight">No Submissions Yet</h2>
                  <p className="text-zinc-500 mt-2 text-xs">
                    You have not submitted any solutions for this problem.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <SubmissionRow key={sub._id} submission={sub} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- DISCUSSION TAB --- */}
        {activeLeftTab === "discuss" && (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            
            {/* Input Area */}
            <form onSubmit={handlePostComment} className="mb-8">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts, hints, or solution..."
                  className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-xl p-4 pr-12 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm resize-none transition-all placeholder:text-zinc-600 shadow-sm"
                  rows="3"
                />
                <button
                  type="submit"
                  disabled={isPosting || !newComment.trim()}
                  className="absolute bottom-4 right-4 text-zinc-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Post Comment"
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="flex-grow space-y-5">
              {loadingComments ? (
                <div className="flex justify-center items-center py-10">
                   <div className="w-6 h-6 border-2 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
                </div>
              ) : !comments || comments.length === 0 ? (
                <div className="text-center py-10 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl">
                   <p className="text-sm text-zinc-500 font-medium">No discussions yet. Start the conversation!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3 group">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-1">
                      {comment.user?.photoUrl ? (
                         <img src={comment.user.photoUrl} alt={comment.user.name} className="w-8 h-8 rounded-full border border-zinc-700 object-cover" />
                      ) : (
                         <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold uppercase">
                            {comment.user?.name?.charAt(0) || "?"}
                         </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-zinc-200">{comment.user?.name || "Anonymous"}</span>
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg rounded-tl-none p-3.5 relative hover:border-zinc-700 transition-colors">
                          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                              {comment.text}
                          </p>
                          
                          {/* Delete Button (Owner Only) */}
                          {userData && userData._id === comment.user?._id && (
                              <button 
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 bg-zinc-950 rounded"
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