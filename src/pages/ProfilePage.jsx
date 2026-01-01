import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaGithub,
  FaLinkedin,
  FaArrowLeft,
  FaEdit,
  FaCog,
  FaTrophy,
  FaFire,
  FaCode,
  FaTerminal,
  FaMedal,
  FaPlus,
  FaCrown, // Import Crown Icon
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";

import { serverUrl } from "../App";
import ActivityGraph from "../component/ActivityGraph";
import ContestRatingGraph from "../component/ContestRatingGraph";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
  </div>
);

// --- Heatmap Styles ---
const heatmapCSS = `
  .react-calendar-heatmap text { font-size: 10px; fill: #666; }
  .react-calendar-heatmap .color-empty { fill: #1a1a1a; rx: 2px; }
  .react-calendar-heatmap .color-scale-1 { fill: #431407; rx: 2px; }
  .react-calendar-heatmap .color-scale-2 { fill: #7c2d12; rx: 2px; }
  .react-calendar-heatmap .color-scale-3 { fill: #c2410c; rx: 2px; }
  .react-calendar-heatmap .color-scale-4 { fill: #ea580c; rx: 2px; }
  .react-calendar-heatmap rect:hover { stroke: #fff; stroke-width: 1px; }
`;

function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const { username } = useParams();
  const navigate = useNavigate();
  const { userData: loggedInUser } = useSelector((state) => state.user);

  const isOwnProfile =
    !username || (loggedInUser && loggedInUser.username === username);

  // --- Fetch Profile Data ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        let url = `${serverUrl}/api/user/profile`;

        if (username) {
          url = `${serverUrl}/api/user/profile/${username}`;
        }

        const { data } = await axios.get(url, { withCredentials: true });
        setProfileData(data);
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

  const handleBack = () => navigate(-1);

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
      setProfileData((prev) => ({
        ...prev,
        user: { ...prev.user, adminRequestStatus: "pending" },
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send request.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !profileData) {
    return (
      <div className="bg-black flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h1 className="text-4xl font-bold text-red-500 animate-pulse [text-shadow:0_0_15px_rgba(255,0,0,0.6)]">
          404 - Not Found
        </h1>
        <p className="text-xl text-gray-400 mt-4">
          {error || "Profile unavailable"}
        </p>
        <Link
          to="/"
          className="mt-8 px-6 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all"
        >
          Return to Battlefield
        </Link>
      </div>
    );
  }

  const { user, stats } = profileData;
  const graphData = stats.heatmap
    ? [...stats.heatmap].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  // --- Styles ---
  const cardStyle = `bg-black border border-orange-700/60 rounded-xl p-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,69,0,0.2)] hover:border-orange-600/80`;
  const headingStyle = `text-xl font-semibold text-white mb-4 [text-shadow:0_0_6px_rgba(255,255,255,0.2)] flex items-center gap-2`;
  const buttonPrimaryStyle = `w-full bg-orange-600 text-white font-bold rounded-lg py-2 px-4 text-sm shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 hover:bg-orange-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonSecondaryStyle = `w-full bg-black border border-orange-600/50 text-orange-500 font-semibold rounded-lg py-2 px-4 text-sm shadow-[0_0_10px_rgba(255,69,0,0.15)] transition-all duration-300 hover:bg-orange-950/30 hover:text-orange-400 hover:scale-105`;

  // --- DYNAMIC RING COLOR ---
  const getProfileRingColor = (plan) => {
    switch (plan) {
      case "Gladiator":
        return "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]";
      case "Warrior":
        return "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]";
      default:
        return "border-orange-500 shadow-[0_0_25px_rgba(255,69,0,0.4)]";
    }
  };

  return (
    <>
      <style>{heatmapCSS}</style>

      {/* Floating Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-orange-600/50 text-orange-500 font-bold rounded-full py-1.5 px-3 hover:scale-105 transition-all"
      >
        <FaArrowLeft /> <span className="hidden sm:inline">Back</span>
      </button>

      <div className="min-h-screen text-gray-300 pt-28 px-4 bg-black pb-20 godfather-bg font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ### LEFT COLUMN: User Identity & Detailed Stats ### */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div
              className={`${cardStyle} text-center relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent"></div>

              <img
                src={
                  user.photoUrl ||
                  `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`
                }
                alt={user.name}
                // Apply Dynamic Ring Logic Here
                className={`w-32 h-32 rounded-full border-4 object-cover mx-auto ${getProfileRingColor(
                  user.subscriptionPlan
                )}`}
              />
              <h1 className="text-2xl font-bold text-white mt-4">
                {user.name}
              </h1>
              <p className="text-lg text-orange-400">@{user.username}</p>

              {/* --- UPDATED BADGE SECTION --- */}
              <div className="mt-3 flex justify-center gap-2">
                {/* 1. Staff Badge (Admin/Master) */}
                {user.role === "admin" && (
                  <span className="px-3 py-0.5 bg-green-900/40 text-green-400 text-xs rounded-full border border-green-700 font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
                {user.role === "master" && (
                  <span className="px-3 py-0.5 bg-blue-900/40 text-blue-400 text-xs rounded-full border border-blue-700 font-bold uppercase tracking-wider">
                    Master
                  </span>
                )}

                {/* 2. Subscription Badge (Warrior/Gladiator) */}
                {user.subscriptionPlan && user.subscriptionPlan !== "Free" && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full border font-bold text-xs uppercase tracking-wider ${
                      user.subscriptionPlan === "Gladiator"
                        ? "bg-yellow-900/30 text-yellow-400 border-yellow-500/50"
                        : "bg-red-900/30 text-red-400 border-red-500/50"
                    }`}
                  >
                    <FaCrown size={14} />{" "}
                    {/* Reduced size to 14 to fit better */}
                    {user.subscriptionPlan}
                  </div>
                )}

                {/* 3. Fallback Badge (Free User) */}
                {user.role === "user" && user.subscriptionPlan === "Free" && (
                  <span className="px-3 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-600 font-bold uppercase tracking-wider">
                    Scout
                  </span>
                )}
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => navigate("/editprofile")}
                  className={`mt-5 ${buttonSecondaryStyle} flex items-center justify-center gap-2`}
                >
                  <FaEdit /> Edit Profile
                </button>
              )}

              <div className="flex justify-center gap-5 mt-5">
                {user.github && (
                  <a
                    href={user.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-orange-400 text-2xl"
                  >
                    <FaGithub />
                  </a>
                )}
                {user.linkedin && (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-orange-400 text-2xl"
                  >
                    <FaLinkedin />
                  </a>
                )}
              </div>
            </div>

            {/* Difficulty Breakdown  */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>
                <FaTrophy className="text-orange-500" /> Battle Record
              </h2>
              <div className="space-y-4">
                {/* Easy */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-400 font-bold">Easy</span>
                    <span className="text-gray-400">{stats.easy} solved</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (stats.easy / (stats.totalSolved || 1)) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                {/* Medium */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-yellow-400 font-bold">Medium</span>
                    <span className="text-gray-400">{stats.medium} solved</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (stats.medium / (stats.totalSolved || 1)) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                {/* Hard */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-500 font-bold">Hard</span>
                    <span className="text-gray-400">{stats.hard} solved</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-red-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (stats.hard / (stats.totalSolved || 1)) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                {/* Super Hard */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-purple-400 font-bold">
                      Super Hard
                    </span>
                    <span className="text-gray-400">
                      {stats.superHard} solved
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (stats.superHard / (stats.totalSolved || 1)) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Solved</span>
                  <span className="text-2xl font-black text-white">
                    {stats.totalSolved}
                  </span>
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>About Me</h2>
              <p className="text-sm text-gray-400 leading-relaxed italic">
                "{user.description || "No bio provided. Just here to code."}"
              </p>
            </div>

          </div>

          {/* ### RIGHT COLUMN: Visualizations & Activity ### */}
          <div className="lg:col-span-2 space-y-6">
            {/* Heatmap */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>
                <FaFire className="text-orange-500" /> Consistency
              </h2>
              <div className="w-full overflow-x-auto pb-2">
                <div className="min-w-[600px]">
                  <CalendarHeatmap
                    startDate={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 1)
                      )
                    }
                    endDate={new Date()}
                    values={stats.heatmap || []}
                    classForValue={(value) => {
                      if (!value) return "color-empty";
                      return `color-scale-${Math.min(value.count, 4)}`;
                    }}
                    tooltipDataAttrs={(value) => ({
                      "data-tooltip-id": "heatmap-tooltip",
                      "data-tooltip-content": value.date
                        ? `${value.date}: ${value.count} submissions`
                        : "No activity",
                    })}
                  />
                  <ReactTooltip
                    id="heatmap-tooltip"
                    style={{
                      backgroundColor: "#000",
                      border: "1px solid #333",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Activity Graph */}
            <ActivityGraph data={graphData} />

            {/* Contest History  */}
            <div className="space-y-6">
              {/* The Graph */}
              <ContestRatingGraph data={stats.contestHistory} />

              {/* The List  */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>
                  <FaMedal className="text-orange-500" /> Recent Contests
                </h2>
                <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 pr-2">
                  {stats.contestHistory && stats.contestHistory.length > 0 ? (
                    stats.contestHistory.map((contest) => (
                      <div
                        key={contest.contestId}
                        className="flex justify-between items-center p-3 bg-gray-900/40 rounded border border-gray-800 hover:border-gray-600 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-200">
                            {contest.title}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {new Date(contest.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400 font-black text-lg">
                            #{contest.rank}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Score: {contest.score}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 py-4">
                      <FaMedal size={24} className="mb-2" />
                      <p className="text-sm">No contest history yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity List */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>
                <FaTerminal className="text-orange-500" /> Recent Activity
              </h2>
              <div className="space-y-3">
                {stats.recent.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-900/40 rounded border border-gray-800 hover:border-gray-600 transition-colors group"
                  >
                    <div className="overflow-hidden">
                      <div className="font-medium text-sm text-gray-300 group-hover:text-white truncate">
                        {sub.title}
                      </div>
                      <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                        {new Date(sub.date).toLocaleDateString()} &bull;{" "}
                        {sub.language}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-1 rounded font-bold border uppercase tracking-wider ${
                        sub.status === "Accepted"
                          ? "bg-green-950/30 text-green-400 border-green-900/30"
                          : "bg-red-950/30 text-red-400 border-red-900/30"
                      }`}
                    >
                      {sub.status === "Accepted" ? "AC" : "WA"}
                    </span>
                  </div>
                ))}
                {stats.recent.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 py-4">
                    <FaCode size={24} className="mb-2" />
                    <p className="text-sm">No recent battles recorded.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Admin / Account Controls (Only for Logged In User) */}
            {isOwnProfile && loggedInUser && (
              <div className={cardStyle}>
                <h2 className={headingStyle}>
                  <FaCog className="text-orange-500" /> Account Controls
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(loggedInUser.role === "admin" ||
                    loggedInUser.role === "master") && (
                    <>
                      <button
                        onClick={() => navigate("/admin/problems")}
                        className={buttonSecondaryStyle}
                      >
                        Manage Problems
                      </button>
                      <button
                        onClick={() => navigate("/admin/contests")}
                        className={buttonSecondaryStyle}
                      >
                        Manage Contests
                      </button>
                    </>
                  )}

                  {loggedInUser.role === "master" && (
                    <button
                      onClick={() => navigate("/admin/dashboard")}
                      className={`${buttonPrimaryStyle} sm:col-span-2`}
                    >
                      Master Dashboard
                    </button>
                  )}

                  {loggedInUser.role === "user" && (
                    <div className="sm:col-span-2 pt-2 border-t border-gray-800 mt-2">
                      <p className="text-sm text-gray-400 mb-3">
                        Want to contribute problems or manage contests?
                      </p>
                      <button
                        onClick={handleRequestAdmin}
                        disabled={
                          isRequesting || user.adminRequestStatus === "pending"
                        }
                        className={buttonPrimaryStyle}
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
