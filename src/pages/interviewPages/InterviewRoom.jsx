import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";

// --- Import Components ---
import ProblemDescription from "../../component/ProblemPageComponent/ProblemDescription";
import CodeEditorPane from "../../component/ProblemPageComponent/CodeEditorPane";
import ConsolePane from "../../component/ProblemPageComponent/ConsolePane";
import Whiteboard from "../../component/InterviewPageComponent/Whiteboard";
import ProblemSelectionModal from "../../component/InterviewPageComponent/ProblemSelectionModal"; // <-- NEW

// --- Import Icons ---
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
import { FaClock } from "react-icons/fa6"; // Correct clock icon

// --- STUN Servers ---
const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// --- Timer Formatting Helper ---
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

function InterviewRoom() {
  const { roomID } = useParams();
  const navigate = useNavigate();

  // --- Socket.io Ref ---
  const socket = useRef(null);

  // --- Data State ---
  const [problem, setProblem] = useState(null); // <-- Will start as null
  const [loading, setLoading] = useState(true);

  // --- WebRTC State ---
  // const [peerConnections, setPeerConnections] = useState(new Map());
  const peerConnections = useRef(new Map());
  const [localStream, setLocalStream] = useState(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  // --- Controls State ---
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // --- Editor State ---
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  // --- Tab State ---
  const [activeTab, setActiveTab] = useState("lobby"); // <-- NEW DEFAULT
  const [activeProblemTab, setActiveProblemTab] = useState("description");

  // --- NEW: Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Timer State ---
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // --- Resizing State (Unchanged) ---
  const [mainPaneWidth, setMainPaneWidth] = useState(75);
  const [problemPaneHeight, setProblemPaneHeight] = useState(50);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const containerRef = useRef(null);
  const mainPaneRef = useRef(null);

  // --- 1. Get Media & Fetch Session Data ---
  useEffect(() => {
    const setupRoom = async () => {
      try {
        // Get user's camera and mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Fetch the interview session data
        const { data: session } = await axios.get(
          `${serverUrl}/api/interview/session/${roomID}`,
          { withCredentials: true }
        );

        // --- THIS IS THE FIX ---
        // Check if a problem is *already* assigned (e.g., rejoining a room)
        if (session.problem) {
          setProblem(session.problem);
          if (session.problem.starterCode?.length > 0) {
            setSelectedLanguage(session.problem.starterCode[0].language);
            setCode(session.problem.starterCode[0].code);
          }
          // If a problem exists, jump to the coding tab
          setActiveTab("coding");
        }
        // If session.problem is null, we do nothing and stay on the 'lobby' tab
        // --- END OF FIX ---

        setLoading(false);
        setSecondsElapsed(0);
      } catch (err) {
        console.error("Error setting up room:", err);
        toast.error(err.response?.data?.message || "Failed to set up room.");
        navigate("/interview");
      }
    };
    setupRoom();
  }, [roomID, navigate]);

  // --- 2. WebRTC Connection Logic (Unchanged) ---
  const createPeerConnection = (remoteSocketId) => {
    if (!localStream) return;
    const pc = new RTCPeerConnection(peerConnectionConfig);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
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

  // --- 3. Socket.io Event Handlers ---
  useEffect(() => {
    if (!localStream) return;
    socket.current = io(serverUrl, { withCredentials: true });

    // --- Event: The *other* user joins (you are the 1st person) ---
    const handleUserJoined = async ({ socketId }) => {
      console.log("Other user joined:", socketId);
      const pc = createPeerConnection(socketId);
      if (pc) {
        // You are the "offerer"
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.current.emit("offer", { target: socketId, offer });
      }
    };

    // --- Event: You receive an offer (you are the 2nd person) ---
    const handleOfferReceived = async ({ offer, sender }) => {
      console.log("Offer received from:", sender);
      const pc = createPeerConnection(sender);
      if (pc) {
        // You are the "answerer"
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.current.emit("answer", { target: sender, answer });
      }
    };

    // --- Event: You receive an answer (you are the 1st person) ---
    const handleAnswerReceived = async ({ answer, sender }) => {
      console.log("Answer received from:", sender);
      // const pc = peerConnections.get(sender); 
      const pc = peerConnections.current.get(sender);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    // --- Event: ICE Candidate (both users) ---
    const handleIceCandidate = async ({ candidate, sender }) => {
      // const pc = peerConnections.get(sender); 
      const pc = peerConnections.current.get(sender); 
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // --- Sync Handlers (Unchanged) ---
    const handleCodeChanged = ({ code }) => setCode(code);
    const handleLanguageChanged = ({ language }) =>
      setSelectedLanguage(language);
    const handleTabChanged = ({ tab }) => setActiveTab(tab);

    // --- NEW: Handle Problem Selection from Socket ---
    const handleProblemSelected = ({ problem: newProblem }) => {
      setProblem(newProblem); // Set the problem
      if (newProblem.starterCode?.length > 0) {
        setSelectedLanguage(newProblem.starterCode[0].language);
        setCode(newProblem.starterCode[0].code);
      }
      setActiveTab("coding"); // Automatically switch to coding tab
      setIsModalOpen(false); // Close modal if open
      toast.success(`Problem selected: ${newProblem.title}`);
    };

    // --- Bind all handlers ---
    socket.current.on("user-joined", handleUserJoined);
    socket.current.on("offer-received", handleOfferReceived);
    socket.current.on("answer-received", handleAnswerReceived);
    socket.current.on("ice-candidate-received", handleIceCandidate);
    socket.current.on("code-changed", handleCodeChanged);
    socket.current.on("language-changed", handleLanguageChanged);
    socket.current.on("tab-changed", handleTabChanged);
    socket.current.on("problem-selected", handleProblemSelected); // <-- NEW

    socket.current.emit("join-room", roomID);

    return () => {
      // Unbind all handlers on cleanup
      if (socket.current) {
        socket.current.off("user-joined", handleUserJoined);
        socket.current.off("offer-received", handleOfferReceived);
        socket.current.off("answer-received", handleAnswerReceived);
        socket.current.off("ice-candidate-received", handleIceCandidate);
        socket.current.off("code-changed", handleCodeChanged);
        socket.current.off("language-changed", handleLanguageChanged);
        socket.current.off("tab-changed", handleTabChanged);
        socket.current.off("problem-selected", handleProblemSelected);
        socket.current.disconnect();
      }
      // peerConnections.forEach((pc) => pc.close());
      peerConnections.current.forEach(pc => pc.close());
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [localStream, roomID]); // Dependencies are correct

  // --- 4. Handlers to EMIT Sync Events ---
  const handleEditorChange = (newCode) => {
    setCode(newCode); // Update local state
    if (socket.current) {
      // Send the new code to the other user
      socket.current.emit("code-change", { roomID, code: newCode });
    }
  };
  const handleLanguageChange = (e) => {
    if (!problem) return; // Safety check

    const newLang = e.target.value;
    setSelectedLanguage(newLang); // Update local state for language

    // Find the new starter code
    const starter = problem.starterCode.find((s) => s.language === newLang);
    const newCode = starter ? starter.code : `// ${newLang} starter code`;
    setCode(newCode); // Update local state for code

    if (socket.current) {
      // Send both the language and the new code to the other user
      socket.current.emit("language-change", { roomID, language: newLang });
      socket.current.emit("code-change", { roomID, code: newCode });
    }
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (socket.current) {
      socket.current.emit("tab-change", { roomID, tab: tab });
    }
  };

  // --- 5. Handlers for Media Controls ---
  const toggleMute = () => {
    if (!localStream) return; // Safety check

    // Toggle every audio track on the local stream
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled; // Mute/unmute
    });

    // Update the UI state
    setIsMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    if (!localStream) return; // Safety check

    // Toggle every video track on the local stream
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled; // Turn camera off/on
    });

    // Update the UI state
    setIsVideoOff((prev) => !prev);
  };

  const handleLeave = () => {
    // 1. Disconnect from the socket server
    if (socket.current) {
      socket.current.disconnect();
    }

    // 2. Stop all local camera/mic tracks
    localStream?.getTracks().forEach((track) => track.stop());

    // 3. Close all peer connections
    // peerConnections.forEach((pc) => pc.close());
    peerConnections.current.forEach(pc => pc.close());

    // 4. Navigate back to the lobby
    navigate("/interview");
    toast.success("You left the interview.");
  };

  // --- 6. Timer ---
  useEffect(() => {
    if (loading) return; // Don't start timer until room is loaded

    // Start a 1-second interval
    const timerInterval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    // Clear the interval when the component unmounts
    return () => clearInterval(timerInterval);
  }, [loading]); // Dependency: only runs when 'loading' changes

  // --- 7. Resizing Handlers ---
  const handleMouseDownHorizontal = useCallback((e) => {
    e.preventDefault();
    setIsDraggingHorizontal(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseDownVertical = useCallback((e) => {
    e.preventDefault();
    setIsDraggingVertical(true);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDraggingHorizontal(false);
    setIsDraggingVertical(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      // Handle main horizontal drag
      if (isDraggingHorizontal && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate new width percentage based on mouse position
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        // Constrain width between 25% and 75%
        setMainPaneWidth(Math.max(25, Math.min(75, newWidth)));
      }

      // Handle vertical drag *only* if coding tab is active
      if (isDraggingVertical && mainPaneRef.current && activeTab === "coding") {
        const rect = mainPaneRef.current.getBoundingClientRect();
        // Calculate new height percentage
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        // Constrain height between 20% and 80%
        setProblemPaneHeight(Math.max(20, Math.min(80, newHeight)));
      }
    },
    [isDraggingHorizontal, isDraggingVertical, activeTab]
  ); // Dependencies

  // --- 8. Resizing Event Listeners ---
  useEffect(() => {
    // Add global listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Cleanup: remove listeners when component unmounts
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]); // Dependencies

  // --- 9. NEW: Handler for Modal Problem Selection ---
  const handleProblemSelect = (problemId) => {
    if (socket.current) {
      socket.current.emit("select-problem", { roomID, problemId });
    }
    // We don't close the modal here; we wait for the 'problem-selected' event
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
        <p className="text-white text-lg ml-4">Setting up the arena...</p>
      </div>
    );
  }

  // --- Render the Arena (NEW LAYOUT) ---
  return (
    <>
      <div
        ref={containerRef}
        className="flex w-full h-screen bg-black text-gray-300 p-2 gap-2 godfather-bg overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* --- Main Pane (Resizable) --- */}
        <div
          ref={mainPaneRef}
          className="flex flex-col h-full"
          style={{ width: `${mainPaneWidth}%` }}
        >
          {/* --- Tab Buttons --- */}
          <div className="flex-shrink-0 flex">
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
              disabled={!problem} // <-- KEY CHANGE
            />
            <TabButton
              icon={<FaChalkboard />}
              label="System Design"
              isActive={activeTab === "whiteboard"}
              onClick={() => handleTabChange("whiteboard")}
            />
          </div>

          {/* --- Tab Content --- */}
          <div className="flex-grow h-full w-full bg-black border-2 border-orange-800/60 rounded-b-xl rounded-tr-xl overflow-hidden shadow-[0_0_50px_rgba(255,69,0,0.35)]">
            {/* --- NEW: LOBBY TAB --- */}
            {activeTab === "lobby" && (
              <div className="w-full h-full p-8 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-white mb-4">
                  Interview Lobby
                </h1>
                <p className="text-gray-400 mb-8">
                  Welcome to the session. The interviewer can select a problem.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(255,69,0,0.5)] hover:bg-orange-700 transition-all"
                  >
                    <FaPlus /> Select Problem
                  </button>
                  <button
                    onClick={() => handleTabChange("whiteboard")}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all"
                  >
                    <FaChalkboard /> Go to Whiteboard
                  </button>
                </div>
              </div>
            )}

            {/* --- CODING TAB --- */}
            {activeTab === "coding" &&
              problem && ( // Only render if problem is selected
                <div className="flex flex-col w-full h-full">
                  <div
                    ref={problemPaneRef}
                    className="flex-grow overflow-auto"
                    style={{ height: `${problemPaneHeight}%` }}
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
                  <div
                    className="flex-shrink-0 h-2 w-full cursor-row-resize bg-gray-800/50 hover:bg-orange-700/50 transition-colors"
                    onMouseDown={handleMouseDownVertical}
                  />
                  <div
                    className="flex-grow overflow-hidden"
                    style={{
                      height: `calc(${100 - problemPaneHeight}% - 8px)`,
                    }}
                  >
                    <CodeEditorPane
                      problem={problem}
                      selectedLanguage={selectedLanguage}
                      code={code}
                      handleLanguageChange={handleLanguageChange}
                      resetCode={() => {}}
                      handleEditorChange={handleEditorChange}
                    />
                  </div>
                </div>
              )}

            {/* --- WHITEBOARD TAB --- */}
            {activeTab === "whiteboard" && <Whiteboard />}
          </div>
        </div>

        {/* --- Horizontal Resizer --- */}
        <div
          className="flex-shrink-0 w-2 h-full cursor-col-resize bg-gray-800/50 hover:bg-orange-700/50 transition-colors"
          onMouseDown={handleMouseDownHorizontal}
        />

        {/* --- Right Sidebar (Resizable) --- */}
        <div
          className="flex flex-col h-full gap-2"
          style={{ width: `calc(${100 - mainPaneWidth}% - 8px)` }}
        >
          {/* ... (Remote Video, Local Video, Console, Controls Bar) ... */}
          {/* This whole section is UNCHANGED from the previous step */}

          {/* Remote Video (The Guest) */}
          <div className="w-full h-1/3 rounded-lg overflow-hidden bg-black border-2 border-orange-700/60">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Local Video (You) */}
          <div className="w-full h-1/3 rounded-lg overflow-hidden bg-black border-2 border-gray-700/60">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Console (For 'Coding' tab) */}
          <div
            className={`flex-grow h-1/3 ${
              activeTab !== "coding" ? "flex" : "hidden"
            }`}
          >
            {/* This is a placeholder for when not coding */}
            <div className="w-full h-full bg-black border-2 border-orange-800/60 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,69,0,0.35)] flex items-center justify-center">
              <p className="text-gray-500 text-sm">Console (Coding Only)</p>
            </div>
          </div>
          <div
            className={`flex-grow h-1/3 ${
              activeTab === "coding" ? "flex" : "hidden"
            }`}
          >
            <div className="w-full h-full bg-black border-2 border-orange-800/60 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,69,0,0.35)]">
              <ConsolePane
                problemTestCases={problem?.testCases || []} // Handle null problem
                submissionResult={null}
                isSubmitting={false}
                handleSubmit={() => toast.info("Submit disabled in interview")}
                handleRun={() => toast.info("Run disabled in interview")}
                activeRightTab={"testcase"}
                setActiveRightTab={() => {}}
              />
            </div>
          </div>

          {/* --- Controls Bar --- */}
          <div className="flex-shrink-0 flex items-center justify-around gap-4 p-3 bg-black border border-orange-700/50 rounded-xl shadow-[0_0_20px_rgba(255,69,0,0.2)]">
            <div className="flex items-center gap-2 text-orange-400 font-mono text-lg font-bold">
              <FaClock />
              <span>{formatTime(secondsElapsed)}</span>
            </div>
            <ControlButton onClick={toggleMute} isToggled={isMuted}>
              {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </ControlButton>
            <ControlButton onClick={toggleVideo} isToggled={isVideoOff}>
              {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
            </ControlButton>
            <ControlButton onClick={handleLeave} isDanger={true}>
              <FaPhoneSlash />
            </ControlButton>
          </div>
        </div>
      </div>

      {/* --- RENDER THE MODAL (it will be hidden by default) --- */}
      <ProblemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProblemSelect={handleProblemSelect}
      />
    </>
  );
}

// --- Helper Tab Component ---
const TabButton = ({ icon, label, isActive, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-t-lg
      ${
        isActive
          ? "bg-black border-b-2 border-transparent text-orange-400 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]"
          : "bg-gray-900/40 text-gray-500"
      }
      ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-800/60 hover:text-gray-300"
      }`}
  >
    {icon} {label}
  </button>
);

// --- Helper Control Button Component (Unchanged) ---
const ControlButton = ({
  onClick,
  children,
  isToggled = false,
  isDanger = false,
}) => {
  // ... (this component is unchanged)
  let style = "bg-gray-700 hover:bg-gray-600 text-white";
  if (isToggled) {
    style =
      "bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_10px_rgba(255,69,0,0.5)]";
  }
  if (isDanger) {
    style =
      "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(255,0,0,0.5)]";
  }
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${style}`}
    >
      {children}
    </button>
  );
};

export default InterviewRoom;
