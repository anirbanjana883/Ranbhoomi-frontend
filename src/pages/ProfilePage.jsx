import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaLinkedin,
  FaArrowLeft,
  FaEdit,
  FaCog,
  FaCode,
  FaTerminal,
  FaMedal,
  FaCrown,
  FaShareSquare,
  FaFireAlt,
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

// ─── Loading Spinner ───────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 space-y-4">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold animate-pulse">
      Loading Profile...
    </p>
  </div>
);

// ─── Heatmap Styles ────────────────────────────────────────────────
const heatmapCSS = `
  .react-calendar-heatmap text { font-size: 10px; fill: #71717a; font-family: monospace; font-weight: 600; }
  .react-calendar-heatmap .color-empty { fill: #27272a; rx: 3px; ry: 3px; }
  .react-calendar-heatmap .color-scale-1 { fill: #450a0a; rx: 3px; ry: 3px; } /* red-950 mix */
  .react-calendar-heatmap .color-scale-2 { fill: #7f1d1d; rx: 3px; ry: 3px; } /* red-900 */
  .react-calendar-heatmap .color-scale-3 { fill: #b91c1c; rx: 3px; ry: 3px; } /* red-700 */
  .react-calendar-heatmap .color-scale-4 { fill: #ef4444; rx: 3px; ry: 3px; } /* red-500 */
  .react-calendar-heatmap rect:hover { stroke: #e4e4e7; stroke-width: 1px; transition: all 0.2s; }
`;

