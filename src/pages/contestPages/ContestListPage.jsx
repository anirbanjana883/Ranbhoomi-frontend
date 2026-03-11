import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { serverUrl } from '../../App.jsx';
import {
  FaArrowLeft, FaCalendarAlt, FaHistory,
  FaPlus, FaLock, FaFire, FaChevronRight,
} from 'react-icons/fa';

// ─── Loading Spinner (TUF Minimalist) ──────────────────────────────
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 space-y-4">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold animate-pulse">
      Loading Arenas...
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
  if (type === 'upcoming') return (
    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20 shrink-0">
      Upcoming
    </span>
  );
  return (
    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border text-zinc-400 bg-zinc-800 border-zinc-700 shrink-0">
      Past
    </span>
  );
};

// ─── Contest Card ──────────────────────────────────────────────────
const ContestCard = ({ contest, type }) => {
  const navigate = useNavigate();

  const btnClass = {
    live: 'bg-red-600 text-white hover:bg-red-500 shadow-sm',
    upcoming: 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white',
    past: 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300',
  }[type];

  const btnText = {
    live: 'Enter Arena',
    upcoming: 'View Details',
    past: 'View Rankings',
  }[type];

  const fmt = (d) => new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      onClick={() => navigate(`/contest/${contest.slug}`)}
      className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800/50 shadow-sm"
    >
      <div>
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-lg font-bold text-zinc-100 leading-tight group-hover:text-red-400 transition-colors line-clamp-2">
            {contest.title}
          </h3>
          <StatusBadge type={type} />
        </div>
        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-6">
          {contest.description}
        </p>
      </div>

      <div className="mt-auto">
        <div className="grid grid-cols-2 gap-3 mb-5 pt-4 border-t border-zinc-800/60">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Starts</p>
            <p className="text-xs font-medium text-zinc-300">{fmt(contest.startTime)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Ends</p>
            <p className="text-xs font-medium text-zinc-300">{fmt(contest.endTime)}</p>
          </div>
        </div>
        <button
          className={`w-full py-2.5 px-4 rounded-md text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${btnClass}`}
          onClick={(e) => { e.stopPropagation(); navigate(`/contest/${contest.slug}`); }}
        >
          {btnText}
          <FaChevronRight size={10} />
        </button>
      </div>
    </div>
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

// ─── Empty State ───────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center">
    <p className="text-sm text-zinc-500 font-medium">{message}</p>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────
export default function ContestListPage() {
  const [contests, setContests]     = useState({ upcoming: [], live: [], past: [] });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const contestRes = await axios.get(`${serverUrl}/api/contests`, { withCredentials: true });
        setContests(contestRes.data.data || contestRes.data);
        try {
          const userRes = await axios.get(`${serverUrl}/api/user/getcurrentuser`, { withCredentials: true });
          setCurrentUser(userRes.data.data || userRes.data);
        } catch { /* not logged in */ }
      } catch {
        toast.error("Failed to load contests.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isPremium = currentUser && currentUser.subscriptionPlan !== 'Free';

  const handleHostClick = () => {
    if (!currentUser) { toast.error("Please login to host a contest."); navigate('/login'); return; }
    if (!isPremium)   { toast.success("🔒 Hosting Private Arenas is a Premium feature."); navigate('/premium'); return; }
    navigate('/contest/create-private');
  };

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
              Ranbhoomi Contest Arena
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-red-500 leading-none mt-1 hidden sm:block">
              Compete with ather warriors
            </p>
          </div>
        </div>

        {/* Right: Stats & Host Button */}
        <div className="flex items-center gap-6 shrink-0">
          
          {/* Stats Strip (Hidden on small mobile) */}
          <div className="hidden md:flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                <span className="text-emerald-400">{contests.live.length}</span> Live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                <span className="text-amber-400">{contests.upcoming.length}</span> Upcoming
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                <span className="text-zinc-300">{contests.past.length}</span> Past
              </span>
            </div>
          </div>

          <button
            onClick={handleHostClick}
            className={`inline-flex items-center gap-2 font-semibold py-2 px-4 rounded-md transition-colors text-xs ${
              isPremium
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-300'
            }`}
          >
            {isPremium
              ? <><FaPlus size={10} /> <span className="hidden sm:inline">Host Private Arena</span><span className="sm:hidden">Host</span></>
              : <><FaLock size={10} className="text-amber-500" /> <span className="hidden sm:inline">Host Arena (Premium)</span><span className="sm:hidden">Host</span></>
            }
          </button>

        </div>
      </header>

      {/* ── SCROLLABLE CONTENT AREA ── */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-10">

          {/* ── Live Contests ── */}
          {contests.live.length > 0 && (
            <section>
              <SectionHeader
                icon={<FaFire className="text-emerald-500 animate-pulse" size={16} />}
                title="Live Arenas"
                count={contests.live.length}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {contests.live.map((c) => <ContestCard key={c._id} contest={c} type="live" />)}
              </div>
            </section>
          )}

          {/* ── Upcoming Contests ── */}
          <section>
            <SectionHeader
              icon={<FaCalendarAlt className="text-amber-500" size={14} />}
              title="Upcoming Battles"
              count={contests.upcoming.length}
            />
            {contests.upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {contests.upcoming.map((c) => <ContestCard key={c._id} contest={c} type="upcoming" />)}
              </div>
            ) : (
              <EmptyState message={isPremium ? "No upcoming contests scheduled. Host a private arena above!" : "No upcoming contests scheduled. Upgrade to host your own!"} />
            )}
          </section>

          {/* ── Past Contests ── */}
          <section>
            <SectionHeader
              icon={<FaHistory className="text-zinc-500" size={14} />}
              title="Past Arenas"
              count={contests.past.length}
            />
            {contests.past.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {contests.past.map((c) => <ContestCard key={c._id} contest={c} type="past" />)}
              </div>
            ) : (
              <EmptyState message="No past contests have been archived yet." />
            )}
          </section>

        </div>
      </main>

    </div>
  );
}