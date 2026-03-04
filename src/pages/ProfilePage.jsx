import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  FaCrown,
  FaShareSquare,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";

// API instance
import API from "../api/axios.js"; 
import ActivityGraph from "../component/ActivityGraph";
import ContestRatingGraph from "../component/ContestRatingGraph";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
  </div>
);

// --- Heatmap Styles  ---
const heatmapCSS = `
  .react-calendar-heatmap text { font-size: 10px; fill: #71717a; font-family: monospace; }
  .react-calendar-heatmap .color-empty { fill: #27272a; rx: 3px; ry: 3px; }
  .react-calendar-heatmap .color-scale-1 { fill: #7f1d1d; rx: 3px; ry: 3px; } /* red-900 */
  .react-calendar-heatmap .color-scale-2 { fill: #b91c1c; rx: 3px; ry: 3px; } /* red-700 */
  .react-calendar-heatmap .color-scale-3 { fill: #ef4444; rx: 3px; ry: 3px; } /* red-500 */
  .react-calendar-heatmap .color-scale-4 { fill: #f87171; rx: 3px; ry: 3px; } /* red-400 */
  .react-calendar-heatmap rect:hover { stroke: #e4e4e7; stroke-width: 1px; }
`;

function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const { username } = useParams();
  const navigate = useNavigate();
  const { userData: loggedInUser } = useSelector((state) => state.user);

  const isOwnProfile = !username || (loggedInUser && loggedInUser.username === username);

  // --- Fetch Profile Data ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const url = username ? `/user/profile/${username}` : `/user/profile`;

        const { data } = await API.get(url);
        const unwrappedData = data?.data || data;

        setProfileData(unwrappedData);
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
      const { data } = await API.post(`/admin/request`, { reason });
      toast.success(data?.message || "Request sent successfully");
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
  
  const handleShareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied to clipboard!");
  };

  if (loading) return <LoadingSpinner />;

  if (error || !profileData) {
    return (
      <div className="bg-zinc-950 flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h1 className="text-4xl font-bold text-red-500 mb-2">404</h1>
        <p className="text-lg text-zinc-400 uppercase tracking-widest font-bold">
          {error || "Profile unavailable"}
        </p>
        <Link
          to="/"
          className="mt-8 px-6 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-md hover:bg-zinc-700 hover:text-white transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { user, stats } = profileData;
  const graphData = stats.heatmap
    ? [...stats.heatmap].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  // --- Circular SVG Progress Math (LeetCode Style) ---
  const totalSolved = stats.totalSolved || 0;
  const calcTotal = totalSolved === 0 ? 1 : totalSolved; // Prevent division by zero
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const easyLen = ((stats.easy || 0) / calcTotal) * circ;
  const medLen = ((stats.medium || 0) / calcTotal) * circ;
  const hardLen = ((stats.hard || 0) / calcTotal) * circ;
  const superLen = ((stats.superHard || 0) / calcTotal) * circ;

  // --- TUF Styles ---
  const cardStyle = `bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm h-full flex flex-col`;
  const headingStyle = `text-lg font-bold text-zinc-100 mb-5 border-b border-zinc-800 pb-3 flex items-center gap-2 shrink-0`;
  const buttonPrimaryStyle = `w-full bg-red-600 text-white font-semibold rounded-md py-2.5 px-4 text-sm transition-colors hover:bg-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonSecondaryStyle = `w-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-md py-2 px-4 text-sm transition-colors hover:bg-zinc-700 hover:text-white flex justify-center items-center gap-2`;

  const getProfileRingStyle = (plan) => {
    switch (plan) {
      case "Gladiator": return "border-amber-500/50 p-1";
      case "Warrior": return "border-red-500/50 p-1";
      default: return "border-zinc-700 p-1";
    }
  };

  const badgeStyle = "flex items-center gap-1.5 px-3 py-1 rounded-md border font-bold text-[10px] uppercase tracking-widest";

  return (
    <>
      <style>{heatmapCSS}</style>

      {/* Floating Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 font-medium rounded-full py-2 px-4 text-xs transition-colors hover:bg-zinc-800 hover:text-white shadow-lg"
      >
        <FaArrowLeft size={12}/> <span className="hidden sm:inline">Back</span>
      </button>

      <div className="min-h-screen text-zinc-300 pt-28 px-4 bg-zinc-950 pb-20 font-sans">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: Identity, Difficulty & Config */}
          {/* ========================================== */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            
            {/* 1. Profile Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm text-center shrink-0">
              <div className="relative inline-block">
                <img
                  src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`}
                  alt={user.name}
                  className={`w-32 h-32 rounded-full border-2 object-cover mx-auto bg-zinc-950 ${getProfileRingStyle(user.subscriptionPlan)}`}
                />
              </div>
              
              <h1 className="text-2xl font-bold text-zinc-100 mt-4 tracking-tight">
                {user.name}
              </h1>
              <p className="text-sm text-zinc-500 font-medium">@{user.username}</p>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {user.role === "admin" && (
                  <span className={`${badgeStyle} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Admin</span>
                )}
                {user.role === "master" && (
                  <span className={`${badgeStyle} bg-blue-500/10 text-blue-400 border-blue-500/20`}>Master</span>
                )}
                {user.subscriptionPlan && user.subscriptionPlan !== "Free" && (
                  <div className={`${badgeStyle} ${
                      user.subscriptionPlan === "Gladiator"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}
                  >
                    <FaCrown size={12} /> {user.subscriptionPlan}
                  </div>
                )}
                {user.role === "user" && user.subscriptionPlan === "Free" && (
                  <span className={`${badgeStyle} bg-zinc-800 text-zinc-400 border-zinc-700`}>Scout</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6 mt-6">
                {isOwnProfile ? (
                  <button 
                    onClick={() => navigate("/editprofile")} 
                    className="flex justify-center items-center gap-2 w-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg py-2.5 px-4 text-xs transition-colors border border-zinc-700/50 hover:border-zinc-600"
                  >
                    <FaEdit size={14} /> Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={() => toast.success("Followed successfully!")} 
                    className="flex justify-center items-center gap-2 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-lg py-2.5 px-4 text-xs transition-colors border border-emerald-500/20 hover:border-emerald-500/40"
                  >
                    <FaPlus size={12} /> Follow
                  </button>
                )}
                <button 
                  onClick={handleShareProfile} 
                  className="flex justify-center items-center gap-2 w-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg py-2.5 px-4 text-xs transition-colors border border-zinc-700/50 hover:border-zinc-600"
                >
                  <FaShareSquare size={14} /> Share Profile
                </button>
              </div>

              {/* Social Links */}
              {(user.github || user.linkedin) && (
                <div className="flex justify-center gap-4 mt-6">
                  {user.github && (
                    <a href={user.github} target="_blank" rel="noreferrer" className="p-2 bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors">
                      <FaGithub size={18}/>
                    </a>
                  )}
                  {user.linkedin && (
                    <a href={user.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors">
                      <FaLinkedin size={18}/>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 2. About Me */}
            {user.description && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm shrink-0">
                <h2 className={headingStyle}>About Me</h2>
                <p className="text-sm text-zinc-400 leading-relaxed italic border-l-2 border-zinc-700 pl-3">
                  "{user.description}"
                </p>
              </div>
            )}

            {/* 3. Solved Problems (LeetCode Style) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm shrink-0">
              <h2 className={headingStyle}>
                <FaCode className="text-zinc-500" /> Solved Problems
              </h2>
              
              <div className="flex items-center gap-5 mt-4">
                {/* Left: Circular Progress Ring */}
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="5" />
                    
                    {/* Dynamic Segments */}
                    {stats.easy > 0 && (
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="5"
                        strokeDasharray={`${easyLen} ${circ}`} strokeDashoffset={0} strokeLinecap="round" />
                    )}
                    {stats.medium > 0 && (
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="5"
                        strokeDasharray={`${medLen} ${circ}`} strokeDashoffset={-easyLen} strokeLinecap="round" />
                    )}
                    {stats.hard > 0 && (
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#ef4444" strokeWidth="5"
                        strokeDasharray={`${hardLen} ${circ}`} strokeDashoffset={-(easyLen + medLen)} strokeLinecap="round" />
                    )}
                    {stats.superHard > 0 && (
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#a855f7" strokeWidth="5"
                        strokeDasharray={`${superLen} ${circ}`} strokeDashoffset={-(easyLen + medLen + hardLen)} strokeLinecap="round" />
                    )}
                  </svg>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-100">{totalSolved}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Solved</span>
                  </div>
                </div>

                {/* Right: Linear Stats Breakdown */}
                <div className="flex-1 space-y-3">
                  {/* Easy */}
                  <div>
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                      <span className="text-emerald-400 font-medium">Easy</span>
                      <span className="text-zinc-300 font-bold">{stats.easy || 0}</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(((stats.easy || 0) / calcTotal) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  {/* Medium */}
                  <div>
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                      <span className="text-amber-400 font-medium">Medium</span>
                      <span className="text-zinc-300 font-bold">{stats.medium || 0}</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(((stats.medium || 0) / calcTotal) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  {/* Hard */}
                  <div>
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                      <span className="text-red-500 font-medium">Hard</span>
                      <span className="text-zinc-300 font-bold">{stats.hard || 0}</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(((stats.hard || 0) / calcTotal) * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* Super Hard */}
                  <div>
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                      <span className="text-purple-400 font-medium">Super Hard</span>
                      <span className="text-zinc-300 font-bold">{stats.superHard || 0}</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(((stats.superHard || 0) / calcTotal) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Admin / Account Controls */}
            {isOwnProfile && loggedInUser && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm shrink-0">
                <h2 className={headingStyle}>
                  <FaCog className="text-zinc-500" /> Account Controls
                </h2>
                <div className="flex flex-col gap-3">
                  {(loggedInUser.role === "admin" || loggedInUser.role === "master") && (
                    <>
                      <button onClick={() => navigate("/admin/problems")} className={buttonSecondaryStyle}>
                        Manage Problems
                      </button>
                      <button onClick={() => navigate("/admin/contests")} className={buttonSecondaryStyle}>
                        Manage Contests
                      </button>
                    </>
                  )}

                  {loggedInUser.role === "master" && (
                    <button onClick={() => navigate("/admin/dashboard")} className={buttonPrimaryStyle}>
                      Master Dashboard
                    </button>
                  )}

                  {loggedInUser.role === "user" && (
                    <div className="pt-2 border-t border-zinc-800 mt-1">
                      <p className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-widest text-center">
                        Want to contribute problems?
                      </p>
                      <button
                        onClick={handleRequestAdmin}
                        disabled={isRequesting || user.adminRequestStatus === "pending"}
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

          {/* ========================================== */}
          {/* RIGHT COLUMN: Visualizations & Activity    */}
          {/* ========================================== */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            
            {/* ROW 1: Heatmap (Full Width) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
              <h2 className={headingStyle}>
                <FaFire className="text-red-500" /> Consistency Activity
              </h2>
              <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                <div className="min-w-[700px]">
                  <CalendarHeatmap
                    startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                    endDate={new Date()}
                    values={stats.heatmap || []}
                    classForValue={(value) => {
                      if (!value) return "color-empty";
                      return `color-scale-${Math.min(value.count, 4)}`;
                    }}
                    tooltipDataAttrs={(value) => ({
                      "data-tooltip-id": "heatmap-tooltip",
                      "data-tooltip-content": value.date ? `${value.date}: ${value.count} submissions` : "No activity",
                    })}
                  />
                  <ReactTooltip
                    id="heatmap-tooltip"
                    style={{ backgroundColor: "#18181b", border: "1px solid #27272a", color: "#e4e4e7", fontSize: "12px", padding: "6px 10px", zIndex: 100 }}
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Graphs (Side by Side) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ActivityGraph data={graphData} />
              <ContestRatingGraph data={stats.contestHistory} />
            </div>

            {/* ROW 3: Lists (Side by Side & Symmetrical Heights) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* Recent Contests  */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>
                  <FaMedal className="text-amber-500" /> Recent Contests
                </h2>
                <div className="h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {stats.contestHistory && stats.contestHistory.length > 0 ? (
                    stats.contestHistory.map((contest) => (
                      <div key={contest.contestId} className="flex justify-between items-center p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors">
                        <div>
                          <div className="font-semibold text-sm text-zinc-200">{contest.title}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">
                            {new Date(contest.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-zinc-100 font-bold text-base">#{contest.rank}</div>
                          <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">
                            Score: <span className="text-zinc-300">{contest.score}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
                      <FaMedal size={20} className="mb-2 opacity-50" />
                      <p className="text-xs font-medium uppercase tracking-widest">No contest history</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>
                  <FaTerminal className="text-zinc-500" /> Recent Submissions
                </h2>
                <div className="h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {stats.recent.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors group">
                      <div className="overflow-hidden pr-4">
                        <div className="font-medium text-sm text-zinc-300 group-hover:text-zinc-100 truncate transition-colors">
                          {sub.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">
                          {new Date(sub.date).toLocaleDateString()} &bull; <span className="text-zinc-400">{sub.language}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest border ${
                          sub.status === "Accepted"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {sub.status === "Accepted" ? "AC" : "WA"}
                      </span>
                    </div>
                  ))}
                  {stats.recent.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
                      <FaCode size={20} className="mb-2 opacity-50" />
                      <p className="text-xs font-medium uppercase tracking-widest">No recent battles</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default ProfilePage;