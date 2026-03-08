import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast"; // Using react-hot-toast
import { serverUrl } from "../../App.jsx";
import { FaArrowLeft, FaTrashAlt, FaSave, FaSearch, FaEyeSlash, FaCube } from "react-icons/fa";

// --- Loading Spinner (TUF Minimalist) ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
  </div>
);

// --- Form Input Components (TUF Dark Mode) ---
const FormInput = ({ id, name, label, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div className="w-full mb-5">
    <label htmlFor={id} className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full p-3 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm
                 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                 transition-colors placeholder:text-zinc-600"
    />
  </div>
);

const FormTextarea = ({ id, name, label, value, onChange, rows = 4, required = false, placeholder = "" }) => (
  <div className="w-full mb-5">
    <label htmlFor={id} className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">
      {label}
    </label>
    <textarea
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-3 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm resize-y leading-relaxed
                 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                 transition-colors placeholder:text-zinc-600 custom-scrollbar"
    />
  </div>
);

const FormSelect = ({ id, name, label, value, onChange, children, required = false }) => (
  <div className="w-full mb-5 sm:mb-0">
    <label htmlFor={id} className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">
      {label}
    </label>
    <select
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full p-3 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm
                 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                 transition-colors appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: `right .75rem center`,
        backgroundRepeat: `no-repeat`,
        backgroundSize: `1.5em 1.5em`,
        paddingRight: `2.5rem`,
      }}
    >
      {children}
    </select>
  </div>
);

// --- Time & Date Helpers ---
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const formatDate = (date) => new Date(date).toISOString().split("T")[0];
const formatTime = (date) => new Date(date).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

