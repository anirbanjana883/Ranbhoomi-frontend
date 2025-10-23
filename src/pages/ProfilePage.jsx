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
    <div className="w-24 h-24 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_30px_rgba(255,69,0,0.7)]"></div>
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

  // 2. Fetch profile data when component loads
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Using the API path from your previous file
        const { data } = await axios.get(`${serverUrl}/api/user/profile/${username}`, {
          withCredentials: true,
        });
        setUser(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "User not found");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]); // Re-run if the username in the URL changes

  const handleBack = () => {
    navigate(-1); // This navigates to the previous page in history
  };

  // --- Handle Admin Request ---
  const handleRequestAdmin = async () => {
    const reason = "I would like to help contribute to Ranbhoomi."; // We can make this a modal later
    setIsRequesting(true);
    try {
      // Using the API path from your previous file
      const { data } = await axios.post(
        `${serverUrl}/api/admin/request`,
        { reason },
        { withCredentials: true }
      );
      toast.success(data.message);
      setUser(prevUser => ({ ...prevUser, adminRequestStatus: 'pending' }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send request.");
    } finally {
      setIsRequesting(false);
    }
  };


  // --- Render States ---
  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-black flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h1 className="text-5xl font-bold text-red-500 animate-pulse [text-shadow:0_0_20px_rgba(255,0,0,0.7)]">404 - Not Found</h1>
        <p className="text-2xl text-gray-400 mt-4">{error}</p>
        <Link 
          to="/" 
          className="mt-8 px-6 py-3 bg-orange-600 text-white text-lg font-bold rounded-lg 
                     shadow-[0_0_20px_rgba(255,69,0,0.6)] hover:shadow-[0_0_30px_rgba(255,69,0,0.8)]
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
      {/* Placed outside the main div so padding doesn't affect it */}
      <button 
        onClick={handleBack} 
        className="fixed top-7 left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-lg 
                   border border-orange-600/30 shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                   text-orange-500 font-bold rounded-full py-2 px-4 
                   transition-all duration-300 transform 
                   hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] 
                   hover:text-orange-400 hover:scale-105"
      >
        <FaArrowLeft />
        Back
      </button>

      {/* --- Main Content --- */}
      {/* --- CHANGED --- Set main background to pure black */}
      <div className="min-h-screen text-gray-300 pt-28 px-4 bg-black">
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ################## */}
          {/* ### LEFT COLUMN ### */}
          {/* ################## */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* --- Profile Card --- */}
            {/* --- CHANGED --- Set bg-black, removed blur and slate */}
            <div className="bg-black border border-orange-600/30 
                            shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                            transition-all duration-300 transform 
                            hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] hover:-translate-y-1.5 
                            rounded-2xl p-6 text-center">
              <img
                src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`}
                alt={user.name}
                className="w-40 h-40 rounded-full border-4 border-orange-500 object-cover mx-auto
                           shadow-[0_0_30px_rgba(255,69,0,0.5)]"
              />
              <h1 className="text-4xl font-black text-white mt-5 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                {user.name}
              </h1>
              <p className="text-2xl text-orange-400 [text-shadow:0_0_15px_rgba(255,69,0,0.6)]">
                @{user.username}
              </p>
              
              {/* --- Edit Profile Button --- */}
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/editprofile')}
                  className="mt-6 w-full bg-transparent border border-orange-600/50 text-orange-500 
                             font-bold rounded-lg py-2.5 px-5 
                             shadow-[0_0_15px_rgba(255,69,0,0.2)] 
                             transition-all duration-300 transform 
                             hover:bg-orange-600/10 hover:border-orange-600/80 
                             hover:text-orange-400 hover:shadow-[0_0_25px_rgba(255,69,0,0.4)] hover:scale-105"
                >
                  Edit Profile
                </button>
              )}

              {/* --- Social Links --- */}
              <div className="flex justify-center gap-6 mt-6">
                {user.github && (
                  <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transform hover:scale-125 transition-all duration-200">
                    <FaGithub size={30} />
                  </a>
                )}
                {user.linkedin && (
                  <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transform hover:scale-125 transition-all duration-200">
                    <FaLinkedin size={30} />
                  </a>
                )}
              </div>
            </div>
            
            {/* --- Stats Card --- */}
            {/* --- CHANGED --- Set bg-black, removed blur and slate */}
            <div className="bg-black border border-orange-600/30 
                            shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                            transition-all duration-300 transform 
                            hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] hover:-translate-y-1.5 
                            rounded-2xl p-6">
              <h2 className="text-3xl font-bold text-white mb-6 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                Battle Stats
              </h2>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-orange-500 [text-shadow:0_0_15px_rgba(255,69,0,0.6)]">0</p>
                  <p className="text-gray-400 text-lg">Problems Solved</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-bold text-orange-500 [text-shadow:0_0_15px_rgba(255,69,0,0.6)]">0</p>
                  <p className="text-gray-400 text-lg">Contests Joined</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-bold text-orange-500 [text-shadow:0_0_15px_rgba(255,69,0,0.6)]">N/A</p>
                  <p className="text-gray-400 text-lg">Current Rating</p>
                </div>
              </div>
            </div>

          </div>

          {/* ################### */}
          {/* ### RIGHT COLUMN ### */}
          {/* ################### */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* --- About Me Card --- */}
            {/* --- CHANGED --- Set bg-black, removed blur and slate */}
            <div className="bg-black border border-orange-600/30 
                            shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                            transition-all duration-300 transform 
                            hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] hover:-translate-y-1.5 
                            rounded-2xl p-6 md:p-8">
              <h2 className="text-3xl font-bold text-white mb-4 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                About Me
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                {user.description || "No description provided."}
              </p>
            </div>

            {/* --- Submission Activity (Heatmap Placeholder) --- */}
            {/* --- CHANGED --- Set bg-black, removed blur and slate */}
            <div className="bg-black border border-orange-600/30 
                            shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                            transition-all duration-300 transform 
                            hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] hover:-translate-y-1.5 
                            rounded-2xl p-6 md:p-8">
              <h2 className="text-3xl font-bold text-white mb-4 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                Submission Activity
              </h2>
              <div className="h-40 flex items-center justify-center bg-black/30 rounded-lg border border-gray-700/50">
                <p className="text-gray-500">Submission Heatmap (Coming Soon)</p>
              </div>
            </div>

            {/* --- Account Status Card --- */}
            {isOwnProfile && (
              /* --- CHANGED --- Set bg-black, removed blur and slate */
              <div className="bg-black border border-orange-600/30 
                              shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                              transition-all duration-300 transform 
                              hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] hover:-translate-y-1.5 
                              rounded-2xl p-6 md:p-8">
                <h2 className="text-3xl font-bold text-white mb-6 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
                  Account Status
                </h2>
                
                {loggedInUser.role === 'admin' && (
                  <div className="text-center">
                    <span className="px-6 py-3 bg-green-500/20 text-green-300 text-lg font-bold rounded-full
                                     shadow-[0_0_20px_rgba(0,255,0,0.4)]">
                      Account Status: Admin
                    </span>
                  </div>
                )}
                {loggedInUser.role === 'master' && (
                  <div className="text-center space-y-6">
                    <span className="px-6 py-3 bg-yellow-500/20 text-yellow-300 text-lg font-bold rounded-full
                                     shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                      Account Status: Master
                    </span>
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="w-full bg-orange-600 text-white font-bold rounded-lg py-2.5 px-5 
                                 shadow-[0_0_20px_rgba(255,69,0,0.5)] 
                                 transition-all duration-300 transform 
                                 hover:bg-orange-700 hover:shadow-[0_0_35px_rgba(255,69,0,0.8)] hover:scale-105"
                    >
                      Go to Master Dashboard
                    </button>
                  </div>
                )}

                {loggedInUser.role === 'user' && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-gray-300 text-lg flex-1">
                      Want to help manage Ranbhoomi? Request admin access to help add problems and create contests.
                    </p>
                    <button
                      onClick={handleRequestAdmin}
                      disabled={isRequesting || user.adminRequestStatus === 'pending'}
                      className="flex-shrink-0 bg-orange-600 text-white font-bold rounded-lg py-2.5 px-5 
                                 shadow-[0_0_20px_rgba(255,69,0,0.5)] 
                                 transition-all duration-300 transform 
                                 hover:bg-orange-700 hover:shadow-[0_0_35px_rgba(255,69,0,0.8)] hover:scale-105
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