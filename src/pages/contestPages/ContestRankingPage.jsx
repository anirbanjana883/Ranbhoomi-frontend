import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { serverUrl } from '../../App'; 
import { FaArrowLeft, FaTrophy, FaMedal, FaCrown, FaLock, FaCircle } from 'react-icons/fa';
import API from '../../api/axios';

// ─── Loading Spinner (TUF Minimalist) ──────────────────────────────
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 space-y-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold animate-pulse">
            Calculating Standings...
        </p>
    </div>
);

// ─── PODIUM COMPONENT ──────────────────────────────────────────────
const RankingPodium = ({ topThree }) => {
    const PodiumStand = ({ rank, user, score, height, color, glow, bgGradient }) => {
        if (!user) return <div className="w-1/3"></div>;

        return (
            <div className={`flex flex-col items-center justify-end w-1/3 ${height} transition-transform duration-500 hover:-translate-y-2 z-10`}>
                <Link to={`/profile/${user.username}`} className="relative group mb-3 flex flex-col items-center">
                    {rank === 1 && <FaCrown className="absolute -top-7 text-amber-400 text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] z-20 animate-bounce" />}
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 ${color} ${glow} overflow-hidden bg-zinc-950 relative z-10 transition-transform group-hover:scale-105`}>
                        <img 
                            src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} 
                            alt={user.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className={`absolute -bottom-3 bg-zinc-950 border ${color} text-zinc-100 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full z-20 shadow-lg`}>
                        #{rank}
                    </div>
                </Link>
                <div className="text-center mb-2">
                    <h3 className="text-zinc-200 font-bold text-sm sm:text-base truncate max-w-[100px] sm:max-w-[140px]">
                        {user.name}
                    </h3>
                    <p className={`font-mono text-lg sm:text-xl font-black ${color.replace('border-', 'text-')}`}>
                        {score} <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">pts</span>
                    </p>
                </div>
                <div className={`w-full ${rank === 1 ? 'h-32' : rank === 2 ? 'h-20' : 'h-12'} ${bgGradient} border-t-2 ${color} rounded-t-xl opacity-90`}></div>
            </div>
        );
    };

    const first = topThree[0];
    const second = topThree[1];
    const third = topThree[2];

    return (
        <div className="flex justify-center items-end max-w-2xl mx-auto mb-10 pt-8 px-4 gap-2 sm:gap-4">
            <PodiumStand rank={2} user={second?.user} score={second?.totalScore} height="mt-8" color="border-zinc-300" glow="shadow-[0_0_20px_rgba(212,212,216,0.2)]" bgGradient="bg-gradient-to-t from-zinc-900/50 to-zinc-800/80" />
            <PodiumStand rank={1} user={first?.user} score={first?.totalScore} height="mt-0" color="border-amber-400" glow="shadow-[0_0_30px_rgba(251,191,36,0.3)]" bgGradient="bg-gradient-to-t from-amber-900/20 to-amber-500/20" />
            <PodiumStand rank={3} user={third?.user} score={third?.totalScore} height="mt-12" color="border-orange-500" glow="shadow-[0_0_20px_rgba(249,115,22,0.2)]" bgGradient="bg-gradient-to-t from-orange-900/20 to-orange-600/20" />
        </div>
    );
};

// ─── RANK ROW COMPONENT ────────────────────────────────────────────
const RankRow = ({ rankEntry, rankIndex }) => {
    const { user, totalScore, totalPenalty } = rankEntry;

    // 🛡️ SAFETY CHECK
    if (!user || typeof user !== 'object') {
        return (
            <tr className="border-b border-zinc-800/50 bg-red-500/5">
                <td className="px-6 py-4 text-center text-xs font-mono text-zinc-500">#{rankIndex + 1}</td>
                <td className="px-6 py-4 text-red-400 italic text-sm font-medium">Anonymous User</td>
                <td className="px-6 py-4 text-center font-mono text-zinc-300">{totalScore}</td>
                <td className="px-6 py-4 text-center font-mono text-zinc-500">-</td>
            </tr>
        );
    }

    const hours = Math.floor(totalPenalty / 60).toString().padStart(2, '0');
    const minutes = Math.floor(totalPenalty % 60).toString().padStart(2, '0');
    const seconds = Math.floor((totalPenalty * 60) % 60).toString().padStart(2, '0');
    const penaltyTime = `${hours}:${minutes}:${seconds}`;
    
    let rankDisplay = rankIndex === 0 ? <FaTrophy className="text-amber-400 inline drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" size={16} /> :
                      rankIndex === 1 ? <FaMedal className="text-zinc-300 inline" size={16} /> :
                      rankIndex === 2 ? <FaMedal className="text-orange-500 inline" size={16} /> :
                      <span className="text-zinc-500 font-bold">#{rankIndex + 1}</span>;

    return (
        <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors group">
            <td className="px-6 py-4 text-center text-sm font-mono">{rankDisplay}</td>
            <td className="px-6 py-4 align-middle">
                <Link to={user.username ? `/profile/${user.username}` : '#'} className="flex items-center gap-3 w-fit">
                    <img 
                        src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username || 'unknown'}`} 
                        alt={user.username || 'User'} 
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-700 group-hover:border-red-500 transition-colors bg-zinc-950 object-cover" 
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-zinc-200 group-hover:text-red-400 transition-colors text-sm">
                            {user.name || user.username || "Unknown User"}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono tracking-wide">
                            @{user.username || "unknown"}
                        </span>
                    </div>
                </Link>
            </td>
            <td className="px-6 py-4 text-center text-base font-black text-zinc-100 font-mono">{totalScore}</td>
            <td className="px-6 py-4 text-center text-xs font-mono text-zinc-500">{penaltyTime}</td>
        </tr>
    );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────
export default function ContestRankingPage() {
    const [rankingData, setRankingData] = useState(null);
    const [contest, setContest] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const { slug } = useParams();
    const navigate = useNavigate();

    // ─── Data Fetching ───
    const fetchRanking = async () => {
        try {
            // Parallelize fetching contest info and ranking for speed
            const [contestRes, rankingRes] = await Promise.all([
                API.get(`/contests/${slug}`),
                API.get(`/contests/${slug}/ranking`)
            ]);

            setContest(contestRes.data?.data || contestRes.data);
            setRankingData(rankingRes.data?.data || rankingRes.data);

            try {
                const userRes = await API.get(`/user/getcurrentuser`);
                setCurrentUser(userRes.data?.data || userRes.data);
            } catch (e) {
                // Not logged in
            }
        } catch (err) {
            console.error(err);
            if (!rankingData) toast.error("Could not load leaderboard.");
        } finally {
            setLoading(false);
        }
    };

    // ─── Polling Logic ───
    useEffect(() => {
        fetchRanking(); // Initial fetch
        
        let interval;
        // 🛡️ THE UNIFIED SWITCH:
        // Only poll if the contest is NOT finalized. If it's finalized, data is static.
        if (contest && !contest.isRankingsFinalized) {
            interval = setInterval(fetchRanking, 30000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [slug, contest?.isRankingsFinalized]);

    // ─── Security Check (The Gatekeeper) ───
    useEffect(() => {
        if (!loading && contest) {
            const visibility = contest.visibility ? contest.visibility.toUpperCase() : "PUBLIC";
            
            if (visibility === 'PRIVATE') {
                // Safe checks for user existence
                const hostId = contest.createdBy?._id || contest.createdBy;
                const isHost = currentUser && hostId === currentUser._id;
                const isRegistered = contest.isRegistered;

                if (!isHost && !isRegistered) {
                    toast.error("🔒 Private Contest! You must join to see the rankings.");
                    navigate(`/contest/${slug}`); 
                }
            }
        }
    }, [loading, contest, currentUser, navigate, slug]);

    if (loading && !rankingData) return <LoadingSpinner />;
    if (!rankingData || !contest) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-zinc-500 font-bold tracking-widest uppercase text-sm border border-zinc-800 bg-zinc-900 px-6 py-3 rounded-lg shadow-sm">
                Leaderboard unavailable
            </div>
        </div>
    );

    const { rankings } = rankingData;
    const isPrivate = (contest.visibility || "").toUpperCase() === "PRIVATE";
    const isLive = !contest.isRankingsFinalized;

    return (
        // 🛡️ Strict Full Screen Architecture
        <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30 overflow-hidden">
            
            {/* ── TOP NAV BAR ── */}
            <header className="shrink-0 h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                    <button 
                        onClick={() => navigate('/contests')} 
                        className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
                    >
                        <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="uppercase hidden sm:inline">Arenas</span>
                    </button>
                    <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
                    <div className="min-w-0 flex flex-col justify-center">
                        <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate max-w-[200px] sm:max-w-md">
                            {contest.title}
                        </h1>
                    </div>
                </div>

                {/* 🛡️ UNIFIED UI BADGE */}
                <div className="flex items-center gap-3 shrink-0">
                    {isPrivate && (
                        <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <FaLock size={9}/> Private
                        </span>
                    )}
                    {isLive ? (
                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <FaCircle className="animate-pulse" size={8}/> Live Standings
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                            <FaTrophy size={10}/> Final Results
                        </span>
                    )}
                </div>
            </header>

            {/* ── MAIN SCROLLABLE CONTENT ── */}
            <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    
                    {/* --- PODIUM --- */}
                    {rankings.length > 0 ? (
                        <RankingPodium topThree={rankings.slice(0, 3)} />
                    ) : (
                        <div className="py-20 text-center">
                            <p className="text-zinc-500 font-medium">Waiting for the first warrior to draw blood...</p>
                        </div>
                    )}

                    {/* --- TABLE CONTAINER --- */}
                    {rankings.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col relative">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[600px]">
                                    
                                    <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-4 text-center w-20">Rank</th>
                                            <th className="px-6 py-4">Participant</th>
                                            <th className="px-6 py-4 text-center w-32">Total Score</th>
                                            <th className="px-6 py-4 text-center w-32">Penalty Time</th>
                                        </tr>
                                    </thead>
                                    
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {rankings.map((entry, index) => (
                                            <RankRow key={entry.user?._id || index} rankEntry={entry} rankIndex={index} />
                                        ))}
                                    </tbody>
                                    
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}