import React, { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

const ContestTimer = ({ endTime, onTimeUp }) => {
  // Helper to get seconds remaining
  const getSecondsRemaining = () => {
    const total = Date.parse(endTime) - Date.now();
    return total > 0 ? Math.floor(total / 1000) : 0;
  };

  const [timeLeft, setTimeLeft] = useState(getSecondsRemaining());

  useEffect(() => {
    // Update every second
    const timerId = setInterval(() => {
      const remaining = getSecondsRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerId);
        if (onTimeUp) onTimeUp();
      }
    }, 1000);

    // Cleanup
    return () => clearInterval(timerId);
  }, [endTime, onTimeUp]);

  // Format HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Critical State: Less than 5 minutes
  const isCritical = timeLeft < 300; 

  return (
    <div className={`
      flex items-center gap-2 px-4 py-1.5 rounded-lg border font-mono text-lg font-bold transition-all duration-300
      ${isCritical 
        ? "text-red-500 border-red-600/50 bg-red-950/20 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.4)]" 
        : "text-orange-500 border-orange-900/40 bg-black shadow-[0_0_10px_rgba(255,69,0,0.15)]"}
    `}>
      <FaClock className={isCritical ? "animate-spin" : ""} size={16} />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
};

export default ContestTimer;