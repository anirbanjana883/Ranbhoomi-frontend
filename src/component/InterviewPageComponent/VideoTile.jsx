import React from 'react';
import { FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';

const VideoTile = ({ videoRef, label, isMuted, isVideoOff, accent = "border-gray-700/70" }) => {
  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden bg-black border-2 ${accent} shadow-[0_0_20px_rgba(255,69,0,0.2)]`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={label === 'You'} // Only mute our own local video
        className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
        onLoadedMetadata={(e) => {
          e.currentTarget.play().catch(() => {});
        }}
      />
      
      {/* Black placeholder for when video is off */}
      {isVideoOff && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <FaVideoSlash className="text-gray-500 text-4xl" />
        </div>
      )}

      {/* Label */}
      <div className="absolute top-2 left-2 px-2.5 py-1 text-xs font-semibold rounded-full bg-black/60 border border-orange-900/50 text-orange-300 backdrop-blur-sm">
        {label}
      </div>

      {/* Mute Icon */}
      {isMuted && (
        <div className="absolute top-2 right-2 p-2 rounded-full bg-red-600/80">
          <FaMicrophoneSlash className="text-white text-sm" />
        </div>
      )}
    </div>
  );
};

export default VideoTile;