import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ContestTimer = ({ durationSeconds, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Turn red and pulse when less than 10 minutes remain
  const isUrgent = timeLeft < 600;

  return (
    <div className={`flex items-center space-x-2 font-mono text-xl font-bold ${isUrgent ? "text-red-500 animate-pulse" : "text-gray-100"} bg-gray-800 px-4 py-1.5 rounded-md border border-gray-700`}>
      <Clock className="w-5 h-5" />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
};

export default ContestTimer;