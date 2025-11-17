import React from 'react';
import { 
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, 
  FaCode, FaChalkboard, FaUserFriends, FaEye, FaEyeSlash 
} from 'react-icons/fa';
import { FaClock } from 'react-icons/fa6';

const MacTaskbar = ({
  activeTab,
  onTabChange,
  problem,
  secondsElapsed,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onLeave,
  hideVideo,
  onToggleHideVideo
}) => {
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 p-2 bg-black/70 backdrop-blur-lg border border-orange-800/50 rounded-2xl shadow-[0_0_30px_rgba(255,69,0,0.4)] z-50">
      
      {/* --- Left Side: Tabs --- */}
      <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-xl">
        <TabButton
          icon={<FaUserFriends />}
          label="Lobby"
          isActive={activeTab === "lobby"}
          onClick={() => onTabChange("lobby")}
        />
        <TabButton
          icon={<FaCode />}
          label="Coding"
          isActive={activeTab === "coding"}
          onClick={() => onTabChange("coding")}
          disabled={!problem}
        />
        <TabButton
          icon={<FaChalkboard />}
          label="System Design"
          isActive={activeTab === "whiteboard"}
          onClick={() => onTabChange("whiteboard")}
        />
      </div>

      {/* --- Center: Controls --- */}
      <div className="flex items-center gap-2 p-1 bg-gray-800/50 rounded-xl">
        <ControlButton onClick={onToggleMute} isToggled={isMuted} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </ControlButton>
        <ControlButton onClick={onToggleVideo} isToggled={isVideoOff} title={isVideoOff ? "Turn camera on" : "Turn camera off"}>
          {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </ControlButton>
        <ControlButton onClick={onLeave} isDanger title="Leave">
          <FaPhoneSlash />
        </ControlButton>
      </div>

      {/* --- Right Side: Timer & Video Toggle --- */}
      <div className="flex items-center gap-3 p-1 pr-3 bg-gray-800/50 rounded-xl">
        <ControlButton onClick={onToggleHideVideo} isToggled={hideVideo} title={hideVideo ? "Show Video" : "Hide Video"}>
          {hideVideo ? <FaEyeSlash /> : <FaEye />}
        </ControlButton>
        <div className="flex items-center gap-2 text-orange-400 font-mono text-sm">
          <FaClock />
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </div>

    </div>
  );
};

// --- Helper Components for the Dock ---
const TabButton = ({ icon, label, isActive, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all
      ${isActive
        ? "bg-orange-600 text-white shadow-[0_0_10px_rgba(255,69,0,0.5)]"
        : "text-gray-300"
      }
      ${disabled
        ? "opacity-30 cursor-not-allowed"
        : "hover:text-white"
      }
    `}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const ControlButton = ({ onClick, children, isToggled = false, isDanger = false, title }) => {
  let style = "bg-gray-700 hover:bg-gray-600 text-white";
  if (isToggled)
    style = "bg-orange-600 hover:bg-orange-700 text-white";
  if (isDanger)
    style = "bg-red-600 hover:bg-red-700 text-white";
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all transform hover:scale-110 ${style}`}
    >
      {children}
    </button>
  );
};

export default MacTaskbar;