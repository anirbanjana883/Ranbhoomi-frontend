import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaGithub,
  FaLinkedin,
  FaArrowLeft,
  FaEdit,
  FaCog,
} from "react-icons/fa"; 
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { serverUrl } from "../App";

// --- Loading Spinner --- (Refined Glow)
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div
      className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"
    ></div>
  </div>
);

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const { username } = useParams();
  const navigate = useNavigate();
  const { userData: loggedInUser } = useSelector((state) => state.user);
  const isOwnProfile = loggedInUser && loggedInUser.username === username;

  // --- Fetch profile data ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${serverUrl}/api/user/profile/${username}`,
          { withCredentials: true }
        );
        setUser(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "User not found");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [username]);

  const handleBack = () => {
    navigate(-1);
  };

  // --- Handle Admin Request ---
  const handleRequestAdmin = async () => {
    const reason = "I would like to help contribute to Ranbhoomi.";
    setIsRequesting(true);
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/admin/request`,
        { reason },
        { withCredentials: true }
      );
      toast.success(data.message);
      setUser((prevUser) => ({ ...prevUser, adminRequestStatus: "pending" }));
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
        <button
          onClick={handleBack}
          className="absolute top-24 left-6 z-10 /* ... back button styles ... */"
        >
          {" "}
          {/* ... */}{" "}
        </button>
        <h1 className="text-4xl font-bold text-red-500 animate-pulse [text-shadow:0_0_15px_rgba(255,0,0,0.6)]">
          404 - Not Found
        </h1>
        <p className="text-xl text-gray-400 mt-4">{error}</p>
        <Link
          to="/"
          className="mt-8 px-6 py-2.5 bg-orange-600 text-white text-base font-bold rounded-lg shadow-[0_0_15px_rgba(255,69,0,0.5)] hover:shadow-[0_0_25px_rgba(255,69,0,0.7)] hover:bg-orange-700 transition-all transform hover:scale-105"
        >
          Return to Battlefield
        </Link>
      </div>
    );
  }

  if (!user) return null;

  // --- Theme Styles ---
  const cardStyle = `bg-gradient-to-br from-black via-gray-950 to-black border border-orange-700/40 rounded-xl p-6 shadow-[0_0_30px_rgba(255,69,0,0.2)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(255,69,0,0.3)] hover:border-orange-600/60`;
  const headingStyle = `text-2xl font-bold text-white mb-4 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]`;
  const buttonPrimaryStyle = `w-full bg-orange-600 text-white font-bold rounded-lg py-2 px-4 text-sm shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 transform hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-105 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100`;
  const buttonSecondaryStyle = `w-full bg-transparent border border-orange-600/50 text-orange-500 font-semibold rounded-lg py-2 px-4 text-sm shadow-[0_0_10px_rgba(255,69,0,0.2)] transition-all duration-300 transform hover:bg-orange-950/30 hover:border-orange-600/80 hover:text-orange-400 hover:shadow-[0_0_20px_rgba(255,69,0,0.3)] hover:scale-105`;

  return (
    <>
      {/* --- Floating Back Button --- */}
      <button
        onClick={handleBack}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-orange-600/40 shadow-[0_0_20px_rgba(255,69,0,0.25)] text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm transition-all duration-300 transform hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:text-orange-400 hover:scale-105"
      >
        <FaArrowLeft />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="min-h-screen text-gray-300 pt-28 px-4 bg-black pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ### LEFT COLUMN ### */}
          <div className="lg:col-span-1 space-y-6">
            {/* --- Profile Card --- */}
            <div className={`${cardStyle} text-center`}>
              <img
                src={
                  user.photoUrl ||
                  `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`
                }
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-orange-500 object-cover mx-auto shadow-[0_0_25px_rgba(255,69,0,0.4)]"
              />
              <h1 className="text-3xl font-bold text-white mt-4 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                {" "}
                {user.name}{" "}
              </h1>
              <p className="text-lg text-orange-400 [text-shadow:0_0_12px_rgba(255,69,0,0.5)]">
                {" "}
                @{user.username}{" "}
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate("/editprofile")}
                  className={`mt-5 ${buttonSecondaryStyle} flex items-center justify-center gap-2`}
                >
                  {" "}
                  <FaEdit /> Edit Profile{" "}
                </button>
              )}
              <div className="flex justify-center gap-5 mt-5">
                {user.github && (
                  <a
                    href={user.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 transform hover:scale-110 transition-all duration-200"
                  >
                    {" "}
                    <FaGithub size={24} />{" "}
                  </a>
                )}
                {user.linkedin && (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 transform hover:scale-110 transition-all duration-200"
                  >
                    {" "}
                    <FaLinkedin size={24} />{" "}
                  </a>
                )}
              </div>
            </div>

            {/* --- Stats Card --- */}
            <div className={cardStyle}>
              <h2 className={headingStyle}> Battle Stats </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  {" "}
                  <span className="text-gray-400">Problems Solved</span>{" "}
                  <span className="text-lg font-bold text-orange-500 [text-shadow:0_0_10px_rgba(255,69,0,0.4)]">
                    0
                  </span>{" "}
                </div>
                <div className="flex justify-between items-center text-sm">
                  {" "}
                  <span className="text-gray-400">Contests Joined</span>{" "}
                  <span className="text-lg font-bold text-orange-500 [text-shadow:0_0_10px_rgba(255,69,0,0.4)]">
                    0
                  </span>{" "}
                </div>
                <div className="flex justify-between items-center text-sm">
                  {" "}
                  <span className="text-gray-400">Current Rating</span>{" "}
                  <span className="text-lg font-bold text-orange-500 [text-shadow:0_0_10px_rgba(255,69,0,0.4)]">
                    N/A
                  </span>{" "}
                </div>
              </div>
            </div>
          </div>

          {/* ### RIGHT COLUMN ### */}
          <div className="lg:col-span-2 space-y-6">
            {/* --- About Me Card --- */}
            <div className={cardStyle}>
              <h2 className={headingStyle}> About Me </h2>
              <p className="text-gray-300 leading-relaxed text-base">
                {" "}
                {user.description || "No description provided."}{" "}
              </p>
            </div>

            {/* --- Submission Activity --- */}
            <div className={cardStyle}>
              <h2 className={headingStyle}> Submission Activity </h2>
              <div className="h-32 flex items-center justify-center bg-black/40 rounded-lg border border-gray-700/50">
                <p className="text-gray-500 italic">
                  Submission Heatmap (Coming Soon)
                </p>
              </div>
            </div>

            {/* --- Account Status / Admin Actions Card --- */}
            {isOwnProfile && (
              <div className={cardStyle}>
                <h2 className={headingStyle}> Account Controls </h2>
                <div className="space-y-4">
                  {/* Role Display */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Account Role:</span>
                    {loggedInUser.role === "admin" && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full shadow-[0_0_10px_rgba(0,255,0,0.3)]">
                        Admin
                      </span>
                    )}
                    {loggedInUser.role === "master" && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full shadow-[0_0_10px_rgba(255,215,0,0.4)]">
                        Master
                      </span>
                    )}
                    {loggedInUser.role === "user" && (
                      <span className="px-3 py-1 bg-gray-700/50 text-gray-400 text-xs font-bold rounded-full">
                        User
                      </span>
                    )}
                  </div>

                  {/* Master Dashboard Button */}
                  {loggedInUser.role === "master" && (
                    <button
                      onClick={() => navigate("/admin/dashboard")}
                      className={`${buttonPrimaryStyle} flex items-center justify-center gap-2`}
                    >
                      {" "}
                      <FaCog /> Go to Master Dashboard{" "}
                    </button>
                  )}

                  {/* --- Manage Problems Button --- */}
                  {(loggedInUser.role === "admin" ||
                    loggedInUser.role === "master") && (
                    <button
                      onClick={() => navigate("/admin/problems")} // Link to the future problem management page
                      className={`${buttonSecondaryStyle} flex items-center justify-center gap-2`}
                    >
                      <FaEdit /> Manage Problems
                    </button>
                  )}
                 

                  {/* Admin Request Button */}
                  {loggedInUser.role === "user" && (
                    <div className="pt-4 border-t border-orange-800/30">
                      <p className="text-sm text-gray-400 mb-2">
                        Want to help manage Ranbhoomi? Request admin access.
                      </p>
                      <button
                        onClick={handleRequestAdmin}
                        disabled={
                          isRequesting || user.adminRequestStatus === "pending"
                        }
                        className={`${buttonPrimaryStyle} !text-xs !py-1.5`}
                      >
                        {isRequesting
                          ? "Sending..."
                          : user.adminRequestStatus === "pending"
                          ? "Request Pending"
                          : "Request Admin Access"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
