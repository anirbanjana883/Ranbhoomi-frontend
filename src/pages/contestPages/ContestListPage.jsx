import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App'; // Adjust path if needed
import { FaArrowLeft, FaPlay, FaCalendarAlt, FaHistory } from 'react-icons/fa';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

// --- New "Professional Glow" Card Component ---
// This component encapsulates the new style.
const ContestCard = ({ contest, type }) => {
    const navigate = useNavigate();
    
    let borderColor = 'border-orange-700/40';
    let shadowColor = 'shadow-[0_0_15px_rgba(255,69,0,0.15)]';
    let hoverShadowColor = 'hover:shadow-[0_0_25px_rgba(255,69,0,0.3)]';
    let buttonStyle = 'bg-orange-600 hover:bg-orange-700 shadow-[0_0_15px_rgba(255,69,0,0.4)] hover:shadow-[0_0_20px_rgba(255,69,0,0.6)]';
    let buttonText = 'View Contest';

    if (type === 'live') {
        borderColor = 'border-green-500/60'; // Live is green
        shadowColor = 'shadow-[0_0_15px_rgba(0,255,0,0.2)]';
        hoverShadowColor = 'hover:shadow-[0_0_25px_rgba(0,255,0,0.4)]';
        buttonStyle = 'bg-green-600 hover:bg-green-700 shadow-[0_0_15px_rgba(0,255,0,0.4)] hover:shadow-[0_0_20px_rgba(0,255,0,0.6)]';
        buttonText = 'Enter Now';
    } else if (type === 'past') {
        borderColor = 'border-gray-700/50';
        shadowColor = 'shadow-[0_0_10px_rgba(150,150,150,0.1)]';
        hoverShadowColor = 'hover:shadow-[0_0_15px_rgba(150,150,150,0.2)]';
        buttonStyle = 'bg-gray-700 hover:bg-gray-600 shadow-none';
        buttonText = 'View Results';
    }

    return (
        <div
            className={`bg-black border ${borderColor} ${shadowColor} rounded-xl 
                        p-5 flex flex-col justify-between transition-all duration-300 
                        hover:border-orange-600/70 ${hoverShadowColor} hover:-translate-y-1 cursor-pointer`}
            onClick={() => navigate(`/contest/${contest.slug}`)} // Navigate to contest details page
        >
            <div>
                <h3 className="text-xl font-bold text-white mb-2 truncate [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                    {contest.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {contest.description}
                </p>
            </div>
            <div className="mt-4">
                <p className="text-xs text-gray-500">
                    Starts: {new Date(contest.startTime).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                    Ends: {new Date(contest.endTime).toLocaleString()}
                </p>
                <button 
                    className={`w-full mt-4 py-2 px-4 rounded-lg text-white text-sm font-bold 
                                ${buttonStyle} transition-all duration-300 transform hover:scale-105`}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

// --- Section Header Component ---
const SectionHeader = ({ icon, title, count }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="text-orange-500">{icon}</div>
        <h2 className="text-2xl font-bold text-white [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
            {title}
            <span className="ml-2 text-lg text-gray-500 font-normal">({count})</span>
        </h2>
        <div className="flex-grow h-px bg-gradient-to-r from-orange-800/50 to-transparent"></div>
    </div>
);


// --- Main Contest List Page ---
function ContestListPage() {
    const [contests, setContests] = useState({ upcoming: [], live: [], past: [] });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContests = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${serverUrl}/api/contests`, { withCredentials: true });
                setContests(data);
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to fetch contests.");
            } finally {
                setLoading(false);
            }
        };
        fetchContests();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <>
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md 
                           border border-orange-600/40 shadow-[0_0_20px_rgba(255,69,0,0.25)] 
                           text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 
                           text-xs sm:text-sm transition-all duration-300 transform 
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] 
                           hover:text-orange-400 hover:scale-105"
            >
                <FaArrowLeft />
                <span className="hidden sm:inline">Back</span>
            </button>

            <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
                <div className="max-w-screen-xl mx-auto">
                    <h1 className="text-4xl font-black text-white mb-8
                                   [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
                        Contest Arena
                    </h1>

                    {/* --- Live Contests --- */}
                    {contests.live.length > 0 && (
                        <section className="mb-12">
                            <SectionHeader icon={<FaPlay size={20} className="animate-pulse" />} title="Live Now" count={contests.live.length} />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {contests.live.map(contest => (
                                    <ContestCard key={contest._id} contest={contest} type="live" />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* --- Upcoming Contests --- */}
                    <section className="mb-12">
                        <SectionHeader icon={<FaCalendarAlt size={20} />} title="Upcoming" count={contests.upcoming.length} />
                        {contests.upcoming.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {contests.upcoming.map(contest => (
                                    <ContestCard key={contest._id} contest={contest} type="upcoming" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No upcoming contests scheduled. Check back soon!</p>
                        )}
                    </section>

                    {/* --- Past Contests --- */}
                    <section>
                        <SectionHeader icon={<FaHistory size={20} />} title="Past Contests" count={contests.past.length} />
                         {contests.past.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {contests.past.map(contest => (
                                    <ContestCard key={contest._id} contest={contest} type="past" />
                                ))}
                            </div>
                         ) : (
                            <p className="text-gray-500 italic">No past contests... yet.</p>
                         )}
                    </section>
                </div>
            </div>
        </>
    );
}

export default ContestListPage;