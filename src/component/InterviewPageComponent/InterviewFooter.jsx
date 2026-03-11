import React from 'react';
import { 
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, 
  FaCode, FaChalkboard, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { FaClock } from 'react-icons/fa6';

const InterviewFooter = ({
  activeTab,
  onTabChange,
  secondsElapsed,
  isMuted,
  isVideoOff,
  hideVideoTiles, 
  onToggleMute,
  onToggleVideo,
  onToggleHideVideoTiles, 
  onLeave
}) => {
  
  // 🚀 Safely format time
  const formatTime = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) {
      return "00:00:00";
    }
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <footer className="h-14 shrink-0 w-full bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-4 sm:px-6 relative z-40 select-none font-sans">
      
      {/* ======================= LEFT: NAVIGATION TABS ======================= */}
      <div className="flex items-center gap-2">
        <FooterTabButton
          icon={<FaCode />}
          label="Coding"
          isActive={activeTab === "coding"}
          onClick={() => onTabChange("coding")}
        />
        <div className="w-px h-4 bg-zinc-800 mx-1"></div> {/* Divider */}
        <FooterTabButton
          icon={<FaChalkboard />}
          label="System Design"
          isActive={activeTab === "whiteboard"}
          onClick={() => onTabChange("whiteboard")}
        />
      </div>

      {/* ======================= CENTER: CALL CONTROLS ======================= */}
      {/* Positioned absolutely to perfectly center them regardless of left/right content widths */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        
        <FooterControlButton 
          onClick={onToggleMute} 
          isToggled={isMuted} 
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <FaMicrophoneSlash size={14} /> : <FaMicrophone size={14} />}
        </FooterControlButton>
        
        <FooterControlButton 
          onClick={onToggleVideo} 
          isToggled={isVideoOff} 
          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isVideoOff ? <FaVideoSlash size={14} /> : <FaVideo size={14} />}
        </FooterControlButton>

        <div className="w-px h-5 bg-zinc-800 mx-1"></div> {/* Divider */}

        <FooterControlButton 
          onClick={onToggleHideVideoTiles} 
          isToggled={hideVideoTiles} 
          title={hideVideoTiles ? "Show Video Tiles" : "Hide Video Tiles"}
        >
          {hideVideoTiles ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </FooterControlButton>
        
        <div className="w-px h-5 bg-zinc-800 mx-1"></div> {/* Divider */}

        <FooterControlButton 
          onClick={onLeave} 
          isDanger 
          title="End Call"
        >
          <FaPhoneSlash size={14} />
        </FooterControlButton>

      </div>

      {/* ======================= RIGHT: UTILITIES & TIMER ======================= */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-300 font-mono text-xs font-medium tracking-wider bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md shadow-inner">
          <FaClock size={11} className="text-zinc-500" />
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </div>

    </footer>
  );
};

// =========================================================================
// --- HELPER COMPONENT: Footer Tab Button ---
// =========================================================================
const FooterTabButton = ({ icon, label, isActive, onClick }) => {
  const common = "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-200 cursor-pointer";
  
  const textStyle = isActive 
    ? "bg-zinc-800 text-zinc-100 shadow-sm" 
    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"; 
    
  const labelStyle = isActive
    ? "text-[10px] uppercase tracking-widest font-bold"
    : "text-[10px] uppercase tracking-widest font-semibold";

  return (
    <button
      onClick={onClick}
      title={label}
      className={`${common} ${textStyle}`}
    >
      <span className={isActive ? "text-red-500" : "text-zinc-500"}>{icon}</span>
      <span className={`${labelStyle} hidden sm:inline`}>{label}</span>
    </button>
  );
};

// =========================================================================
// --- HELPER COMPONENT: Footer Control Button ---
// =========================================================================
const FooterControlButton = ({ onClick, children, isToggled = false, isDanger = false, title }) => {
  const base = "w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none cursor-pointer";
  
  if (isToggled) {
    return (
      <button 
        onClick={onClick} 
        title={title} 
        className={`${base} bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20`}
      >
        {children}
      </button>
    );
  }
  
  if (isDanger) {
    return (
      <button 
        onClick={onClick} 
        title={title} 
        className={`${base} bg-red-600 text-white hover:bg-red-500 shadow-sm`}
      >
        {children}
      </button>
    );
  }
  
  return (
    <button 
      onClick={onClick} 
      title={title} 
      className={`${base} bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700`}
    >
      {children}
    </button>
  );
};

export default InterviewFooter;