export default function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const { username } = useParams();
  const navigate = useNavigate();
  const { userData: loggedInUser } = useSelector((state) => state.user);

  const isOwnProfile = !username || (loggedInUser && loggedInUser.username === username);

  // ─── Fetch Profile Data ───
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const url = username ? `/user/profile/${username}` : `/user/profile`;
        const { data } = await API.get(url);
        setProfileData(data?.data || data);
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

  // ─── Handlers ───
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
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-center p-4 selection:bg-red-500/30">
        <h1 className="text-5xl font-black text-zinc-800 mb-4 tracking-tighter">404</h1>
        <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-8">
          {error || "Profile unavailable"}
        </p>
        <button
          onClick={handleBack}
          className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold rounded-md hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
        >
          <FaArrowLeft size={12}/> Go Back
        </button>
      </div>
    );
  }

  const { user, stats } = profileData;
  const graphData = stats.heatmap
    ? [...stats.heatmap].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  // ─── Circular SVG Progress Math ───
  const totalSolved = stats.totalSolved || 0;
  const calcTotal = totalSolved === 0 ? 1 : totalSolved; 
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const easyLen = ((stats.easy || 0) / calcTotal) * circ;
  const medLen = ((stats.medium || 0) / calcTotal) * circ;
  const hardLen = ((stats.hard || 0) / calcTotal) * circ;
  const superLen = ((stats.superHard || 0) / calcTotal) * circ;

  // ─── Common Styles ───
  const cardStyle = `bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden`;
  const headingStyle = `text-sm font-bold text-zinc-100 uppercase tracking-widest mb-6 flex items-center gap-2 shrink-0 border-b border-zinc-800 pb-3`;
  const badgeStyle = "flex items-center gap-1.5 px-3 py-1 rounded border font-bold text-[10px] uppercase tracking-widest";

  const getProfileRingStyle = (plan) => {
    switch (plan) {
      case "Gladiator": return "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]";
      case "Warrior": return "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]";
      default: return "border-zinc-700";
    }
  };

  return (
    // 🛡️ Strict Full Screen Architecture
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30 overflow-hidden">
      <style>{heatmapCSS}</style>

      {/* ── TOP NAV BAR ── */}
      <header className="shrink-0 h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
          >
            <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="uppercase hidden sm:inline">Back</span>
          </button>
          
          <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
          
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
              {isOwnProfile ? "My Profile" : `${user.username}'s Profile`}
            </h1>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: Identity, Progress & Config */}
          {/* ========================================== */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            
            {/* 1. Identity Card */}
            <div className={`${cardStyle} text-center`}>
              <div className="relative inline-block mb-4">
                <img
                  src={user.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`}
                  alt={user.name}
                  className={`w-32 h-32 rounded-full border-4 object-cover mx-auto bg-zinc-950 p-1 ${getProfileRingStyle(user.subscriptionPlan)}`}
                />
              </div>
              
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
                {user.name}
              </h1>
              <p className="text-sm text-zinc-500 font-medium font-mono mt-1">@{user.username}</p>

              {/* Badges */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {user.role === "admin" && (
                  <span className={`${badgeStyle} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}><FaCrown size={10}/> Admin</span>
                )}
                {user.role === "master" && (
                  <span className={`${badgeStyle} bg-blue-500/10 text-blue-400 border-blue-500/20`}><FaCrown size={10}/> Master</span>
                )}
                {user.subscriptionPlan && user.subscriptionPlan !== "Free" && (
                  <div className={`${badgeStyle} ${user.subscriptionPlan === "Gladiator" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                    <FaCrown size={10} /> {user.subscriptionPlan}
                  </div>
                )}
                {user.role === "user" && user.subscriptionPlan === "Free" && (
                  <span className={`${badgeStyle} bg-zinc-800 text-zinc-400 border-zinc-700`}>Scout</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {isOwnProfile ? (
                  <button onClick={() => navigate("/editprofile")} className="flex justify-center items-center gap-2 w-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-md py-2 px-4 text-xs transition-colors">
                    <FaEdit size={12} /> Edit
                  </button>
                ) : (
                  <button onClick={() => toast.success("Followed successfully!")} className="flex justify-center items-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white font-semibold rounded-md py-2 px-4 text-xs transition-colors shadow-sm">
                    Follow
                  </button>
                )}
                <button onClick={handleShareProfile} className="flex justify-center items-center gap-2 w-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-md py-2 px-4 text-xs transition-colors">
                  <FaShareSquare size={12} /> Share
                </button>
              </div>

              {/* Social Links */}
              {(user.github || user.linkedin) && (
                <div className="flex justify-center gap-3 mt-6 border-t border-zinc-800/60 pt-5">
                  {user.github && (
                    <a href={user.github} target="_blank" rel="noreferrer" className="p-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors">
                      <FaGithub size={16}/>
                    </a>
                  )}
                  {user.linkedin && (
                    <a href={user.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors">
                      <FaLinkedin size={16}/>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 2. About Me */}
            {user.description && (
              <div className={cardStyle}>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">About Me</h2>
                <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-red-500 pl-3">
                  "{user.description}"
                </p>
              </div>
            )}

            {/* 3. Solved Problems (LeetCode Style) */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>
                <FaCode size={14} className="text-zinc-500" /> Progress
              </h2>
              
              <div className="flex items-center gap-6 mt-2">
                {/* Circular Progress */}
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="6" />
                    {stats.easy > 0 && <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray={`${easyLen} ${circ}`} strokeDashoffset={0} strokeLinecap="round" />}
                    {stats.medium > 0 && <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray={`${medLen} ${circ}`} strokeDashoffset={-easyLen} strokeLinecap="round" />}
                    {stats.hard > 0 && <circle cx="50" cy="50" r="42" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray={`${hardLen} ${circ}`} strokeDashoffset={-(easyLen + medLen)} strokeLinecap="round" />}
                    {stats.superHard > 0 && <circle cx="50" cy="50" r="42" fill="none" stroke="#a855f7" strokeWidth="6" strokeDasharray={`${superLen} ${circ}`} strokeDashoffset={-(easyLen + medLen + hardLen)} strokeLinecap="round" />}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-zinc-100 leading-none">{totalSolved}</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Solved</span>
                  </div>
                </div>

                {/* Linear Breakdown */}
                <div className="flex-1 space-y-3.5">
                  {[
                    { label: 'Easy', count: stats.easy, color: 'text-emerald-400', bg: 'bg-emerald-500' },
                    { label: 'Medium', count: stats.medium, color: 'text-amber-400', bg: 'bg-amber-500' },
                    { label: 'Hard', count: stats.hard, color: 'text-red-400', bg: 'bg-red-500' },
                    { label: 'Super', count: stats.superHard, color: 'text-purple-400', bg: 'bg-purple-500' }
                  ].map((lvl) => (
                    <div key={lvl.label}>
                      <div className="flex justify-between items-end mb-1.5 text-[10px] uppercase font-bold tracking-wider">
                        <span className={lvl.color}>{lvl.label}</span>
                        <span className="text-zinc-300 font-mono">{lvl.count || 0}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                        <div className={`${lvl.bg} h-1 rounded-full`} style={{ width: `${Math.min(((lvl.count || 0) / calcTotal) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Admin / Account Controls */}
            {isOwnProfile && loggedInUser && (
              <div className={cardStyle}>
                <h2 className={headingStyle}>
                  <FaCog size={14} className="text-zinc-500" /> Account Controls
                </h2>
                <div className="flex flex-col gap-3">
                  {(loggedInUser.role === "admin" || loggedInUser.role === "master") && (
                    <>
                      <button onClick={() => navigate("/admin/problems")} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-md py-2.5 px-4 text-xs transition-colors hover:bg-zinc-700 hover:text-white">
                        Manage Problems
                      </button>
                      <button onClick={() => navigate("/admin/contests")} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-md py-2.5 px-4 text-xs transition-colors hover:bg-zinc-700 hover:text-white">
                        Manage Arenas
                      </button>
                      <button onClick={() => navigate("/admin/roadmap")} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-md py-2.5 px-4 text-xs transition-colors hover:bg-zinc-700 hover:text-white">
                        Manage Roadmaps
                      </button>
                    </>
                  )}

                  {loggedInUser.role === "master" && (
                    <button onClick={() => navigate("/admin/dashboard")} className="w-full bg-red-600 text-white font-bold rounded-md py-2.5 px-4 text-xs transition-colors hover:bg-red-500 shadow-sm">
                      Master Dashboard
                    </button>
                  )}

                  {loggedInUser.role === "user" && (
                    <div className="pt-2 border-t border-zinc-800/60 mt-1">
                      <p className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-widest text-center">
                        Want to contribute?
                      </p>
                      <button
                        onClick={handleRequestAdmin}
                        disabled={isRequesting || user.adminRequestStatus === "pending"}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-md py-2.5 px-4 text-xs transition-colors hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRequesting ? "Sending..." : user.status === "pending" ? "Request Pending" : "Request Admin Access"}
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
            <div className={cardStyle}>
              <h2 className={headingStyle}>
                <FaFireAlt size={14} className="text-red-500" /> Consistency Graph
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
                    style={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", color: "#e4e4e7", fontSize: "11px", fontWeight: "bold", padding: "6px 12px", zIndex: 100, borderRadius: "6px" }}
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Graphs (Side by Side) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ActivityGraph data={graphData} />
              <ContestRatingGraph data={stats.contestHistory} />
            </div>

            {/* ROW 3: Lists (Side by Side) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* Recent Contests  */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>
                  <FaMedal size={14} className="text-amber-500" /> Arena History
                </h2>
                <div className="h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {stats.contestHistory && stats.contestHistory.length > 0 ? (
                    stats.contestHistory.map((contest) => (
                      <div key={contest.contestId} className="flex justify-between items-center p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-lg hover:bg-zinc-800 transition-colors group">
                        <div className="min-w-0 pr-4">
                          <div className="font-bold text-sm text-zinc-200 truncate group-hover:text-zinc-100">{contest.title}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">
                            {new Date(contest.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-zinc-100 font-black text-lg">#{contest.rank}</div>
                          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                            Score <span className="text-amber-500">{contest.score}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/50">
                      <FaMedal size={24} className="mb-3 opacity-50" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No history</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>
                  <FaTerminal size={14} className="text-zinc-500" /> Recent Submissions
                </h2>
                <div className="h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {stats.recent.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-lg hover:bg-zinc-800 transition-colors group">
                      <div className="min-w-0 pr-4">
                        <div className="font-bold text-sm text-zinc-200 truncate group-hover:text-zinc-100">
                          {sub.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest flex items-center gap-1.5">
                          {new Date(sub.date).toLocaleDateString()} 
                          <span className="w-1 h-1 rounded-full bg-zinc-700"></span> 
                          <span className="text-zinc-400 font-semibold">{sub.language}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded font-black uppercase tracking-widest border ${
                          sub.status === "Accepted"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {sub.status === "Accepted" ? "AC" : "WA"}
                      </span>
                    </div>
                  ))}
                  {stats.recent.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/50">
                      <FaCode size={24} className="mb-3 opacity-50" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No battles fought</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}