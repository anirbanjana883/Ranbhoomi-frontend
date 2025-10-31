import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx"; // Corrected path
import {
  FaArrowLeft,
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaSearch,
  FaBuilding,
} from "react-icons/fa";
import { BsTagsFill } from "react-icons/bs"; // Import tag icon

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_30px_rgba(255,69,0,0.7),inset_0_0_8px_rgba(255,69,0,0.4)]"></div>
  </div>
);

// --- Difficulty Badge ---
const DifficultyBadge = ({ difficulty }) => {
  let colorClasses = "";
  if (difficulty === "Easy")
    colorClasses =
      "bg-green-700/20 text-green-300 border-green-600/60 shadow-[0_0_12px_rgba(0,255,0,0.4)]";
  else if (difficulty === "Medium")
    colorClasses =
      "bg-yellow-600/20 text-yellow-300 border-yellow-500/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]";
  else if (difficulty === "Hard")
    colorClasses =
      "bg-red-700/20 text-red-400 border-red-600/60 shadow-[0_0_12px_rgba(255,0,0,0.4)]";
  else if (difficulty === "Super Hard")
    colorClasses =
      "bg-purple-700/20 text-purple-300 border-purple-600/60 shadow-[0_0_12px_rgba(168,85,247,0.5)]";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}
    >
      {" "}
      {difficulty}{" "}
    </span>
  );
};

