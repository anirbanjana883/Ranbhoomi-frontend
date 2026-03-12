import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft, FaEdit, FaTrashAlt, FaPlus, FaPlay,
  FaCalendarAlt, FaHistory, FaTrophy, FaSyncAlt, FaCircle,
} from "react-icons/fa";
import API from "../../api/axios.js";

/* ─── Loading ──────────────────────────────────────────────────────── */
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 gap-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border border-zinc-800 rounded-full" />
      <div className="absolute inset-0 border-t-2 border-red-600 rounded-full animate-spin" />
    </div>
    <p className="text-[10px] text-zinc-600 tracking-widest uppercase font-mono">Loading arenas…</p>
  </div>
);

/* ─── Section config ───────────────────────────────────────────────── */
const SECTIONS = [
  {
    key: "live",
    label: "Live Arenas",
    rankable: true,
    emptyText: "No contests are live right now.",
    badge: (
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
        <FaCircle size={6} className="animate-pulse" /> Live
      </span>
    ),
    icon: <FaPlay size={12} className="text-emerald-400" />,
  },
  {
    key: "upcoming",
    label: "Upcoming Battles",
    rankable: false,
    emptyText: "No upcoming contests scheduled.",
    badge: (
      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
        Upcoming
      </span>
    ),
    icon: <FaCalendarAlt size={12} className="text-amber-400" />,
  },
  {
    key: "past",
    label: "Past Archives",
    rankable: true,
    emptyText: "No past contests found.",
    badge: (
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md">
        Archived
      </span>
    ),
    icon: <FaHistory size={12} className="text-zinc-500" />,
  },
];

const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* ══════════════════════════════════════════════════════════════════ */
export default function AdminContestPage() {
  const [contests,        setContests]        = useState({ upcoming: [], live: [], past: [] });
  const [loading,         setLoading]         = useState(true);
  const [calculatingSlug, setCalculatingSlug] = useState(null);
  const navigate = useNavigate();

  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/contests");
      setContests(data.data || data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch contests.");
      setContests({ upcoming: [], live: [], past: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContests(); }, [fetchContests]);

  const handleDelete = async (slug, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/contests/${slug}`);
      toast.success(`"${title}" deleted.`);
      fetchContests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    }
  };

  const handleCalculate = async (slug, title) => {
    if (!window.confirm(`Recalculate rankings for "${title}"?`)) return;
    setCalculatingSlug(slug);
    try {
      await API.post(`/contests/${slug}/calculate`, {});
      toast.success(`Rankings calculated for "${title}"!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Calculation failed.");
    } finally {
      setCalculatingSlug(null);
    }
  };

  const totalCount =
    contests.live.length + contests.upcoming.length + contests.past.length;

  if (loading && totalCount === 0) return <LoadingSpinner />;

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans">

      {/* ══ STICKY HEADER ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 h-14 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">

        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors shrink-0"
          >
            <FaArrowLeft size={12} />
          </button>
          <div className="hidden sm:block w-px h-5 bg-zinc-800 shrink-0" />
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1 h-4 bg-red-600 rounded-full shrink-0" />
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight truncate">
              Contest Management
            </h1>
          </div>
        </div>

        {/* Right: summary chips + create button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live indicator */}
          {contests.live.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <FaCircle size={6} className="text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 font-mono">
                {contests.live.length} LIVE
              </span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 font-mono">
              {totalCount} TOTAL
            </span>
          </div>
          <Link
            to="/admin/contests/create"
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <FaPlus size={11} />
            <span className="hidden sm:inline">Create Contest</span>
          </Link>
        </div>
      </header>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-8">

        {/* Page intro (below header) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Arenas</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Create, edit, and orchestrate official coding arenas.
            </p>
          </div>
          {/* Mobile create button */}
          <Link
            to="/admin/contests/create"
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <FaPlus size={11} /> Create Contest
          </Link>
        </div>

        {/* ── Contest sections ── */}
        {SECTIONS.map(({ key, label, rankable, emptyText, badge, icon }) => {
          const data = contests[key] || [];
          return (
            <section key={key}>

              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {icon}
                  <h3 className="text-base font-bold text-zinc-200">{label}</h3>
                  {badge}
                  <span className="font-mono text-xs text-zinc-600">({data.length})</span>
                </div>
              </div>

              {/* Table card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {data.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm text-zinc-600 font-medium">{emptyText}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap min-w-[620px]">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/60">
                          <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-600">Title</th>
                          <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-600">Start</th>
                          <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-600">End</th>
                          <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-600 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {data.map((contest) => (
                          <tr
                            key={contest._id}
                            className="hover:bg-zinc-800/30 transition-colors group"
                          >
                            {/* Title */}
                            <td className="px-5 py-3.5">
                              <Link
                                to={`/admin/contests/edit/${contest.slug}`}
                                className="text-sm font-semibold text-zinc-200 hover:text-red-400 transition-colors"
                              >
                                {contest.title}
                              </Link>
                              <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{contest.slug}</p>
                            </td>

                            {/* Start */}
                            <td className="px-5 py-3.5">
                              <span className="text-sm text-zinc-400">{fmtDate(contest.startTime)}</span>
                            </td>

                            {/* End */}
                            <td className="px-5 py-3.5">
                              <span className="text-sm text-zinc-400">{fmtDate(contest.endTime)}</span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">

                                {rankable && (
                                  <button
                                    onClick={() => handleCalculate(contest.slug, contest.title)}
                                    disabled={calculatingSlug === contest.slug}
                                    title="Calculate Rankings"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {calculatingSlug === contest.slug
                                      ? <FaSyncAlt size={12} className="animate-spin text-amber-400" />
                                      : <FaTrophy size={12} />
                                    }
                                  </button>
                                )}

                                <Link
                                  to={`/admin/contests/edit/${contest.slug}`}
                                  title="Edit Contest"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-blue-400 hover:border-blue-500/40 transition-colors"
                                >
                                  <FaEdit size={12} />
                                </Link>

                                <button
                                  onClick={() => handleDelete(contest.slug, contest.title)}
                                  title="Delete Contest"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                                >
                                  <FaTrashAlt size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}