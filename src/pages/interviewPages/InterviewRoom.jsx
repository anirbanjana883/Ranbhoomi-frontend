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
import FloatingVideoContainer from "../../component/InterviewPageComponent/FloatingVideoContainer"; // <-- NEW

// Import Icons
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, FaCode, FaChalkboard, FaUserFriends, FaPlus } from "react-icons/fa";
import { FaClock } from "react-icons/fa6";

// --- (peerConnectionConfig and formatTime helpers are unchanged) ---
const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

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

  // problem/editor state
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeTab, setActiveTab] = useState("lobby");
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- LAYOUT STATE (SIMPLIFIED) ---
  const [problemPaneHeight, setProblemPaneHeight] = useState(52);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const mainPaneRef = useRef(null);
  // (Removed all horizontal resizing state)

  // --- (1. Setup media + session useEffect is UNCHANGED) ---
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
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
        console.error("Media/Session setup failed:", err);
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
  }, [localStream]);

  // --- (2. createPeerConnection is UNCHANGED) ---
  const createPeerConnection = (remoteSocketId) => {
    if (!localStream) return null;
    if (peerConnections.current.has(remoteSocketId)) {
      return peerConnections.current.get(remoteSocketId);
    }
    const pc = new RTCPeerConnection(peerConnectionConfig);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = true; // Start muted
        setTimeout(() => {
          remoteVideoRef.current.play().catch(() => {});
        }, 0);
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

  // --- (3. Socket wiring useEffect is UNCHANGED) ---
  useEffect(() => {
    socket.current = io(serverUrl, { withCredentials: true });
    socket.current.emit("join-room", roomID);
    socket.current.on("connect", () => {
      console.log("✅ Connected to socket:", socket.current.id);
    });

    const handleUserJoined = async ({ socketId }) => {
      const pc = createPeerConnection(socketId);
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.current.emit("offer", { target: socketId, offer });
    };
    const handleOfferReceived = async ({ offer, sender }) => {
      const pc = createPeerConnection(sender);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.current.emit("answer", { target: sender, answer });
      } catch (e) { console.warn("Error processing offer:", e); }
    };
    const handleAnswerReceived = async ({ answer, sender }) => {
      const pc = peerConnections.current.get(sender);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) { console.warn("Error applying answer:", e); }
    };
    const handleIceCandidate = async ({ candidate, sender }) => {
      const pc = peerConnections.current.get(sender);
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { console.warn("Error adding ICE:", e); }
    };

    // sync
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

    socket.current.on("user-joined", handleUserJoined);
    socket.current.on("offer-received", handleOfferReceived);
    socket.current.on("answer-received", handleAnswerReceived);
    socket.current.on("ice-candidate-received", handleIceCandidate);
    socket.current.on("code-changed", handleCodeChanged);
    socket.current.on("language-changed", handleLanguageChanged);
    socket.current.on("tab-changed", handleTabChanged);
    socket.current.on("problem-selected", handleProblemSelected);

    return () => {
      if (socket.current?.connected) socket.current.disconnect();
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [roomID, localStream]);

  // --- (4. Emitters/Handlers are UNCHANGED) ---
  const handleEditorChange = (newCode) => {
    setCode(newCode);
    socket.current?.emit("code-change", { roomID, code: newCode });
  };
  const handleLanguageChange = (e) => {
    if (!problem) return;
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    const starter = problem.starterCode.find((s) => s.language === newLang);
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
    socket.current?.disconnect();
    localStream?.getTracks().forEach((t) => t.stop());
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    navigate("/interview");
    toast.success("You left the interview.");
  };

  // --- (5. Timer + Vertical Resizing are UNCHANGED) ---
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => setSecondsElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const handleMouseDownVertical = useCallback((e) => {
    e.preventDefault();
    setIsDraggingVertical(true);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);
  
  const handleMouseUp = useCallback(() => {
    setIsDraggingVertical(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);
  
  const handleMouseMove = useCallback(
    (e) => {
      if (isDraggingVertical && mainPaneRef.current && activeTab === "coding") {
        const rect = mainPaneRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        setProblemPaneHeight(Math.max(32, Math.min(78, newHeight)));
      }
    },
    [isDraggingVertical, activeTab]
  );
  
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleMouseUp);
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
  // 6. NEW RENDER LOGIC
  // ---
  return (
    <>
      <div
        className="flex w-full h-screen bg-black text-gray-200 overflow-hidden"
        onMouseMove={handleMouseMove} // <-- For vertical resize
        onMouseUp={handleMouseUp}     // <-- For vertical resize
      >
        {/* --- Main Work Area (NOW 100% WIDTH) --- */}
        <div
          ref={mainPaneRef}
          className="flex flex-col h-full w-full border-r border-orange-900/40"
        >
          {/* Top Bar / Tabs */}
          <div className="flex items-center gap-2 px-3 py-2 bg-black/80 border-b border-orange-900/40 sticky top-0 z-10">
            <TabButton
              icon={<FaUserFriends />}
              label="Lobby"
              isActive={activeTab === "lobby"}
              onClick={() => handleTabChange("lobby")}
            />
            <TabButton
              icon={<FaCode />}
              label="Coding"
              isActive={activeTab === "coding"}
              onClick={() => handleTabChange("coding")}
              disabled={!problem}
            />
            <TabButton
              icon={<FaChalkboard />}
              label="System Design"
              isActive={activeTab === "whiteboard"}
              onClick={() => handleTabChange("whiteboard")}
            />
            <div className="ml-auto flex items-center gap-3 text-orange-400">
              <FaClock />
              <span className="font-mono">{formatTime(secondsElapsed)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 relative">
            {activeTab === "lobby" && (
              <div className="w-full h-full p-8 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-white mb-3">Interview Lobby</h1>
                <p className="text-gray-400 mb-8 text-center max-w-xl">
                  Welcome! Once the interviewer selects a problem, both of you can start coding.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-[0_0_18px_rgba(255,69,0,0.45)] hover:bg-orange-700 transition"
                  >
                    <FaPlus /> Select Problem
                  </button>
                  <button
                    onClick={() => handleTabChange("whiteboard")}
                    className="px-6 py-3 bg-gray-800 text-gray-100 font-semibold rounded-lg hover:bg-gray-700 transition"
                  >
                    Go to Whiteboard
                  </button>
                </div>
              </div>
            )}
            {activeTab === "coding" && problem && (
              <div className="flex flex-col h-full">
                {/* Top Pane: Problem Description */}
                <div
                  className="overflow-auto border-b border-orange-900/40"
                  style={{ height: `${problemPaneHeight}%` }}
                >
                  <ProblemDescription
                    problem={problem}
                    slug={problem.slug}
                    activeLeftTab={activeProblemTab}
                    setActiveLeftTab={setActiveProblemTab}
                    submissions={[]}
                    loadingSubmissions={false}
Of                   setSubmissions={() => {}}
                    setLoadingSubmissions={() => {}}
                    isContestMode={true}
                  />
                </div>
                {/* Resizer */}
                <div
                  className="w-full h-2 cursor-row-resize bg-gray-800/50 hover:bg-orange-700/50 transition-colors"
                  onMouseDown={handleMouseDownVertical}
                  title="Drag to resize"
                />
                {/* Bottom Pane: Code Editor + Console */}
                <div className="flex-1 min-h-0 flex">
                  {/* Code Editor */}
                  <div className="w-3/5 h-full overflow-hidden">
                    <CodeEditorPane
                      problem={problem}
                      selectedLanguage={selectedLanguage}
                      code={code}
                      handleLanguageChange={handleLanguageChange}
                      handleEditorChange={handleEditorChange}
                    />
                  </div>
                  {/* Console */}
                  <div className="w-2/5 h-full border-l border-orange-900/40">
                    <ConsolePane
                      problemTestCases={problem?.testCases || []}
                      submissionResult={null}
                      isSubmitting={false}
                      handleSubmit={() => toast.info("Submit disabled in interview")}
                      handleRun={() => toast.info("Run disabled in interview")}
                      activeRightTab={"testcase"}
                      setActiveRightTab={() => {}}
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

        {/* --- ADD THE FLOATING VIDEO CONTAINER --- */}
        <FloatingVideoContainer
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          isLocalMuted={isMuted}
          isLocalVideoOff={isVideoOff}
        />

        {/* --- ADD THE FLOATING CONTROLS --- */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-between gap-3 p-3 bg-black/80 border border-orange-900/40 rounded-full z-30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ThemedControlButton onClick={toggleMute} isToggled={isMuted} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </ThemedControlButton>
  s           <ThemedControlButton onClick={toggleVideo} isToggled={isVideoOff} title={isVideoOff ? "Turn camera on" : "Turn camera off"}>
              {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
            </ThemedControlButton>
            <ThemedControlButton onClick={handleLeave} isDanger title="Leave">
              <FaPhoneSlash />
            </ThemedControlButton>
          </div>
        </div>

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

/* ----------------- UI Helpers ----------------- */
// (TabButton is unchanged)
const TabButton = ({ icon, label, isActive, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition
      ${
        isActive
          ? "bg-black text-orange-400 border border-orange-900/60 shadow-[0_0_18px_rgba(255,69,0,0.35)]"
          : "bg-gray-900/40 text-gray-400 border border-transparent"
      }
      ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-800/60 hover:text-gray-200"
      }
    `}
  >
    {icon} {label}
  </button>
);

// (ControlButton is unchanged)
const ThemedControlButton = ({ onClick, children, isToggled = false, isDanger = false, title }) => {
 let style = "bg-gray-800 hover:bg-gray-700 text-white";
if (isToggled) style = "bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_10px_rgba(255,69,0,0.5)]";
 if (isDanger) style = "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(255,0,0,0.5)]";
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

// (VideoTile is now in its own file)

export default InterviewRoom;