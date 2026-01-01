import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx"; // Adjust path if needed
import {
  FaArrowLeft,
  FaSave,
  FaSearch,
  FaTrashAlt,
  FaCopy,
  FaCheckCircle,
} from "react-icons/fa";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-16 h-16 border-4 border-t-transparent border-orange-600 rounded-full animate-spin"></div>
  </div>
);

// --- Reusable Form Components (Same as Admin) ---
const GodfatherInput = ({
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
      className="block text-sm font-medium text-gray-300 mb-1.5"
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
      className={`w-full p-2.5 bg-black text-white rounded-md border border-orange-700/60 focus:outline-none focus:border-orange-600/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] transition-all duration-300 text-sm ${
        type === "date" ? "text-gray-300" : ""
      }`}
    />
  </div>
);

const GodfatherTextarea = ({
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
      className="block text-sm font-medium text-gray-300 mb-1.5"
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
      className="w-full p-2.5 bg-black text-white rounded-md border border-orange-700/60 focus:outline-none focus:border-orange-600/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] transition-all duration-300 text-sm resize-y font-mono"
    />
  </div>
);

const GodfatherSelect = ({
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
      className="block text-sm font-medium text-gray-300 mb-1.5"
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
      className="w-full p-2.5 bg-black text-white rounded-md border border-orange-700/60 focus:outline-none focus:border-orange-600/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] transition-all duration-300 text-sm"
    >
      {children}
    </select>
  </div>
);

// --- Problem Search Component (User Version) ---
const ProblemSelector = ({
  allProblems,
  selectedProblems,
  onAdd,
  onRemove,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter: Exclude already selected problems & match search term
  const filteredProblems = allProblems.filter(
    (p) =>
      !selectedProblems.some((sp) => sp._id === p._id) &&
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full mb-5">
      <label
        htmlFor="problem-search"
        className="block text-sm font-medium text-gray-300 mb-1.5"
      >
        Select Problems
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-500" size={12} />
        </div>
        <input
          type="text"
          id="problem-search"
          placeholder="Search for problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full p-2.5 pl-9 bg-black text-white rounded-md border border-orange-700/60 focus:outline-none focus:border-orange-600/80 transition-all duration-300 text-sm"
        />
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-black border border-orange-700/60 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
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
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-orange-900/50 hover:text-orange-300 flex justify-between"
                >
                  <span>{prob.title}</span>
                  <span
                    className={`text-xs ${
                      prob.difficulty === "Easy"
                        ? "text-green-400"
                        : prob.difficulty === "Medium"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {prob.difficulty}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 italic">
                No matching problems found.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {selectedProblems.map((prob, index) => (
          <div
            key={prob._id}
            className="flex items-center justify-between p-2 bg-gray-900/50 border border-gray-700/50 rounded-md"
          >
            <span className="text-sm text-white">
              {index + 1}. {prob.title}
            </span>
            <button
              type="button"
              onClick={() => onRemove(prob._id)}
              className="text-red-500 hover:text-red-400"
            >
              <FaTrashAlt />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- SUCCESS MODAL COMPONENT ---
const SuccessModal = ({ inviteCode, slug, onClose }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Invite Code Copied!");
  };

  const handleGoToContest = () => {
    window.location.href = `/contest/${slug}`; // Force reload/nav to contest
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-black border border-orange-500 rounded-xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,69,0,0.5)] text-center relative">
        <FaCheckCircle className="text-orange-500 text-5xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Contest Created!</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Your private arena is ready. Share this code with your friends to let
          them join.
        </p>

        {/* Code Display */}
        <div className="flex items-center justify-between bg-gray-900 border border-orange-900/50 rounded-lg p-3 mb-6">
          <span className="text-xl font-mono font-bold text-orange-400 tracking-widest">
            {inviteCode}
          </span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaCopy size={20} />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:border-gray-400"
          >
            Close
          </button>
          <button
            onClick={handleGoToContest}
            className="flex-1 px-4 py-2 bg-orange-600 text-white font-bold rounded hover:bg-orange-700 shadow-[0_0_15px_rgba(255,69,0,0.4)]"
          >
            Go to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
function CreatePrivateContest() {
  const navigate = useNavigate();
  const getLocalDate = () => new Date().toISOString().split("T")[0];

  // Form State
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

  // Data & UI State
  const [allProblems, setAllProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // Success State
  const [successData, setSuccessData] = useState(null); // { inviteCode, slug }

  // Fetch Public Problems
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoadingProblems(true);
        // Use PUBLIC route
        const { data } = await axios.get(`${serverUrl}/api/problems`, {
          withCredentials: true,
        });
        setAllProblems(data.problems || data); // Handle if API returns { problems: [] } or just []
      } catch (err) {
        console.error(err);
        toast.error("Could not load problems.");
      } finally {
        setLoadingProblems(false);
      }
    };
    fetchProblems();
  }, []);

  // Handlers
  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAddProblem = (p) => setSelectedProblems((prev) => [...prev, p]);
  const handleRemoveProblem = (id) =>
    setSelectedProblems((prev) => prev.filter((p) => p._id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (selectedProblems.length === 0) {
      toast.error("Select at least one problem.");
      setLoading(false);
      return;
    }

    const start = `${formData.startDate}T${formData.startTimeHour}:${formData.startTimeMinute}:00`;
    const end = `${formData.endDate}T${formData.endTimeHour}:${formData.endTimeMinute}:00`;

    if (new Date(end) <= new Date(start)) {
      toast.error("End time must be after start time.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        startTime: start,
        endTime: end,
        problemIds: selectedProblems.map((p) => p._id),
      };

      // HIT THE PRIVATE ENDPOINT
      const { data } = await axios.post(
        `${serverUrl}/api/contests/private`,
        payload,
        { withCredentials: true }
      );

      // Show Success Modal
      setSuccessData({ inviteCode: data.inviteCode, slug: data.slug });
    } catch (err) {
      const msg = err.response?.data?.message || "Creation failed.";
      if (err.response?.status === 403) {
        toast.error("Upgrade required: " + msg);
        // Optional: navigate('/subscription')
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const buttonStyle = `w-full bg-orange-600 text-white font-bold rounded-lg py-3 shadow-[0_0_15px_rgba(255,69,0,0.4)] hover:bg-orange-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <>
      {/* Back Button */}
      <button
        onClick={() => navigate("/contests")}
        className="fixed top-24 left-4 z-40 text-orange-500 font-bold bg-black/80 px-4 py-2 rounded-full border border-orange-600/50 hover:text-orange-400 flex items-center gap-2"
      >
        <FaArrowLeft /> <span className="hidden sm:inline">Back</span>
      </button>

      <div className="min-h-screen bg-black text-gray-300 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-4xl font-black text-white 
                                           [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)] text-center"
          >
            Create Private Contest
          </h1>
          <p className="text-center text-gray-200 mb-8 text-sm">
            Host your own arena. Premium features enabled.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-black border border-orange-800/60 rounded-xl p-6 shadow-[0_0_25px_rgba(255,69,0,0.15)]"
          >
            {/* Title & Description */}
            <GodfatherInput
              id="title"
              label="Contest Name"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g. Saturday Night Code"
            />
            <GodfatherTextarea
              id="description"
              label="Rules / Description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Describe the rules..."
            />

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <GodfatherInput
                  type="date"
                  id="startDate"
                  label="Start Date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
                <div className="flex gap-2">
                  <GodfatherSelect
                    id="startTimeHour"
                    label="Hour"
                    value={formData.startTimeHour}
                    onChange={handleInputChange}
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </GodfatherSelect>
                  <GodfatherSelect
                    id="startTimeMinute"
                    label="Min"
                    value={formData.startTimeMinute}
                    onChange={handleInputChange}
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </GodfatherSelect>
                </div>
              </div>
              <div>
                <GodfatherInput
                  type="date"
                  id="endDate"
                  label="End Date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
                <div className="flex gap-2">
                  <GodfatherSelect
                    id="endTimeHour"
                    label="Hour"
                    value={formData.endTimeHour}
                    onChange={handleInputChange}
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </GodfatherSelect>
                  <GodfatherSelect
                    id="endTimeMinute"
                    label="Min"
                    value={formData.endTimeMinute}
                    onChange={handleInputChange}
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </GodfatherSelect>
                </div>
              </div>
            </div>

            {/* Problem Selection */}
            <div className="border-t border-orange-900/50 pt-6 mt-2">
              {loadingProblems ? (
                <LoadingSpinner />
              ) : (
                <ProblemSelector
                  allProblems={allProblems}
                  selectedProblems={selectedProblems}
                  onAdd={handleAddProblem}
                  onRemove={handleRemoveProblem}
                />
              )}
            </div>

            {/* Submit */}
            <div className="mt-8 pt-6 border-t border-orange-900/50">
              <button
                type="submit"
                disabled={loading || loadingProblems}
                className={buttonStyle}
              >
                {loading ? (
                  "Creating Arena..."
                ) : (
                  <>
                    <FaSave className="inline mr-2" /> Create & Get Code
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <SuccessModal
          inviteCode={successData.inviteCode}
          slug={successData.slug}
          onClose={() => navigate(`/contest/${successData.slug}`)}
        />
      )}
    </>
  );
}

export default CreatePrivateContest;
