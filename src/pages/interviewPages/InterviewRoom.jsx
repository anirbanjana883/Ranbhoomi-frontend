// InterviewRoom.jsx (CHUNK 1/3)
// Imports + helpers + state + media init + createPeerConnection + socket wiring

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
import FloatingVideoContainer from "../../component/InterviewPageComponent/FloatingVideoContainer";

// Icons
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaCode,
  FaChalkboard,
  FaUserFriends,
  FaPlus,
} from "react-icons/fa";
import { FaClock } from "react-icons/fa6";

// -------------------- Helpers --------------------
const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// -------------------- Component (start) --------------------
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

  // UI state
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // problem/editor state
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeTab, setActiveTab] = useState("lobby"); // lobby | coding | whiteboard
  const [isModalOpen, setIsModalOpen] = useState(false);

  // problem page state
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // layout/resizing
  const [leftPaneWidth, setLeftPaneWidth] = useState(45); // percent
  const [editorPaneHeight, setEditorPaneHeight] = useState(65); // percent
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // floating island
  const [isIslandOpen, setIsIslandOpen] = useState(false);

  // -------------------- (1) media + session init --------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          // if component unmounted quickly, stop tracks
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        const { data: session } = await axios.get(
          `${serverUrl}/api/interview/session/${roomID}`,
          { withCredentials: true }
        );

        if (session?.problem) {
          setProblem(session.problem);
          if (session.problem.starterCode?.length > 0) {
            setSelectedLanguage(session.problem.starterCode[0].language);
            setCode(session.problem.starterCode[0].code);
          }
          setActiveTab("coding");
        }
        setLoading(false);
      } catch (err) {
        console.error("Media/Session setup failed:", err);
        toast.error(err?.response?.data?.message || "Failed to set up room.");
        navigate("/interview");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomID, navigate]);

  // bind local stream to local video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // -------------------- (2) createPeerConnection --------------------
  const createPeerConnection = (remoteSocketId) => {
    if (!localStream) return null;
    if (peerConnections.current.has(remoteSocketId)) {
      return peerConnections.current.get(remoteSocketId);
    }

    const pc = new RTCPeerConnection(peerConnectionConfig);

    // add local tracks
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // when remote track arrives, attach to remoteVideoRef
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = true; // keep remote muted by default
        setTimeout(() => remoteVideoRef.current.play().catch(() => {}), 0);
      }
    };

    // ICE candidates
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

  // -------------------- (3) socket wiring --------------------
  useEffect(() => {
    socket.current = io(serverUrl, { withCredentials: true });
    socket.current.emit("join-room", roomID);
    socket.current.on("connect", () => {
      console.log("✅ Connected to socket:", socket.current.id);
    });

    // --- WebRTC signaling handlers ---
    const handleUserJoined = async ({ socketId }) => {
      const pc = createPeerConnection(socketId);
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
    const handleCodeChanged = ({ code: remoteCode }) => setCode(remoteCode);
    const handleLanguageChanged = ({ language }) =>
      setSelectedLanguage(language);
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

    // --- Submission updates from other participant ---
    const handleSubmissionUpdate = ({ result }) => {
      // result should be an object like { status: 'Judging'|'Accepted'|... , ...}
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
      try {
        if (socket.current?.connected) socket.current.disconnect();
      } catch (e) {
        /* ignore */
      }
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      localStream?.getTracks().forEach((t) => t.stop());
    };
    // note: localStream included so createPeerConnection has tracks
  }, [roomID, localStream]);

  // -------------------- (4) Submissions fetching --------------------
  useEffect(() => {
    const fetchSubs = async () => {
      if (activeProblemTab === "submissions" && problem) {
        setLoadingSubmissions(true);
        try {
          const { data } = await axios.get(
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
  }, [activeProblemTab, problem]);

  // -------------------- (5) Editor / language / tab handlers --------------------
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

  // -------------------- (8) Timer --------------------
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => setSecondsElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  // -------------------- (9) Resizing handlers (improved reversible logic) --------------------
  const handleMouseDownHorizontal = useCallback(
    (e) => {
      if (window.innerWidth < 1024 || activeTab !== "coding") return;
      e.preventDefault();
      isResizingHorizontal.current = true;
      setIsDragging(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [activeTab]
  );

  const handleMouseDownVertical = useCallback(
    (e) => {
      if (window.innerWidth < 1024 || activeTab !== "coding") return;
      e.preventDefault();
      isResizingVertical.current = true;
      setIsDragging(true);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [activeTab]
  );

  const handleMouseUp = useCallback(() => {
    isResizingHorizontal.current = false;
    isResizingVertical.current = false;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      // Horizontal resize
      if (isResizingHorizontal.current) {
        // <-- FIX: was 'isDraggingHorizontal'
        setLeftPaneWidth((prevWidth) => {
          const newWidth = prevWidth + (e.movementX / window.innerWidth) * 100;
          return Math.max(20, Math.min(80, newWidth));
        });
      }

      // Vertical resize (editor / console)
      if (isResizingVertical.current) {
        // <-- FIX: was 'isDraggingVertical'
        setEditorPaneHeight((prevHeight) => {
          const newHeight =
            prevHeight + (e.movementY / window.innerHeight) * 100;
          return Math.max(15, Math.min(85, newHeight));
        });
      }
    },
    [isResizingHorizontal, isResizingVertical] // Dependencies are correct
  );

  // event listeners for resize
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("blur", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]); // <-- FIX: Removed the refs from this array

  // event listeners for resize
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleMouseUp);
    };
  }, [
    handleMouseMove,
    handleMouseUp,
    isResizingHorizontal,
    isResizingVertical,
  ]); // <-- ADD DEPENDENCIES

  // -------------------- (10) Click-outside for floating island --------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      const island = document.getElementById("floating-island");
      if (island && !island.contains(e.target)) {
        setIsIslandOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // -------------------- InterviewRoom.jsx (CHUNK 3/3) --------------------

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-4">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin"></div>
        <p className="text-white text-lg">Preparing your interview space...</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex w-full h-screen bg-black text-gray-200 overflow-hidden relative"
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {/* ======================= MAIN WORKSPACE ======================= */}
        <div ref={containerRef} className="flex flex-col h-full w-full">
          {/* ======================= FLOATING ISLAND (Top Left) ======================= */}
          <div
            id="floating-island"
            className={`
            absolute top-4 left-4 z-40 transition-all duration-300
            bg-black/70 backdrop-blur-md border border-orange-600/40 rounded-xl
            shadow-[0_0_20px_rgba(255,80,0,0.4)]
            ${isIslandOpen ? "px-4 py-3" : "px-4 py-2 cursor-pointer"}
          `}
            onClick={() => {
              if (!isIslandOpen) setIsIslandOpen(true);
            }}
          >
            {/* Collapsed view → ONLY TIMER */}
            {!isIslandOpen && (
              <div className="flex items-center gap-2 text-orange-400">
                <FaClock className="text-sm" />
                <span className="font-mono text-sm">
                  {formatTime(secondsElapsed)}
                </span>
              </div>
            )}

            {/* Expanded view → Show Tabs */}
            {isIslandOpen && (
              <div className="flex flex-col gap-3">
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsIslandOpen(false);
                  }}
                  className="self-end text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>

                {/* Tabs */}
                <div className="flex flex-col gap-2">
                  <TabButton
                    icon={<FaUserFriends />}
                    label="Lobby"
                    isActive={activeTab === "lobby"}
                    onClick={() => {
                      handleTabChange("lobby");
                      setIsIslandOpen(false);
                    }}
                  />

                  <TabButton
                    icon={<FaCode />}
                    label="Coding"
                    isActive={activeTab === "coding"}
                    disabled={!problem}
                    onClick={() => {
                      handleTabChange("coding");
                      setIsIslandOpen(false);
                    }}
                  />

                  <TabButton
                    icon={<FaChalkboard />}
                    label="System Design"
                    isActive={activeTab === "whiteboard"}
                    onClick={() => {
                      handleTabChange("whiteboard");
                      setIsIslandOpen(false);
                    }}
                  />
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2 pt-2 border-t border-orange-800/40">
                  <FaClock className="text-orange-400 text-sm" />
                  <span className="font-mono text-sm text-orange-300">
                    {formatTime(secondsElapsed)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ======================= MAIN CONTENT AREA ======================= */}
          <div className="flex-1 min-h-0 relative flex">
            {/* ========== LOBBY ========== */}
            {activeTab === "lobby" && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-3xl font-bold mb-3">Interview Lobby</h1>
                <p className="text-gray-400 mb-8 max-w-xl">
                  Waiting for interviewer to select a problem and begin the
                  interview.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg shadow-lg hover:bg-orange-700 transition"
                  >
                    <FaPlus /> Select Problem
                  </button>

                  <button
                    onClick={() => handleTabChange("whiteboard")}
                    className="px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                  >
                    Go to Whiteboard
                  </button>
                </div>
              </div>
            )}

{/* === CODING MODE === */}
{activeTab === "coding" && problem && (
  <>

    {/* LEFT PANE (FULL HEIGHT, ONLY HORIZONTAL RESIZE ALLOWED) */}
    <div
      className="h-full flex flex-col overflow-hidden border-r border-orange-900/40"
      style={{ width: `${leftPaneWidth}%` }}
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

    {/* HORIZONTAL RESIZER (WORKS GREAT) */}
    <div
      onMouseDown={handleMouseDownHorizontal}
      className="hidden lg:block w-1.5 h-full bg-gray-800/60 hover:bg-orange-700/60 cursor-col-resize transition-all"
    />

    {/* RIGHT SIDE (EDITOR + CONSOLE, VERTICAL RESIZING HERE ONLY) */}
    <div
      ref={rightPaneRef}
      className="flex flex-col flex-grow h-full overflow-hidden"
    >
      {/* EDITOR */}
      <div
        className="flex flex-col overflow-hidden border-b border-orange-900/40"
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

      {/* VERTICAL RESIZER — CORRECT POSITION */}
      <div
        onMouseDown={handleMouseDownVertical}
        className="hidden lg:block h-1.5 w-full bg-gray-800/60 hover:bg-orange-700/60 cursor-row-resize transition-all"
      />

      {/* CONSOLE */}
      <div className="flex flex-col flex-grow overflow-hidden">
        <ConsolePane
          problemTestCases={problem.testCases}
          submissionResult={submissionResult}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          handleRun={() => toast.info("Run functionality coming soon!")}
          activeRightTab={activeConsoleTab}
          setActiveRightTab={setActiveConsoleTab}
        />
      </div>
    </div>
  </>
)}


            {/* ========== WHITEBOARD ========== */}
            {activeTab === "whiteboard" && socket.current && (
              <Whiteboard socket={socket.current} roomID={roomID} />
            )}
          </div>
        </div>

        {/* ========== FLOATING VIDEO CONTAINER ========== */}
        <FloatingVideoContainer
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          isLocalMuted={isMuted}
          isLocalVideoOff={isVideoOff}
        />

        {/* ========== BOTTOM MEDIA CONTROLS ========== */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-4 bg-black/80 border border-orange-800/50 rounded-full backdrop-blur-md z-40">
          <ThemedControlButton
            onClick={toggleMute}
            isToggled={isMuted}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </ThemedControlButton>

          <ThemedControlButton
            onClick={toggleVideo}
            isToggled={isVideoOff}
            title={isVideoOff ? "Enable Camera" : "Disable Camera"}
          >
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </ThemedControlButton>

          <ThemedControlButton onClick={handleLeave} isDanger title="Leave">
            <FaPhoneSlash />
          </ThemedControlButton>
        </div>
      </div>

      {/* ======================= MODAL ======================= */}
      <ProblemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProblemSelect={handleProblemSelect}
      />
    </>
  );
}

/* ------------------- UI HELPERS ------------------- */

const TabButton = ({ icon, label, isActive, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center gap-2 px-4 py-2 text-sm rounded-md transition border
      ${
        isActive
          ? "bg-black text-orange-400 border-orange-700 shadow-[0_0_12px_rgba(255,80,0,0.5)]"
          : "bg-gray-900/50 text-gray-300 border-transparent"
      }
      ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"}
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ThemedControlButton = ({
  onClick,
  children,
  isToggled = false,
  isDanger = false,
  title,
}) => {
  let style = "bg-gray-800 hover:bg-gray-700 text-white";
  if (isToggled)
    style = "bg-orange-600 hover:bg-orange-700 text-white shadow-lg";
  if (isDanger) style = "bg-red-600 hover:bg-red-700 text-white shadow-lg";

  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-3 rounded-full transition transform hover:scale-110 ${style}`}
    >
      {children}
    </button>
  );
};

export default InterviewRoom;
