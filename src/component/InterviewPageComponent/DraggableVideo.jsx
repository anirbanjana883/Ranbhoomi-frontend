import React, { useState, useRef } from 'react';
import VideoTile from './VideoTile'; // Your existing VideoTile component
import { FaArrowsAlt } from 'react-icons/fa';

const DraggableVideo = ({ 
  localVideoRef, 
  remoteVideoRef, 
  isLocalMuted, 
  isLocalVideoOff,
  isHidden 
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodeRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only drag when clicking the drag handle
    if (!e.target.classList.contains('drag-handle')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (isHidden) {
    return null; // Don't render if hidden
  }

  return (
    <div
      ref={nodeRef}
      className="absolute flex flex-col gap-2 w-48 md:w-64 p-2 bg-black/60 backdrop-blur-md border border-orange-800/50 rounded-xl shadow-lg z-40"
      style={{ top: position.y, left: position.x, cursor: isDragging ? 'grabbing' : 'default' }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle */}
      <div className="drag-handle w-full flex justify-center items-center py-1 text-gray-500 cursor-grab active:cursor-grabbing">
        <FaArrowsAlt />
      </div>

      {/* Remote Video */}
      <div className="w-full aspect-video">
        <VideoTile
          videoRef={remoteVideoRef}
          label="Remote"
          isMuted={false} // We'll sync this later
          isVideoOff={false}
          accent="border-orange-700/70"
        />
      </div>
      
      {/* Local Video */}
      <div className="w-full aspect-video">
        <VideoTile
          videoRef={localVideoRef}
          label="You"
          isMuted={isLocalMuted}
          isVideoOff={isLocalVideoOff}
          accent="border-gray-700/70"
        />
      </div>
    </div>
  );
};

export default DraggableVideo;