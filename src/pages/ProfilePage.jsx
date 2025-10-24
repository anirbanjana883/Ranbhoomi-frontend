import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
// We need the FaArrowLeft icon
import { FaGithub, FaLinkedin, FaArrowLeft } from 'react-icons/fa';
import { useSelector } from 'react-redux'; // Get logged-in user
import { toast } from 'react-toastify';
import { serverUrl } from '../App';

// A simple loading spinner component (re-styled for theme)
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        {/* Slightly smaller spinner */}
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

function ProfilePage() {
    const [user, setUser] = useState(null); // The profile being viewed
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRequesting, setIsRequesting] = useState(false); // For admin button

    const { username } = useParams(); // Username from URL
    const navigate = useNavigate();

    // Get the currently logged-in user from Redux
    const { userData: loggedInUser } = useSelector((state) => state.user);

    // Check if the logged-in user is viewing their own profile
    const isOwnProfile = loggedInUser && loggedInUser.username === username;

    // Fetch profile data
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${serverUrl}/api/user/profile/${username}`, { withCredentials: true });
                setUser(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError(err.response?.data?.message || "User not found");
            } finally { setLoading(false); }
        };
        if (username) { fetchUserProfile(); }
    }, [username]);

    const handleBack = () => { navigate(-1); };

    // Handle Admin Request
    const handleRequestAdmin = async () => {
        const reason = "I would like to help contribute to Ranbhoomi.";
        setIsRequesting(true);
        try {
            const { data } = await axios.post(`${serverUrl}/api/admin/request`, { reason }, { withCredentials: true });
            toast.success(data.message);
            setUser(prevUser => ({ ...prevUser, adminRequestStatus: 'pending' }));
        } catch (err) { toast.error(err.response?.data?.message || "Could not send request."); }
        finally { setIsRequesting(false); }
    };

    // --- Render States ---
    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="bg-black flex flex-col items-center justify-center min-h-screen text-center p-4">
                {/* Reduced text size */}
                <h1 className="text-4xl font-bold text-red-500 animate-pulse [text-shadow:0_0_15px_rgba(255,0,0,0.6)]">404 - Not Found</h1>
                <p className="text-xl text-gray-400 mt-4">{error}</p>
                <Link
                    to="/"
                    className="mt-8 px-6 py-2.5 bg-orange-600 text-white text-base font-bold rounded-lg
                               shadow-[0_0_15px_rgba(255,69,0,0.5)] hover:shadow-[0_0_25px_rgba(255,69,0,0.7)]
                               hover:bg-orange-700 transition-all transform hover:scale-105"
                >
                    Return to Battlefield
                </Link>
            </div>
        );
    }

    if (!user) return null;

    // --- Successful Render ---
    return (
        <>
            {/* --- Floating Back Button --- */}
            <button
                onClick={handleBack}
                // Adjusted top position slightly
                className="fixed top-24 left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md
                           border border-orange-600/30 shadow-[0_0_20px_rgba(255,69,0,0.2)]
                           text-orange-500 font-bold rounded-full py-2 px-4 text-sm
                           transition-all duration-300 transform
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)]
                           hover:text-orange-400 hover:scale-105"
            >
                <FaArrowLeft />
                Back
            </button>

            {/* --- Main Content --- */}
            <div className="min-h-screen text-gray-300 pt-28 px-4 bg-black pb-20"> {/* Added pb-20 */}

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Reduced gap */}

                    {/* ### LEFT COLUMN ### */}
                    <div className="lg:col-span-1 space-y-6"> {/* Reduced space-y */}

                        {/* --- Profile Card --- */}
                        <div className="bg-black border border-orange-600/30
                                        shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                        transition-all duration-300 transform
                                        hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:-translate-y-1
                                        rounded-xl p-6 text-center"> {/* Changed padding and rounded */}
                            <img
                                src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`}
                                alt={user.name}
                                className="w-32 h-32 rounded-full border-4 border-orange-500 object-cover mx-auto
                                           shadow-[0_0_25px_rgba(255,69,0,0.4)]" // Slightly reduced glow
                            />
                            {/* Reduced text sizes */}
                            <h1 className="text-3xl font-bold text-white mt-4 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                {user.name}
                            </h1>
                            <p className="text-xl text-orange-400 [text-shadow:0_0_12px_rgba(255,69,0,0.5)]">
                                @{user.username}
                            </p>

                            {/* --- Edit Profile Button --- */}
                            {isOwnProfile && (
                                <button
                                    onClick={() => navigate('/editprofile')}
                                    className="mt-5 w-full bg-transparent border border-orange-600/50 text-orange-500
                                               font-semibold rounded-lg py-2 px-4 text-sm
                                               shadow-[0_0_10px_rgba(255,69,0,0.2)]
                                               transition-all duration-300 transform
                                               hover:bg-orange-600/10 hover:border-orange-600/80
                                               hover:text-orange-400 hover:shadow-[0_0_20px_rgba(255,69,0,0.3)] hover:scale-105"
                                >
                                    Edit Profile
                                </button>
                            )}

                            {/* --- Social Links --- */}
                            <div className="flex justify-center gap-5 mt-5"> {/* Reduced gap */}
                                {user.github && (
                                    <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transform hover:scale-110 transition-all duration-200">
                                        <FaGithub size={24} /> {/* Reduced size */}
                                    </a>
                                )}
                                {user.linkedin && (
                                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transform hover:scale-110 transition-all duration-200">
                                        <FaLinkedin size={24} /> {/* Reduced size */}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* --- Stats Card --- */}
                        <div className="bg-black border border-orange-600/30
                                        shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                        transition-all duration-300 transform
                                        hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:-translate-y-1
                                        rounded-xl p-6"> {/* Changed padding and rounded */}
                            <h2 className="text-2xl font-bold text-white mb-4 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                Battle Stats
                            </h2>
                            <div className="space-y-4"> {/* Reduced space */}
                                <div className="text-center">
                                    {/* Reduced text sizes */}
                                    <p className="text-4xl font-bold text-orange-500 [text-shadow:0_0_12px_rgba(255,69,0,0.5)]">0</p>
                                    <p className="text-gray-400 text-base">Problems Solved</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-orange-500 [text-shadow:0_0_12px_rgba(255,69,0,0.5)]">0</p>
                                    <p className="text-gray-400 text-base">Contests Joined</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-orange-500 [text-shadow:0_0_12px_rgba(255,69,0,0.5)]">N/A</p>
                                    <p className="text-gray-400 text-base">Current Rating</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ### RIGHT COLUMN ### */}
                    <div className="lg:col-span-2 space-y-6"> {/* Reduced space-y */}

                        {/* --- About Me Card --- */}
                        <div className="bg-black border border-orange-600/30
                                        shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                        transition-all duration-300 transform
                                        hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:-translate-y-1
                                        rounded-xl p-6"> {/* Changed padding and rounded */}
                            <h2 className="text-2xl font-bold text-white mb-3 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                About Me
                            </h2>
                            {/* Reduced text size */}
                            <p className="text-gray-300 leading-relaxed text-base">
                                {user.description || "No description provided."}
                            </p>
                        </div>

                        {/* --- Submission Activity (Heatmap Placeholder) --- */}
                        <div className="bg-black border border-orange-600/30
                                        shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                        transition-all duration-300 transform
                                        hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:-translate-y-1
                                        rounded-xl p-6"> {/* Changed padding and rounded */}
                            <h2 className="text-2xl font-bold text-white mb-3 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                Submission Activity
                            </h2>
                            <div className="h-32 flex items-center justify-center bg-black/30 rounded-lg border border-gray-700/50"> {/* Reduced height */}
                                <p className="text-gray-500">Submission Heatmap (Coming Soon)</p>
                            </div>
                        </div>

                        {/* --- Account Status Card --- */}
                        {isOwnProfile && (
                            <div className="bg-black border border-orange-600/30
                                            shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                            transition-all duration-300 transform
                                            hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:-translate-y-1
                                            rounded-xl p-6"> {/* Changed padding and rounded */}
                                <h2 className="text-2xl font-bold text-white mb-5 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                    Account Status
                                </h2>

                                {loggedInUser.role === 'admin' && (
                                    <div className="text-center">
                                        <span className="px-4 py-2 bg-green-500/20 text-green-300 text-base font-bold rounded-full
                                                         shadow-[0_0_15px_rgba(0,255,0,0.3)]"> {/* Reduced glow */}
                                            Account Status: Admin
                                        </span>
                                    </div>
                                )}
                                {loggedInUser.role === 'master' && (
                                    <div className="text-center space-y-4"> {/* Reduced space */}
                                        <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 text-base font-bold rounded-full
                                                         shadow-[0_0_15px_rgba(255,215,0,0.4)]"> {/* Reduced glow */}
                                            Account Status: Master
                                        </span>
                                        <button
                                            onClick={() => navigate('/admin/dashboard')}
                                            className="w-full bg-orange-600 text-white font-bold rounded-lg py-2 px-4 text-sm
                                                       shadow-[0_0_15px_rgba(255,69,0,0.4)]
                                                       transition-all duration-300 transform
                                                       hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-105"
                                        >
                                            Go to Master Dashboard
                                        </button>
                                    </div>
                                )}

                                {loggedInUser.role === 'user' && (
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4"> {/* Reduced gap */}
                                        <p className="text-gray-300 text-base flex-1">
                                            Want to help manage Ranbhoomi? Request admin access to help add problems and create contests.
                                        </p>
                                        <button
                                            onClick={handleRequestAdmin}
                                            disabled={isRequesting || user.adminRequestStatus === 'pending'}
                                            className="flex-shrink-0 bg-orange-600 text-white font-bold rounded-lg py-2 px-4 text-sm
                                                       shadow-[0_0_15px_rgba(255,69,0,0.4)]
                                                       transition-all duration-300 transform
                                                       hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-105
                                                       disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none
                                                       disabled:cursor-not-allowed disabled:scale-100"
                                        >
                                            {isRequesting
                                                ? "Sending..."
                                                : user.adminRequestStatus === 'pending'
                                                    ? "Request Pending"
                                                    : "Request Admin Access"
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </>
    );
}

export default ProfilePage;