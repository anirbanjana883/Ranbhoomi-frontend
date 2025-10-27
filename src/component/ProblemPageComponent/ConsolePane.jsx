import React, { useState } from 'react';
import { FaPlay, FaPaperPlane, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// --- Tab Button Component ---
// Note: This is duplicated from ProblemDescription.jsx.
// For a cleaner project, you could move this to its own file like `TabButton.jsx`
// and import it in both components.
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

// --- Main Component for the Bottom-Right Pane ---
function ConsolePane({
  problemTestCases, // The sample test cases
  submissionResult, // The result object from polling
  isSubmitting,
  handleSubmit,
  handleRun, // Add handleRun later
}) {
  const [activeRightTab, setActiveRightTab] = useState("testcase");

  // --- Godfather Styles ---
  const paneHeaderStyle = `p-3 px-4 text-sm font-semibold text-gray-400 border-b-2 border-orange-800/60 bg-gradient-to-t from-black/60 to-gray-950/60 backdrop-blur-sm flex justify-between items-center shrink-0`;
  const actionButtonStyle = `px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-in-out transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black`;
  const runButtonStyle = `bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600/80 text-gray-300 hover:from-gray-600 hover:to-gray-700 hover:text-white hover:border-gray-500 hover:scale-105 hover:-translate-y-0.5 shadow-[0_0_12px_rgba(150,150,150,0.4)] hover:shadow-[0_0_20px_rgba(150,150,150,0.6)] focus:ring-gray-500`;
  const submitButtonStyle = `bg-gradient-to-r from-orange-600 to-red-700 text-white shadow-[0_0_18px_rgba(255,69,0,0.6)] hover:from-orange-700 hover:to-red-800 hover:shadow-[0_0_35px_rgba(255,69,0,0.9)] hover:scale-105 hover:-translate-y-0.5 focus:ring-orange-500`;

  return (
    <>
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

      {/* --- Console/Output Area --- */}
      <div className="flex-grow p-3 overflow-y-auto text-xs font-mono bg-black/40 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black/50 no-scrollbar">
        {activeRightTab === "testcase" && (
          <div>
            <p className="text-gray-400 mb-2">
              Run against sample test cases:
            </p>
            {problemTestCases && problemTestCases.length > 0 ? (
                problemTestCases.map((tc, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-900/50 border border-gray-700/50 rounded mb-2"
                >
                  <p className="text-gray-500 font-semibold text-xs">
                    Case {index + 1}:{" "}
                    <code className="text-orange-400">{tc.input}</code>
                  </p>
                </div>
              ))
            ) : (
                <p className="text-gray-600 italic">No sample test cases provided.</p>
            )}
          </div>
        )}
        {activeRightTab === "result" && (
          <div>
            {!submissionResult ? (
              <p className="text-gray-600 italic">
                (Run or Submit your code to see results...)
              </p>
            ) : submissionResult.status === 'Judging' ? (
              <div className="flex items-center gap-2 text-yellow-400">
                <div className="w-4 h-4 border-2 border-t-transparent border-yellow-400 rounded-full animate-spin"></div>
                <span>Judging...</span>
              </div>
            ) : submissionResult.status === 'Accepted' ? (
              <div className="text-green-400 font-bold text-lg">
                <FaCheckCircle className="inline mr-2" /> Accepted
              </div>
            ) : (
              <div className="text-red-400 font-bold text-lg">
                <FaTimesCircle className="inline mr-2" /> {submissionResult.status}
              </div>
            )}
            
            {/* Display detailed results */}
            {submissionResult && submissionResult.results && (
              <div className="mt-4 space-y-2">
                {submissionResult.results.map((res, index) => (
                  <div key={index} className={`p-2 rounded ${res.status === 'Passed' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                    <span className={`font-semibold ${res.status === 'Passed' ? 'text-green-400' : 'text-red-400'}`}>
                      Test Case {index + 1}: {res.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Bottom Action Bar --- */}
      <div className="p-3 flex justify-end items-center gap-4 bg-gradient-to-t from-black via-gray-950/60 to-black/40 border-t-2 border-orange-800/60">
        <button
          disabled={isSubmitting} // Placeholder: implement handleRun
          onClick={() => toast.info("'Run Code' feature not implemented yet.")}
          className={`${actionButtonStyle} ${runButtonStyle}`}
        >
          <FaPlay /> Run
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`${actionButtonStyle} ${submitButtonStyle}`}
        >
          <FaPaperPlane /> {isSubmitting ? 'Judging...' : 'Submit'}
        </button>
      </div>
    </>
  );
}

export default ConsolePane;