// --- Main Page Component ---
function ProblemManagementPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Filter States --- (Copied from ProblemListPage)
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const tagDropdownRef = useRef(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef(null);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Fetch problems based on filters
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficultyFilter !== "All")
        params.append("difficulty", difficultyFilter);
      if (selectedTags.length > 0)
        params.append("tags", selectedTags.join(","));
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedCompany !== "All") params.append("company", selectedCompany);
      // Fetch ALL fields needed for management, filtering happens via query params
      const endpoint = `${serverUrl}/api/problems/getallproblem?${params.toString()}`;
      const { data } = await axios.get(
        `${serverUrl}/api/problems/admin/all?${params.toString()}`,
        { withCredentials: true }
      );
      setProblems(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch problems.");
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [difficultyFilter, selectedTags, searchQuery, selectedCompany]); // Dependencies for refetching

  // Fetch available tags for filter dropdown
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingTags(true);
        const { data } = await axios.get(`${serverUrl}/api/tags/problems`, {
          withCredentials: true,
        });
        setAvailableTags(data);
      } catch (err) {
        toast.error("Failed to load filter tags.");
        setAvailableTags([]);
      } finally {
        setLoadingTags(false);
      }

      try {
        setLoadingCompanies(true);
        const { data } = await axios.get(`${serverUrl}/api/tags/companies`, {
          withCredentials: true,
        });
        setAvailableCompanies(["All", ...data.sort()]);
      } catch (err) {
        toast.error("Failed to load company tags.");
        setAvailableCompanies(["All"]);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchFilters();
  }, []);

  // Trigger fetchProblems when filters change (with debounce)
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const newTimeout = setTimeout(() => {
      fetchProblems();
    }, 300);
    setDebounceTimeout(newTimeout);
    return () => clearTimeout(newTimeout);
  }, [
    difficultyFilter,
    selectedTags,
    searchQuery,
    selectedCompany,
    fetchProblems,
  ]);

  // Close Tag Dropdown on Outside Click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target)
      )
        setShowTagDropdown(false);
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target)
      )
        setShowCompanyDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tagDropdownRef, companyDropdownRef]);

  // --- Delete Handler ---
  const handleDelete = async (slug, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the problem "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await axios.delete(`${serverUrl}/api/problems/deleteproblem/${slug}`, {
        withCredentials: true,
      });
      toast.success(`Problem "${title}" deleted successfully.`);

      fetchProblems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete problem.");
    }
  };
  // --- Event Handlers for Filters ---
  const handleTagSelect = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
  };
  const handleDifficultySelect = (diff) => {
    setDifficultyFilter(diff);
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const sortedTags = availableTags; // Assumes backend sends sorted
  const initialLoading =
    loading && problems.length === 0 && availableTags.length === 0;
  if (initialLoading) return <LoadingSpinner />;

  // --- Enhanced Theme Styles ---
  const filterContainerStyle = `mb-6 p-3 sm:p-4 bg-black border border-orange-800/50 rounded-xl shadow-[0_0_30px_rgba(255,69,0,0.2),inset_0_1px_4px_rgba(0,0,0,0.7)] space-y-3`;
  const filterButtonStyle = `px-3 py-1.5 bg-gradient-to-b from-gray-900 to-black border border-gray-700/60 text-gray-400 text-xs font-semibold rounded hover:bg-gray-800/80 hover:text-orange-400 hover:border-orange-600/60 transition-colors duration-200 flex items-center gap-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]`;
  const filterButtonActiveStyle = `!bg-gradient-to-b !from-orange-900/50 !to-black !border-orange-500/80 !text-orange-300 !shadow-[inset_0_1px_2px_rgba(255,100,0,0.4),0_0_12px_rgba(255,69,0,0.6)]`;
  const dropdownStyle = `absolute top-full left-0 mt-1.5 z-20 w-64 max-h-60 overflow-y-auto bg-gradient-to-b from-black via-gray-950 to-black border border-orange-600/80 rounded-lg shadow-[0_10px_50px_rgba(255,69,0,0.5)] p-2 space-y-0.5`;
  const cardStyle = `bg-gradient-to-br from-black via-gray-950 to-black border border-orange-700/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(255,69,0,0.3)]`;
  const headerStyle = `p-4 text-xs font-semibold text-orange-400 uppercase tracking-wider [text-shadow:0_0_10px_rgba(255,69,0,0.6)]`;
  const rowStyle = `border-t border-orange-800/50 transition-colors duration-200 hover:bg-orange-950/20`;
  const cellStyle = `p-4 text-sm align-middle`;
  const actionButtonStyle = `p-2 rounded transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black`;
  const editButtonStyle = `bg-blue-900/30 text-blue-300 border border-blue-600/60 shadow-[0_0_10px_rgba(59,130,246,0.4)] hover:bg-blue-800/50 hover:text-blue-200 focus:ring-blue-500`;
  const deleteButtonStyle = `bg-red-900/30 text-red-400 border border-red-600/60 shadow-[0_0_10px_rgba(255,0,0,0.4)] hover:bg-red-800/50 hover:text-red-300 focus:ring-red-500`;
  const createButtonStyle = `flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg py-2 px-5 text-sm shadow-[0_0_20px_rgba(255,69,0,0.5)] transition-all duration-300 transform hover:from-orange-700 hover:to-red-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.7)] hover:scale-105`;

  return (
    <>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className={`fixed top-24 left-4 sm:left-6 z-40 ${filterButtonStyle} !py-1.5 !px-3 sm:!px-4 !rounded-full !text-orange-500 hover:!text-orange-300 !border-orange-700/60 hover:!border-orange-500 hover:!shadow-[0_0_20px_rgba(255,69,0,0.6)]`}
      >
        {" "}
        <FaArrowLeft /> <span className="hidden sm:inline">Back</span>{" "}
      </button>

      <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-screen-xl mx-auto">
          {" "}
          {/* Wider container */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
              Manage Problems
            </h1>
            <Link to="/admin/problems/create" className={createButtonStyle}>
              <FaPlus />{" "}
              <span className="hidden sm:inline">Create New Problem</span>
            </Link>
          </div>
          {/* --- Filter Section --- */}
          <div className={filterContainerStyle}>
            {/* Row 1: Difficulty */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-400 mr-1 sm:mr-2 shrink-0">
                Difficulty:
              </span>
              <div className="flex flex-wrap items-center gap-2 flex-grow justify-start">
                {["All", "Easy", "Medium", "Hard", "Super Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultySelect(diff)}
                    className={`${filterButtonStyle} ${
                      difficultyFilter === diff ? filterButtonActiveStyle : ""
                    }`}
                  >
                    {" "}
                    {diff}{" "}
                  </button>
                ))}
              </div>
            </div>

            {/*  Search & Tags  */}
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 pt-4 border-t border-gray-800/70">
              {/* Search: Full width on mobile */}
              <div className="relative w-full md:w-auto md:flex-grow lg:flex-grow-0 lg:w-60">
                <input
                  type="text"
                  placeholder="Search title..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-950 text-xs text-white rounded border border-gray-700 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_18px_rgba(255,69,0,0.5)] transition-all"
                />
                <FaSearch
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                  size={12}
                />
              </div>

              {/* Tags: Full width button on mobile */}
              <div className="relative w-full md:w-auto" ref={tagDropdownRef}>
                <button
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  disabled={loadingTags || sortedTags.length === 0}
                  className={`w-full md:w-auto ${filterButtonStyle} justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
                    selectedTags.length > 0 ? filterButtonActiveStyle : ""
                  }`}
                >
                  {" "}
                  <BsTagsFill /> Tags{" "}
                  {selectedTags.length > 0 && `(${selectedTags.length})`}{" "}
                  <span
                    className={`text-[10px] transition-transform duration-200 ${
                      showTagDropdown ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>{" "}
                </button>
                {showTagDropdown && !loadingTags && sortedTags.length > 0 && (
                  <div className={`${dropdownStyle} md:absolute md:left-0`}>
                    {" "}
                    {sortedTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-orange-800/40 cursor-pointer transition-colors"
                      >
                        {" "}
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagSelect(tag)}
                          className="form-checkbox h-3.5 w-3.5 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-600/60 focus:ring-offset-0 focus:ring-offset-black"
                        />{" "}
                        <span className="text-xs text-gray-300 capitalize">
                          {tag.replace(/-/g, " ")}
                        </span>{" "}
                      </label>
                    ))}{" "}
                  </div>
                )}
              </div>
              {/* Company: Full width button on mobile */}
              <div
                className="relative w-full md:w-auto"
                ref={companyDropdownRef}
              >
                <button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  disabled={loadingCompanies || availableCompanies.length <= 1}
                  className={`w-full md:w-auto ${filterButtonStyle} justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
                    selectedCompany !== "All" ? filterButtonActiveStyle : ""
                  }`}
                >
                  {" "}
                  <FaBuilding />{" "}
                  {selectedCompany === "All" ? (
                    "Company"
                  ) : (
                    <span className="capitalize">{selectedCompany}</span>
                  )}{" "}
                  <span
                    className={`text-[10px] transition-transform duration-200 ${
                      showCompanyDropdown ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>{" "}
                </button>
                {showCompanyDropdown &&
                  !loadingCompanies &&
                  availableCompanies.length > 1 && (
                    <div className={`${dropdownStyle} md:absolute md:left-0`}>
                      {" "}
                      {availableCompanies.map((comp) => (
                        <button
                          key={comp}
                          onClick={() => handleCompanySelect(comp)}
                          className={`w-full text-left px-3 py-1.5 rounded text-xs capitalize transition-colors ${
                            selectedCompany === comp
                              ? "bg-orange-800/70 text-orange-300 font-semibold"
                              : "text-gray-300 hover:bg-orange-800/40"
                          }`}
                        >
                          {" "}
                          {comp.replace(/-/g, " ")}{" "}
                        </button>
                      ))}{" "}
                    </div>
                  )}
              </div>
            </div>
            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-800/70">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-950/60 text-orange-300 rounded-full text-[11px] border border-orange-700/60 shadow-sm"
                  >
                    {" "}
                    {tag.replace(/-/g, " ")}{" "}
                    <button
                      onClick={() => handleTagSelect(tag)}
                      className="text-orange-500 hover:text-red-400 font-bold -mr-1"
                    >
                      &times;
                    </button>{" "}
                  </span>
                ))}
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-gray-500 hover:text-red-500 text-xs ml-2 font-semibold"
                >
                  [Clear Tags]
                </button>
              </div>
            )}
          </div>
          {/* --- End Filter Section --- */}
          <div className={cardStyle}>
            <div className="overflow-x-auto relative">
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
                </div>
              )}

              <table className="w-full text-left min-w-[700px]">
                <thead className="border-b-2 border-orange-700/60 bg-gradient-to-b from-black via-gray-950/80 to-black sticky top-0 z-0">
                  <tr>
                    <th className={headerStyle + " w-[45%]"}>Title</th>
                    <th className={headerStyle}>Difficulty</th>
                    <th className={headerStyle}>Status</th>
                    <th className={headerStyle}>Tags</th>
                    <th className={headerStyle + " text-center"}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && problems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-10 text-center text-gray-500 text-xl italic font-semibold"
                      >
                        No problems match filters.
                      </td>
                    </tr>
                  ) : (
                    problems.map((prob) => (
                      <tr
                        key={prob._id}
                        className={rowStyle + ` ${loading ? "opacity-30" : ""}`}
                      >
                        <td className={cellStyle + " text-white font-semibold"}>
                          {prob.title}
                        </td>
                        <td className={cellStyle}>
                          <DifficultyBadge difficulty={prob.difficulty} />
                        </td>

                        <td className={cellStyle}>
                          {prob.isPublished ? (
                            <span className="px-2 py-0.5 bg-green-700/20 text-green-300 border border-green-600/60 rounded text-xs font-semibold">
                              Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-700/20 text-purple-300 border border-purple-600/60 rounded text-xs font-semibold">
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className={cellStyle}>
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {prob.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-800/70 border border-gray-700/50 text-gray-200 rounded text-[11px] whitespace-nowrap"
                              >
                                {tag}
                              </span>
                            ))}
                            {(prob.tags?.length || 0) > 2 && (
                              <span className="text-gray-500 text-xs font-semibold">
                                ...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={cellStyle + " text-center"}>
                          <div className="inline-flex gap-2">
                            <Link
                              to={`/admin/problems/edit/${prob.slug}`}
                              className={`${actionButtonStyle} ${editButtonStyle}`}
                              title="Edit Problem"
                            >
                              {" "}
                              <FaEdit size={14} />{" "}
                            </Link>
                            <button
                              onClick={() =>
                                handleDelete(prob.slug, prob.title)
                              }
                              className={`${actionButtonStyle} ${deleteButtonStyle}`}
                              title="Delete Problem"
                            >
                              {" "}
                              <FaTrashAlt size={14} />{" "}
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
        </div>
      </div>
    </>
  );
}

export default ProblemManagementPage;
