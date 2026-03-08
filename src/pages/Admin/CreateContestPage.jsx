import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // Using react-hot-toast
import { serverUrl } from "../../App.jsx";
import {
  FaArrowLeft,
  FaTrashAlt,
  FaSave,
  FaSearch,
  FaEyeSlash,
} from "react-icons/fa";

// --- Loading Spinner (TUF Minimalist) ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
  </div>
);

// --- Form Input Components (TUF Dark Mode) ---
const FormInput = ({
  id,
  name,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) => (
  <div className="w-full mb-5">
    <label
      htmlFor={id}
      className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2"
    >
      {" "}
      {label}{" "}
    </label>
    <input
      type={type}
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full p-2.5 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm
                      focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                      transition-colors placeholder:text-zinc-600"
    />
  </div>
);

const FormTextarea = ({
  id,
  name,
  label,
  value,
  onChange,
  rows = 4,
  required = false,
  placeholder = "",
}) => (
  <div className="w-full mb-5">
    <label
      htmlFor={id}
      className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2"
    >
      {" "}
      {label}{" "}
    </label>
    <textarea
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-2.5 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm resize-y leading-relaxed
                      focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                      transition-colors placeholder:text-zinc-600"
    />
  </div>
);

const FormSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  children,
  required = false,
}) => (
  <div className="w-full mb-5">
    <label
      htmlFor={id}
      className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2"
    >
      {" "}
      {label}{" "}
    </label>
    <select
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full p-2.5 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm
                      focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                      transition-colors appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: `right .5rem center`,
        backgroundRepeat: `no-repeat`,
        backgroundSize: `1.5em 1.5em`,
        paddingRight: `2.5rem`,
      }}
    >
      {children}
    </select>
  </div>
);

// Helper function to get current date
const getLocalDate = () => new Date().toISOString().split("T")[0];

// Generate Time Options
const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

