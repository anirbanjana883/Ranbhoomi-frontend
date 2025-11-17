import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";

// --- Themed Tab Button ---
const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 text-sm font-semibold transition-all duration-200
      ${
        isActive
          ? "text-orange-400 border-b-2 border-orange-500 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]"
          : "text-gray-500 border-b-2 border-transparent hover:text-gray-300 hover:border-gray-700"
      }`}
  >
    {label}
  </button>
);

// --- Themed Test Case Box ---
const ThemedTestCase = ({ testCase, index }) => (
  <div className="p-3 bg-gray-950/50 border border-orange-800/40 rounded-lg mb-2">
    <p className="font-bold text-orange-400 mb-2 text-sm">
      Case {index + 1}:
    </p>
    <div className="text-gray-400 text-xs space-y-2">
      <div>
        <p className="font-semibold text-gray-500 mb-1">Input:</p>
        <pre className="whitespace-pre-wrap bg-black/40 p-2 rounded-md border border-gray-800/50 text-gray-200 font-mono text-[13px] leading-relaxed">
          {testCase.input?.replace(/\\n/g, "\n")}
        </pre>
      </div>
      <div>
        <p className="font-semibold text-gray-500 mb-1">Expected Output:</p>
        <pre className="whitespace-pre-wrap bg-black/40 p-2 rounded-md border border-gray-800/50 text-gray-200 font-mono text-[13px] leading-relaxed">
          {testCase.expectedOutput?.replace(/\\n/g, "\n")}
        </pre>
      </div>
    </div>
  </div>
);

// --- Themed Result Status ---
const SubmissionStatus = ({ result }) => {
  if (!result) {
    return (
      <p className="text-gray-600 italic">
        (Run or Submit your code to see results...)
      </p>
    );
  }

  if (result.status === "Judging" || result.status === "Pending") {
    return (
      <div className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
        <div className="w-5 h-5 border-2 border-t-transparent border-yellow-400 rounded-full animate-spin"></div>
        <span>{result.status}...</span>
      </div>
    );
  }

  if (result.status === "Accepted") {
    return (
      <div className="text-green-400 font-bold text-xl [text-shadow:0_0_10px_rgba(0,255,0,0.5)]">
        <FaCheckCircle className="inline mr-2" /> Accepted
      </div>
    );
  }

  // Any other status (Wrong Answer, TLE, etc.)
  return (
    <div className="text-red-400 font-bold text-xl [text-shadow:0_0_10px_rgba(255,0,0,0.5)]">
      <FaTimesCircle className="inline mr-2" /> {result.status}
    </div>
  );
};

// --- Main Console Pane Component ---
function ConsolePane({
  problemTestCases,
  submissionResult,
  isSubmitting,
  // handleSubmit and handleRun are no longer needed here
  activeRightTab,
  setActiveRightTab,
}) {
  return (
    // This component must fill its parent
    <div className="flex flex-col h-full bg-black">
      {/* --- Tab Header --- */}
      <div className="flex-shrink-0 flex items-center border-b border-orange-900/40">
        <TabButton
          label="Testcase"
          isActive={activeRightTab === "testcase"}
          onClick={() => setActiveRightTab("testcase")}
        />
        <TabButton
          label="Result"
          isActive={activeRightTab === "result"}
          onClick={() => setActiveRightTab("result")}
        />
      </div>

      {/* --- Console/Output Area --- */}
      <div className="flex-grow p-4 overflow-y-auto text-sm font-mono scrollbar-thin scrollbar-thumb-orange-800/50 scrollbar-track-black/50">
        
        {/* --- Testcase Tab Content --- */}
        {activeRightTab === "testcase" && (
          <div>
            {problemTestCases && problemTestCases.length > 0 ? (
              problemTestCases.map((tc, index) => (
                <ThemedTestCase
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
        )}

        {/* --- Result Tab Content --- */}
        {activeRightTab === "result" && (
          <div>
            <SubmissionStatus result={submissionResult} />

            {/* Display detailed results */}
            {submissionResult && submissionResult.results && (
              <div className="mt-4 space-y-2">
                {submissionResult.results.map((res, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      res.status === "Passed"
                        ? "bg-green-900/30"
                        : "bg-red-900/30"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        res.status === "Passed"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      Test Case {index + 1}: {res.status}
                    </span>
                    {/* You could add more details here later */}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Bottom Action Bar (REMOVED) --- */}
      {/* The Run and Submit buttons are now in the header */}
    </div>
  );
}

export default ConsolePane;