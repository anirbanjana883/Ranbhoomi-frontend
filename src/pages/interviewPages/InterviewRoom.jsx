import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";

// Import your components
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";
import Whiteboard from "../../component/InterviewPageComponent/Whiteboard";
import ProblemSelectionModal from "../../component/InterviewPageComponent/ProblemSelectionModal";
import DraggableVideo from "../../component/InterviewPageComponent/DraggableVideo"; // <-- NEW
import MacTaskbar from "../../component/InterviewPageComponent/MacTaskbar"; // <-- NEW
import { FaPlus } from "react-icons/fa";
import { FaChalkboard } from "react-icons/fa";

// --- (peerConnectionConfig is unchanged) ---
const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
// (formatTime is now inside MacTaskbar)

function InterviewRoom() {
  const { roomID } = useParams();
  const navigate = useNavigate();

  // sockets / rtc
  const socket = useRef(null);
  const peerConnections = useRef(new Map());

  // media refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // streams
  const [localStream, setLocalStream] = useState(null);

  // ui state
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [hideVideo, setHideVideo] = useState(false); // <-- NEW

  // problem/editor state
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeTab, setActiveTab] = useState("lobby");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // problem page state
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // layout/resizing (SIMPLIFIED: only vertical for editor)
  const [editorPaneHeight, setEditorPaneHeight] = useState(65); // percent
  const mainPaneRef = useRef(null);
  const isResizingVertical = useRef(false);

  // --- (1. Setup media + session useEffect is UNCHANGED) ---
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        // Bind to the ref immediately
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        const { data: session } = await axios.get(
          `${serverUrl}/api/interview/session/${roomID}`,
          { withCredentials: true }
        );
        if (session.problem) {
          setProblem(session.problem);
          if (session.problem.starterCode?.length > 0) {
            setSelectedLanguage(session.problem.starterCode[0].language);
            setCode(session.problem.starterCode[0].code);
          }
          setActiveTab("coding");
        }
        setLoading(false);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to set up room.");
        navigate("/interview");
      }
    })();
  }, [roomID, navigate]);

  // --- (Bind local stream useEffect is UNCHANGED) ---
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, loading]); // Added loading as dependency

  // --- (2. createPeerConnection is UNCHANGED) ---
  const createPeerConnection = (remoteSocketId) => {
    if (!localStream) return null;
    const pc = new RTCPeerConnection(peerConnectionConfig);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play().catch(() => {});
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.current) {
        socket.current.emit("ice-candidate", {
          target: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };
    peerConnections.current.set(remoteSocketId, pc);
    return pc;
  };

// --- 3. Socket wiring useEffect ---
  useEffect(() => {
    // Wait until we have the user's camera stream before connecting
    if (!localStream) return;

    socket.current = io(serverUrl, { withCredentials: true });
    socket.current.emit("join-room", roomID);
    socket.current.on("connect", () => {
      console.log("✅ Connected to socket:", socket.current.id);
    });

    // --- WebRTC signaling handlers ---
    const handleUserJoined = async ({ socketId }) => {
      console.log("Other user joined:", socketId);
      const pc = createPeerConnection(socketId); // createPeerConnection is your existing function
      if (!pc) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.current.emit("offer", { target: socketId, offer });
      } catch (err) {
        console.warn("Error creating offer:", err);
      }
    };

    const handleOfferReceived = async ({ offer, sender }) => {
      console.log("Offer received from:", sender);
      const pc = createPeerConnection(sender);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.current.emit("answer", { target: sender, answer });
      } catch (e) {
        console.warn("Error processing offer:", e);
      }
    };

    const handleAnswerReceived = async ({ answer, sender }) => {
      console.log("Answer received from:", sender);
      const pc = peerConnections.current.get(sender);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.warn("Error applying answer:", e);
      }
    };

    const handleIceCandidate = async ({ candidate, sender }) => {
      const pc = peerConnections.current.get(sender);
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("Error adding ICE candidate:", e);
      }
    };

    // --- Sync handlers ---
    const handleCodeChanged = ({ code }) => setCode(code);
    const handleLanguageChanged = ({ language }) => setSelectedLanguage(language);
    const handleTabChanged = ({ tab }) => setActiveTab(tab);

    const handleProblemSelected = ({ problem: newProblem }) => {
      if (!newProblem) return;
      setProblem(newProblem);
      if (newProblem.starterCode?.length > 0) {
        setSelectedLanguage(newProblem.starterCode[0].language);
        setCode(newProblem.starterCode[0].code);
      }
      setActiveTab("coding");
      setIsModalOpen(false);
      toast.success(`Problem selected: ${newProblem.title}`);
    };

    const handleSubmissionUpdate = ({ result }) => {
      if (!result) return;
      setSubmissionResult(result);
      if (result.status !== "Judging" && result.status !== "Pending") {
        setIsSubmitting(false);
      }
    };

    // Attach listeners
    socket.current.on("user-joined", handleUserJoined);
    socket.current.on("offer-received", handleOfferReceived);
    socket.current.on("answer-received", handleAnswerReceived);
    socket.current.on("ice-candidate-received", handleIceCandidate);
    socket.current.on("code-changed", handleCodeChanged);
    socket.current.on("language-changed", handleLanguageChanged);
    socket.current.on("tab-changed", handleTabChanged);
    socket.current.on("problem-selected", handleProblemSelected);
    socket.current.on("submission-update", handleSubmissionUpdate);

    return () => {
      // Cleanup all listeners
      if (socket.current?.connected) {
        socket.current.off("user-joined", handleUserJoined);
        socket.current.off("offer-received", handleOfferReceived);
        socket.current.off("answer-received", handleAnswerReceived);
        socket.current.off("ice-candidate-received", handleIceCandidate);
        socket.current.off("code-changed", handleCodeChanged);
        socket.current.off("language-changed", handleLanguageChanged);
        socket.current.off("tab-changed", handleTabChanged);
        socket.current.off("problem-selected", handleProblemSelected);
        socket.current.off("submission-update", handleSubmissionUpdate);
        socket.current.disconnect();
      }
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [roomID, localStream]); // This effect MUST re-run if localStream changes

