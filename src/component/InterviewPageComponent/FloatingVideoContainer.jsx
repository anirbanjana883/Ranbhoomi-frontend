import React, { useState } from 'react';
import VideoTile from './VideoTile'; // Import our new component
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const FloatingVideoContainer = ({ 
  localVideoRef, 
  remoteVideoRef, 
  isLocalMuted, 
  isLocalVideoOff 
  // We'll add remote status later
}) => {
  const [isLocalHidden, setIsLocalHidden] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 w-48 md:w-64">
      
      {/* Remote Video (Always shows) */}
      <div className="w-full aspect-video">
        <VideoTile
          videoRef={remoteVideoRef}
          label="Remote"
          isMuted={false} // We don't have this state from the remote user yet
          isVideoOff={false} // We don't have this state from the remote user yet
          accent="border-orange-700/70"
        />
      </div>

      {/* Local Video (Can be hidden) */}
      <div 
        className={`w-full aspect-video transition-all duration-300 ${isLocalHidden ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}
      >
        <VideoTile
          videoRef={localVideoRef}
          label="You"
          isMuted={isLocalMuted}
          isVideoOff={isLocalVideoOff}
          accent="border-gray-700/70"
        />
      </div>

      {/* Hide Button */}
      <button 
        onClick={() => setIsLocalHidden(prev => !prev)}
        className="absolute -bottom-8 right-0 text-xs text-gray-400 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-sm"
        title={isLocalHidden ? "Show my video" : "Hide my video"}
      >
        {isLocalHidden ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};

export default FloatingVideoContainer;