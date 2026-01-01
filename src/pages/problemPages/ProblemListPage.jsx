import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import {
  FaArrowLeft,
  FaRandom,
  FaSearch,
  FaTimes,
  FaBuilding,
} from "react-icons/fa";
import { BsTagsFill } from "react-icons/bs";
import { IoIosLock } from "react-icons/io";

// --- Loading Spinner --- (Enhanced Glow)
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div
      className="w-24 h-24 border-[10px] border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_40px_rgba(255,69,0,0.8),inset_0_0_10px_rgba(255,69,0,0.5)]"
    ></div>
  </div>
);

// --- Difficulty Badge --- (Slightly enhanced glow)
const DifficultyBadge = ({ difficulty }) => {
  let colorClasses = "";
  // Sharper glows, slightly bolder text
  if (difficulty === "Easy") {
    colorClasses =
      "bg-green-700/20 text-green-300 border-green-600/60 shadow-[0_0_12px_rgba(0,255,0,0.4)]";
  } else if (difficulty === "Medium") {
    colorClasses =
      "bg-yellow-600/20 text-yellow-300 border-yellow-500/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]";
  } else if (difficulty === "Hard") {
    colorClasses =
      "bg-red-700/20 text-red-400 border-red-600/60 shadow-[0_0_12px_rgba(255,0,0,0.4)]";
  } else if (difficulty === "Super Hard") {
    colorClasses =
      "bg-purple-700/20 text-purple-300 border-purple-600/60 shadow-[0_0_12px_rgba(168,85,247,0.5)]";
  }
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}
    >
      {difficulty}
    </span>
  );
};
// --- Main Problem List Page Component ---
function ProblemListPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const tagDropdownRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // --- Fetch Problems ---
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

      const endpoint = `${serverUrl}/api/problems/getallproblem?${params.toString()}`;
      const { data } = await axios.get(endpoint, { withCredentials: true });
      setProblems(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch problems.");
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [difficultyFilter, selectedTags, searchQuery, selectedCompany]);

  // --- Fetch Tags & Companies ---
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

  // --- Trigger fetchProblems on Filter Change ---
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

  // --- Close Dropdowns ---
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

  // --- Event Handlers ---
  const handleTagSelect = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };
  const handleDifficultySelect = (diff) => {
    setDifficultyFilter(diff);
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
  };
  
  //  PREMIUM CLICK INTERCEPTOR 
  const handleProblemClick = (e, prob) => {
    // If NOT premium, let them pass
    if (!prob.isPremium) return;

    // If User NOT logged in -> Login
    if (!userData) {
      e.preventDefault();
      toast.info("Login required to access Premium content.");
      navigate("/login");
      return;
    }

    // Check Plan
    const isPaid = ["Warrior", "Gladiator"].includes(userData.subscriptionPlan);
    const isAdmin = ["admin", "master"].includes(userData.role);

    if (!isPaid && !isAdmin) {
      e.preventDefault(); // STOP NAVIGATION
      toast.warning("🔒 Premium Content! Upgrade to unlock.");
      navigate("/premium"); // REDIRECT TO PAY
    }
  };
  const handlePickRandom = () => {
    if (problems.length > 0) {
      const i = Math.floor(Math.random() * problems.length);
      navigate(`/problem/${problems[i].slug}`);
    } else {
      toast.info("No problems match filters!");
    }
  };

  const sortedTags = availableTags;

  const initialLoading =
    loading &&
    problems.length === 0 &&
    availableTags.length === 0 &&
    availableCompanies.length <= 1;
  if (initialLoading) return <LoadingSpinner />;

  // --- Godfather Theme Specific Styles ---
  const filterContainerStyle = `mb-6 p-4 bg-black border border-orange-700/50 rounded-xl
                                 shadow-[0_0_30px_rgba(255,69,0,0.2),inset_0_1px_4px_rgba(0,0,0,0.7)] space-y-4`; // Added inset shadow
  // More defined filter buttons
  const filterButtonStyle = `px-3 py-1 bg-gradient-to-b from-gray-900 to-black border border-gray-700/60 text-gray-400 text-xs font-semibold rounded
                              hover:bg-gray-800/80 hover:text-orange-400 hover:border-orange-600/60
                              transition-colors duration-200 flex items-center gap-1.5
                              shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]`;
  // Stronger active filter glow
  const filterButtonActiveStyle = `!bg-orange-900/40 !border-orange-500/80 !text-orange-300
                                     !shadow-[inset_0_1px_2px_rgba(255,100,0,0.4),0_0_12px_rgba(255,69,0,0.6)]`;
  // Darker dropdown with intense shadow
  const dropdownStyle = `absolute top-full left-0 mt-1.5 z-20 w-64 max-h-60 overflow-y-auto
                           bg-gradient-to-b from-black via-gray-950 to-black
                           border border-orange-600/80 rounded-lg
                           shadow-[0_10px_50px_rgba(255,69,0,0.5)] p-2 space-y-0.5`;
  // Main table container with imposing shadow
  const tableContainerStyle = `bg-black border border-orange-700/60 shadow-[0_0_50px_rgba(255,69,0,0.35)]
                                rounded-xl overflow-hidden transition-all duration-300 relative`;
  // Darker table header, sharper text shadow
  const tableHeaderStyle = `p-3 text-sm font-bold text-orange-400 uppercase tracking-wider
                             [text-shadow:0_0_12px_rgba(255,69,0,0.7)]`;
  // More pronounced gradient row hover
  const tableRowStyle = `border-t border-orange-800/40 transition-colors duration-200
                          hover:bg-gradient-to-r hover:from-black hover:via-orange-950/30 hover:to-black`;
  const tableCellStyle = `p-3 text-sm`;
  // Sharper title link glow
  const titleLinkStyle = `text-white font-semibold hover:text-orange-300 hover:underline
                           transition-colors [text-shadow:0_0_8px_rgba(255,255,255,0.4)]`;
  // Darker tag span
  const tagSpanStyle = `inline-block px-2.5 py-1 bg-black border border-orange-700/60 text-gray-300
                       rounded shadow-[0_0_8px_rgba(255,100,0,0.3)]
                       text-[11px] font-semibold whitespace-nowrap
                       transition-all duration-200
                       hover:bg-orange-950/40 hover:border-orange-600/80 hover:text-orange-300 hover:shadow-[0_0_12px_rgba(255,100,0,0.4)]`;

  return (
    <>
      {/* Enhanced Back Button */}
      <button
        onClick={() => navigate(-1)}
        className={`fixed top-24 left-4 sm:left-6 z-40 ${filterButtonStyle} !py-1.5 !px-3 sm:!px-4 !rounded-full !text-orange-500 hover:!text-orange-300 !border-orange-700/60 hover:!border-orange-500 hover:!shadow-[0_0_20px_rgba(255,69,0,0.6)]`}
      >
        {" "}
        <FaArrowLeft /> <span className="hidden sm:inline">Back</span>{" "}
      </button>

      <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-4xl font-black text-white [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
              {" "}
              Problemset{" "}
            </h1>
            {/* Enhanced Daily Problem Card */}
            <div className="w-full md:w-auto bg-gradient-to-br from-black via-gray-950 to-black border border-orange-700/50 shadow-[0_0_25px_rgba(255,69,0,0.4)] rounded-xl p-3 px-4 flex items-center justify-between gap-4 md:min-w-[300px]">
              <div>
                <p className="text-sm text-orange-400 font-semibold [text-shadow:0_0_10px_rgba(255,69,0,0.5)]">
                  Daily Challenge
                </p>
                <p className="text-white text-sm font-medium truncate">
                  Placeholder Problem Title
                </p>
              </div>
              <button className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-md hover:bg-orange-700 transition-colors shadow-[0_0_15px_rgba(255,69,0,0.6)] hover:shadow-[0_0_25px_rgba(255,69,0,0.8)] transform hover:scale-105">
                {" "}
                Solve{" "}
              </button>
            </div>
          </div>

          {/* --- Enhanced & Responsive Filter Section --- */}
          <div className={filterContainerStyle}>
            {/* Row 1: Difficulty & Pick Random */}
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
              <button
                onClick={handlePickRandom}
                className={`${filterButtonStyle} ml-auto sm:ml-4 !bg-purple-950/50 !border-purple-600/60 !text-purple-300 hover:!bg-purple-800/60 hover:!text-purple-200 hover:!border-purple-500 hover:!shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0`}
              >
                {" "}
                <FaRandom /> <span className="hidden sm:inline">
                  Pick One
                </span>{" "}
              </button>
            </div>

            {/* Row 2: Search, Tags, Company (Stacks on mobile) */}
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
          
          
          {/* Enhanced Table Container */}
          <div className={tableContainerStyle}>
            {loading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10">
                {" "}
                <div className="w-12 h-12 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>{" "}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="border-b-2 border-orange-700/50 bg-gradient-to-b from-black via-gray-950/70 to-black sticky top-0 z-0">
                  <tr>
                    <th className={tableHeaderStyle + " w-[50%]"}>Title</th>
                    <th className={tableHeaderStyle}>Difficulty</th>
                    <th className={tableHeaderStyle}>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && problems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-10 text-center text-gray-500 text-xl italic font-semibold"
                      >
                        No problems match the current filters.
                      </td>
                    </tr>
                  ) : (
                    problems.map((prob) => (
                      <tr
                        key={prob._id}
                        className={
                          tableRowStyle + ` ${loading ? "opacity-30" : ""}`
                        }
                      >
                        <td className={tableCellStyle}>
                          {/* 1. Add this wrapper div with flexbox */}
                          <div className="flex items-center gap-1.5">
                            {" "}
                            {/* Adjust gap-X as needed */}
                            {prob.isPremium && (
                              <span
                                title="Premium Problem"
                                className="text-yellow-400 text-xs shrink-0 [text-shadow:0_0_8px_rgba(255,215,0,0.7)] "
                              >
                                <IoIosLock className="w-5 h-5"/>{" "}
                                
                              </span>
                            )}
                            <Link
                              to={`/problem/${prob.slug}`}
                              onClick={(e) => handleProblemClick(e, prob)}
                              className={titleLinkStyle}
                            >
                              {prob.title}
                            </Link>
                            {/* 2. Keep the conditional rendering inside the flex container */}
                            
                          </div>
                        </td>
                        <td className={tableCellStyle}>
                          <DifficultyBadge difficulty={prob.difficulty} />
                        </td>
                        <td className={tableCellStyle}>
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {prob.tags?.slice(0, 3).map((tag) => (
                              <span key={tag} className={tagSpanStyle}>
                                {" "}
                                {tag}{" "}
                              </span>
                            ))}
                            {(prob.tags?.length || 0) > 3 && (
                              <span className="text-gray-500 text-xs font-semibold">
                                ...
                              </span>
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
        </div>
      </div>
    </>
  );
}

export default ProblemListPage;