// -------------------- (4) Submissions fetching --------------------
  useEffect(() => {
    const fetchSubs = async () => {
      // Only fetch if the tab is 'submissions' and we have a problem
      if (activeProblemTab === "submissions" && problem) {
        setLoadingSubmissions(true);
        try {
          const { data } = await axios.get(
            // Use the regular submissions route, not contest submissions
            `${serverUrl}/api/submissions/problem/${problem.slug}`,
            { withCredentials: true }
          );
          setSubmissions(Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn("Failed to fetch submissions:", err);
          toast.error("Failed to load submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      }
    };
    fetchSubs();
  }, [activeProblemTab, problem]); // Re-run whenever the tab or problem changes

// -------------------- (5) Emitters / handlers --------------------
  const handleEditorChange = (newCode) => {
    setCode(newCode);
    // broadcast to partner
    socket.current?.emit("code-change", { roomID, code: newCode });
  };

  const handleLanguageChange = (e) => {
    const newLang = e?.target?.value ?? e; // allow passing a string or event
    if (!problem || !newLang) return;
    setSelectedLanguage(newLang);
    const starter = problem.starterCode?.find((s) => s.language === newLang);
    const newCode = starter ? starter.code : `// ${newLang} starter code`;
    setCode(newCode);
    socket.current?.emit("language-change", { roomID, language: newLang });
    socket.current?.emit("code-change", { roomID, code: newCode });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    socket.current?.emit("tab-change", { roomID, tab });
  };

  const handleProblemSelect = (problemId) => {
    socket.current?.emit("select-problem", { roomID, problemId });
  };

  // -------------------- (6) Submission / polling logic --------------------
  const pollForResult = (submissionId) => {
    // clear any previous interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    setActiveConsoleTab("result");
    setSubmissionResult({ status: "Judging" });
    setIsSubmitting(true);

    // notify partner
    socket.current?.emit("submission-update", {
      roomID,
      result: { status: "Judging" },
    });

    const interval = setInterval(async () => {
      try {
        const { data: result } = await axios.get(
          `${serverUrl}/api/submissions/status/${submissionId}`,
          { withCredentials: true }
        );

        // broadcast result to partner
        socket.current?.emit("submission-update", { roomID, result });

        if (!result) return;

        if (result.status !== "Judging" && result.status !== "Pending") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsSubmitting(false);
          setSubmissionResult(result);
          toast.success(`Submission ${result.status}!`);

          // if user is on submissions tab, force refetch
          if (activeProblemTab === "submissions") {
            setActiveProblemTab(""); // quick toggle to trigger effect
            setTimeout(() => setActiveProblemTab("submissions"), 50);
          }
        } else {
          setSubmissionResult(result);
        }
      } catch (err) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsSubmitting(false);
        const errorResult = { status: "Error checking status." };
        setSubmissionResult(errorResult);
        socket.current?.emit("submission-update", {
          roomID,
          result: errorResult,
        });
        console.warn("Polling submission failed:", err);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  const handleSubmit = async () => {
    if (!code?.trim() || !problem) return toast.warn("Code cannot be empty.");
    setIsSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab("result");

    // notify partner we started judging
    socket.current?.emit("submission-update", {
      roomID,
      result: { status: "Judging" },
    });

    try {
      const { data: pendingSubmission } = await axios.post(
        `${serverUrl}/api/submissions`,
        { slug: problem.slug, language: selectedLanguage, code },
        { withCredentials: true }
      );

      if (pendingSubmission && pendingSubmission._id) {
        pollForResult(pendingSubmission._id);
      } else {
        setIsSubmitting(false);
        toast.error("Submission created but no id returned.");
      }
    } catch (err) {
      setIsSubmitting(false);
      console.warn("Submission error:", err);
      toast.error(err?.response?.data?.message || "Submission failed.");
    }
  };

  // -------------------- (7) Media controls & leave --------------------
  const toggleMute = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((p) => !p);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOff((p) => !p);
  };

  const handleLeave = () => {
    try {
      socket.current?.disconnect();
    } catch (e) {}
    localStream?.getTracks().forEach((t) => t.stop());
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    navigate("/interview");
    toast.success("You left the interview.");
  };

  // --- (6. Timer + Vertical Resizing Logic - SIMPLIFIED) ---
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => setSecondsElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const handleMouseDownVertical = useCallback((e) => {
    if (activeTab !== "coding") return;
    e.preventDefault();
    isResizingVertical.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, [activeTab]);

  const handleMouseUp = useCallback(() => {
    isResizingVertical.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isResizingVertical.current && mainPaneRef.current && activeTab === "coding") {
        const rect = mainPaneRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        setEditorPaneHeight(Math.max(20, Math.min(80, newHeight)));
      }
    },
    [isResizingVertical, activeTab]
  );
  
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-4">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin"></div>
        <p className="text-white text-lg">Preparing your interview space...</p>
      </div>
    );
  }

  // ---
  // 7. NEW RENDER LOGIC
  // ---
  return (
    <>
      <div
        className="flex w-full h-screen bg-black text-gray-200 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* --- Main Work Area (100% WIDTH) --- */}
        <div
          ref={mainPaneRef}
          className="flex flex-col h-full w-full"
          // Add padding-bottom to create a "safe zone" for the dock
          style={{ paddingBottom: '80px' }} 
        >
          {/* Top Bar is GONE. Replaced by MacTaskbar */}

          {/* Content */}
          <div className="flex-1 min-h-0 relative">
            {activeTab === "lobby" && (
              <div className="w-full h-full p-8 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-white mb-3">Interview Lobby</h1>
                <p className="text-gray-400 mb-8 text-center max-w-xl">
                  Welcome! Use the dock below to navigate or select a problem.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-[0_0_18px_rgba(255,69,0,0.45)] hover:bg-orange-700 transition"
                >
                  <FaPlus /> Select Problem
                </button>
              </div>
            )}
            {activeTab === "coding" && problem && (
              <div className="flex flex-col h-full">
                {/* Top Pane: Problem Description */}
                <div
                  className="overflow-auto border-b border-orange-900/40"
                  style={{ height: `${editorPaneHeight}%` }} // Renamed from problemPaneHeight
                >
                  <ProblemDescription
                    problem={problem}
                    slug={problem.slug}
                    activeLeftTab={activeProblemTab}
                    setActiveLeftTab={setActiveProblemTab}
                    submissions={submissions}
                    loadingSubmissions={loadingSubmissions}
                    setSubmissions={setSubmissions}
                    setLoadingSubmissions={setLoadingSubmissions}
                    isContestMode={true}
                  />
                </div>
                {/* Resizer */}
                <div
            _       className="w-full h-2 cursor-row-resize bg-gray-800/50 hover:bg-orange-700/50 transition-colors"
                  onMouseDown={handleMouseDownVertical}
                  title="Drag to resize"
                />
                {/* Bottom Pane: Code Editor + Console */}
                <div className="flex-1 min-h-0 flex">
                  <div className="w-3/5 h-full overflow-hidden">
                    <CodeEditorPane
                      problem={problem}
                      selectedLanguage={selectedLanguage}
                      code={code}
                      handleLanguageChange={handleLanguageChange}
                      handleEditorChange={handleEditorChange}
                    />
                  </div>
                  <div className="w-2/5 h-full border-l border-orange-900/40">
                    <ConsolePane
                      problemTestCases={problem?.testCases || []}
                      submissionResult={submissionResult}
                      isSubmitting={isSubmitting}
                      handleSubmit={handleSubmit}
                      handleRun={() => toast.info("Run disabled in interview")}
                      activeRightTab={activeConsoleTab}
                      setActiveRightTab={setActiveConsoleTab}
                    />
                  </div>
                </div>
              </div>
           )}
            {/* --- WHITEBOARD TAB --- */}
            {activeTab === "whiteboard" && socket.current && (
              <Whiteboard socket={socket.current} roomID={roomID} />
            )}
          </div>
        </div>

        {/* --- Floating Video --- */}
        <DraggableVideo
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          isLocalMuted={isMuted}
          isLocalVideoOff={isVideoOff}
          isHidden={hideVideo}
        />

        {/* --- Floating Dock --- */}
        <MacTaskbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          problem={problem}
          secondsElapsed={secondsElapsed}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onLeave={handleLeave}
          hideVideo={hideVideo}
          onToggleHideVideo={() => setHideVideo(prev => !prev)}
        />
      </div>

      {/* Modal */}
      <ProblemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProblemSelect={handleProblemSelect}
      />
    </>
  );
}

export default InterviewRoom;