// --- Problem Search & Select Component (TUF Styled) ---
const ProblemSelector = ({
  allProblems,
  selectedProblems,
  onAdd,
  onRemove,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filters for "isPublished === false"
  const filteredProblems = allProblems.filter(
    (p) =>
      !selectedProblems.some((sp) => sp._id === p._id) &&
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      p.isPublished === false,
  );

  return (
    <div className="w-full mb-5">
      <label
        htmlFor="problem-search"
        className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2 flex justify-between"
      >
        <span>Add Contest Problems</span>
        <span className="text-amber-500 flex items-center gap-1">
          <FaEyeSlash size={10} /> Unpublished Only
        </span>
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-zinc-500" size={12} />
        </div>
        <input
          type="text"
          id="problem-search"
          placeholder="Search unpublished problems to add..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full pl-9 p-2.5 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md text-sm
                     focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 
                     transition-colors placeholder:text-zinc-600"
        />

        {/* Search Dropdown */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1">
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
                  className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded flex justify-between items-center transition-colors"
                >
                  <span className="font-medium truncate pr-4">
                    {prob.title}
                  </span>
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
              <div className="px-4 py-3 text-xs text-zinc-500 font-medium text-center">
                No matching unpublished problems found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Problems List */}
      <div className="mt-4 space-y-2">
        {selectedProblems.length === 0 ? (
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-md text-center">
            <p className="text-xs text-zinc-500 font-medium">
              No problems added yet. Search above to add.
            </p>
          </div>
        ) : (
          selectedProblems.map((prob, index) => (
            <div
              key={prob._id}
              className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-md group hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-zinc-200">
                  {prob.title}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded shrink-0">
                  Hidden
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(prob._id)}
                className="text-zinc-500 hover:text-red-500 p-1.5 rounded hover:bg-zinc-800 transition-colors"
                title="Remove Problem"
              >
                <FaTrashAlt size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Main Create Contest Page Component ---
export default function CreateContestPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: getLocalDate(),
    startTimeHour: "12",
    startTimeMinute: "00",
    endDate: getLocalDate(),
    endTimeHour: "14",
    endTimeMinute: "00",
  });
  const [loading, setLoading] = useState(false);
  const [allProblems, setAllProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // --- Fetch ALL problems ---
  useEffect(() => {
    const fetchAllProblems = async () => {
      try {
        setLoadingProblems(true);
        // Use ADMIN route to get ALL problems (published and unpublished)
        const { data } = await axios.get(
          `${serverUrl}/api/problems/admin/all`,
          { withCredentials: true },
        );
        setAllProblems(data.data || data); // Adjust based on your ApiResponse
      } catch (err) {
        toast.error("Failed to load list of problems.");
      } finally {
        setLoadingProblems(false);
      }
    };
    fetchAllProblems();
  }, []);

  // --- Handlers ---
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

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const problemIdsArray = selectedProblems.map((p) => p._id);
    if (problemIdsArray.length === 0) {
      toast.error("Please add at least one problem to the contest.");
      setLoading(false);
      return;
    }

    const combinedStartTime = `${formData.startDate}T${formData.startTimeHour}:${formData.startTimeMinute}:00`;
    const combinedEndTime = `${formData.endDate}T${formData.endTimeHour}:${formData.endTimeMinute}:00`;

    if (new Date(combinedEndTime) <= new Date(combinedStartTime)) {
      toast.error("End time must be after start time.");
      setLoading(false);
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
      // POST to standard Contest endpoint
      const { data } = await axios.post(
        `${serverUrl}/api/contests`,
        submissionData,
        { withCredentials: true },
      );
      const newContest = data.data || data; // Adjust based on your ApiResponse
      toast.success(`Contest "${newContest.title}" created successfully!`);
      navigate(`/admin/contests`);
    } catch (err) {
      console.error("Create Contest Error:", err.response || err);
      toast.error(err.response?.data?.message || "Failed to create contest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30">
      {/* Floating Back Button */}
      <button
        onClick={() => navigate(-1)} // or handleBack
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 font-medium rounded-full py-2 px-4 text-xs transition-colors hover:bg-zinc-800 hover:text-white shadow-lg"
      >
        <FaArrowLeft size={12} /> <span className="hidden sm:inline">Back</span>
      </button>

      <main className="pt-36 px-4 sm:px-6 lg:px-8 pb-20 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
            Create Official Arena
          </h1>
          <p className="text-zinc-400 text-sm">
            Configure the timeline and select unpublished problems for a new
            global tournament.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-sm"
        >
          <div className="border-b border-zinc-800/60 pb-6 mb-6">
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
              label="Description (Rules, Details)"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
              placeholder="Enter details, rules, or prizes about the contest..."
            />
          </div>

          <div className="border-b border-zinc-800/60 pb-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
              <FormInput
                id="startDate"
                name="startDate"
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
              <div className="grid grid-cols-2 gap-x-4">
                <FormSelect
                  id="startTimeHour"
                  name="startTimeHour"
                  label="Start Hour"
                  value={formData.startTimeHour}
                  onChange={handleInputChange}
                  required
                >
                  {hours.map((h) => (
                    <option key={`start-h-${h}`} value={h}>
                      {h}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  id="startTimeMinute"
                  name="startTimeMinute"
                  label="Start Min"
                  value={formData.startTimeMinute}
                  onChange={handleInputChange}
                  required
                >
                  {minutes.map((m) => (
                    <option key={`start-m-${m}`} value={m}>
                      {m}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 pt-2">
              <FormInput
                id="endDate"
                name="endDate"
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
              <div className="grid grid-cols-2 gap-x-4">
                <FormSelect
                  id="endTimeHour"
                  name="endTimeHour"
                  label="End Hour"
                  value={formData.endTimeHour}
                  onChange={handleInputChange}
                  required
                >
                  {hours.map((h) => (
                    <option key={`end-h-${h}`} value={h}>
                      {h}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  id="endTimeMinute"
                  name="endTimeMinute"
                  label="End Min"
                  value={formData.endTimeMinute}
                  onChange={handleInputChange}
                  required
                >
                  {minutes.map((m) => (
                    <option key={`end-m-${m}`} value={m}>
                      {m}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>
          </div>

          <div className="pb-2">
            {loadingProblems ? (
              <div className="flex items-center gap-3 text-zinc-500 text-sm p-4 bg-zinc-950 rounded-md border border-zinc-800">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin"></div>
                Loading problem repository...
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
          <div className="mt-8 pt-6 border-t border-zinc-800/60">
            <button
              type="submit"
              disabled={loading || loadingProblems}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-md py-3 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Configuring Arena...
                </>
              ) : (
                <>
                  <FaSave /> Create Official Contest
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
