import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { serverUrl } from "../../App.jsx";
import {
  FaArrowLeft, FaTrashAlt, FaSave,
  FaSearch, FaEyeSlash, FaPlus,
} from "react-icons/fa";

/* ─── Helpers ──────────────────────────────────────────────────────── */
const getLocalDate = () => new Date().toISOString().split("T")[0];
const hours   = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

const DIFF_STYLES = {
  Easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hard:   "text-red-400 bg-red-500/10 border-red-500/20",
};

/* ─── Shared classes ───────────────────────────────────────────────── */
const inputCls =
  "w-full px-3 py-2 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-lg text-sm " +
  "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 " +
  "transition-colors placeholder:text-zinc-600";

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: "right .4rem center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "1.4em 1.4em",
  paddingRight: "2rem",
};

/* ─── Field wrapper ────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">{label}</label>
    {children}
  </div>
);

/* ─── Problem Selector ─────────────────────────────────────────────── */
const ProblemSelector = ({ allProblems, selectedProblems, onAdd, onRemove }) => {
  const [search, setSearch]   = useState("");
  const [open,   setOpen]     = useState(false);

  const filtered = allProblems.filter(
    p =>
      !selectedProblems.some(s => s._id === p._id) &&
      p.isPublished === false &&
      p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      {/* Search */}
      <div className="relative shrink-0">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={11} />
        <input
          type="text"
          placeholder="Search unpublished problems…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={inputCls + " pl-9"}
        />
        {open && (
          <div className="absolute z-30 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.length > 0 ? filtered.map(p => (
              <button
                key={p._id}
                type="button"
                onMouseDown={() => { onAdd(p); setSearch(""); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="text-zinc-200 font-medium truncate pr-3">{p.title}</span>
                <span className={`shrink-0 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${DIFF_STYLES[p.difficulty] || ""}`}>
                  {p.difficulty}
                </span>
              </button>
            )) : (
              <p className="text-xs text-zinc-600 text-center py-4 font-medium">No unpublished problems found.</p>
            )}
          </div>
        )}
      </div>

      {/* Selected list — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5">
        {selectedProblems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 py-8">
            <FaPlus size={16} className="text-zinc-800" />
            <p className="text-xs text-zinc-600 font-medium text-center">
              Search above to add problems
            </p>
          </div>
        ) : selectedProblems.map((p, i) => (
          <div
            key={p._id}
            className="flex items-center justify-between px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 text-zinc-500 text-[10px] font-bold font-mono shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-zinc-200 truncate font-medium">{p.title}</span>
              <span className="shrink-0 text-[9px] uppercase tracking-widest font-bold text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded hidden sm:inline">
                Hidden
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(p._id)}
              className="ml-2 w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <FaTrashAlt size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
export default function CreateContestPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate:       getLocalDate(),
    startTimeHour:   "12",
    startTimeMinute: "00",
    endDate:         getLocalDate(),
    endTimeHour:     "14",
    endTimeMinute:   "00",
  });

  const [loading,          setLoading]          = useState(false);
  const [allProblems,      setAllProblems]      = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [loadingProblems,  setLoadingProblems]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/problems/admin/all`, { withCredentials: true });
        setAllProblems(data.data || data);
      } catch {
        toast.error("Failed to load problem repository.");
      } finally {
        setLoadingProblems(false);
      }
    })();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async e => {
    e?.preventDefault();
    if (selectedProblems.length === 0) { toast.error("Add at least one problem."); return; }
    const startTime = `${formData.startDate}T${formData.startTimeHour}:${formData.startTimeMinute}:00`;
    const endTime   = `${formData.endDate}T${formData.endTimeHour}:${formData.endTimeMinute}:00`;
    if (new Date(endTime) <= new Date(startTime)) { toast.error("End time must be after start time."); return; }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/contests`,
        { title: formData.title, description: formData.description, startTime, endTime, problemIds: selectedProblems.map(p => p._id) },
        { withCredentials: true }
      );
      toast.success(`"${(data.data || data).title}" created!`);
      navigate("/admin/contests");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create contest.");
    } finally {
      setLoading(false);
    }
  };

  /* ── RENDER ── */
  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans overflow-hidden">

      {/* ══ HEADER ═════════════════════════════════════════════════ */}
      <header className="shrink-0 h-14 px-4 sm:px-6 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-md flex items-center justify-between z-20">
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
              Create New Arena
            </h1>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || loadingProblems}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <FaSave size={12} />
          }
          <span className="hidden sm:inline">{loading ? "Creating…" : "Create Contest"}</span>
        </button>
      </header>

      {/* ══ BODY — fixed height, no page scroll ════════════════════ */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0">

        {/* ── LEFT PANEL: Details + Schedule ── */}
        <div className="lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 space-y-6">

            {/* Details */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-100 mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-red-600 rounded-full inline-block" />
                Contest Details
              </p>
              <div className="space-y-3">
                <Field label="Contest Title">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Weekly Tournament #1"
                    className={inputCls}
                  />
                </Field>
                <Field label="Description & Rules">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Enter rules, prizes, or contest details…"
                    className={inputCls + " resize-none leading-relaxed"}
                  />
                </Field>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white-500 mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-amber-500 rounded-full inline-block" />
                Schedule
              </p>

              {/* Start */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-zinc-400 mb-2.5">Start Time</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Field label="Date">
                      <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Hour">
                    <select name="startTimeHour" value={formData.startTimeHour} onChange={handleChange} className={inputCls + " appearance-none cursor-pointer"} style={selectStyle}>
                      {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </Field>
                  <Field label="Min">
                    <select name="startTimeMinute" value={formData.startTimeMinute} onChange={handleChange} className={inputCls + " appearance-none cursor-pointer"} style={selectStyle}>
                      {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* End */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2.5">End Time</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Field label="Date">
                      <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Hour">
                    <select name="endTimeHour" value={formData.endTimeHour} onChange={handleChange} className={inputCls + " appearance-none cursor-pointer"} style={selectStyle}>
                      {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </Field>
                  <Field label="Min">
                    <select name="endTimeMinute" value={formData.endTimeMinute} onChange={handleChange} className={inputCls + " appearance-none cursor-pointer"} style={selectStyle}>
                      {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Problems ── */}
        <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6">

          {/* Panel header */}
          <div className="shrink-0 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-white-500 flex items-center gap-2">
                <span className="w-1 h-3 bg-emerald-500 rounded-full inline-block" />
                Contest Problems
              </p>
              <span className="font-mono text-xs text-zinc-600">
                ({selectedProblems.length} selected)
              </span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
              <FaEyeSlash size={9} /> Unpublished Only
            </span>
          </div>

          {/* Problem selector fills remaining height */}
          <div className="flex-1 min-h-0">
            {loadingProblems ? (
              <div className="h-full flex items-center justify-center gap-3 border border-zinc-800 rounded-xl bg-zinc-900/40">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
                <span className="text-sm text-zinc-500">Loading problem repository…</span>
              </div>
            ) : (
              <ProblemSelector
                allProblems={allProblems}
                selectedProblems={selectedProblems}
                onAdd={p  => setSelectedProblems(prev => [...prev, p])}
                onRemove={id => setSelectedProblems(prev => prev.filter(p => p._id !== id))}
              />
            )}
          </div>

          {/* Mobile submit */}
          <div className="shrink-0 mt-4 lg:hidden">
            <button
              onClick={handleSubmit}
              disabled={loading || loadingProblems}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                : <><FaSave size={13} /> Create Official Contest</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}