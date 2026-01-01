import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App'; 
import { FaArrowLeft, FaTrophy, FaMedal, FaCrown, FaLock } from 'react-icons/fa';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

// --- PODIUM COMPONENT ---
const RankingPodium = ({ topThree }) => {
    const PodiumStand = ({ rank, user, score, height, color, glow }) => {
        if (!user) return <div className="w-1/3"></div>;

        return (
            <div className={`flex flex-col items-center justify-end w-1/3 ${height} transition-all duration-500 hover:scale-105 z-10`}>
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
                <div className="text-center mb-2">
                    <h3 className="text-white font-bold text-sm sm:text-base truncate max-w-[100px] sm:max-w-[140px]">
                        {user.name}
                    </h3>
                    <p className={`font-mono text-lg font-bold ${color.replace('border', 'text')}`}>
                        {score} <span className="text-xs text-gray-500">pts</span>
                    </p>
                </div>
                <div className={`w-full ${rank === 1 ? 'h-32' : rank === 2 ? 'h-20' : 'h-12'} bg-gradient-to-t from-orange-900/40 to-transparent border-t-4 ${color} rounded-t-lg opacity-80`}></div>
            </div>
        );
    };

    const first = topThree[0];
    const second = topThree[1];
    const third = topThree[2];

    return (
        <div className="flex justify-center items-end max-w-lg mx-auto mb-12 pt-10 px-4 gap-2 sm:gap-4">
            <PodiumStand rank={2} user={second?.user} score={second?.totalScore} height="mt-8" color="border-gray-400" glow="shadow-[0_0_20px_rgba(156,163,175,0.4)]" />
            <PodiumStand rank={1} user={first?.user} score={first?.totalScore} height="mt-0" color="border-yellow-400" glow="shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
            <PodiumStand rank={3} user={third?.user} score={third?.totalScore} height="mt-12" color="border-orange-700" glow="shadow-[0_0_20px_rgba(194,65,12,0.4)]" />
        </div>
    );
};

// --- RANK ROW COMPONENT ---
const RankRow = ({ rankEntry, rankIndex }) => {
    const { user, totalScore, totalPenalty } = rankEntry;
    const hours = Math.floor(totalPenalty / 60).toString().padStart(2, '0');
    const minutes = Math.floor(totalPenalty % 60).toString().padStart(2, '0');
    const seconds = Math.floor((totalPenalty * 60) % 60).toString().padStart(2, '0');
    const penaltyTime = `${hours}:${minutes}:${seconds}`;
    
    let rankDisplay = rankIndex === 0 ? <FaTrophy className="text-yellow-400 inline" /> :
                      rankIndex === 1 ? <FaMedal className="text-gray-400 inline" /> :
                      rankIndex === 2 ? <FaMedal className="text-orange-700 inline" /> :
                      `#${rankIndex + 1}`;

    return (
        <tr className="border-b border-gray-800 hover:bg-white/5 transition-colors">
            <td className="p-4 text-center text-lg font-bold text-gray-400 font-mono">{rankDisplay}</td>
            <td className="p-4 text-sm align-middle">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 group">
                    <img src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} alt={user.username} className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-orange-500 transition-colors" />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{user.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">@{user.username}</span>
                    </div>
                </Link>
            </td>
            <td className="p-4 text-center text-lg font-bold text-white font-mono">{totalScore}</td>
            <td className="p-4 text-center text-xs font-mono text-gray-500">{penaltyTime}</td>
        </tr>
    );
};

// --- MAIN PAGE ---
function ContestRankingPage() {
    const [rankingData, setRankingData] = useState(null);
    const [contest, setContest] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // <--- Added State
    const [loading, setLoading] = useState(true);
    const { slug } = useParams();
    const navigate = useNavigate();

    // Fetch Data
    const fetchRanking = async () => {
        try {
            // 1. Get Rankings
            const { data } = await axios.get(`${serverUrl}/api/contests/${slug}/ranking`, { withCredentials: true });
            setRankingData(data);
            
            // 2. Get Contest Details
            const contestRes = await axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
            setContest(contestRes.data);

            // 3. Get Current User (For Host Check)
            try {
                const userRes = await axios.get(`${serverUrl}/api/user/getcurrentuser`, { withCredentials: true });
                setCurrentUser(userRes.data);
            } catch (e) {
                console.log("Not logged in");
            }

        } catch (err) {
            console.error(err);
            if(!rankingData) toast.error("Could not load leaderboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
        const interval = setInterval(fetchRanking, 30000);
        return () => clearInterval(interval);
    }, [slug]);

    // --- SECURITY CHECK (THE GATEKEEPER) ---
    useEffect(() => {
        if (!loading && contest && currentUser) {
            const visibility = contest.visibility ? contest.visibility.toUpperCase() : "PUBLIC";
            
            // Check if Private
            if (visibility === 'PRIVATE') {
                const isHost = (contest.createdBy._id || contest.createdBy) === currentUser._id;
                const isRegistered = contest.isRegistered;

                // If NOT Host AND NOT Registered => KICK OUT
                if (!isHost && !isRegistered) {
                    toast.error("🔒 Private Contest! You must join to see the rankings.");
                    navigate(`/contest/${slug}`); // Send back to details page to enter code
                }
            }
        }
    }, [loading, contest, currentUser, navigate, slug]);
    // ---------------------------------------

    if (loading) return <LoadingSpinner />;
    if (!rankingData || !contest) return <div className="text-white text-center p-10">Leaderboard unavailable</div>;

    const { rankings } = rankingData;
    const isPrivate = (contest.visibility || "").toUpperCase() === "PRIVATE";

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 pt-24 pb-20 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/contests')} className="p-3 rounded-full bg-[#111] hover:bg-[#222] text-gray-400 hover:text-white transition-colors">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-orange-500 text-xs font-bold tracking-widest uppercase mb-1">Live Standings</p>
                            {isPrivate && <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-600/40 px-2 rounded flex items-center gap-1"><FaLock size={8}/> PRIVATE</span>}
                        </div>
                        <h1 className="text-3xl font-black text-white">{contest.title}</h1>
                    </div>
                </div>

                {/* --- PODIUM --- */}
                {rankings.length > 0 && <RankingPodium topThree={rankings.slice(0, 3)} />}

                {/* --- TABLE --- */}
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