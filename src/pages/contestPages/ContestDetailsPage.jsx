import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App'; 
import { FaArrowLeft, FaCheckCircle, FaUserSecret, FaCopy, FaEdit, FaLock, FaTimes } from 'react-icons/fa';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
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

// --- JOIN PRIVATE CONTEST MODAL ---
const JoinPrivateModal = ({ isOpen, onClose, onJoin }) => {
    const [code, setCode] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-orange-600/50 rounded-xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(255,69,0,0.3)] animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaLock className="text-orange-500" /> Private Contest
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                
                <p className="text-gray-400 text-sm mb-4">
                    This arena is locked. Please enter the invite code provided by the host to enter.
                </p>

                <input 
                    type="text" 
                    placeholder="ENTER-CODE-HERE" 
                    className="w-full bg-black border border-gray-700 rounded p-3 text-white font-mono text-center tracking-widest focus:border-orange-500 outline-none mb-6 uppercase"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                />

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-800 font-bold transition">
                        Cancel
                    </button>
                    <button 
                        onClick={() => onJoin(code)} 
                        disabled={!code.trim()}
                        className="flex-1 py-2 rounded bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-[0_0_15px_rgba(255,69,0,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Unlock & Join
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Contest Details Page ---
function ContestDetailsPage() {
    const [contest, setContest] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const { slug } = useParams();
    const navigate = useNavigate();

    // Fetch Data
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const contestRes = await axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
            setContest(contestRes.data);

            try {
                const userRes = await axios.get(`${serverUrl}/api/user/getcurrentuser`, { withCredentials: true });
                setCurrentUser(userRes.data);
            } catch (userErr) {
                console.log("User fetch failed");
            }

        } catch (err) {
            toast.error("Failed to fetch details.");
            navigate("/contests"); 
        } finally {
            setLoading(false);
        }
    }, [slug, navigate]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- HANDLE REGISTER CLICK ---
    const onRegisterClick = () => {
        const isPrivate = contest.visibility === 'PRIVATE' || contest.visibility === 'Private';
        if (isPrivate) {
            setShowJoinModal(true);
        } else {
            handleRegistrationRequest({});
        }
    };

    // --- API CALL ---
    const handleRegistrationRequest = async (payload) => {
        setIsRegistering(true);
        try {
            const { data } = await axios.post(
                `${serverUrl}/api/contests/${slug}/register`, 
                payload, 
                { withCredentials: true }
            );
            toast.success(data.message);
            setShowJoinModal(false); 
            fetchAllData();          
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed.");
        } finally {
            setIsRegistering(false);
        }
    };

    if (loading || !contest) return <LoadingSpinner />;

    // --- LOGIC ---
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    let contestStatus = "upcoming";
    if (startTime <= now && endTime > now) contestStatus = "live";
    else if (endTime <= now) contestStatus = "past";

    const hostId = contest.createdBy?._id 
        ? contest.createdBy._id.toString() 
        : (contest.createdBy ? contest.createdBy.toString() : null);
    const userId = currentUser?._id ? currentUser._id.toString() : null;
    const isHost = userId && hostId && hostId === userId;
    
    // Check privacy
    const isPrivateContest = contest.visibility === 'PRIVATE' || contest.visibility === 'Private';

    // Styles
    const cardStyle = `bg-black border border-orange-700/40 rounded-xl shadow-[0_0_20px_rgba(255,69,0,0.2)] transition-all duration-300`;
    const problemRowStyle = `border-t border-orange-800/40 transition-colors duration-200 hover:bg-orange-950/20`;

    return (
        <>
            <JoinPrivateModal 
                isOpen={showJoinModal} 
                onClose={() => setShowJoinModal(false)} 
                onJoin={(code) => handleRegistrationRequest({ inviteCode: code })} 
            />

            <button onClick={() => navigate('/contests')} className="fixed top-24 left-4 z-40 bg-black/80 text-orange-500 px-4 py-2 rounded-full border border-orange-600/40 flex items-center gap-2">
                <FaArrowLeft /> Back
            </button>

            <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 pb-20 godfather-bg">
                <div className="max-w-4xl mx-auto">
                    
                    <div className={`${cardStyle} p-6 mb-8`}>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-black text-white mb-3">{contest.title}</h1>
                            {isPrivateContest && (
                                <span className="px-3 py-1 rounded bg-red-900/40 text-red-400 border border-red-600/40 text-xs font-bold flex items-center gap-1">
                                    <FaLock size={10} /> PRIVATE
                                </span>
                            )}
                        </div>

                        {/* --- HOST PANEL (ONLY FOR PRIVATE CONTESTS) --- */}
                        {isHost && isPrivateContest && (
                            <div className="mb-6 bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
                                <h3 className="text-orange-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase">
                                    <FaUserSecret /> Host Controls
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded border border-orange-800/50 w-full md:w-auto">
                                        <span className="text-gray-500 text-xs font-bold">CODE:</span>
                                        <span className="text-xl font-mono text-white tracking-widest">{contest.inviteCode}</span>
                                        <button onClick={() => {navigator.clipboard.writeText(contest.inviteCode); toast.success("Copied!");}} className="ml-auto text-orange-500"><FaCopy /></button>
                                    </div>
                                    {contestStatus === 'upcoming' ? (
                                        <button onClick={() => navigate(`/contest/edit-private/${contest.slug}`)} className="flex items-center gap-2 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white font-bold rounded shadow-lg w-full md:w-auto justify-center">
                                            <FaEdit /> Edit Settings
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-500 border border-gray-800 px-3 py-2 rounded">⚠️ Updates Locked</span>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* ----------------------------------------------- */}

                        <div className="flex justify-between gap-2 p-3 bg-gray-950/50 border border-gray-700/50 rounded-lg mb-4 mt-4 text-sm">
                            <div><span className="text-gray-400">Start:</span> <span className="text-white">{startTime.toLocaleString()}</span></div>
                            <div><span className="text-gray-400">End:</span> <span className="text-white">{endTime.toLocaleString()}</span></div>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 whitespace-pre-wrap">{contest.description}</p>

                        {/* --- REGISTER BUTTON --- */}
                        {contestStatus === 'upcoming' && !contest.isRegistered && (
                            <button 
                                onClick={onRegisterClick} 
                                disabled={isRegistering} 
                                className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-[0_0_20px_rgba(255,69,0,0.5)] transition"
                            >
                                {isRegistering ? 'Processing...' : (isPrivateContest ? 'Join Private Contest' : 'Register Now')}
                            </button>
                        )}
                        {contestStatus === 'upcoming' && contest.isRegistered && (
                            <button disabled className="w-full py-3 bg-green-900/30 text-green-400 border border-green-600/50 font-bold rounded-lg flex justify-center gap-2">
                                <FaCheckCircle className="mt-1"/> Registered
                            </button>
                        )}
                        {contestStatus === 'live' && (
                             <button onClick={() => navigate(`/contest/${contest.slug}/problem/${contest.problems[0]?.problem?.slug}`)} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg animate-pulse">
                                Enter Contest Now
                            </button>
                        )}
                         {contestStatus === 'past' && (
                             <button onClick={() => navigate(`/contest/${contest.slug}/ranking`)} className="w-full py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600">
                                View Ranking
                            </button>
                        )}
                    </div>

                    {/* Problems List */}
                    <div className={cardStyle}>
                        <h2 className="text-2xl font-bold text-white p-5 pb-3">Contest Problems</h2>
                        {contest.problems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead className="border-b-2 border-orange-700/60 bg-black/30">
                                        <tr>
                                            <th className="p-4 text-xs font-semibold text-orange-400">Title</th>
                                            <th className="p-4 text-xs font-semibold text-orange-400">Difficulty</th>
                                            <th className="p-4 text-xs font-semibold text-orange-400">Tags</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contest.problems.map(({ problem }) => (
                                            <tr key={problem._id} className={problemRowStyle}>
                                                <td className="p-4 text-sm text-white font-semibold">
                                                    {contestStatus === 'live' ? <Link to={`/problem/${problem.slug}`} className="hover:text-orange-300 underline">{problem.title}</Link> : problem.title}
                                                </td>
                                                <td className="p-4"><DifficultyBadge difficulty={problem.difficulty} /></td>
                                                <td className="p-4 text-xs text-gray-400">{problem.tags?.slice(0, 2).join(", ")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="p-6 text-center text-gray-500">No problems yet.</p>}
                    </div>
                </div>
            </div>
        </>
    );
}

export default ContestDetailsPage;