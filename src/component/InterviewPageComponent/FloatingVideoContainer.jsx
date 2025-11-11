import React, { useState, useRef, useEffect } from "react";
import VideoTile from "./VideoTile";
import {
  FaEye,
  FaEyeSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";

const FloatingVideoContainer = ({
  localVideoRef,
  remoteVideoRef,
  isLocalMuted,
  isLocalVideoOff,
  toggleMute,
  toggleVideo,
  handleLeave,
}) => {
  const [isLocalHidden, setIsLocalHidden] = useState(false);
  const [position, setPosition] = useState({ x: 30, y: 30 });
  const [targetPos, setTargetPos] = useState({ x: 30, y: 30 });
  const [size, setSize] = useState({ width: 300, height: 360 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const containerRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });

  /* ---------------- Smooth Animation ---------------- */
  useEffect(() => {
    let frame;
    const smoothMove = () => {
      setPosition((p) => {
        const dx = targetPos.x - p.x;
        const dy = targetPos.y - p.y;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return targetPos;
        return { x: p.x + dx * 0.2, y: p.y + dy * 0.2 };
      });
      frame = requestAnimationFrame(smoothMove);
    };
    frame = requestAnimationFrame(smoothMove);
    return () => cancelAnimationFrame(frame);
  }, [targetPos]);

  /* ---------------- Drag logic ---------------- */
  const startDrag = (e) => {
    if (resizing) return;
    setDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setTargetPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    } else if (resizing) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      setSize({
        width: Math.max(250, resizeStart.current.width + dx),
        height: Math.max(220, resizeStart.current.height + dy),
      });
    }
  };

  const stopAll = () => {
    setDragging(false);
    setResizing(false);
  };

  /* ---------------- Resize logic ---------------- */
  const startResize = (e) => {
    e.stopPropagation();
    setResizing(true);
    resizeStart.current = {
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY,
    };
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopAll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopAll);
    };
  });

  /* ---------------- Render ---------------- */
  return (
    <div
      ref={containerRef}
      onMouseDown={startDrag}
      className={`fixed z-40 rounded-2xl overflow-hidden border border-gray-800 bg-black/70 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.6)] select-none transition-all duration-150 ease-out`}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: dragging ? "grabbing" : "grab",
      }}
    >
      {/* --- Video Area --- */}
      <div className="flex flex-col w-full h-[calc(100%-60px)]">
        <div className="flex-1 relative">
          <VideoTile
            videoRef={remoteVideoRef}
            label="Remote"
            isMuted={false}
            isVideoOff={false}
            accent="border-orange-700/70"
          />
        </div>

        {!isLocalHidden && (
          <div className="flex-1 relative">
            <VideoTile
              videoRef={localVideoRef}
              label="You"
              isMuted={isLocalMuted}
              isVideoOff={isLocalVideoOff}
              accent="border-gray-700/70"
            />
          </div>
        )}
      </div>

      {/* --- Controls Area --- */}
      <div className="h-[60px] flex items-center justify-center gap-3 border-t border-gray-700 bg-black/60 backdrop-blur-sm">
        <ControlButton
          onClick={toggleMute}
          active={isLocalMuted}
          title={isLocalMuted ? "Unmute" : "Mute"}
        >
          {isLocalMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </ControlButton>
        <ControlButton
          onClick={toggleVideo}
          active={isLocalVideoOff}
          title={isLocalVideoOff ? "Turn camera on" : "Turn camera off"}
        >
          {isLocalVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </ControlButton>
        <ControlButton
          onClick={handleLeave}
          danger
          title="Leave Meeting"
        >
          <FaPhoneSlash />
        </ControlButton>

        <button
          onClick={() => setIsLocalHidden((p) => !p)}
          className="ml-auto mr-3 text-gray-400 hover:text-white transition"
          title={isLocalHidden ? "Show my video" : "Hide my video"}
        >
          {isLocalHidden ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startResize}
        className="absolute bottom-1 right-1 w-3 h-3 bg-orange-600/60 hover:bg-orange-600 cursor-se-resize rounded-sm"
      />
    </div>
  );
};

/* ---------------- Button ---------------- */
const ControlButton = ({ onClick, children, active, danger, title }) => {
  const base =
    "p-3 rounded-full transition-transform hover:scale-110 text-white";
  const color = danger
    ? "bg-red-600 hover:bg-red-700 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
    : active
    ? "bg-orange-600 hover:bg-orange-700 shadow-[0_0_10px_rgba(255,69,0,0.5)]"
    : "bg-gray-800 hover:bg-gray-700";
  return (
    <button
      onClick={onClick}
      title={title}
      className={`${base} ${color}`}
    >
      {children}
    </button>
  );
};

export default FloatingVideoContainer;
