import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // Using react-hot-toast
import { serverUrl } from "../../App.jsx";
import {
  FaArrowLeft,
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaPlay,
  FaCalendarAlt,
  FaHistory,
  FaTrophy,
  FaSyncAlt,
} from "react-icons/fa";
import API from "../../api/axios.js";

// --- Loading Spinner (TUF Minimalist) ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
  </div>
);

// --- Section Header Component (TUF Clean Lines) ---
const SectionHeader = ({ icon, title, count }) => (
  <div className="flex items-center gap-3 mb-4 border-b border-zinc-800/60 pb-3">
    <div className="text-zinc-500 shrink-0">{icon}</div>
    <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
      {title}
      <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-500">
        {count}
      </span>
    </h2>
  </div>
);

// --- Main Page Component ---
export default function AdminContestPage() {
  const [contests, setContests] = useState({
    upcoming: [],
    live: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [calculatingSlug, setCalculatingSlug] = useState(null);

  // Fetch all contests
  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/contests`);
      setContests(data.data || data); // Adjust based on your ApiResponse structure
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch contests.");
      setContests({ upcoming: [], live: [], past: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  // --- Delete Handler ---
  const handleDelete = async (slug, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the contest "${title}"? This is irreversible.`,
      )
    ) {
      return;
    }
    try {
      // Calls DELETE /api/contests/:slug (Admin Auth Required)
      await API.delete(`/contests/${slug}`);
      toast.success(`Contest "${title}" deleted successfully.`);
      fetchContests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete contest.");
    }
  };

  // --- Calculate Ranking Handler ---
  const handleCalculate = async (slug, title) => {
    if (
      !window.confirm(
        `Are you sure you want to (re)calculate rankings for "${title}"? This will process all submissions.`,
      )
    ) {
      return;
    }
    setCalculatingSlug(slug);
    try {
      // Calls POST /api/contests/:slug/calculate (Admin Auth Required)
      await API.post(`/contests/${slug}/calculate`, {});
      toast.success(`Rankings for "${title}" calculated!`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to calculate rankings.",
      );
    } finally {
      setCalculatingSlug(null);
    }
  };

  if (
    loading &&
    !contests.live.length &&
    !contests.upcoming.length &&
    !contests.past.length
  )
    return <LoadingSpinner />;

  // Helper to render a table for a contest category
  const renderContestTable = (
    title,
    icon,
    data,
    isActionableRankings = false,
  ) => (
    <section className="mb-12">
      <SectionHeader icon={icon} title={title} count={data.length} />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-[40%]">
                  Title
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-[20%]">
                  Start Time
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-[20%]">
                  End Time
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-right w-[20%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-sm font-medium text-zinc-500 bg-zinc-900/50"
                  >
                    No contests in this category.
                  </td>
                </tr>
              ) : (
                data.map((contest) => (
                  <tr
                    key={contest._id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/contests/edit/${contest.slug}`}
                        className="text-sm font-medium text-zinc-200 hover:text-red-400 transition-colors"
                      >
                        {contest.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {new Date(contest.startTime).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {new Date(contest.endTime).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Calculate Button (Only for Live/Past) */}
                        {isActionableRankings && (
                          <button
                            onClick={() =>
                              handleCalculate(contest.slug, contest.title)
                            }
                            disabled={calculatingSlug === contest.slug}
                            className="p-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-md hover:text-amber-400 hover:border-amber-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Calculate Rankings"
                          >
                            {calculatingSlug === contest.slug ? (
                              <FaSyncAlt
                                size={14}
                                className="animate-spin text-amber-500"
                              />
                            ) : (
                              <FaTrophy size={14} />
                            )}
                          </button>
                        )}

                        {/* Edit Button */}
                        <Link
                          to={`/admin/contests/edit/${contest.slug}`}
                          className="p-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-md hover:text-blue-400 hover:border-blue-500/50 transition-colors"
                          title="Edit Contest"
                        >
                          <FaEdit size={14} />
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={() =>
                            handleDelete(contest.slug, contest.title)
                          }
                          className="p-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-md hover:text-red-400 hover:border-red-500/50 transition-colors"
                          title="Delete Contest"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30">
      {/* Floating Back Button */}
      <button
        onClick={() => navigate(-1)} // or handleBack
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 font-medium rounded-full py-2 px-4 text-xs transition-colors hover:bg-zinc-800 hover:text-white shadow-lg"
      >
        <FaArrowLeft size={12} /> <span className="hidden sm:inline">Back</span>
      </button>
      <main className="pt-36 px-4 sm:px-6 lg:px-8 pb-20 max-w-7xl mx-auto">
        {/* Header & CTA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-zinc-800/60 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100 mb-2">
              Contest Management
            </h1>
            <p className="text-zinc-400 text-sm">
              Create, edit, and orchestrate official coding arenas.
            </p>
          </div>
          <Link
            to="/admin/contests/create"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-md py-2.5 px-5 transition-colors shadow-sm text-sm shrink-0 w-full md:w-auto justify-center"
          >
            <FaPlus size={12} /> Create New Contest
          </Link>
        </div>

        {/* Data Tables */}
        {renderContestTable(
          "Live Arenas",
          <FaPlay className="text-emerald-500 animate-pulse" />,
          contests.live,
          true,
        )}
        {renderContestTable(
          "Upcoming Battles",
          <FaCalendarAlt />,
          contests.upcoming,
          false,
        )}
        {renderContestTable(
          "Past Archives",
          <FaHistory />,
          contests.past,
          true,
        )}
      </main>
    </div>
  );
}
