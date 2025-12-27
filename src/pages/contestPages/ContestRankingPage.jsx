import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App'; 
import { FaArrowLeft, FaTrophy, FaMedal, FaCrown } from 'react-icons/fa';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

// --- NEW: PODIUM COMPONENT ---
const RankingPodium = ({ topThree }) => {
    // Helper to render a single podium stand
    const PodiumStand = ({ rank, user, score, height, color, glow }) => {
        if (!user) return <div className="w-1/3"></div>; // Empty slot filler

        return (
            <div className={`flex flex-col items-center justify-end w-1/3 ${height} transition-all duration-500 hover:scale-105 z-10`}>
                {/* Avatar with Ring */}
                <Link to={`/profile/${user.username}`} className="relative group mb-3">
                    {rank === 1 && <FaCrown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 text-2xl animate-bounce" />}
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 ${color} ${glow} overflow-hidden bg-black relative`}>
                        <img 
                            src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} 
                            alt={user.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black border ${color} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                        #{rank}
                    </div>
                </Link>

                {/* Name & Score */}
                <div className="text-center mb-2">
                    <h3 className="text-white font-bold text-sm sm:text-base truncate max-w-[100px] sm:max-w-[140px]">
                        {user.name}
                    </h3>
                    <p className={`font-mono text-lg font-bold ${color.replace('border', 'text')}`}>
                        {score} <span className="text-xs text-gray-500">pts</span>
                    </p>
                </div>

                {/* The Physical Stand Bar */}
                <div className={`w-full ${rank === 1 ? 'h-32' : rank === 2 ? 'h-20' : 'h-12'} 
                                bg-gradient-to-t from-orange-900/40 to-transparent 
                                border-t-4 ${color} rounded-t-lg opacity-80`}>
                </div>
            </div>
        );
    };

    const first = topThree[0];
    const second = topThree[1];
    const third = topThree[2];

    return (
        <div className="flex justify-center items-end max-w-lg mx-auto mb-12 pt-10 px-4 gap-2 sm:gap-4">
            {/* 2nd Place (Left) */}
            <PodiumStand 
                rank={2} 
                user={second?.user} 
                score={second?.totalScore} 
                height="mt-8" 
                color="border-gray-400" 
                glow="shadow-[0_0_20px_rgba(156,163,175,0.4)]"
            />
            {/* 1st Place (Center - Tallest) */}
            <PodiumStand 
                rank={1} 
                user={first?.user} 
                score={first?.totalScore} 
                height="mt-0" 
                color="border-yellow-400" 
                glow="shadow-[0_0_30px_rgba(250,204,21,0.6)]"
            />
            {/* 3rd Place (Right) */}
            <PodiumStand 
                rank={3} 
                user={third?.user} 
                score={third?.totalScore} 
                height="mt-12" 
                color="border-orange-700" 
                glow="shadow-[0_0_20px_rgba(194,65,12,0.4)]"
            />
        </div>
    );
};

// --- Ranking Row Component ---
const RankRow = ({ rankEntry, rankIndex }) => {
    const { user, totalScore, totalPenalty } = rankEntry;

    // Format penalty (e.g., 90.5 minutes -> 01:30:30)
    const hours = Math.floor(totalPenalty / 60).toString().padStart(2, '0');
    const minutes = Math.floor(totalPenalty % 60).toString().padStart(2, '0');
    const seconds = Math.floor((totalPenalty * 60) % 60).toString().padStart(2, '0');
    const penaltyTime = `${hours}:${minutes}:${seconds}`;
    
    // Rank styling
    let rankColor = "text-gray-400 font-mono";
    // Top 3 get icons (though they are also in podium, usually list includes them too or starts from 4)
    // Here we show icons for top 3 in list as well for clarity
    const rankDisplay = rankIndex === 0 ? <FaTrophy className="text-yellow-400 inline" /> :
                        rankIndex === 1 ? <FaMedal className="text-gray-400 inline" /> :
                        rankIndex === 2 ? <FaMedal className="text-orange-700 inline" /> :
                        `#${rankIndex + 1}`;

    return (
        <tr className="border-b border-gray-800 hover:bg-white/5 transition-colors">
            <td className={`p-4 text-center text-lg font-bold ${rankColor}`}>
                {rankDisplay}
            </td>
            <td className="p-4 text-sm align-middle">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 group">
                    <img 
                        src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} 
                        alt={user.username} 
                        className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-orange-500 transition-colors" 
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-200 group-hover:text-white transition-colors">
                            {user.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                            @{user.username}
                        </span>
                    </div>
                </Link>
            </td>
            <td className="p-4 text-center text-lg font-bold text-white font-mono">
                {totalScore}
            </td>
            <td className="p-4 text-center text-xs font-mono text-gray-500">
                {penaltyTime}
            </td>
        </tr>
    );
};

// --- Main Page ---
function ContestRankingPage() {
    const [rankingData, setRankingData] = useState(null);
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const { slug } = useParams();
    const navigate = useNavigate();

    // Fetch Ranking Logic
    const fetchRanking = async () => {
        try {
            const { data } = await axios.get(`${serverUrl}/api/contests/${slug}/ranking`, { withCredentials: true });
            setRankingData(data);
            
            const contestRes = await axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
            setContest(contestRes.data);
        } catch (err) {
            console.error(err);
            // Don't redirect immediately on error, allow retries or show empty state
            if(!rankingData) toast.error("Could not load leaderboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
        // Optional: Auto-refresh every 30s
        const interval = setInterval(fetchRanking, 30000);
        return () => clearInterval(interval);
    }, [slug]);

    if (loading) return <LoadingSpinner />;
    if (!rankingData || !contest) return <div className="text-white text-center p-10">Leaderboard unavailable</div>;

    const { rankings } = rankingData;

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 pt-24 pb-20 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => navigate('/contests')} 
                        className="p-3 rounded-full bg-[#111] hover:bg-[#222] text-gray-400 hover:text-white transition-colors"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <p className="text-orange-500 text-xs font-bold tracking-widest uppercase mb-1">Live Standings</p>
                        <h1 className="text-3xl font-black text-white">{contest.title}</h1>
                    </div>
                </div>

                {/* --- 1. PODIUM (Only if we have rankings) --- */}
                {rankings.length > 0 && (
                    <RankingPodium topThree={rankings.slice(0, 3)} />
                )}

                {/* --- 2. RANKING TABLE --- */}
                <div className="bg-[#0a0a0a] border border-orange-900/30 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[500px]">
                            <thead className="bg-[#111] border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 text-center w-16">Rank</th>
                                    <th className="p-4">Participant</th>
                                    <th className="p-4 text-center">Score</th>
                                    <th className="p-4 text-center">Penalty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/30">
                                {rankings.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-10 text-center text-gray-600 italic">
                                            No submissions yet. Be the first to solve a problem!
                                        </td>
                                    </tr>
                                ) : (
                                    rankings.map((entry, index) => (
                                        <RankRow key={entry.user._id} rankEntry={entry} rankIndex={index} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ContestRankingPage;