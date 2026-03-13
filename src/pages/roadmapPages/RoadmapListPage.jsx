import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaArrowLeft, FaMap, FaFire, FaCalendarAlt, 
  FaChevronRight, FaTerminal, FaDatabase, FaCodeBranch
} from 'react-icons/fa';
import API from '../../api/axios.js';

// ─── Loading Spinner ───────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 space-y-4">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold animate-pulse">
      Loading Paths...
    </p>
  </div>
);

// ─── Status Badge ──────────────────────────────────────────────────
const StatusBadge = ({ type }) => {
  if (type === 'live') return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
  return (
    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20 shrink-0">
      Upcoming
    </span>
  );
};

// ─── Section Header ────────────────────────────────────────────────
const SectionHeader = ({ icon, title, count }) => (
  <div className="flex items-center gap-3 mb-5 border-b border-zinc-800/60 pb-3">
    <span className="shrink-0 text-zinc-500">{icon}</span>
    <h2 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
      {title}
      <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-500">
        {count}
      </span>
    </h2>
  </div>
);

// ─── Roadmap Card ──────────────────────────────────────────────────
const RoadmapCard = ({ roadmap, type }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    if (type === 'live') {
      navigate(`/roadmap/${roadmap.roadmapId}`);
    } else {
      toast("Coming Soon! Our engineers are forging this path.", {
        icon: '🚧',
        style: { borderRadius: '8px', background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a' }
      });
    }
  };

  const btnClass = type === 'live'
    ? 'bg-red-600 text-white hover:bg-red-500 shadow-sm'
    : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white';

  const btnText = type === 'live' ? 'Start Path' : 'Notify Me';

  return (
    <div
      onClick={handleClick}
      className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800/50 shadow-sm"
    >
      <div>
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 group-hover:text-red-400 transition-colors">
              {roadmap.icon || <FaMap size={14} />}
            </div>
            <h3 className="text-lg font-bold text-zinc-100 leading-tight group-hover:text-red-400 transition-colors line-clamp-1">
              {roadmap.title}
            </h3>
          </div>
          <StatusBadge type={type} />
        </div>
        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-6">
          {roadmap.description || "Master these core concepts to dominate your next engineering interview."}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-800/60 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
          {roadmap.category || "Curriculum"}
        </div>
        <button
          className={`py-1.5 px-4 rounded-md text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${btnClass}`}
          onClick={handleClick}
        >
          {btnText}
          <FaChevronRight size={10} />
        </button>
      </div>
    </div>
  );
};

// ─── Static Templates (Placeholders) ───────────────────────────────
const ALL_TEMPLATES = [
  {
    roadmapId: 'ranbhoomi-75',
    title: "RANBHOOMI 75 FAANG List",
    description: "The most frequently asked interview questions. High ROI for standard FAANG loops.",
    category: "Essential",
    icon: <FaTerminal size={14} />
  },
  {
    roadmapId: 'system-design',
    title: "System Design Matrix",
    description: "Learn to design scalable distributed systems. Concepts, case studies, and architecture.",
    category: "Architecture",
    icon: <FaDatabase size={14} />
  },
  {
    roadmapId: 'cp-handbook',
    title: "Competitive Programming",
    description: "Advanced graph algorithms, dynamic programming, and math for Codeforces and ICPC.",
    category: "Advanced",
    icon: <FaCodeBranch size={14} />
  }
];

// ─── Main Page ─────────────────────────────────────────────────────
export default function RoadmapListPage() {
  const [liveRoadmaps, setLiveRoadmaps] = useState([]);
  const [upcomingRoadmaps, setUpcomingRoadmaps] = useState(ALL_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveRoadmaps = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch live roadmaps from the backend
        // Note: Check your axios instance baseURL. We use '/roadmap' to match your router.
        const res = await API.get(`/roadmap`); 
        const fetchedRoadmaps = res.data.data || [];
        
        // Ensure roadmaps from DB have a UI icon and fallback details
        const processedLive = fetchedRoadmaps.map(rm => ({
            ...rm,
            icon: <FaMap size={14} />,
            category: rm.category || "Algorithms",
            // If the DB doesn't return a description, we provide a clean fallback
            description: rm.description || "The ultimate roadmap to master Data Structures and Algorithms from scratch."
        }));

        setLiveRoadmaps(processedLive);

        // 2. Filter out templates that are already live in the DB
        const liveIds = new Set(fetchedRoadmaps.map(r => r.roadmapId));
        const filteredUpcoming = ALL_TEMPLATES.filter(t => !liveIds.has(t.roadmapId));
        
        setUpcomingRoadmaps(filteredUpcoming);
        setLoading(false);

      } catch (error) {
        console.error("Roadmap fetch error:", error);
        toast.error("Failed to sync with the server.");
        setLoading(false);
      }
    };

    fetchLiveRoadmaps();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    // 🛡️ Full Screen Layout with Internal Scrolling
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30 overflow-hidden">

      {/* ── TOP BAR (Fixed) ── */}
      <header className="shrink-0 h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 flex items-center justify-between shadow-sm">
        
        {/* Left: Back + Title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
          >
            <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="uppercase hidden sm:inline">Home</span>
          </button>
          
          <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
          
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
              Learning Paths
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-red-500 leading-none mt-1 hidden sm:block">
              Master the Craft
            </p>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden md:flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                <span className="text-emerald-400">{liveRoadmaps.length}</span> Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                <span className="text-amber-400">{upcomingRoadmaps.length}</span> Upcoming
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── SCROLLABLE CONTENT AREA ── */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-10">

          {/* ── Live Roadmaps (From DB) ── */}
          {liveRoadmaps.length > 0 && (
            <section>
              <SectionHeader
                icon={<FaFire className="text-emerald-500 animate-pulse" size={16} />}
                title="Active Paths"
                count={liveRoadmaps.length}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {liveRoadmaps.map((r) => <RoadmapCard key={r.roadmapId} roadmap={r} type="live" />)}
              </div>
            </section>
          )}

          {/* ── Upcoming Roadmaps (Filtered Templates) ── */}
          {upcomingRoadmaps.length > 0 && (
            <section>
              <SectionHeader
                icon={<FaCalendarAlt className="text-amber-500" size={14} />}
                title="Upcoming Paths"
                count={upcomingRoadmaps.length}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {upcomingRoadmaps.map((r) => <RoadmapCard key={r.roadmapId} roadmap={r} type="upcoming" />)}
              </div>
            </section>
          )}

        </div>
      </main>

    </div>
  );
}