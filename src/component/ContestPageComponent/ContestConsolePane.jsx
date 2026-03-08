import React, { useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaTerminal, FaCode } from "react-icons/fa";

const TabButton = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors duration-200
      ${isActive
          ? "text-red-400 border-red-500 bg-zinc-900/50"
          : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/30"
      }`}
  >
    {Icon && <Icon size={12} />}
    {label}
  </button>
);

const TestCaseCard = ({ testCase, index }) => (
  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg mb-4 shadow-sm">
    <p className="font-bold text-zinc-100 mb-3 text-sm">Case {index + 1}</p>
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1.5">Input</p>
        <pre className="whitespace-pre-wrap bg-zinc-950 p-3 rounded-md border border-zinc-800 text-zinc-300 font-mono text-xs leading-relaxed custom-scrollbar">
          {testCase.input?.replace(/\\n/g, "\n")}
        </pre>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1.5">Expected Output</p>
        <pre className="whitespace-pre-wrap bg-zinc-950 p-3 rounded-md border border-zinc-800 text-emerald-400/80 font-mono text-xs leading-relaxed custom-scrollbar">
          {testCase.output || testCase.expectedOutput?.replace(/\\n/g, "\n")}
        </pre>
      </div>
    </div>
  </div>
);

const ResultBanner = ({ status, error }) => {
  const isAccepted = status === "Accepted";
  const isJudging = status === "Judging" || status === "Pending" || status === "Queued";
  
  if (isJudging) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-amber-500">
        <div className="w-6 h-6 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Evaluating Code...</span>
      </div>
    );
  }

  if (status === "Error" || error) {
     return (
      <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-lg">
        <div className="flex items-center gap-2 text-red-500 font-bold mb-3 tracking-tight">
          <FaTimesCircle /> Execution Error
        </div>
        <pre className="text-xs text-red-300 font-mono bg-red-950/30 p-3 rounded-md border border-red-900/30 whitespace-pre-wrap overflow-x-auto custom-scrollbar">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-lg border shadow-sm flex items-center gap-3 ${
      isAccepted ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-red-500/5 border-red-500/20 text-red-400"
    }`}>
      {isAccepted ? <FaCheckCircle size={20} /> : <FaTimesCircle size={20} />}
      <span className="text-lg font-black uppercase tracking-wide">
        {status || "Wrong Answer"}
      </span>
    </div>
  );
};

export default function ContestConsolePane({
  problemTestCases,
  submissionResult,
  isSubmitting,
  activeRightTab,
  setActiveRightTab,
}) {

  useEffect(() => {
    if (isSubmitting) setActiveRightTab("result");
  }, [isSubmitting, setActiveRightTab]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-sans">
      
      <div className="flex-shrink-0 flex items-center border-b border-zinc-800 bg-zinc-950 px-2">
        <TabButton label="Sample Cases" icon={FaCode} isActive={activeRightTab === "testcase"} onClick={() => setActiveRightTab("testcase")} />
        <TabButton label="Evaluation" icon={FaTerminal} isActive={activeRightTab === "result"} onClick={() => setActiveRightTab("result")} />
      </div>

      <div className="flex-grow p-5 overflow-y-auto custom-scrollbar">
        
        {/* TESTCASES TAB */}
        {activeRightTab === "testcase" && (
          <div className="animate-in fade-in duration-200">
            {problemTestCases && problemTestCases.length > 0 ? (
              problemTestCases.map((tc, index) => (
                <TestCaseCard key={tc._id || index} testCase={tc} index={index} />
              ))
            ) : (
              <div className="text-center py-10 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg">
                <p className="text-zinc-500 italic text-sm">No sample test cases visible in contest mode.</p>
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {activeRightTab === "result" && (
          <div className="animate-in fade-in duration-200 h-full">
            {isSubmitting ? (
              <ResultBanner status="Judging" />
            ) : !submissionResult ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-70 pb-10 min-h-[200px]">
                <FaTerminal size={32} className="mb-4" />
                <p className="text-sm font-medium">Submit your solution to view evaluation</p>
              </div>
            ) : (
              <div className="space-y-6">
                <ResultBanner 
                    status={submissionResult.status} 
                    error={submissionResult.error || submissionResult.message} 
                />

                {submissionResult.results && submissionResult.results.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">Detailed Evaluation</h4>
                    <div className="space-y-2">
                      {submissionResult.results.map((res, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-zinc-900 border border-zinc-800">
                           <span className="text-xs text-zinc-400 font-mono font-medium">Test Case {idx + 1}</span>
                           <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                             res.status === "Passed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                           }`}>
                             {res.status}
                           </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}