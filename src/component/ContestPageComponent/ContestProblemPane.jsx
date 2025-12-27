import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaAlignLeft,
  FaList,
  FaLock
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// --- Adjust these paths to match your folder structure ---
// Since this file is in src/components/contest/, we go back two levels to find 'component'
import DifficultyBadge from '../../component/ProblemPageComponent/DifficultyBadge';
import TestCaseDisplay from '../../component/ProblemPageComponent/TestCaseDisplay';

// --- Helper: Tab Button (Enhanced for Contest) ---
const TabButton = ({ label, isActive, onClick, disabled, icon: Icon }) => (
  <button
    onClick={!disabled ? onClick : undefined}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200
      ${
        isActive
          ? "text-orange-400 border-orange-500 bg-orange-900/10 [text-shadow:0_0_10px_rgba(255,69,0,0.4)]"
          : disabled
            ? "text-gray-600 border-transparent cursor-not-allowed opacity-70"
            : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
      }`}
  >
    {Icon && <Icon size={14} />}
    {label}
  </button>
);

// --- Helper: Submission Row (Kept your exact style) ---
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
                 transition-all hover:bg-gray-950 hover:border-orange-700/80 animate-in fade-in slide-in-from-bottom-2"
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
          {new Date(submission.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

// --- Main Component ---
function ContestProblemPane({
  problem,
  slug,
  activeLeftTab,
  setActiveLeftTab,
  submissions,
  setSubmissions,
  loadingSubmissions,
  setLoadingSubmissions
}) {
  
  // --- EFFECTS ---
  useEffect(() => {
    // Only fetch submissions if tab is active
    const fetchSubmissions = async () => {
      if (setLoadingSubmissions) setLoadingSubmissions(true);
      try {
        // Use CONTEST endpoint
        const { data } = await axios.get(
          `${serverUrl}/api/contest-submissions/problem/${slug}`, 
          { withCredentials: true }
        );
        if (setSubmissions) setSubmissions(data);
      } catch (err) {
        // Silent fail or toast
        console.error("Failed to load contest submissions");
      } finally {
        if (setLoadingSubmissions) setLoadingSubmissions(false);
      }
    };

    if (activeLeftTab === "submissions") {
      fetchSubmissions();
    }
  }, [activeLeftTab, slug, setSubmissions, setLoadingSubmissions]);

  // Style shared with your original component
  const paneHeaderStyle = `flex items-center border-b border-orange-900/30 bg-[#050505] sticky top-0 z-10`;

  return (
    <div className="flex flex-col h-full bg-black">
      
      {/* --- TAB HEADER --- */}
      <div className={paneHeaderStyle}>
        <TabButton
          label="Description"
          icon={FaAlignLeft}
          isActive={activeLeftTab === "description"}
          onClick={() => setActiveLeftTab("description")}
        />
        <TabButton
          label="Submissions"
          icon={FaList}
          isActive={activeLeftTab === "submissions"}
          onClick={() => setActiveLeftTab("submissions")}
        />
        {/* LOCKED TAB VISUAL */}
        <TabButton
          label="Solution"
          icon={FaLock}
          isActive={false}
          disabled={true}
          onClick={() => {}}
        />
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
        
        {/* --- DESCRIPTION TAB --- */}
        {activeLeftTab === "description" && (
          <div className="animate-in fade-in duration-300">
            {/* Header Info */}
            <div className="flex items-center gap-3 mb-6">
              <DifficultyBadge difficulty={problem.difficulty} />
              <div className="flex flex-wrap gap-1.5">
                {problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 bg-gray-900 border border-orange-900/40 text-gray-400 rounded text-[10px] font-mono uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-orange-900/20 text-orange-500 border border-orange-900/50">
                10 Points
              </span>
            </div>

            {/* Markdown Content */}
            <article className="max-w-none text-gray-300 problem-description-markdown prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111] prose-pre:border prose-pre:border-gray-800">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {problem.description}
              </ReactMarkdown>
            </article>

            {/* Examples */}
            <div className="mt-8 space-y-4">
              {problem.testCases && problem.testCases.length > 0 ? (
                problem.testCases.map((tc, index) => (
                  <TestCaseDisplay
                    key={tc._id || index}
                    testCase={tc}
                    index={index}
                  />
                ))
              ) : (
                <p className="text-gray-600 italic text-sm">No public test cases available.</p>
              )}
            </div>

            {/* Contest Rules Warning */}
            <div className="mt-10 p-4 rounded-lg bg-orange-950/10 border border-orange-600/30 flex gap-4">
              <FaExclamationTriangle className="text-orange-500 mt-1 shrink-0" />
              <div className="text-sm text-orange-200/60">
                <p className="font-bold text-orange-400 mb-1">Contest Environment</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>AI Assistance is disabled.</li>
                  <li>Solutions and Discussions are hidden until the contest ends.</li>
                  <li>Plagiarism checks are running in the background.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* --- SUBMISSIONS TAB --- */}
        {activeLeftTab === "submissions" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaList className="text-orange-500" /> My Submissions
            </h2>
            
            {loadingSubmissions ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-800 rounded-xl text-gray-500 mt-4">
                <p>No submissions yet.</p>
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
    </div>
  );
}

export default ContestProblemPane;