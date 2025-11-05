import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx"; // Adjust path
import {
  FaArrowLeft,
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaPlay,
  FaCalendarAlt,
  FaHistory,
  FaTrophy,
  FaSyncAlt, // <-- Make sure FaTrophy & FaSyncAlt are imported
} from "react-icons/fa";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
  </div>
);

// --- Main Page Component ---
function AdminContestPage() {
  const [contests, setContests] = useState({
    upcoming: [],
    live: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // --- State to track which button is loading ---
  const [calculatingSlug, setCalculatingSlug] = useState(null);

  // Fetch all contests
  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${serverUrl}/api/contests`, {
        withCredentials: true,
      });
      setContests(data);
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
        `Are you sure you want to delete the contest "${title}"? This is irreversible.`
      )
    ) {
      return;
    }
    try {
      // Assumes DELETE /api/contests/:slug exists
      await axios.delete(`${serverUrl}/api/contests/${slug}`, {
        withCredentials: true,
      });
      toast.success(`Contest "${title}" deleted successfully.`);
      fetchContests(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete contest.");
    }
  };

  // --- Calculate Ranking Handler ---
  const handleCalculate = async (slug, title) => {
    if (
      !window.confirm(
        `Are you sure you want to (re)calculate rankings for "${title}"? This will process all submissions.`
      )
    ) {
      return;
    }
    setCalculatingSlug(slug); // Set loading for this specific row
    try {
      // Calls POST /api/contests/:slug/calculate
      const { data } = await axios.post(
        `${serverUrl}/api/contests/${slug}/calculate`,
        {},
        { withCredentials: true }
      );
      toast.success(`Rankings for "${title}" calculated!`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to calculate rankings."
      );
    } finally {
      setCalculatingSlug(null); // Reset loading
    }
  };

  if (
    loading &&
    !contests.live.length &&
    !contests.upcoming.length &&
    !contests.past.length
  )
    return <LoadingSpinner />;

  // --- Refined Theme Styles ---
  const cardStyle = `bg-black border border-orange-700/60 rounded-xl shadow-[0_0_30px_rgba(255,69,0,0.2)] 
                       transition-all duration-300 
                       hover:shadow-[0_0_45px_rgba(255,69,0,0.3)] hover:border-orange-600/80`;
  const headerStyle = `p-4 text-xs font-semibold text-orange-400 uppercase tracking-wider [text-shadow:0_0_10px_rgba(255,69,0,0.6)]`;
  const rowStyle = `border-t border-orange-800/50 transition-colors duration-200 hover:bg-orange-950/20`;
  const cellStyle = `p-4 text-sm align-middle`;
  const actionButtonStyle = `p-2 rounded transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed`;
  const editButtonStyle = `bg-blue-900/30 text-blue-300 border border-blue-600/60 shadow-[0_0_10px_rgba(59,130,246,0.4)] hover:bg-blue-800/50 hover:text-blue-200 focus:ring-blue-500`;
  const deleteButtonStyle = `bg-red-900/30 text-red-400 border border-red-600/60 shadow-[0_0_10px_rgba(255,0,0,0.4)] hover:bg-red-800/50 hover:text-red-300 focus:ring-red-500`;
  // --- New Button Style ---
  const calculateButtonStyle = `bg-green-900/30 text-green-300 border border-green-600/60 shadow-[0_0_10px_rgba(0,255,0,0.4)] hover:bg-green-800/50 hover:text-green-200 focus:ring-green-500`;

  const createButtonStyle = `flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg py-2 px-5 text-sm 
                               shadow-[0_0_20px_rgba(255,69,0,0.5)] 
                               transition-all duration-300 transform 
                               hover:from-orange-700 hover:to-red-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.7)] hover:scale-105`;

  // Helper to render a table for a contest category
  const renderContestTable = (title, icon, data) => (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-orange-500">{icon}</div>
        <h2 className="text-2xl font-bold text-white [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
          {title}{" "}
          <span className="ml-2 text-lg text-gray-500 font-normal">
            ({data.length})
          </span>
        </h2>
        <div className="flex-grow h-px bg-gradient-to-r from-orange-800/50 to-transparent"></div>
      </div>
      <div className={cardStyle}>
        <div className="overflow-x-auto relative">
          <table className="w-full text-left min-w-[700px]">
            <thead className="border-b-2 border-orange-700/60 bg-gradient-to-b from-black via-gray-950/80 to-black">
              <tr>
                <th className={headerStyle + " w-[30%]"}>Title</th>
                <th className={headerStyle + " w-[30%]"}>Start Time</th>
                <th className={headerStyle + " w-[30%]"}>End Time</th>
                <th className={headerStyle + " text-center"}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-8 text-center text-gray-500 italic"
                  >
                    No contests in this category.
                  </td>
                </tr>
              ) : (
                data.map((contest) => (
                  <tr key={contest._id} className={rowStyle}>
                    <td className={cellStyle + " text-white font-semibold"}>
                      <Link
                        to={`/admin/contests/edit/${contest.slug}`}
                        className="hover:text-orange-300 hover:underline"
                      >
                        {contest.title}
                      </Link>
                    </td>
                    <td className={cellStyle + " text-gray-400"}>
                      {new Date(contest.startTime).toLocaleString()}
                    </td>
                    <td className={cellStyle + " text-gray-400"}>
                      {new Date(contest.endTime).toLocaleString()}
                    </td>
                    <td className={cellStyle + " text-center"}>
                      {/* --- UPDATED ACTIONS --- */}
                      <div className="inline-flex gap-2">
                        <Link
                          to={`/admin/contests/edit/${contest.slug}`}
                          className={`${actionButtonStyle} ${editButtonStyle}`}
                          title="Edit Contest"
                        >
                          <FaEdit size={14} />
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(contest.slug, contest.title)
                          }
                          className={`${actionButtonStyle} ${deleteButtonStyle}`}
                          title="Delete Contest"
                        >
                          <FaTrashAlt size={14} />
                        </button>

                        {/* --- THIS IS THE NEW BUTTON --- */}
                        {(title === "Live Now" ||
                          title === "Past Contests") && (
                          <button
                            onClick={() =>
                              handleCalculate(contest.slug, contest.title)
                            }
                            disabled={calculatingSlug === contest.slug}
                            className={`${actionButtonStyle} ${calculateButtonStyle}`}
                            title="Calculate Rankings"
                          >
                            {calculatingSlug === contest.slug ? (
                              <FaSyncAlt size={14} className="animate-spin" />
                            ) : (
                              <FaTrophy size={14} />
                            )}
                          </button>
                        )}
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
    <>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)} // Go back (likely to profile)
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md 
                           border border-orange-600/40 shadow-[0_0_20px_rgba(255,69,0,0.25)] 
                           text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 
                           text-xs sm:text-sm transition-all duration-300 transform 
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] 
                           hover:text-orange-400 hover:scale-105"
      >
        <FaArrowLeft />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
              Manage Contests
            </h1>
            <Link to="/admin/contests/create" className={createButtonStyle}>
              <FaPlus />{" "}
              <span className="hidden sm:inline">Create New Contest</span>
            </Link>
          </div>

          {renderContestTable(
            "Live Now",
            <FaPlay size={20} className="text-green-500 animate-pulse" />,
            contests.live
          )}
          {renderContestTable(
            "Upcoming",
            <FaCalendarAlt size={20} className="text-blue-400" />,
            contests.upcoming
          )}
          {renderContestTable(
            "Past",
            <FaHistory size={20} className="text-gray-500" />,
            contests.past
          )}
        </div>
      </div>
    </>
  );
}

export default AdminContestPage;
