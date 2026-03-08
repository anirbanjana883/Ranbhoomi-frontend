import React, { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

export default function ContestTimer({ endTime, onTimeUp }) {
  const getSecondsRemaining = () => {
    const total = Date.parse(endTime) - Date.now();
    return total > 0 ? Math.floor(total / 1000) : 0;
  };

  const [timeLeft, setTimeLeft] = useState(getSecondsRemaining());

  useEffect(() => {
    const timerId = setInterval(() => {
      const remaining = getSecondsRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerId);
        if (onTimeUp) onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [endTime, onTimeUp]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCritical = timeLeft < 300; 

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded border font-mono text-sm font-bold transition-colors duration-300
      ${isCritical 
        ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse" 
        : "text-zinc-300 border-zinc-700 bg-zinc-900"}
    `}>
      <FaClock className={isCritical ? "animate-spin" : "text-zinc-500"} size={12} />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}