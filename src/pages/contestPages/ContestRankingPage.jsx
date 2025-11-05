import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App'; 
import { FaArrowLeft, FaTrophy } from 'react-icons/fa';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

// --- Ranking Row Component ---
const RankRow = ({ rankEntry, rankIndex }) => {
    const { user, totalScore, totalPenalty } = rankEntry;

    // Format penalty (e.g., 90.5 minutes -> 01:30:30)
    const hours = Math.floor(totalPenalty / 60).toString().padStart(2, '0');
    const minutes = Math.floor(totalPenalty % 60).toString().padStart(2, '0');
    const seconds = Math.floor((totalPenalty * 60) % 60).toString().padStart(2, '0');
    const penaltyTime = `${hours}:${minutes}:${seconds}`;
    
    // Rank styling
    let rankColor = "text-gray-400";
    if (rankIndex === 0) rankColor = "text-yellow-400 [text-shadow:0_0_10px_rgba(255,215,0,0.7)]"; 
    if (rankIndex === 1) rankColor = "text-gray-300 [text-shadow:0_0_10px_rgba(192,192,192,0.6)]"; 
    if (rankIndex === 2) rankColor = "text-yellow-600 [text-shadow:0_0_10px_rgba(205,127,50,0.6)]"; 

    return (
        <tr className="border-t border-orange-800/50 transition-colors duration-200 hover:bg-orange-950/20">
            <td className={`p-4 text-center text-lg font-bold ${rankColor}`}>
                {rankIndex === 0 ? <FaTrophy className="inline-block" /> : rankIndex + 1}
            </td>
            <td className="p-4 text-sm align-middle">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 group">
                    <img 
                        src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} 
                        alt={user.username} 
                        className="w-10 h-10 rounded-full border-2 border-orange-700/50 group-hover:border-orange-500 transition-all" 
                    />
                    <span className="font-semibold text-white group-hover:text-orange-300 transition-colors">{user.name}</span>
                </Link>
            </td>
            <td className="p-4 text-center text-lg font-bold text-green-400 [text-shadow:0_0_8px_rgba(0,255,0,0.4)]">
                {totalScore}
            </td>
            <td className="p-4 text-center text-sm font-mono text-gray-400">
                {penaltyTime}
            </td>
        </tr>
    );
};


// --- Main Contest Ranking Page ---
function ContestRankingPage() {
    const [rankingData, setRankingData] = useState(null);
    const [contest, setContest] = useState(null); // To store contest title
    const [loading, setLoading] = useState(true);
    const { slug } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                // Fetch the calculated ranking data
                const { data } = await axios.get(`${serverUrl}/api/contests/${slug}/ranking`, { withCredentials: true });
                setRankingData(data);
                
                // Also fetch contest details for the title
                const contestRes = await axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
                setContest(contestRes.data);

            } catch (err) {
                // If ranking isn't calculated, admin might need to trigger it
                if (err.response?.status === 404) {
                     toast.error("Rankings for this contest have not been calculated yet.");
                } else {
                    toast.error(err.response?.data?.message || "Failed to fetch rankings.");
                }
                navigate("/contests");
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, [slug, navigate]);

    if (loading || !rankingData || !contest) return <LoadingSpinner />;

    // --- Refined Theme Styles ---
    const cardStyle = `bg-black border border-orange-700/60 rounded-xl shadow-[0_0_30px_rgba(255,69,0,0.2)] 
                       transition-all duration-300 
                       hover:shadow-[0_0_45px_rgba(255,69,0,0.3)] hover:border-orange-600/80`;
    const headerStyle = `p-4 text-xs font-semibold text-orange-400 uppercase tracking-wider [text-shadow:0_0_10px_rgba(255,69,0,0.6)]`;

    return (
        <>
            {/* Back Button */}
            <button
                onClick={() => navigate('/contests')}
                className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md 
                           border border-orange-600/40 shadow-[0_0_20px_rgba(255,69,0,0.25)] 
                           text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 
                           text-xs sm:text-sm transition-all duration-300 transform 
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] 
                           hover:text-orange-400 hover:scale-105"
            >
                <FaArrowLeft />
                <span className="hidden sm:inline">All Contests</span>
            </button>

            <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
                <div className="max-w-screen-lg mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2
                                   [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
                        Leaderboard
                    </h1>
                    <h2 className="text-xl text-orange-400 font-semibold mb-8 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]">
                        {contest.title}
                    </h2>

                    <div className={`${cardStyle} overflow-hidden`}>
                        <div className="overflow-x-auto relative">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="border-b-2 border-orange-700/60 bg-gradient-to-b from-black via-gray-950/80 to-black">
                                    <tr>
                                        <th className={headerStyle + " text-center"}>Rank</th>
                                        <th className={headerStyle + " w-2/5"}>User</th>
                                        <th className={headerStyle + " text-center"}>Score</th>
                                        <th className={headerStyle + " text-center"}>Penalty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankingData.rankings.length === 0 ? (
                                        <tr><td colSpan="4" className="p-10 text-center text-gray-500 text-xl italic font-semibold">No participants ranked.</td></tr>
                                    ) : (
                                        rankingData.rankings.map((entry, index) => (
                                            <RankRow key={entry.user._id} rankEntry={entry} rankIndex={index} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ContestRankingPage;