import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FaArrowLeft, FaRandom, FaSearch, FaBuilding,
  FaTimes, FaFire, FaChevronDown,
} from "react-icons/fa";
import { BsTagsFill } from "react-icons/bs";
import { IoIosLock } from "react-icons/io";
import API from "../../api/axios.js";

// ─── Loading Spinner (TUF Minimalist) ──────────────────────────────
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-zinc-950">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
  </div>
);

// ─── Difficulty Badge ──────────────────────────────────────────────
const DifficultyBadge = ({ difficulty }) => {
  const map = {
    Easy:        "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard:        "text-red-400 bg-red-500/10 border-red-500/20",
    "Super Hard":"text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[10px] uppercase tracking-widest font-bold ${map[difficulty] ?? "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
      {difficulty}
    </span>
  );
};

export default function ProblemListPage() {
  const [problems,           setProblems]           = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [difficultyFilter,   setDifficultyFilter]   = useState("All");
  const [selectedTags,       setSelectedTags]       = useState([]);
  const [searchQuery,        setSearchQuery]        = useState("");
  const [selectedCompany,    setSelectedCompany]    = useState("All");
  const [showTagDropdown,    setShowTagDropdown]    = useState(false);
  const [showCompanyDropdown,setShowCompanyDropdown]= useState(false);
  const [debounceTimeout,    setDebounceTimeout]    = useState(null);
  const [availableTags,      setAvailableTags]      = useState([]);
  const [loadingTags,        setLoadingTags]        = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [loadingCompanies,   setLoadingCompanies]   = useState(true);

  const navigate           = useNavigate();
  const { userData }       = useSelector((s) => s.user);
  const tagDropdownRef     = useRef(null);
  const companyDropdownRef = useRef(null);

  // ── Fetch Problems ──────────────────────────────────────────────
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (difficultyFilter !== "All") p.append("difficulty", difficultyFilter);
      if (selectedTags.length > 0)    p.append("tags", selectedTags.join(","));
      if (searchQuery.trim())          p.append("search", searchQuery.trim());
      if (selectedCompany !== "All")   p.append("company", selectedCompany);
      const { data } = await API.get(`/problems?${p}`);
      setProblems(data?.data || data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch problems.");
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [difficultyFilter, selectedTags, searchQuery, selectedCompany]);

  // ── Fetch Filters ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingTags(true);
        const { data } = await API.get("/tags/problems");
        setAvailableTags(data?.data || data || []);
      } catch { toast.error("Failed to load filter tags."); setAvailableTags([]); }
      finally   { setLoadingTags(false); }

      try {
        setLoadingCompanies(true);
        const { data } = await API.get("/tags/companies");
        setAvailableCompanies(["All", ...(data?.data || data || []).sort()]);
      } catch { toast.error("Failed to load company tags."); setAvailableCompanies(["All"]); }
      finally   { setLoadingCompanies(false); }
    })();
  }, []);

  // ── Debounced Fetch ─────────────────────────────────────────────
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const t = setTimeout(fetchProblems, 300);
    setDebounceTimeout(t);
    return () => clearTimeout(t);
  }, [difficultyFilter, selectedTags, searchQuery, selectedCompany, fetchProblems]);

  // ── Close Dropdowns on Outside Click ───────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (tagDropdownRef.current     && !tagDropdownRef.current.contains(e.target))     setShowTagDropdown(false);
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) setShowCompanyDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────
  const handleTagSelect      = (tag) => setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  const handleDifficultySelect = (d) => setDifficultyFilter(d);
  const handleSearchChange   = (e)   => setSearchQuery(e.target.value);
  const handleCompanySelect  = (c)   => { setSelectedCompany(c); setShowCompanyDropdown(false); };

  const handleProblemClick = (e, prob) => {
    if (!prob.isPremium) return;
    if (!userData) {
      e.preventDefault();
      toast.error("Login required to access Premium content.");
      navigate("/login");
      return;
    }
    const isPaid  = ["Warrior", "Gladiator"].includes(userData.subscriptionPlan);
    const isAdmin = ["admin",   "master"].includes(userData.role);
    if (!isPaid && !isAdmin) {
      e.preventDefault();
      toast.error("🔒 Premium Content! Upgrade to unlock.");
      navigate("/premium");
    }
  };

  const handlePickRandom = () => {
    if (problems.length > 0) navigate(`/problem/${problems[Math.floor(Math.random() * problems.length)].slug}`);
    else toast.error("No problems match filters!");
  };

  // ── Base Pill Style ──
  const basePillStyle = "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border cursor-pointer select-none";

  const diffPillActive = (d) => {
    if (difficultyFilter !== d) return `${basePillStyle} bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200`;
    return ({
      All:          `${basePillStyle} bg-zinc-200 border-zinc-300 text-zinc-900 shadow-sm`,
      Easy:         `${basePillStyle} bg-emerald-500/10 border-emerald-500/30 text-emerald-400`,
      Medium:       `${basePillStyle} bg-amber-500/10 border-amber-500/30 text-amber-400`,
      Hard:         `${basePillStyle} bg-red-500/10 border-red-500/30 text-red-400`,
      "Super Hard": `${basePillStyle} bg-purple-500/10 border-purple-500/30 text-purple-400`,
    })[d] ?? "";
  };

  const initialLoading = loading && !problems.length && !availableTags.length && availableCompanies.length <= 1;
  if (initialLoading) return <LoadingSpinner />;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30 overflow-hidden">

      {/* ── TOP NAV BAR (With Title & Daily Challenge) ── */}
      <header className="shrink-0 h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 flex items-center justify-between shadow-sm">
        
        {/* Left Side: Back + Title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
          >
            <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="uppercase hidden sm:inline">Home</span>
          </button>

          <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />

          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="ttext-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
              Ranbhoomi Problemset
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-red-500 leading-none mt-1 hidden sm:block">
              Master Data Structures & Algorithms
            </p>
          </div>
        </div>

        {/* Right Side: Daily Challenge Compact Pill */}
        <div className="flex items-center shrink-0">
          <div className="bg-zinc-900/80 border border-red-500/20 rounded-lg p-1.5 pr-2 pl-3 flex items-center gap-3 shadow-[0_0_15px_rgba(220,38,38,0.05)]">
            <FaFire className="text-red-500 animate-pulse" size={13} />
            <div className="hidden md:block min-w-0 max-w-[200px]">
              <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest mb-0.5 leading-none">
                Daily Challenge
              </p>
              <p className="text-zinc-100 text-xs font-semibold truncate leading-none">
                Solve the problem of the day
              </p>
            </div>
            <button className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors hover:bg-red-500 shadow-sm ml-1">
              Solve
            </button>
          </div>
        </div>

      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] mx-auto w-full">
        
        {/* ── FILTER COMMAND BAR ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 mb-5 shrink-0 shadow-sm">
          
          {/* Top Row: Difficulties + Random */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0 mr-2 hidden sm:block">
                Difficulty
              </span>
              {["All","Easy","Medium","Hard","Super Hard"].map((d) => (
                <button key={d} onClick={() => handleDifficultySelect(d)} className={diffPillActive(d)}>
                  {d}
                </button>
              ))}
            </div>
            <button onClick={handlePickRandom} className={`${basePillStyle} bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white`}>
              <FaRandom size={11} className="text-emerald-400" />
              <span className="hidden sm:inline">Pick Random</span>
            </button>
          </div>

          <div className="border-t border-zinc-800/60" />

          {/* Bottom Row: Search, Tags, Company */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none sm:w-72">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 text-sm text-zinc-100 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 placeholder:text-zinc-600 transition-all shadow-inner"
              />
            </div>

            {/* Tags Dropdown */}
            <div className="relative" ref={tagDropdownRef}>
              <button
                onClick={() => setShowTagDropdown((v) => !v)}
                disabled={loadingTags || availableTags.length === 0}
                className={`${basePillStyle} h-full justify-center w-full sm:w-auto ${selectedTags.length ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
              >
                <BsTagsFill size={12} /> Tags
                {selectedTags.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold">
                    {selectedTags.length}
                  </span>
                )}
                <FaChevronDown size={10} className={`ml-1 transition-transform duration-200 ${showTagDropdown ? "rotate-180" : ""}`} />
              </button>

              {showTagDropdown && !loadingTags && availableTags.length > 0 && (
                <div className="absolute top-full left-0 mt-2 z-30 w-64 max-h-64 overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                  {availableTags.map((tag) => (
                    <label key={tag} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagSelect(tag)}
                        className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 accent-red-500"
                      />
                      <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 capitalize">{tag.replace(/-/g, " ")}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Company Dropdown */}
            <div className="relative" ref={companyDropdownRef}>
              <button
                onClick={() => setShowCompanyDropdown((v) => !v)}
                disabled={loadingCompanies || availableCompanies.length <= 1}
                className={`${basePillStyle} h-full justify-center w-full sm:w-auto ${selectedCompany !== "All" ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
              >
                <FaBuilding size={11} /> 
                {selectedCompany === "All" ? "Company" : <span className="capitalize">{selectedCompany}</span>}
                <FaChevronDown size={10} className={`ml-1 transition-transform duration-200 ${showCompanyDropdown ? "rotate-180" : ""}`} />
              </button>

              {showCompanyDropdown && !loadingCompanies && availableCompanies.length > 1 && (
                <div className="absolute top-full left-0 mt-2 z-30 w-56 max-h-64 overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                  {availableCompanies.map((c) => (
                    <button 
                      key={c} 
                      onClick={() => handleCompanySelect(c)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium capitalize transition-colors ${
                        selectedCompany === c ? "bg-red-500/10 text-red-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      {c.replace(/-/g, " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Selected Tag Chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/40">
              {selectedTags.map((tag) => (
                <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-[10px] uppercase font-bold tracking-widest">
                  {tag.replace(/-/g, " ")}
                  <button onClick={() => handleTagSelect(tag)} className="text-zinc-600 hover:text-red-500 transition-colors">
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}
              <button onClick={() => setSelectedTags([])} className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-red-400 ml-2 transition-colors">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── TABLE SECTION ── */}
        <div className="flex-1 min-h-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col relative">
          
          {/* Table Header Info */}
          <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center shrink-0 z-10">
             <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
               {loading ? "Updating..." : `${problems.length} Problem${problems.length !== 1 ? "s" : ""}`}
             </p>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-x-0 bottom-0 top-[48px] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="w-8 h-8 border-2 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Scrollable Table Area */}
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap min-w-[700px]">
              
              <thead className="bg-zinc-950/80 border-b border-zinc-800 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-16 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Problem Title</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-32">Difficulty</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Tags</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/50">
                {!loading && problems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                          <FaSearch className="text-zinc-600" size={16} />
                        </div>
                        <p className="text-zinc-300 text-sm font-semibold">No challenges match your criteria.</p>
                        <button onClick={() => {setDifficultyFilter("All"); setSelectedTags([]); setSearchQuery(""); setSelectedCompany("All");}} className="text-red-400 text-xs font-medium hover:underline">
                          Reset all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  problems.map((prob, i) => (
                    <tr key={prob._id} className="hover:bg-zinc-800/40 transition-colors group">
                      
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs font-medium text-zinc-600 group-hover:text-zinc-400 transition-colors">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {prob.isPremium && (
                            <span title="Premium Required" className="shrink-0 flex items-center justify-center w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">
                              <IoIosLock size={12} />
                            </span>
                          )}
                          <Link
                            to={`/problem/${prob.slug}`}
                            onClick={(e) => handleProblemClick(e, prob)}
                            className="text-sm font-bold text-zinc-200 hover:text-red-400 transition-colors"
                          >
                            {prob.title}
                          </Link>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <DifficultyBadge difficulty={prob.difficulty} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {prob.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium bg-zinc-950 border-zinc-800 text-zinc-400 capitalize">
                              {tag}
                            </span>
                          ))}
                          {(prob.tags?.length ?? 0) > 3 && (
                            <span className="text-[10px] font-mono text-zinc-600 font-bold self-center px-1">
                              +{prob.tags.length - 3}
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
  );
}