import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "react-hot-toast";
import { serverUrl } from "../../App";

// Components
import Whiteboard from "../../component/InterviewPageComponent/Whiteboard";
import ProblemSelectionModal from "../../component/InterviewPageComponent/ProblemSelectionModal";
import FloatingVideoContainer from "../../component/InterviewPageComponent/FloatingVideoContainer";
import InterviewFooter from "../../component/InterviewPageComponent/InterviewFooter"; 
import InterviewCodingWorkspace from "../../component/InterviewPageComponent/InterviewCodingWorkspace"; 

// Icons
import { FaPlus, FaCircle, FaPlay, FaPaperPlane, FaPhoneSlash } from "react-icons/fa";

const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

function InterviewRoom() {
  const { roomID } = useParams();
  const navigate = useNavigate();

  const socket = useRef(null);
  const peerConnections = useRef(new Map());

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0); 
  const [hideVideoTiles, setHideVideoTiles] = useState(false); 

  const [role, setRole] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeTab, setActiveTab] = useState("coding"); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null); 

  // ==========================================
  // Timer
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // 1. Setup Media & Fetch Session
  // ==========================================
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/interview/${roomID}`,
          { withCredentials: true },
        );

        const session = response.data.data;
        setRole(session.role);
        if (session.code) setCode(session.code);
        if (session.language) setSelectedLanguage(session.language);

        if (session.problem) {
          setProblem(session.problem);
          if (!session.code && session.problem.starterCode?.length > 0) {
            setSelectedLanguage(session.problem.starterCode[0].language);
            setCode(session.problem.starterCode[0].code);
          }
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to set up room.");
        return navigate("/interview");
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch (mediaErr) {
        console.warn("Camera/Mic access denied:", mediaErr);
        toast.error("Joining without camera/mic.");
        setIsVideoOff(true);
        setIsMuted(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomID, navigate]);

  // ==========================================
  // 2. WebRTC Logic
  // ==========================================
  const createPeerConnection = (remoteSocketId) => {
    if (!localStream) return null;
    const pc = new RTCPeerConnection(peerConnectionConfig);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]: event.streams[0],
      }));
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

  // ==========================================
  // 3. Socket Event Wiring
  // ==========================================
  useEffect(() => {
    if (!role || !localStream) return;

    socket.current = io(serverUrl, { withCredentials: true });
    socket.current.emit("join-room", roomID);

    socket.current.on("unauthorized-room", (data) => {
      toast.error(data.message);
      navigate("/interview");
    });

    const handleUserJoined = async ({ socketId }) => {
      toast.success("User connected to the session!");
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

    socket.current.on("user-joined", handleUserJoined);
    socket.current.on("offer-received", handleOfferReceived);
    socket.current.on("answer-received", async ({ answer, sender }) => {
      const pc = peerConnections.current.get(sender);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.current.on(
      "ice-candidate-received",
      async ({ candidate, sender }) => {
        const pc = peerConnections.current.get(sender);
        try {
          if (pc && candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.warn("ICE candidate error", err);
        }
      },
    );

    // 🚀 FIX 2: Added User Disconnect Listener!
    socket.current.on("user-disconnected", ({ socketId }) => {
      toast.error("User disconnected from the session.");
      
      // Destroy the specific peer connection
      if (peerConnections.current.has(socketId)) {
        peerConnections.current.get(socketId).close();
        peerConnections.current.delete(socketId);
      }

      // Remove their video stream from the UI so it doesn't freeze
      setRemoteStreams((prev) => {
        const updatedStreams = { ...prev };
        delete updatedStreams[socketId];
        return updatedStreams;
      });
    });

    // Sync Events
    socket.current.on("code-changed", ({ code: newCode }) => setCode(newCode));
    socket.current.on("language-changed", ({ language }) => setSelectedLanguage(language));
    socket.current.on("tab-changed", ({ tab }) => setActiveTab(tab));

    socket.current.on("problem-selected", ({ problem: newProblem }) => {
      if (!newProblem) return;
      setProblem(newProblem);
      if (newProblem.starterCode?.length > 0) {
        setSelectedLanguage(newProblem.starterCode[0].language);
        setCode(newProblem.starterCode[0].code);
      }
      setIsModalOpen(false);
      toast.success(`Interviewer loaded: ${newProblem.title}`);
    });

    // Execution Events
    socket.current.on("run_result", (data) => {
      setIsRunning(false);
      setIsSubmitting(false); 
      setSubmissionResult(data);
    });
    socket.current.on("run_error", () => {
      setIsRunning(false);
      setIsSubmitting(false);
    });

    return () => {
      if (socket.current?.connected) socket.current.disconnect();
      peerConnections.current.forEach((pc) => pc.close());
    };
  }, [roomID, role, localStream, navigate]);

  // ==========================================
  // Handlers
  // ==========================================
  const handleEditorChange = (val) => {
    const newCode = val || "";
    setCode(newCode);
    socket.current?.emit("code-change", { roomID, code: newCode });
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    socket.current?.emit("language-change", { roomID, language: lang });

    const starter = problem?.starterCode?.find((s) => s.language === lang);
    const newCode = starter ? starter.code : `// No starter code for ${lang}`;
    setCode(newCode);
    socket.current?.emit("code-change", { roomID, code: newCode });
  };

  const handleRunCode = () => {
    if (!code.trim()) return toast.error("Code cannot be empty.");
    setIsRunning(true);
    socket.current?.emit("run_code", {
      roomID,
      slug: problem?.slug,
      language: selectedLanguage,
      code: code,
    });
  };

  const handleSubmit = () => {
    if (!code.trim()) return toast.error("Code cannot be empty.");
    setIsSubmitting(true);
    socket.current?.emit("submit_code", {
      roomID,
      slug: problem?.slug,
      language: selectedLanguage,
      code: code,
    });
  };

  const handleLeave = async () => {
    if (role === "interviewer") {
      try {
        await axios.patch(
          `${serverUrl}/api/interview/${roomID}/end`,
          {},
          { withCredentials: true },
        );
        toast.success("Interview completed and archived.");
      } catch (error) {
        toast.error("Failed to cleanly close interview session.");
      }
    }
    socket.current?.disconnect();
    localStream?.getTracks().forEach((t) => t.stop());
    navigate("/interview");
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  const activeRemoteStream = Object.values(remoteStreams)[0] || null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-sm font-medium">
          Preparing Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-sans">
      {/* HEADER */}
      <header className="shrink-0 flex items-center justify-between h-14 px-5 bg-zinc-950 border-b border-zinc-800 z-20 shadow-sm">
        <div className="flex items-center gap-5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-md py-1.5 px-3 shrink-0">
            <FaCircle size={8} className="text-red-500 animate-pulse" />
            <span className="text-red-400 font-bold text-[10px] tracking-widest uppercase hidden sm:inline">
              Live Session
            </span>
          </div>
          <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
          <h1 className="text-[14px] font-bold text-zinc-100 whitespace-nowrap truncate tracking-tight">
            {problem?.title || "Waiting for problem selection..."}
          </h1>
        </div>

        {/* Center: Action Buttons */}
        {activeTab === "coding" && problem && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCode}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md font-semibold text-xs transition-colors duration-200 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
            >
              {isRunning ? (
                <div className="w-3 h-3 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FaPlay size={10} className="text-emerald-500" />
              )}
              <span>{isRunning ? "Running..." : "Run"}</span>
            </button>

            {role === "interviewer" && (
              <button
                onClick={handleSubmit} 
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md font-semibold text-xs transition-colors duration-200 bg-red-600 text-white hover:bg-red-500 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-3 h-3 border-2 border-red-300 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <FaPaperPlane size={10} />
                )}
                <span>{isSubmitting ? "Judging..." : "Submit"}</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Select Problem & Role Info */}
        <div className="flex items-center gap-3">
          {role === "interviewer" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-bold transition-all hover:bg-zinc-700 hover:text-white"
            >
              <FaPlus size={10} />
              <span className="hidden sm:inline">Change Problem</span>
            </button>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 flex items-center gap-2 hidden sm:flex">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Role:
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${role === "interviewer" ? "text-red-500" : "text-blue-500"}`}
            >
              {role || "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 min-h-0 relative">
        
        {/* 🚀 FIX 1: Lobby is now independent from the Whiteboard tab! */}
        {activeTab === "coding" && !problem && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">
              Interview Lobby
            </h1>
            {role === "interviewer" ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors shadow-sm text-sm"
              >
                <FaPlus size={12} /> Select First Problem
              </button>
            ) : (
              <p className="text-zinc-500 italic text-sm animate-pulse mt-4">
                Waiting for interviewer to select a problem...
              </p>
            )}
          </div>
        )}

        {/* Coding Workspace */}
        {activeTab === "coding" && problem && (
          <InterviewCodingWorkspace
            problem={problem}
            selectedLanguage={selectedLanguage}
            code={code}
            handleLanguageChange={handleLanguageChange}
            handleEditorChange={handleEditorChange}
            setCode={setCode}
            submissionResult={submissionResult}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Whiteboard (Available immediately, even without a problem!) */}
        {activeTab === "whiteboard" && socket.current && (
          <Whiteboard socket={socket.current} roomID={roomID} />
        )}

        {/* FLOATING VIDEO */}
        <FloatingVideoContainer
          localStream={localStream}
          remoteStream={activeRemoteStream} 
          isLocalMuted={isMuted}
          isLocalVideoOff={isVideoOff}
          hidden={hideVideoTiles}
        />
      </main>

      {/* FOOTER */}
      <InterviewFooter
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          socket.current?.emit("tab-change", { roomID, tab });
        }}
        secondsElapsed={secondsElapsed}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        hideVideoTiles={hideVideoTiles}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleHideVideoTiles={() => setHideVideoTiles(!hideVideoTiles)}
        onLeave={handleLeave}
      />

      {/* MODAL */}
      <ProblemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProblemSelect={(probObj) => {
          socket.current?.emit("select-problem", {
            roomID,
            problemId: probObj._id || probObj,
          });
        }}
      />
    </div>
  );
}

export default InterviewRoom;