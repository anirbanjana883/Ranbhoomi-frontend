import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App'; // Adjust path if needed
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

// --- Difficulty Badge ---
const DifficultyBadge = ({ difficulty }) => {
    let colorClasses = '';
    if (difficulty === 'Easy') colorClasses = 'bg-green-700/20 text-green-300 border-green-600/60 shadow-[0_0_12px_rgba(0,255,0,0.4)]';
    else if (difficulty === 'Medium') colorClasses = 'bg-yellow-600/20 text-yellow-300 border-yellow-500/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]';
    else if (difficulty === 'Hard') colorClasses = 'bg-red-700/20 text-red-400 border-red-600/60 shadow-[0_0_12px_rgba(255,0,0,0.4)]';
    else if (difficulty === 'Super Hard') colorClasses = 'bg-purple-700/20 text-purple-300 border-purple-600/60 shadow-[0_0_12px_rgba(168,85,247,0.5)]';
    return (<span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}> {difficulty} </span>);
};

// --- Main Contest Details Page ---
function ContestDetailsPage() {
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const { slug } = useParams();
    const navigate = useNavigate();

    // Fetch contest details
    const fetchContest = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
            setContest(data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to fetch contest details.");
            navigate("/contests"); // Redirect back to list if contest not found
        } finally {
            setLoading(false);
        }
    }, [slug, navigate]);

    useEffect(() => {
        fetchContest();
    }, [fetchContest]);

    // Handle Registration
    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            const { data } = await axios.post(`${serverUrl}/api/contests/${slug}/register`, {}, { withCredentials: true });
            toast.success(data.message);
            // Re-fetch contest data to update the "isRegistered" status
            fetchContest();
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed.");
        } finally {
            setIsRegistering(false);
        }
    };

    // --- Render Logic ---
    if (loading || !contest) return <LoadingSpinner />;

    // Determine contest status
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    let contestStatus = "upcoming";
    if (startTime <= now && endTime > now) contestStatus = "live";
    else if (endTime <= now) contestStatus = "past";

    // --- Theme Styles ---
    const cardStyle = `bg-black border border-orange-700/40 rounded-xl 
                       shadow-[0_0_20px_rgba(255,69,0,0.2)] 
                       hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.3)] 
                       transition-all duration-300`;
    const problemRowStyle = `border-t border-orange-800/40 transition-colors duration-200 
                             hover:bg-orange-950/20`;

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
                <div className="max-w-4xl mx-auto">
                    {/* --- Contest Header --- */}
                    <div className={`${cardStyle} p-6 mb-8`}>
                        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3
                                       [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
                            {contest.title}
                        </h1>
                        {/* Status/Time Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-950/50 border border-gray-700/50 rounded-lg mb-4">
                            <div>
                                <p className="text-xs text-gray-400">Start Time:</p>
                                <p className="text-sm font-semibold text-white">{startTime.toLocaleString()}</p>
                            </div>
                            <div className="sm:text-right">
                                <p className="text-xs text-gray-400">End Time:</p>
                                <p className="text-sm font-semibold text-white">{endTime.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="text-gray-400 text-sm leading-relaxed mb-6">
                            {/* Assuming description is plain text for now. Wrap with markdown if you change it. */}
                            <p className="whitespace-pre-wrap">{contest.description}</p>
                        </div>
                        
                        {/* --- Registration Button Logic --- */}
                        {contestStatus === 'upcoming' && !contest.isRegistered && (
                            <button
                                onClick={handleRegister}
                                disabled={isRegistering}
                                className="w-full py-2.5 px-5 bg-orange-600 text-white font-bold rounded-lg
                                           shadow-[0_0_20px_rgba(255,69,0,0.5)] 
                                           transition-all duration-300 transform 
                                           hover:bg-orange-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.7)] hover:scale-105
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRegistering ? 'Registering...' : 'Register Now'}
                            </button>
                        )}
                        {contestStatus === 'upcoming' && contest.isRegistered && (
                            <button
                                disabled
                                className="w-full py-2.5 px-5 bg-green-700/30 text-green-300 border border-green-600/50 
                                           font-bold rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.3)]
                                           flex items-center justify-center gap-2"
                            >
                                <FaCheckCircle /> Registered
                            </button>
                        )}
                         {contestStatus === 'live' && (
                            <button
                                // Later, this will navigate to the contest interface
                                onClick={() => toast.info("Navigating to live contest... (Not implemented)")}
                                className="w-full py-2.5 px-5 bg-green-600 text-white font-bold rounded-lg
                                           shadow-[0_0_20px_rgba(0,255,0,0.5)] animate-pulse
                                           transition-all duration-300 transform hover:scale-105"
                            >
                                Enter Contest Now
                            </button>
                        )}
                        {contestStatus === 'past' && (
                             <button
                                // Later, this will navigate to rankings
                                onClick={() => toast.info("Navigating to rankings... (Not implemented)")}
                                className="w-full py-2.5 px-5 bg-gray-700 text-gray-300 font-bold rounded-lg
                                           transition-all duration-300 transform hover:bg-gray-600"
                            >
                                View Rankings
                            </button>
                        )}
                    </div>
                    
                    {/* --- Problem List --- */}
                    <div className={cardStyle}>
                        <h2 className="text-2xl font-bold text-white p-5 pb-3 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                            Contest Problems
                        </h2>
                        {contest.problems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead className="border-b-2 border-orange-700/60 bg-black/30">
                                        <tr>
                                            <th className="p-4 text-xs font-semibold text-orange-400 uppercase tracking-wider [text-shadow:0_0_10px_rgba(255,69,0,0.6)] w-3/5">Title</th>
                                            <th className="p-4 text-xs font-semibold text-orange-400 uppercase tracking-wider [text-shadow:0_0_10px_rgba(255,69,0,0.6)]">Difficulty</th>
                                            <th className="p-4 text-xs font-semibold text-orange-400 uppercase tracking-wider [text-shadow:0_0_10px_rgba(255,69,0,0.6)]">Tags</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contest.problems.map(({ problem }) => (
                                            <tr key={problem._id} className={problemRowStyle}>
                                                <td className="p-4 text-sm align-middle text-white font-semibold">
                                                    {/* Link is disabled until contest starts */}
                                                    {contestStatus === 'live' ? (
                                                        <Link to={`/problem/${problem.slug}`} className="hover:text-orange-300 hover:underline">
                                                            {problem.title}
                                                            {problem.isPremium && <span title="Premium" className="ml-2 text-yellow-500 text-xs">🔒</span>}
                                                        </Link>
                                                    ) : (
                                                        <span>
                                                            {problem.title}
                                                            {problem.isPremium && <span title="Premium" className="ml-2 text-yellow-500 text-xs">🔒</span>}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <DifficultyBadge difficulty={problem.difficulty} />
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {problem.tags?.slice(0, 2).map((tag) => (
                                                            <span key={tag} className="px-1.5 py-0.5 bg-gray-800/70 border border-gray-700/50 text-gray-300 rounded text-[11px] whitespace-nowrap">{tag}</span>
                                                        ))}
                                                        {(problem.tags?.length || 0) > 2 && <span className="text-gray-500 text-xs">...</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                             <p className="p-6 text-center text-gray-500 italic">Problems for this contest have not been finalized.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default ContestDetailsPage;