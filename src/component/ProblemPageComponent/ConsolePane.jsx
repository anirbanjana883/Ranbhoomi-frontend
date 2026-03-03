import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

// --- Themed Tab Button  ---
const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200
      ${
        isActive
          ? "text-red-400 border-red-500"
          : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
      }`}
  >
    {label}
  </button>
);

// --- Themed Test Case Box  ---
const ThemedTestCase = ({ testCase, index }) => (
  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg mb-3">
    <p className="font-semibold text-zinc-200 mb-3 text-sm">
      Case {index + 1}
    </p>
    <div className="text-zinc-400 text-xs space-y-3">
      <div>
        <p className="font-medium text-zinc-500 mb-1.5">Input</p>
        <pre className="whitespace-pre-wrap bg-zinc-950 p-2.5 rounded-md border border-zinc-800/80 text-zinc-300 font-mono text-xs leading-relaxed custom-scrollbar">
          {testCase.input?.replace(/\\n/g, "\n")}
        </pre>
      </div>
      <div>
        <p className="font-medium text-zinc-500 mb-1.5">Expected Output</p>
        <pre className="whitespace-pre-wrap bg-zinc-950 p-2.5 rounded-md border border-zinc-800/80 text-zinc-300 font-mono text-xs leading-relaxed custom-scrollbar">
          {testCase.expectedOutput?.replace(/\\n/g, "\n")}
        </pre>
      </div>
    </div>
  </div>
);

// --- Themed Result Status  ---
const SubmissionStatus = ({ result }) => {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px] text-zinc-500 text-sm font-medium">
        Run or Submit your code to see results...
      </div>
    );
  }

  if (result.status === "Judging" || result.status === "Pending") {
    return (
      <div className="flex items-center gap-3 text-amber-500 font-semibold text-lg mb-4">
        <div className="w-5 h-5 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
        <span>{result.status}...</span>
      </div>
    );
  }

  if (result.status === "Accepted") {
    return (
      <div className="flex items-center gap-2 text-emerald-500 font-bold text-2xl mb-4">
        <FaCheckCircle /> <span>Accepted</span>
      </div>
    );
  }

  // Any other status (Wrong Answer, TLE, Runtime Error, etc.)
  return (
    <div className="flex items-center gap-2 text-red-500 font-bold text-2xl mb-4">
      <FaTimesCircle /> <span>{result.status}</span>
    </div>
  );
};

// --- Main Console Pane Component ---
function ConsolePane({
  problemTestCases,
  submissionResult,
  isSubmitting,
  activeRightTab,
  setActiveRightTab,
}) {
  return (
    // This component must fill its parent
    <div className="flex flex-col h-full bg-zinc-950 font-sans">
      {/* --- Tab Header --- */}
      <div className="flex-shrink-0 flex items-center border-b border-zinc-800 bg-zinc-950 px-2 pt-1">
        <TabButton
          label="Testcases"
          isActive={activeRightTab === "testcase"}
          onClick={() => setActiveRightTab("testcase")}
        />
        <TabButton
          label="Test Result"
          isActive={activeRightTab === "result"}
          onClick={() => setActiveRightTab("result")}
        />
      </div>

      {/* --- Console/Output Area --- */}
      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        
        {/* --- Testcase Tab Content --- */}
        {activeRightTab === "testcase" && (
          <div className="animate-in fade-in duration-200">
            {problemTestCases && problemTestCases.length > 0 ? (
              problemTestCases.map((tc, index) => (
                <ThemedTestCase
                  key={tc._id || index}
                  testCase={tc}
                  index={index}
                />
              ))
            ) : (
              <p className="text-zinc-500 italic text-sm">
                No sample test cases provided.
              </p>
            )}
          </div>
        )}

        {/* --- Result Tab Content --- */}
        {activeRightTab === "result" && (
          <div className="animate-in fade-in duration-200">
            <SubmissionStatus result={submissionResult} />

            {/* Display detailed results */}
            {submissionResult && submissionResult.results && (
              <div className="space-y-2.5">
                {submissionResult.results.map((res, index) => (
                  <div
                    key={index}
                    className={`p-3.5 rounded-md border ${
                      res.status === "Passed"
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    }`}
                  >
                    <span
                      className={`font-semibold text-sm ${
                        res.status === "Passed"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      Test Case {index + 1}: {res.status}
                    </span>
                    
                    {/* Detailed error outputs can be conditionally rendered here later */}
                    {res.status !== "Passed" && res.output && (
                      <div className="mt-2 pt-2 border-t border-red-500/20">
                         <p className="text-xs text-red-400/80 mb-1 font-medium">Output / Error:</p>
                         <pre className="text-[11px] text-red-300 font-mono whitespace-pre-wrap overflow-x-auto custom-scrollbar">
                           {res.output}
                         </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsolePane;