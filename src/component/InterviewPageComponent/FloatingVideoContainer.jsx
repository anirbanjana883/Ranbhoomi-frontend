import React, { useEffect, useRef, useState } from "react";
import VideoTile from "./VideoTile";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function FloatingVideoContainer({
  localStream,
  remoteStream,
  isLocalMuted,
  isLocalVideoOff,
  hidden = false,
}) {
  const containerRef = useRef(null);
  const [isLocalHidden, setIsLocalHidden] = useState(false);
  
  const [pos, setPos] = useState(() => {
    try {
      const raw = localStorage.getItem("floatingVideoPos");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          if (parsed.x > -1000 && parsed.y > -1000) {
            // 🚀 FIX 8: Constrain drag boundaries better. w-64 is 256px, use 260 for safety margin.
            return { 
              x: Math.max(10, Math.min(window.innerWidth - 260, parsed.x)), 
              y: Math.max(10, Math.min(window.innerHeight - 350, parsed.y)) 
            };
          }
        }
      }
    } catch (e) {}
    return { x: 20, y: 80 }; 
  });

  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  // ==========================================
  // 🖱️ Safe Dragging Logic
  // ==========================================
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; 
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    try { el.setPointerCapture(e.pointerId); } catch {}

    const offsetX = e.clientX - pos.x;
    const offsetY = e.clientY - pos.y;

    const handlePointerMove = (moveEvent) => {
      let newX = moveEvent.clientX - offsetX;
      let newY = moveEvent.clientY - offsetY;
      
      // 🚀 FIX 8: Updated bounds here as well
      newX = Math.max(10, Math.min(window.innerWidth - 260, newX));
      newY = Math.max(10, Math.min(window.innerHeight - 350, newY));
      
      setPos({ x: newX, y: newY });
    };

    const handlePointerUp = (upEvent) => {
      try { el.releasePointerCapture(upEvent.pointerId); } catch {}
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      localStorage.setItem("floatingVideoPos", JSON.stringify(posRef.current));
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="fixed z-50 w-64 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing hover:border-zinc-700 font-sans flex flex-col group"
      style={{ 
        left: `${pos.x}px`, 
        top: `${pos.y}px`, 
        height: "340px",
        touchAction: "none",
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transform: hidden ? "scale(0.95)" : "scale(1)",
        transition: "opacity 0.2s, transform 0.2s, visibility 0.2s"
      }}
      title="Drag to move"
    >
      <div className="flex flex-col w-full h-[calc(100%-32px)] bg-zinc-900 p-1 gap-1">
        
        {/* Remote Video */}
        <div className="flex-1 relative min-h-0 rounded-md overflow-hidden">
          <VideoTile
            stream={remoteStream}
            label="Remote"
            isMuted={false} 
            isVideoOff={false}
          />
        </div>

        {/* Local Video */}
        <div 
          className={`relative min-h-0 rounded-md overflow-hidden transition-all duration-300 origin-bottom
            ${isLocalHidden ? 'flex-none h-0 opacity-0' : 'flex-1 opacity-100'}
          `}
        >
          <VideoTile
            stream={localStream}
            label="You"
            isMuted={isLocalMuted} 
            isVideoOff={isLocalVideoOff}
          />
        </div>
      </div>

      {/* Slim Footer Controls */}
      <div 
        onPointerDown={(e) => e.stopPropagation()} 
        className="h-[32px] shrink-0 w-full flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-3 cursor-default"
      >
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Live Feed
        </span>
        
        <button
          onClick={() => setIsLocalHidden(!isLocalHidden)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title={isLocalHidden ? "Show my video" : "Hide my video"}
        >
          {isLocalHidden ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
          <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
            {isLocalHidden ? "Show Me" : "Hide Me"}
          </span>
        </button>
      </div>

    </div>
  );
}