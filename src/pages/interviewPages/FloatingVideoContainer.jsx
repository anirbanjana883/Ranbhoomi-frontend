// FloatingVideoContainer.jsx
import React, { useEffect, useRef, useState } from "react";

export default function FloatingVideoContainer({
  localStream,
  remoteStream,
  isLocalMuted,
  isLocalVideoOff,
  hidden = false,
  minimizeToDock = false,
  setMinimizeToDock,
}) {
  const containerRef = useRef(null);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [pos, setPos] = useState(() => {
    // saved pos
    try {
      const raw = localStorage.getItem("floatingVideoPos");
      return raw ? JSON.parse(raw) : { x: 20, y: 80 };
    } catch {
      return { x: 20, y: 80 };
    }
  });

  // apply streams to video elements
  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
      localRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
      remoteRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // dragging with pointer events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0,
      startY = 0,
      startLeft = 0,
      startTop = 0;

    const onPointerDown = (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = pos.x;
      startTop = pos.y;
      el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 200, startLeft + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 140, startTop + dy));
      setPos({ x: newX, y: newY });
    };

    const onPointerUp = (e) => {
      isDown = false;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {}
      localStorage.setItem("floatingVideoPos", JSON.stringify(pos));
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [pos]);

  // don't render if hidden or minimized to dock
  if (hidden || minimizeToDock) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-48 h-32 rounded-lg overflow-hidden bg-black/70 border border-orange-800/40 shadow-xl backdrop-blur-md cursor-grab"
      style={{
        left: pos.x,
        top: pos.y,
        touchAction: "none",
      }}
      title="Drag me"
    >
      <div className="w-full h-full relative">
        {/* remote bigger */}
        <video
          ref={remoteRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />
        {/* local small overlay at bottom-right */}
        <div className="absolute right-2 bottom-2 w-20 h-12 rounded-md overflow-hidden border border-orange-900/40 bg-black/60">
          <video
            ref={localRef}
            className="w-full h-full object-cover"
            muted={isLocalMuted}
            playsInline
          />
        </div>

        {/* controls */}
        <div className="absolute top-1 left-1 flex gap-1">
          <button
            className="px-2 py-1 text-xs bg-black/50 rounded text-white"
            onClick={() => setMinimizeToDock?.((s) => !s)}
            title="Minimize to dock"
          >
            {minimizeToDock ? "Restore" : "Dock"}
          </button>
        </div>
      </div>
    </div>
  );
}
