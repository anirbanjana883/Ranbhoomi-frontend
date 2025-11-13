import React from "react";
import ProblemDescription from "../ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../ProblemPageComponent/ConsolePane";
import SubmissionPane from "../ProblemPageComponent/SubmissionRow";
import { toast } from "react-toastify";

const InterviewCodingWorkspace = ({
  problem,
  activeProblemTab,
  setActiveProblemTab,
  leftPaneWidth,
  editorPaneHeight,
  handleMouseDownHorizontal,
  handleMouseDownVertical,
  isDraggingVertical,
  rightPaneRef,
  selectedLanguage,
  code,
  handleLanguageChange,
  handleEditorChange,
  setCode,
  submissionResult,
}) => {
  return (
    <div
      className="fixed inset-0 z-0 flex bg-[#050505] text-gray-300 overflow-hidden"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Left: Problem Description (full height) */}
      <div
        className="bg-[#0a0a0a] flex flex-col overflow-hidden transition-all duration-300"
        style={{ width: `${leftPaneWidth}%`, height: "100vh" }}
      >
        <ProblemDescription
          problem={problem}
          slug={problem.slug}
          activeLeftTab={activeProblemTab}
          setActiveLeftTab={setActiveProblemTab}
          submissions={[]}
          loadingSubmissions={false}
          setSubmissions={() => {}}
          setLoadingSubmissions={() => {}}
          isContestMode={true}
        />
      </div>

      {/* Vertical Divider */}
      <div
        onMouseDown={handleMouseDownHorizontal}
        className={`hidden lg:block w-[2px] bg-orange-500/20 hover:bg-orange-400 cursor-col-resize transition-all ${
          isDraggingVertical ? "shadow-[0_0_15px_rgba(255,120,0,0.5)]" : ""
        }`}
      />

      {/* Right: Editor + Console (full height) */}
      <div
        ref={rightPaneRef}
        className="flex flex-col overflow-hidden flex-1 transition-all duration-300 bg-[#0a0a0a]"
        style={{ height: "100vh" }}
      >
        {/* Code Editor */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ height: `${editorPaneHeight}%` }}
        >
          <CodeEditorPane
            problem={problem}
            selectedLanguage={selectedLanguage}
            code={code}
            handleLanguageChange={handleLanguageChange}
            handleEditorChange={handleEditorChange}
            resetCode={() => {
              const starter = problem.starterCode.find(
                (s) => s.language === selectedLanguage
              );
              if (starter) setCode(starter.code);
            }}
          />
        </div>

        {/* Horizontal Divider */}
        <div
          onMouseDown={handleMouseDownVertical}
          className="hidden lg:block h-[2px] bg-orange-500/20 hover:bg-orange-400 cursor-row-resize transition-all"
        />

        {/* Console + Submissions */}
        <div className="flex flex-col flex-grow overflow-hidden">
          <ConsolePane
            problemTestCases={problem?.testCases || []}
            submissionResult={submissionResult}
            isSubmitting={false}
            handleSubmit={() => toast.info("Submit disabled in interview")}
            handleRun={() => toast.info("Run disabled in interview")}
            activeRightTab={"testcase"}
            setActiveRightTab={() => {}}
          />
          <div className="border-t border-gray-800 bg-[#0a0a0a]">
            <SubmissionPane submissions={[]} loadingSubmissions={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCodingWorkspace;
