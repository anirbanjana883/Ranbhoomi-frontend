import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTerminal,
  FaCode,
  FaSpinner
} from "react-icons/fa";

// --- Helper: Tab Button ---
const TabButton = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-200
      ${
        isActive
          ? "text-orange-500 border-orange-500 bg-orange-900/10"
          : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
      }`}
  >
    {Icon && <Icon size={12} />}
    {label}
  </button>
);

// --- Helper: Test Case Card ---
const TestCaseCard = ({ testCase, index }) => (
  <div className="group p-3 bg-[#111] border border-gray-800 rounded-lg mb-3 hover:border-gray-700 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Case {index + 1}</span>
    </div>
    
    <div className="space-y-2">
      <div>
        <span className="text-[10px] text-gray-600 uppercase font-bold">Input</span>
        <div className="mt-1 p-2 bg-black border border-gray-900 rounded font-mono text-gray-300 text-xs overflow-x-auto">
          {testCase.input}
        </div>
      </div>
      <div>
        <span className="text-[10px] text-gray-600 uppercase font-bold">Expected Output</span>
        <div className="mt-1 p-2 bg-black border border-gray-900 rounded font-mono text-gray-300 text-xs overflow-x-auto">
          {testCase.output || testCase.expectedOutput}
        </div>
      </div>
    </div>
  </div>
);

// --- Helper: Submission Status Banner ---
const ResultBanner = ({ status, error }) => {
  const isAccepted = status === "Accepted";
  const isJudging = status === "Judging" || status === "Pending";
  
  if (isJudging) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-yellow-500 animate-pulse">
        <FaSpinner className="animate-spin text-3xl mb-3" />
        <span className="text-sm font-bold uppercase tracking-widest">Judging Solution...</span>
      </div>
    );
  }

  if (status === "Error") {
     return (
      <div className="bg-red-900/10 border border-red-900/50 p-4 rounded-lg text-center">
        <div className="flex items-center justify-center gap-2 text-red-500 text-lg font-bold mb-1">
          <FaTimesCircle /> Execution Error
        </div>
        <pre className="text-xs text-red-300 font-mono mt-2 whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
      isAccepted 
        ? "bg-green-900/10 border-green-500/30 text-green-400" 
        : "bg-red-900/10 border-red-500/30 text-red-400"
    }`}>
      {isAccepted ? <FaCheckCircle size={24} /> : <FaTimesCircle size={24} />}
      <span className="text-xl font-black uppercase tracking-wide">
        {status || "Wrong Answer"}
      </span>
    </div>
  );
};

// --- Main Component ---
function ContestConsolePane({
  problemTestCases,
  submissionResult,
  isSubmitting,
  activeRightTab,
  setActiveRightTab,
}) {

  // Auto-switch to result tab if submitting
  React.useEffect(() => {
    if (isSubmitting) setActiveRightTab("result");
  }, [isSubmitting, setActiveRightTab]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      
      {/* --- Tab Header --- */}
      <div className="flex items-center border-b border-orange-900/30 bg-[#050505]">
        <TabButton
          label="Testcases"
          icon={FaCode}
          isActive={activeRightTab === "testcase"}
          onClick={() => setActiveRightTab("testcase")}
        />
        <TabButton
          label="Run Result"
          icon={FaTerminal}
          isActive={activeRightTab === "result"}
          onClick={() => setActiveRightTab("result")}
        />
      </div>

      {/* --- Content Area --- */}
      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        
        {/* TAB: TESTCASES */}
        {activeRightTab === "testcase" && (
          <div className="animate-in fade-in duration-300">
            {problemTestCases && problemTestCases.length > 0 ? (
              problemTestCases.map((tc, index) => (
                <TestCaseCard
                  key={tc._id || index}
                  testCase={tc}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 italic text-sm">No sample test cases visible.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: RESULTS */}
        {activeRightTab === "result" && (
          <div className="animate-in fade-in duration-300 h-full">
            
            {isSubmitting ? (
              <ResultBanner status="Judging" />
            ) : !submissionResult ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50 pb-10">
                <FaTerminal size={32} className="mb-2" />
                <p className="text-xs font-mono">Run code to see output</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Main Banner */}
                <ResultBanner 
                    status={submissionResult.status} 
                    error={submissionResult.error || submissionResult.message} 
                />

                {/* Test Case Details (Only if available) */}
                {submissionResult.results && submissionResult.results.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-800 pb-1">Detailed Results</h4>
                    <div className="space-y-2">
                      {submissionResult.results.map((res, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#111] border border-gray-800">
                           <span className="text-xs text-gray-400 font-mono">Test Case {idx + 1}</span>
                           <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                             res.status === "Passed" ? "bg-green-900/20 text-green-500" : "bg-red-900/20 text-red-500"
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

export default ContestConsolePane;