import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Helper to calculate and format remaining time
const calculateTimeLeft = (endTime) => {
    const total = Date.parse(endTime) - Date.now();
    if (total <= 0) return { total: 0, hours: '00', minutes: '00', seconds: '00' };

    const seconds = Math.floor((total / 1000) % 60).toString().padStart(2, '0');
    const minutes = Math.floor((total / 1000 / 60) % 60).toString().padStart(2, '0');
    const hours = Math.floor((total / (1000 * 60 * 60))).toString().padStart(2, '0'); // Can be > 24

    return { total, hours, minutes, seconds };
};

function ContestHeader({ contest, currentProblemSlug }) {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(contest.endTime));

    // Timer logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(contest.endTime));
        }, 1000);

        if (timeLeft.total <= 0) {
            clearTimeout(timer);
            // Optionally force submit or show a modal
            toast.warn("Contest time is over!");
        }
        return () => clearTimeout(timer);
    }); // Runs every second

    const timerColor = timeLeft.total < 10 * 60 * 1000 ? 'text-red-500 animate-pulse' : 'text-orange-400';

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-auto md:h-16 bg-black border-b-2 border-orange-800/60 shadow-[0_5px_30px_rgba(255,69,0,0.5)] flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 py-2 md:py-0">
            
            {/* Left Side: Back Button & Contest Title */}
            <div className="flex items-center gap-3 self-start md:self-center">
                <button 
                    onClick={() => navigate('/contests')} 
                    className="flex items-center gap-2 text-orange-500 font-bold text-xs sm:text-sm transition-all duration-300 transform hover:text-orange-400 hover:scale-105"
                >
                    <FaArrowLeft /> <span className="hidden sm:inline">Back to Contests</span>
                </button>
                <div className="h-6 w-px bg-gray-700 hidden md:block"></div>
                <h1 className="text-lg font-semibold text-white truncate [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                    {contest.title}
                </h1>
            </div>

            {/* Center: Problem List */}
            <div className="flex items-center gap-2 my-2 md:my-0">
                {contest.problems.map(({ problem }, index) => (
                    <Link
                        key={problem._id}
                        to={`/contest/${contest.slug}/problem/${problem.slug}`}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all
                                    ${problem.slug === currentProblemSlug 
                                        ? 'bg-orange-600/30 border-orange-500 text-orange-300 shadow-[0_0_10px_rgba(255,100,0,0.4)]' 
                                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                    }`}
                    >
                        {/* Use A, B, C... for problem labels */}
                        {String.fromCharCode(65 + index)} 
                    </Link>
                ))}
            </div>

            {/* Right Side: Timer */}
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timerColor} [text-shadow:0_0_10px_rgba(255,100,0,0.5)]`}>
                <FaClock />
                <span>{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}</span>
            </div>
        </div>
    );
}

export default ContestHeader;