import React, { useState, useEffect, useCallback, Fragment } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx";
import {
  FaArrowLeft,
  FaPlus,
  FaTrashAlt,
  FaSave,
  FaEye,
  FaFileImport,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import DOMPurify from "dompurify";
import rehypeRaw from "rehype-raw";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_30px_rgba(255,69,0,0.7),inset_0_0_8px_rgba(255,69,0,0.4)]"></div>
  </div>
);

// --- InfoPanel Component ---
const InfoPanel = ({ title, children }) => (
  <details className="mb-4" open>
    <summary className="cursor-pointer select-none text-sm text-orange-300 font-semibold mb-2">
      {title}
    </summary>
    <div className="mt-2 p-3 bg-orange-950/10 border border-orange-800/40 rounded text-xs text-gray-300 font-mono whitespace-pre-wrap">
      {children}
    </div>
  </details>
);

// --- Godfather Input ---
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
        type === "date" || type === "time" ? "text-gray-300" : ""
      }`}
    />
  </div>
);

// --- Godfather Textarea ---
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

// --- Godfather Select ---
const GodfatherSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
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
      disabled={disabled}
      className="w-full p-2.5 bg-black text-white rounded-md border border-orange-700/60 focus:outline-none focus:border-orange-600/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] transition-all duration-300 text-sm"
    >
      {children}
    </select>
  </div>
);

function EditProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [loading, setLoading] = useState(true); // Page load
  const [saving, setSaving] = useState(false); // For submit/save buttons
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    isPremium: false,
    isPublished: true,
    originContest: "",
    starterCode: [{ language: "javascript", code: "" }],
    solution: "",
  });

  const [testCases, setTestCases] = useState([]); // Separate state for test cases
  const [newTestCase, setNewTestCase] = useState({
    input: "",
    expectedOutput: "",
    isSample: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [companyTagInput, setCompanyTagInput] = useState("");

  const [availableTags, setAvailableTags] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // UI helpers
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [showSolutionPreview, setShowSolutionPreview] = useState(false);

  // --- Fetch All Data on Load ---
  useEffect(() => {
    const fetchAllData = async () => {
      if (!slug) return;
      setLoading(true);
      setLoadingDropdowns(true);
      try {
        // Fetch in parallel
        const problemPromise = axios.get(
          `${serverUrl}/api/problems/getoneproblem/${slug}`,
          { withCredentials: true }
        );
        const testCasesPromise = axios.get(
          `${serverUrl}/api/problems/${slug}/alltestcases`,
          { withCredentials: true }
        );
        const tagsPromise = axios.get(`${serverUrl}/api/tags/problems`, {
          withCredentials: true,
        });
        const companiesPromise = axios.get(`${serverUrl}/api/tags/companies`, {
          withCredentials: true,
        });
        const contestsPromise = axios.get(`${serverUrl}/api/contests`, {
          withCredentials: true,
        });

        const [
          problemRes,
          testCasesRes,
          tagsResult,
          companiesResult,
          contestsResult,
        ] = await Promise.allSettled([
          problemPromise,
          testCasesPromise,
          tagsPromise,
          companiesPromise,
          contestsPromise,
        ]);

        // Process Problem
        if (problemRes.status === "fulfilled") {
          const fetchedProblem = problemRes.value.data;
          setFormData({
            title: fetchedProblem.title || "",
            description: fetchedProblem.description || "",
            difficulty: fetchedProblem.difficulty || "Easy",
            isPremium: fetchedProblem.isPremium || false,
            isPublished: fetchedProblem.isPublished,
            originContest: fetchedProblem.originContest || "",
            starterCode:
              fetchedProblem.starterCode?.length > 0
                ? fetchedProblem.starterCode
                : [{ language: "javascript", code: "" }],
            solution: fetchedProblem.solution || "",
          });
          setTagInput((fetchedProblem.tags || []).join(", "));
          setCompanyTagInput((fetchedProblem.companyTags || []).join(", "));
        } else {
          throw new Error("Failed to load problem data.");
        }

        // Process Test Cases
        if (testCasesRes.status === "fulfilled") {
          setTestCases(testCasesRes.value.data);
        } else {
          throw new Error("Failed to load test cases.");
        }

        // Process Dropdown Data
        if (tagsResult.status === "fulfilled")
          setAvailableTags(tagsResult.value.data);
        else toast.error("Failed to load problem tags.");

        if (companiesResult.status === "fulfilled")
          setAvailableCompanies(companiesResult.value.data);
        else toast.error("Failed to load company tags.");

        if (contestsResult.status === "fulfilled")
          setUpcomingContests(contestsResult.value.data.upcoming || []);
        else toast.error("Failed to load contests list.");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data.");
        toast.error(err.message || "Failed to load data.");
        navigate("/admin/problems");
      } finally {
        setLoading(false);
        setLoadingDropdowns(false);
      }
    };
    fetchAllData();
  }, [slug, navigate]);

  // ---------- Handlers ----------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "originContest") {
      setFormData((prev) => ({
        ...prev,
        originContest: value,
        isPublished: value ? false : prev.isPublished,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleTagInputChange = (e) => setTagInput(e.target.value);
  const handleCompanyTagInputChange = (e) => setCompanyTagInput(e.target.value);
  const handleStarterCodeChange = (index, field, value) => {
    const sc = [...formData.starterCode];
    sc[index][field] = value;
    setFormData((prev) => ({ ...prev, starterCode: sc }));
  };
  const addStarterCode = () =>
    setFormData((prev) => ({
      ...prev,
      starterCode: [...prev.starterCode, { language: "", code: "" }],
    }));
  const removeStarterCode = (index) => {
    if (formData.starterCode.length > 1)
      setFormData((prev) => ({
        ...prev,
        starterCode: prev.starterCode.filter((_, i) => i !== index),
      }));
  };
  const handleNewTestCaseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTestCase((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- Test Case API Handlers ---
  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!newTestCase.input.trim() || newTestCase.expectedOutput === undefined) {
      toast.warn("Input and Output required.");
      return;
    }
    setSaving(true);
    try {
      const { data: addedTestCase } = await axios.post(
        `${serverUrl}/api/problems/${slug}/testcases`,
        newTestCase,
        { withCredentials: true }
      );
      setTestCases((prev) => [...prev, addedTestCase]); // Add to local state
      setNewTestCase({ input: "", expectedOutput: "", isSample: false }); // Reset form
      toast.success("Test case added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm("Delete this test case?")) return;
    setSaving(true);
    try {
      await axios.delete(`${serverUrl}/api/problems/testcases/${testCaseId}`, {
        withCredentials: true,
      });
      setTestCases((prev) => prev.filter((tc) => tc._id !== testCaseId));
      toast.success("Test case deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  // --- Form Validation & Normalization ---
  const normalizeForSubmit = (data) => {
    const normalized = { ...data };
    normalized.description = (normalized.description || "")
      .replace(/\r\n/g, "\n")
      .trim();
    normalized.solution = (normalized.solution || "")
      .replace(/\r\n/g, "\n")
      .trim();
    normalized.starterCode = (normalized.starterCode || []).map((s) => ({
      language: (s.language || "").trim(),
      code: (s.code || "").replace(/\r\n/g, "\n"),
    }));
    return normalized;
  };

  const validateBeforeSubmit = (data) => {
    if (!data.title || !data.title.trim()) return "Title is required.";
    if (!data.description || !data.description.trim())
      return "Description is required.";
    if (testCases.length === 0) return "At least one test case must be saved.";
    if (!Array.isArray(data.starterCode) || data.starterCode.length === 0)
      return "Provide at least one starter code snippet.";
    for (let i = 0; i < data.starterCode.length; i++) {
      if (!data.starterCode[i].language || !data.starterCode[i].language.trim())
        return `Starter code #${i + 1} needs a language.`;
    }
    return null;
  };

  // --- Main Form Submit (Update Problem) ---
  const submitToServer = async (isDraft = false) => {
    const payload = normalizeForSubmit({
      ...formData,
      isPublished: !isDraft && formData.isPublished,
    });
    if (isDraft) payload.isPublished = false;

    const validationError = validateBeforeSubmit(payload);
    if (validationError) return toast.error(validationError);

    setSaving(true);
    try {
      const tagsArray = tagInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const companyTagsArray = companyTagInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const submissionData = {
        ...payload,
        tags: tagsArray,
        companyTags: companyTagsArray,
        originContest: payload.originContest || null,
      };

      const { data: updatedProblem } = await axios.put(
        `${serverUrl}/api/problems/updateproblem/${slug}`,
        submissionData,
        { withCredentials: true }
      );
      toast.success(
        isDraft
          ? `Draft saved: ${updatedProblem.title}`
          : `Problem "${updatedProblem.title}" updated!`
      );

      if (updatedProblem.slug !== slug) {
        navigate(`/admin/problems/edit/${updatedProblem.slug}`, {
          replace: true,
        });
      } else {
        // No slug change, just reload data to be safe
        fetchData();
      }
    } catch (err) {
      console.error("Update Problem Error:", err.response || err);
      toast.error(err.response?.data?.message || "Failed to update problem.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitToServer(false); // false = publish
  };

  const handleSaveDraft = async () => {
    await submitToServer(true); // true = save as draft
  };

  // --- Styles ---
  const cardStyle = `bg-black border border-orange-700/60 rounded-xl p-6 sm:p-8 shadow-[0_0_20px_rgba(255,69,0,0.2)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(255,69,0,0.3)] hover:border-orange-600/80 mb-6`;
  const buttonPrimaryStyle = `w-full bg-orange-600 text-white font-bold rounded-lg py-2.5 px-6 text-base shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 transform hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonSecondaryStyle = `bg-transparent border border-orange-600/50 text-orange-500 font-semibold rounded-lg py-1.5 px-3 text-xs shadow-[0_0_10px_rgba(255,69,0,0.2)] transition-all duration-300 transform hover:bg-orange-950/30 hover:border-orange-600/80 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(255,69,0,0.3)] hover:scale-105`;
  const buttonDangerStyle = `bg-red-900/30 text-red-400 border border-red-600/60 shadow-[0_0_8px_rgba(255,0,0,0.3)] hover:bg-red-800/50 hover:text-red-300 focus:ring-red-500 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black`;
  const headingStyle = `text-2xl font-bold text-orange-400 mb-4 [text-shadow:0_0_10px_rgba(255,69,0,0.6)]`;
  const labelStyle = `block text-sm font-medium text-gray-300 mb-1.5`;

  if (loading) return <LoadingSpinner />; // Full page loader for initial fetch

  return (
    <>
      <button
        onClick={() => navigate("/admin/problems")}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-orange-600/50 shadow-[0_0_20px_rgba(255,69,0,0.2)] text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm transition-all duration-300 transform hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:text-orange-400 hover:scale-105"
      >
        <FaArrowLeft />
        <span className="hidden sm:inline">Back to Manage</span>
      </button>

      <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
              Edit Problem
            </h1>
            <div className="flex items-center gap-2">
              {/* No "Load Example" on Edit page */}
              <button
                onClick={handleSaveDraft}
                type="button"
                disabled={saving}
                className={`${buttonSecondaryStyle} flex items-center gap-2`}
              >
                Save Draft
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Problem Details */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Problem Details</h2>

              <GodfatherInput
                id="title"
                name="title"
                label="Title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
                <GodfatherSelect
                  id="difficulty"
                  name="difficulty"
                  label="Difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Super Hard">Super Hard</option>
                </GodfatherSelect>

                <GodfatherSelect
                  id="originContest"
                  name="originContest"
                  label="Linked to Contest (Optional)"
                  value={formData.originContest}
                  onChange={handleInputChange}
                  disabled={loadingDropdowns}
                >
                  <option value="">None (Public Problem)</option>
                  {upcomingContests.map((contest) => (
                    <option key={contest._id} value={contest._id}>
                      {contest.title}
                    </option>
                  ))}
                </GodfatherSelect>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <label className={`${labelStyle}`}>
                    Description (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowDescriptionPreview(!showDescriptionPreview)
                    }
                    className={`${buttonSecondaryStyle} text-xs`}
                  >
                    <FaEye /> {showDescriptionPreview ? "Edit" : "Preview"}
                  </button>
                </div>
                {!showDescriptionPreview ? (
                  <GodfatherTextarea
                    id="description"
                    name="description"
                    label=""
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={10}
                    required
                  />
                ) : (
                  <div className="mt-3 p-3 bg-gray-900/50 border border-orange-700/30 rounded problem-description-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {formData.description}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <GodfatherInput
                    id="tags-input"
                    name="tags"
                    label="Problem Tags (comma-separated)"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    placeholder="e.g., array, hash-table, dp"
                  />
                  {!loadingDropdowns && availableTags.length > 0 && (
                    <p className="text-xs text-gray-500 -mt-3">
                      Allowed: {availableTags.slice(0, 3).join(", ")}...
                    </p>
                  )}
                </div>
                <div>
                  <GodfatherInput
                    id="companyTags-input"
                    name="companyTags"
                    label="Company Tags (comma-separated)"
                    value={companyTagInput}
                    onChange={handleCompanyTagInputChange}
                    placeholder="e.g., google, amazon"
                  />
                  {!loadingDropdowns && availableCompanies.length > 0 && (
                    <p className="text-xs text-gray-500 -mt-3">
                      Allowed: {availableCompanies.slice(0, 3).join(", ")}...
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 items-end">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPremium"
                    name="isPremium"
                    checked={formData.isPremium}
                    onChange={handleInputChange}
                    className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-600/60 mr-2"
                  />
                  <label
                    htmlFor="isPremium"
                    className="text-sm font-medium text-gray-300 select-none"
                  >
                    Mark as Premium Problem
                  </label>
                </div>

                {/* Show toggle unless it's locked by a contest */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                    disabled={!!formData.originContest} // Disable if linked to a contest
                    className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-600/60 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="isPublished"
                    className={`text-sm font-medium text-gray-300 select-none ${
                      !!formData.originContest ? "text-gray-500" : ""
                    }`}
                  >
                    Published (Visible on Practice)
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-orange-800/30">
                <div className="flex items-center justify-between mb-3">
                  <label className={`${labelStyle}`}>
                    Solution / Editorial (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSolutionPreview(!showSolutionPreview)}
                    className={`${buttonSecondaryStyle} text-xs`}
                  >
                    <FaEye /> {showSolutionPreview ? "Edit" : "Preview"}
                  </button>
                </div>
                {!showSolutionPreview ? (
                  <GodfatherTextarea
                    id="solution"
                    name="solution"
                    label=""
                    value={formData.solution}
                    onChange={handleInputChange}
                    rows={6}
                  />
                ) : (
                  <div className="mt-2 p-3 bg-gray-900/50 border border-orange-700/30 rounded problem-description-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {formData.solution}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Starter Code */}
            <div className={cardStyle}>
              {/* ... (Starter Code UI - same as CreateProblemPage) ... */}
            </div>

            {/* Submit */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="submit"
                disabled={saving || loadingDropdowns}
                className={`${buttonPrimaryStyle} sm:col-span-2`}
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <FaSave className="inline mr-2" /> Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || loadingDropdowns}
                className={`${buttonSecondaryStyle} sm:col-span-1`}
              >
                Save as Draft
              </button>
            </div>
          </form>

          {/* Test Cases */}
          <div className={`${cardStyle} p-6 mt-8`}>
            <h2 className={headingStyle}>
              {" "}
              Manage Test Cases ({testCases.length}){" "}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 mb-6 border-b border-orange-800/30 pb-4">
              {testCases.map((tc, index) => (
                <div
                  key={tc._id}
                  className="p-3 bg-gray-950/50 border border-gray-700/60 rounded-lg flex justify-between items-start gap-4"
                >
                  <div className="flex-grow text-xs space-y-1 overflow-hidden">
                    <p className="font-semibold text-gray-400">
                      {" "}
                      TC #{index + 1}{" "}
                      {tc.isSample && (
                        <span className="text-yellow-400 font-bold">
                          (Sample)
                        </span>
                      )}
                    </p>
                    <p>
                      <strong className="text-gray-500">Input:</strong>{" "}
                      <code className="block whitespace-pre-wrap break-words bg-black/40 p-1.5 rounded text-orange-300/80 text-[11px]">
                        {tc.input}
                      </code>
                    </p>
                    <p>
                      <strong className="text-gray-500">Output:</strong>{" "}
                      <code className="block whitespace-pre-wrap break-words bg-black/40 p-1.5 rounded text-orange-300/80 text-[11px]">
                        {tc.expectedOutput}
                      </code>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTestCase(tc._id)}
                    disabled={saving}
                    className={`${buttonDangerStyle} shrink-0`}
                    title="Delete Test Case"
                  >
                    {" "}
                    <FaTrashAlt />{" "}
                  </button>
                </div>
              ))}
              {!loading && testCases.length === 0 && (
                <p className="text-gray-500 text-center italic">
                  {" "}
                  No test cases added yet.{" "}
                </p>
              )}
            </div>

            <form onSubmit={handleAddTestCase}>
              <h3 className="text-lg font-semibold text-white mb-3">
                {" "}
                Add New Test Case{" "}
              </h3>
              <GodfatherTextarea
                id="new-input"
                name="input"
                label="Input"
                value={newTestCase.input}
                onChange={handleNewTestCaseChange}
                rows={3}
                required
              />
              <GodfatherTextarea
                id="new-output"
                name="expectedOutput"
                label="Expected Output"
                value={newTestCase.expectedOutput}
                onChange={handleNewTestCaseChange}
                rows={3}
                required
              />
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-isSample"
                  name="isSample"
                  checked={newTestCase.isSample}
                  onChange={handleNewTestCaseChange}
                  className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-600/60 focus:ring-offset-0 focus:ring-offset-black"
                />
                <label
                  htmlFor="new-isSample"
                  className="text-sm font-medium text-gray-300 select-none"
                >
                  {" "}
                  Mark as Sample (Visible to User){" "}
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className={`${buttonSecondaryStyle} !w-auto`}
              >
                {" "}
                {saving ? (
                  "Adding..."
                ) : (
                  <>
                    <FaPlus className="inline mr-1" /> Add Test Case
                  </>
                )}{" "}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditProblemPage;
