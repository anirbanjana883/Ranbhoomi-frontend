import React, { useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { serverUrl } from "../../App";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaAlignLeft, FaList, FaLock } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import DifficultyBadge from '../ProblemPageComponent/DifficultyBadge';
import TestCaseDisplay from '../ProblemPageComponent/TestCaseDisplay';

const TabButton = ({ label, isActive, onClick, disabled, icon: Icon }) => (
  <button
    onClick={!disabled ? onClick : undefined}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors duration-200
      ${isActive
          ? "text-red-400 border-red-500 bg-zinc-900/50"
          : disabled
            ? "text-zinc-600 border-transparent cursor-not-allowed opacity-50"
            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/30"
      }`}
  >
    {Icon && <Icon size={12} />}
    {label}
  </button>
);

const SubmissionRow = ({ submission }) => {
  const isAccepted = submission.status === "Accepted";
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-md mb-2 transition-colors hover:bg-zinc-800/80">
      <div className={`flex items-center gap-2 text-sm font-semibold ${isAccepted ? "text-emerald-400" : "text-red-400"}`}>
        {isAccepted ? <FaCheckCircle /> : <FaTimesCircle />}
        <span>{submission.status}</span>
      </div>
      <div className="flex sm:flex-col sm:items-end text-right gap-x-3 sm:gap-x-0 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <span className="text-zinc-300 text-xs font-medium bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 mb-1 block">
          {submission.language}
        </span>
        <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
          {new Date(submission.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default function ContestProblemPane({
  problem,
  slug,
  activeLeftTab,
  setActiveLeftTab,
  submissions,
  setSubmissions,
  loadingSubmissions,
  setLoadingSubmissions
}) {
  
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (setLoadingSubmissions) setLoadingSubmissions(true);
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/contest-submissions/problem/${slug}`, 
          { withCredentials: true }
        );
        if (setSubmissions) setSubmissions(data.data || data);
      } catch (err) {
        console.error("Failed to load contest submissions");
      } finally {
        if (setLoadingSubmissions) setLoadingSubmissions(false);
      }
    };
    if (activeLeftTab === "submissions") fetchSubmissions();
  }, [activeLeftTab, slug, setSubmissions, setLoadingSubmissions]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10 px-2">
        <TabButton label="Description" icon={FaAlignLeft} isActive={activeLeftTab === "description"} onClick={() => setActiveLeftTab("description")} />
        <TabButton label="Submissions" icon={FaList} isActive={activeLeftTab === "submissions"} onClick={() => setActiveLeftTab("submissions")} />
        <TabButton label="Solution" icon={FaLock} isActive={false} disabled={true} onClick={() => {}} />
      </div>

      <div className="p-5 md:p-6 grow overflow-y-auto custom-scrollbar">
        {activeLeftTab === "description" && problem && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/60 pb-4">
              <DifficultyBadge difficulty={problem.difficulty} />
              <div className="flex flex-wrap gap-1.5">
                {problem.tags?.map((tag) => (
                  <span key={tag} className="inline-block px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[10px] font-medium whitespace-nowrap">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm mb-8">
              <article className="max-w-none text-zinc-300 problem-description-markdown leading-relaxed text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {problem.description}
                </ReactMarkdown>
              </article>
            </div>

            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-4">Examples</h2>
              {problem.testCases && problem.testCases.length > 0 ? (
                problem.testCases.map((tc, index) => (
                  <TestCaseDisplay key={tc._id || index} testCase={tc} index={index} />
                ))
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg p-6 text-center">
                  <p className="text-zinc-500 italic text-sm">No public test cases available.</p>
                </div>
              )}
            </div>

            {/* TUF Styled Contest Warning */}
            <div className="mt-10 p-5 rounded-lg bg-red-500/5 border border-red-500/20 flex gap-4 shadow-sm">
              <FaExclamationTriangle className="text-red-500 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="font-bold text-red-400 mb-1 text-sm tracking-tight">Strict Contest Environment</p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-red-200/70 font-medium">
                  <li>AI Tutors and assistance algorithms are disabled.</li>
                  <li>Solutions and Discussions are hidden until the arena closes.</li>
                  <li>Background plagiarism checks are active.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeLeftTab === "submissions" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-4">My Submissions</h2>
            
            {loadingSubmissions ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div></div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 text-zinc-500 mt-4">
                <p className="text-sm font-medium">No code submitted yet.</p>
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