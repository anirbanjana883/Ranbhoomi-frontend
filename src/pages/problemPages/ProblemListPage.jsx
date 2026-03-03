import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaArrowLeft, FaRandom, FaSearch, FaBuilding ,FaTimes} from "react-icons/fa";
import { BsTagsFill } from "react-icons/bs";
import { IoIosLock } from "react-icons/io";
import API from "../../api/axios.js";

// --- Loading Spinner --- 
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
  </div>
);

// --- Difficulty Badge --- (Clean, flat translucent style)
const DifficultyBadge = ({ difficulty }) => {
  let colorClasses = "";
  if (difficulty === "Easy") {
    colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (difficulty === "Medium") {
    colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (difficulty === "Hard") {
    colorClasses = "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (difficulty === "Super Hard") {
    colorClasses = "bg-purple-500/10 text-purple-400 border-purple-500/20";
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${colorClasses}`}>
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
      if (difficultyFilter !== "All") params.append("difficulty", difficultyFilter);
      if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedCompany !== "All") params.append("company", selectedCompany);

      const { data } = await API.get(`/problems?${params.toString()}`);
      const problemsArray = data?.data || data || [];
      setProblems(problemsArray);
    } catch (err) {
      console.error("Fetch Error:", err);
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
        const { data } = await API.get("/tags/problems");
        const tagsArray = data?.data || data || [];
        setAvailableTags(tagsArray);
      } catch (err) {
        toast.error("Failed to load filter tags.");
        setAvailableTags([]);
      } finally {
        setLoadingTags(false);
      }

      try {
        setLoadingCompanies(true);
        const { data } = await API.get("/tags/companies");
        const companyArray = data?.data || data || [];
        setAvailableCompanies(["All", ...companyArray.sort()]);
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
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const newTimeout = setTimeout(() => {
      fetchProblems();
    }, 300);
    setDebounceTimeout(newTimeout);
    return () => clearTimeout(newTimeout);
  }, [difficultyFilter, selectedTags, searchQuery, selectedCompany, fetchProblems]);

  // --- Close Dropdowns ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target))
        setShowTagDropdown(false);
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target))
        setShowCompanyDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tagDropdownRef, companyDropdownRef]);

  // --- Event Handlers ---
  const handleTagSelect = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };
  const handleDifficultySelect = (diff) => setDifficultyFilter(diff);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
  };

  // PREMIUM CLICK INTERCEPTOR
  const handleProblemClick = (e, prob) => {
    if (!prob.isPremium) return;
    if (!userData) {
      e.preventDefault();
      toast.info("Login required to access Premium content.");
      navigate("/login");
      return;
    }
    const isPaid = ["Warrior", "Gladiator"].includes(userData.subscriptionPlan);
    const isAdmin = ["admin", "master"].includes(userData.role);

    if (!isPaid && !isAdmin) {
      e.preventDefault();
      toast.warning("🔒 Premium Content! Upgrade to unlock.");
      navigate("/premium");
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

  const initialLoading = loading && problems.length === 0 && availableTags.length === 0 && availableCompanies.length <= 1;
  if (initialLoading) return <LoadingSpinner />;

  // ---  Theme Specific Styles ---
  const filterContainerStyle = `mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-4`;
  const filterButtonStyle = `px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-md hover:bg-zinc-700 hover:text-zinc-100 transition-colors duration-200 flex items-center gap-2`;
  const filterButtonActiveStyle = `!bg-zinc-100 !text-zinc-900 !border-zinc-100 font-semibold`;
  
  const dropdownStyle = `absolute top-full left-0 mt-2 z-20 w-64 max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1.5 space-y-0.5 custom-scrollbar`;
  const tableContainerStyle = `bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative`;
  const tableHeaderStyle = `p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800`;
  const tableRowStyle = `border-b border-zinc-800/50 transition-colors duration-150 hover:bg-zinc-800/50`;
  const tableCellStyle = `p-4 text-sm`;
  const titleLinkStyle = `text-zinc-100 font-medium hover:text-red-400 transition-colors`;
  const tagSpanStyle = `inline-block px-2.5 py-1 bg-zinc-800 border border-zinc-700/50 text-zinc-300 rounded-md text-[10px] font-medium whitespace-nowrap`;

  return (
    <>
      {/* Clean Back Button */}
      <button
        onClick={() => navigate(-1)}
        className={`fixed top-24 left-4 sm:left-6 z-40 px-4 py-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-zinc-300 text-sm font-medium rounded-full hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2 shadow-lg`}
      >
        <FaArrowLeft size={12} /> <span className="hidden sm:inline">Back</span>
      </button>

      <div className="min-h-screen bg-zinc-950 text-zinc-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 font-sans">
        <div className="max-w-screen-xl mx-auto">
          
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Problemset
            </h1>
            
            {/* Minimal Daily Problem Card */}
            <div className="w-full md:w-auto bg-zinc-900 border border-zinc-800 rounded-xl p-3 px-5 flex items-center justify-between gap-6 md:min-w-[320px]">
              <div>
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-0.5">
                  Daily Challenge
                </p>
                <p className="text-white text-sm font-medium truncate">
                  Placeholder Problem Title
                </p>
              </div>
              <button className="bg-red-600 text-white text-xs font-semibold px-4 py-1.5 rounded-md hover:bg-red-500 transition-colors">
                Solve
              </button>
            </div>
          </div>

          {/* --- Filter Section --- */}
          <div className={filterContainerStyle}>
            {/* Row 1: Difficulty & Pick Random */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-zinc-500 mr-1 shrink-0">
                Difficulty
              </span>
              <div className="flex flex-wrap items-center gap-2 flex-grow">
                {["All", "Easy", "Medium", "Hard", "Super Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultySelect(diff)}
                    className={`${filterButtonStyle} ${difficultyFilter === diff ? filterButtonActiveStyle : ""}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePickRandom}
                className={`${filterButtonStyle} ml-auto shrink-0 hover:!bg-zinc-800 hover:!text-white`}
              >
                <FaRandom size={12} /> <span className="hidden sm:inline">Pick Random</span>
              </button>
            </div>

            {/* Row 2: Search, Tags, Company */}
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 pt-3 border-t border-zinc-800/60">
              {/* Search */}
              <div className="relative w-full md:w-auto md:flex-grow lg:flex-grow-0 lg:w-64">
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 text-sm text-white rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-zinc-600"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
              </div>

              {/* Tags Dropdown */}
              <div className="relative w-full md:w-auto" ref={tagDropdownRef}>
                <button
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  disabled={loadingTags || sortedTags.length === 0}
                  className={`w-full md:w-auto py-2 ${filterButtonStyle} justify-center disabled:opacity-50 ${selectedTags.length > 0 ? "!bg-zinc-800 !text-white !border-zinc-600" : ""}`}
                >
                  <BsTagsFill /> Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  <span className={`text-[10px] ml-1 transition-transform ${showTagDropdown ? "rotate-180" : ""}`}>▼</span>
                </button>
                {showTagDropdown && !loadingTags && sortedTags.length > 0 && (
                  <div className={`${dropdownStyle} md:absolute md:left-0`}>
                    {sortedTags.map((tag) => (
                      <label key={tag} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagSelect(tag)}
                          className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-900"
                        />
                        <span className="text-sm text-zinc-300 capitalize">{tag.replace(/-/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Company Dropdown */}
              <div className="relative w-full md:w-auto" ref={companyDropdownRef}>
                <button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  disabled={loadingCompanies || availableCompanies.length <= 1}
                  className={`w-full md:w-auto py-2 ${filterButtonStyle} justify-center disabled:opacity-50 ${selectedCompany !== "All" ? "!bg-zinc-800 !text-white !border-zinc-600" : ""}`}
                >
                  <FaBuilding /> {selectedCompany === "All" ? "Company" : <span className="capitalize">{selectedCompany}</span>}
                  <span className={`text-[10px] ml-1 transition-transform ${showCompanyDropdown ? "rotate-180" : ""}`}>▼</span>
                </button>
                {showCompanyDropdown && !loadingCompanies && availableCompanies.length > 1 && (
                  <div className={`${dropdownStyle} md:absolute md:left-0`}>
                    {availableCompanies.map((comp) => (
                      <button
                        key={comp}
                        onClick={() => handleCompanySelect(comp)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${selectedCompany === comp ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                      >
                        {comp.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {selectedTags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 text-zinc-200 rounded-md text-xs border border-zinc-700">
                    {tag.replace(/-/g, " ")}
                    <button onClick={() => handleTagSelect(tag)} className="text-zinc-500 hover:text-red-400 ml-1">
                      <FaTimes size={10} />
                    </button>
                  </span>
                ))}
                <button onClick={() => setSelectedTags([])} className="text-zinc-500 hover:text-red-400 text-xs ml-2 font-medium underline underline-offset-2">
                  Clear all
                </button>
              </div>
            )}
          </div>
          
          {/* Enhanced Table Container */}
          <div className={tableContainerStyle}>
            {loading && (
              <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-zinc-900/80 sticky top-0 z-0">
                  <tr>
                    <th className={tableHeaderStyle + " w-[45%]"}>Title</th>
                    <th className={tableHeaderStyle}>Difficulty</th>
                    <th className={tableHeaderStyle}>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && problems.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-zinc-500 text-sm">
                        No problems match the current filters.
                      </td>
                    </tr>
                  ) : (
                    problems.map((prob) => (
                      <tr key={prob._id} className={tableRowStyle + ` ${loading ? "opacity-50" : ""}`}>
                        <td className={tableCellStyle}>
                          <div className="flex items-center gap-2">
                            {prob.isPremium && (
                              <span title="Premium Problem" className="text-amber-500 shrink-0">
                                <IoIosLock className="w-4 h-4" />
                              </span>
                            )}
                            <Link
                              to={`/problem/${prob.slug}`}
                              onClick={(e) => handleProblemClick(e, prob)}
                              className={titleLinkStyle}
                            >
                              {prob.title}
                            </Link>
                          </div>
                        </td>
                        <td className={tableCellStyle}>
                          <DifficultyBadge difficulty={prob.difficulty} />
                        </td>
                        <td className={tableCellStyle}>
                          <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                            {prob.tags?.slice(0, 3).map((tag) => (
                              <span key={tag} className={tagSpanStyle}>
                                {tag}
                              </span>
                            ))}
                            {(prob.tags?.length || 0) > 3 && (
                              <span className="text-zinc-500 text-xs font-medium self-center ml-1">
                                +{(prob.tags.length - 3)}
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