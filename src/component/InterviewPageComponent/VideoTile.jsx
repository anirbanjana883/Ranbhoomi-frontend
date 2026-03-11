import React, { useRef, useEffect } from "react";
import { FaMicrophoneSlash, FaVideoSlash } from "react-icons/fa";

const VideoTile = ({
  stream, 
  label,
  isMuted,
  isVideoOff,
  accent = "border-zinc-800",
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
  if (!videoRef.current) return;

  if (stream) {
    videoRef.current.srcObject = stream;
  } else {
    videoRef.current.srcObject = null;
  }
}, [stream]);
  return (
    <div className={`relative w-full h-full bg-zinc-950 border ${accent} flex items-center justify-center`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={label === "You"} // ALWAYS true for local to prevent echo
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isVideoOff ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Camera Off Fallback */}
      {isVideoOff && (
        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center z-0">
          <FaVideoSlash className="text-zinc-700 text-3xl mb-2" />
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            Camera Off
          </span>
        </div>
      )}

      {/* Label Badge */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-md z-10 shadow-sm">
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-none">
          {label}
        </span>
      </div>

      {/* Mute Indicator */}
      {isMuted && (
        <div className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/10 border border-red-500/20 backdrop-blur-md z-10 shadow-sm">
          <FaMicrophoneSlash className="text-red-500 text-xs" />
        </div>
      )}
    </div>
  );
};

export default VideoTile;