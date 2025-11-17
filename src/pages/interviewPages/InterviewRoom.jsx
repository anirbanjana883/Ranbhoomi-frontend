import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";

// Import your components
import Whiteboard from "../../component/InterviewPageComponent/Whiteboard";
import ProblemSelectionModal from "../../component/InterviewPageComponent/ProblemSelectionModal";
import DraggableVideo from "../../component/InterviewPageComponent/DraggableVideo";
import MacTaskbar from "../../component/InterviewPageComponent/MacTaskbar";
import InterviewCodingTab from "../../component/InterviewPageComponent/InterviewCodingTab"; // <-- NEW
import { FaPlus, FaChalkboard } from "react-icons/fa";

// --- (peerConnectionConfig is unchanged) ---
const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function InterviewRoom() {
  const { roomID } = useParams();
  const navigate = useNavigate();

  // --- Sockets / RTC ---
  const socket = useRef(null);
  const peerConnections = useRef(new Map());

  // --- Media Refs ---
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // --- Streams ---
  const [localStream, setLocalStream] = useState(null);

  // --- UI State ---
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [hideVideo, setHideVideo] = useState(false);

  // --- Problem/Editor State (Simplified) ---
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeTab, setActiveTab] = useState("lobby");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // (All resizing and sub-tab state is GONE)

  // --- 1. Setup media + session ---
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
  }, [localStream, loading]);

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
    if (!localStream) return; // Wait for media
    
    socket.current = io(serverUrl, { withCredentials: true });
    socket.current.emit("join-room", roomID);
    socket.current.on("connect", () => console.log("✅ Socket Connected"));

    // --- WebRTC signaling handlers ---
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
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.current.emit("answer", { target: sender, answer });
    };
    const handleAnswerReceived = async ({ answer, sender }) => {
      const pc = peerConnections.current.get(sender);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };
    const handleIceCandidate = async ({ candidate, sender }) => {
      const pc = peerConnections.current.get(sender);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
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

    // Attach listeners
    socket.current.on("user-joined", handleUserJoined);
    socket.current.on("offer-received", handleOfferReceived);
    socket.current.on("answer-received", handleAnswerReceived);
    socket.current.on("ice-candidate-received", handleIceCandidate);
    socket.current.on("code-changed", handleCodeChanged);
    socket.current.on("language-changed", handleLanguageChanged);
    socket.current.on("tab-changed", handleTabChanged);
    socket.current.on("problem-selected", handleProblemSelected);
    // (The submission-update listener is now inside InterviewCodingTab)

    return () => {
      if (socket.current?.connected) socket.current.disconnect();
      peerConnections.current.forEach((pc) => pc.close());
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [roomID, localStream]);


  // --- 4. Emitters/Handlers (Simplified) ---
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
    navigate("/interview");
    toast.success("You left the interview.");
  };

  // --- 5. Timer ---
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => setSecondsElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  // (All resizing logic is GONE)

 if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-4">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin"></div>
        <p className="text-white text-lg">Preparing your interview space...</p>
      </div>
    );
  }

  // ---
  // 6. RENDER LOGIC (MUCH CLEANER)
  // ---
  return (
    <>
      <div
        className="flex w-full h-screen bg-black text-gray-200 overflow-hidden"
      >
        {/* --- Main Work Area (100% WIDTH) --- */}
        <div
          className="flex flex-col h-full w-full"
          style={{ paddingBottom: '80px' }} // Space for Dock
        >
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
              <InterviewCodingTab
                problem={problem}
                socket={socket.current}
                roomID={roomID}
                code={code}
                setCode={setCode}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
              />
            )}
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