// --- Problem Search & Select Component (TUF Styled) ---
const ProblemSelector = ({ allProblems, selectedProblems, onAdd, onRemove }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filters for "isPublished === false"
  const filteredProblems = allProblems.filter(
    (p) =>
      !selectedProblems.some((sp) => sp._id === p._id) &&
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      p.isPublished === false
  );

  return (
    <div className="w-full flex flex-col h-full">
      <label htmlFor="problem-search" className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2 flex justify-between">
        <span>Repository Search</span>
        <span className="text-amber-500 flex items-center gap-1">
          <FaEyeSlash size={10} /> Unpublished Only
        </span>
      </label>

      <div className="relative shrink-0 mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-zinc-500" size={12} />
        </div>
        <input
          type="text"
          id="problem-search"
          placeholder="Search to add problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full pl-9 p-3 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm
                     focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                     transition-colors placeholder:text-zinc-600"
        />

        {/* Search Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((prob) => (
                <button
                  type="button"
                  key={prob._id}
                  onClick={() => {
                    onAdd(prob);
                    setSearchTerm("");
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-md flex justify-between items-center transition-colors"
                >
                  <span className="font-medium truncate pr-4">{prob.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border 
                      ${
                        prob.difficulty === "Easy"
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : prob.difficulty === "Medium"
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20"
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-xs text-zinc-500 font-medium text-center">
                No matching unpublished problems found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Internal Scrollable Selected Area */}
      <div className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-md p-2 overflow-y-auto custom-scrollbar max-h-[300px] lg:max-h-full min-h-[200px] relative">
        {selectedProblems.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center opacity-70">
            <FaCube size={24} className="text-zinc-600 mb-3" />
            <p className="text-xs text-zinc-500 font-medium">
              Arena is empty. Search above to lock in problems.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedProblems.map((prob, index) => (
              <div
                key={prob._id}
                className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-md group hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-950 text-zinc-500 border border-zinc-800 text-[11px] font-black shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {prob.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(prob._id)}
                  className="text-zinc-500 hover:text-red-500 p-2 rounded-md hover:bg-zinc-800 transition-colors shrink-0 ml-2"
                  title="Remove Problem"
                >
                  <FaTrashAlt size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Edit Contest Page Component ---
export default function EditContestPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTimeHour: "12",
    startTimeMinute: "00",
    endDate: "",
    endTimeHour: "14",
    endTimeMinute: "00",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allProblems, setAllProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // --- Fetch ALL data on mount ---
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setLoadingProblems(true);
      try {
        // Fetch contest and problems in parallel via proper REST routes
        const [contestRes, problemsRes] = await Promise.all([
          axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true }),
          axios.get(`${serverUrl}/api/problems/admin/all`, { withCredentials: true })
        ]);
        
        const contest = contestRes.data.data || contestRes.data;
        const allProbs = problemsRes.data.data || problemsRes.data;

        // Populate form
        setFormData({
          title: contest.title,
          description: contest.description,
          startDate: formatDate(contest.startTime),
          startTimeHour: formatTime(contest.startTime).split(":")[0],
          startTimeMinute: formatTime(contest.startTime).split(":")[1],
          endDate: formatDate(contest.endTime),
          endTimeHour: formatTime(contest.endTime).split(":")[0],
          endTimeMinute: formatTime(contest.endTime).split(":")[1],
        });
        
        setAllProblems(allProbs);
        
        // Extract the fully populated problem objects
        setSelectedProblems(contest.problems.map((p) => p.problem));

      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load contest data.");
        navigate("/admin/contests");
      } finally {
        setLoading(false);
        setLoadingProblems(false);
      }
    };
    fetchAllData();
  }, [slug, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleAddProblem = (problem) => {
    setSelectedProblems((prev) => [...prev, problem]);
  };
  
  const handleRemoveProblem = (problemId) => {
    setSelectedProblems((prev) => prev.filter((p) => p._id !== problemId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const problemIdsArray = selectedProblems.map((p) => p._id);
    if (problemIdsArray.length === 0) {
      toast.error("Contest must have at least one problem.");
      setSaving(false);
      return;
    }

    const combinedStartTime = `${formData.startDate}T${formData.startTimeHour}:${formData.startTimeMinute}:00`;
    const combinedEndTime = `${formData.endDate}T${formData.endTimeHour}:${formData.endTimeMinute}:00`;

    if (new Date(combinedEndTime) <= new Date(combinedStartTime)) {
      toast.error("End time must be after start time.");
      setSaving(false);
      return;
    }

    const submissionData = {
      title: formData.title,
      description: formData.description,
      startTime: combinedStartTime,
      endTime: combinedEndTime,
      problemIds: problemIdsArray,
    };

    try {
      const { data } = await axios.put(
        `${serverUrl}/api/contests/${slug}`,
        submissionData,
        { withCredentials: true }
      );
      const updatedContest = data.data || data;
      toast.success(`Contest "${updatedContest.title}" updated successfully!`);
      navigate(`/admin/contests`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update contest.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30">
      
      
      {/* Main Content Area */}
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-20 max-w-7xl mx-auto">
        
        {/* Inline Back Button & Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4 text-sm font-medium"
          >
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
            Edit Official Arena
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Modify the timeline or repository questions for this contest. Note: You cannot edit a contest once it goes live.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* CSS Grid for side-by-side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: Configuration */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-100 mb-6 border-b border-zinc-800/60 pb-3">
                Arena Settings
              </h2>
              
              <FormInput
                id="title"
                name="title"
                label="Contest Title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Weekly Algorithms Tournament #1"
              />
              
              <FormTextarea
                id="description"
                name="description"
                label="Rules & Overview"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="Enter details, rules, or prizes about the contest..."
              />

              <div className="mt-8 border-t border-zinc-800/60 pt-6">
                <h3 className="text-sm font-semibold text-zinc-200 mb-4">Timeline Configuration</h3>
                
                {/* Start Time Row */}
                <div className="flex flex-col sm:flex-row gap-4 mb-5">
                  <div className="flex-1">
                    <FormInput id="startDate" name="startDate" label="Start Date" type="date" value={formData.startDate} onChange={handleInputChange} required />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <FormSelect id="startTimeHour" name="startTimeHour" label="Start Hour" value={formData.startTimeHour} onChange={handleInputChange} required>
                      {hours.map((h) => <option key={`sh-${h}`} value={h}>{h}</option>)}
                    </FormSelect>
                    <FormSelect id="startTimeMinute" name="startTimeMinute" label="Start Min" value={formData.startTimeMinute} onChange={handleInputChange} required>
                      {minutes.map((m) => <option key={`sm-${m}`} value={m}>{m}</option>)}
                    </FormSelect>
                  </div>
                </div>
                
                {/* End Time Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <FormInput id="endDate" name="endDate" label="End Date" type="date" value={formData.endDate} onChange={handleInputChange} required />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <FormSelect id="endTimeHour" name="endTimeHour" label="End Hour" value={formData.endTimeHour} onChange={handleInputChange} required>
                      {hours.map((h) => <option key={`eh-${h}`} value={h}>{h}</option>)}
                    </FormSelect>
                    <FormSelect id="endTimeMinute" name="endTimeMinute" label="End Min" value={formData.endTimeMinute} onChange={handleInputChange} required>
                      {minutes.map((m) => <option key={`em-${m}`} value={m}>{m}</option>)}
                    </FormSelect>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Problems & Submit */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Problem Selector Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-sm flex-1 flex flex-col lg:h-[550px]">
                <h2 className="text-lg font-bold text-zinc-100 mb-6 border-b border-zinc-800/60 pb-3">
                  Problem Repository
                </h2>
                
                {loadingProblems ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin mb-3"></div>
                    <span className="text-xs font-medium uppercase tracking-widest">Loading DB...</span>
                  </div>
                ) : (
                  <ProblemSelector
                    allProblems={allProblems}
                    selectedProblems={selectedProblems}
                    onAdd={handleAddProblem}
                    onRemove={handleRemoveProblem}
                  />
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving || loadingProblems}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl py-4 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <FaSave /> Update Arena
                  </>
                )}
              </button>
            </div>
            
          </div>
        </form>
      </main>
    </div>
  );
}