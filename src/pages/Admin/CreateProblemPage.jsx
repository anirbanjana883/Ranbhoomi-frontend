// CreateProblemPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
import DOMPurify from "dompurify";


const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_30px_rgba(255,69,0,0.7),inset_0_0_8px_rgba(255,69,0,0.4)]"></div>
  </div>
);

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
      className={`w-full p-2.5 bg-black text-white rounded-md 
                       border border-orange-700/60 
                       focus:outline-none focus:border-orange-600/80 
                       focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] 
                       transition-all duration-300 text-sm
                       ${
                         type === "date" || type === "time"
                           ? "text-gray-300"
                           : ""
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
      className="w-full p-2.5 bg-black text-white rounded-md 
                      border border-orange-700/60
                      focus:outline-none focus:border-orange-600/80 
                      focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] 
                      transition-all duration-300 text-sm resize-y font-mono"
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
      className="w-full p-2.5 bg-black text-white rounded-md 
                      border border-orange-700/60
                      focus:outline-none focus:border-orange-600/80 
                      focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] 
                      transition-all duration-300 text-sm"
    >
      {children}
    </select>
  </div>
);

function CreateProblemPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    isPremium: false,
    starterCode: [{ language: "javascript", code: "" }],
    testCasesData: [{ input: "", expectedOutput: "", isSample: true }],
    solution: "",
    isPublished: true,
    originContest: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [companyTagInput, setCompanyTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loadingContests, setLoadingContests] = useState(true);

  // UI helpers
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [showSolutionPreview, setShowSolutionPreview] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingTags(true);
      setLoadingCompanies(true);
      setLoadingContests(true);
      try {
        const tagsPromise = axios.get(`${serverUrl}/api/tags/problems`, {
          withCredentials: true,
        });
        const companiesPromise = axios.get(`${serverUrl}/api/tags/companies`, {
          withCredentials: true,
        });
        const contestsPromise = axios.get(`${serverUrl}/api/contests`, {
          withCredentials: true,
        });

        const [tagsResult, companiesResult, contestsResult] =
          await Promise.allSettled([
            tagsPromise,
            companiesPromise,
            contestsPromise,
          ]);

        if (tagsResult.status === "fulfilled")
          setAvailableTags(tagsResult.value.data);
        else {
          console.error("Failed to load problem tags:", tagsResult.reason);
          toast.error("Failed to load problem tags.");
        }

        if (companiesResult.status === "fulfilled")
          setAvailableCompanies(companiesResult.value.data);
        else {
          console.error("Failed to load company tags:", companiesResult.reason);
          toast.error("Failed to load company tags.");
        }

        if (contestsResult.status === "fulfilled")
          setUpcomingContests(contestsResult.value.data.upcoming || []);
        else {
          console.error("Failed to load contests:", contestsResult.reason);
          toast.error("Failed to load contests list.");
        }
      } catch (err) {
        console.error("Error in fetchFilterOptions:", err);
        toast.error("An unexpected error occurred.");
      } finally {
        setLoadingTags(false);
        setLoadingCompanies(false);
        setLoadingContests(false);
      }
    };
    fetchFilterOptions();
  }, []);

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

  // Starter code handlers
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
  const removeStarterCode = (index) =>
    setFormData((prev) => ({
      ...prev,
      starterCode: prev.starterCode.filter((_, i) => i !== index),
    }));

  // Test case handlers
  const handleTestCaseChange = (index, field, value, type = "text") => {
    const tc = [...formData.testCasesData];
    tc[index][field] = type === "checkbox" ? !tc[index][field] : value;
    setFormData((prev) => ({ ...prev, testCasesData: tc }));
  };
  const addTestCase = () =>
    setFormData((prev) => ({
      ...prev,
      testCasesData: [
        ...prev.testCasesData,
        { input: "", expectedOutput: "", isSample: false },
      ],
    }));
  const removeTestCase = (index) =>
    setFormData((prev) => ({
      ...prev,
      testCasesData: prev.testCasesData.filter((_, i) => i !== index),
    }));

  // Example loader
  const loadExampleProblem = () => {
    const example = {
      title: "Two Sum (Example)",
      description:
        `## Two Sum

Given an array of integers ` +
        "`nums`" +
        ` and an integer ` +
        "`target`" +
        `, return indices of the two numbers such that they add up to target.

### Input
First line: n (size of array)  
Second line: n space-separated integers  
Third line: target

### Output
Single line with two indices (0-based) in any order.

### Example
\`\`\`
Input:
4
2 7 11 15
9
Output:
0 1
\`\`\`

`,
      difficulty: "Easy",
      starterCode: [
        {
          language: "javascript",
          code: `// Example starter (JS)\nfunction twoSum(nums, target) {\n  // write your code\n}`,
        },
      ],
      testCasesData: [
        { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isSample: true },
        { input: "3\n3 2 4\n6", expectedOutput: "1 2", isSample: true },
      ],
      solution: `### Approach
Use a hash map to store seen values and indices. For each number, check if (target - num) exists.

\`\`\`js
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
}
\`\`\``,
    };
    setFormData((prev) => ({ ...prev, ...example }));
    setTagInput("array,hash-table");
    setCompanyTagInput("leetcode,google");
    toast.info("Loaded example problem — edit and save when ready.");
  };

  // Normalize and validate input before sending to backend
  const normalizeForSubmit = (data) => {
    const normalized = { ...data };
    // normalize newlines to \n for description/solution/testcases
    normalized.description = (normalized.description || "")
      .replace(/\r\n/g, "\n")
      .trim();
    normalized.solution = (normalized.solution || "")
      .replace(/\r\n/g, "\n")
      .trim();
    normalized.testCasesData = (normalized.testCasesData || []).map((tc) => ({
      input: (tc.input || "").replace(/\r\n/g, "\n").trim(),
      expectedOutput: (tc.expectedOutput || "").replace(/\r\n/g, "\n").trim(),
      isSample: !!tc.isSample,
    }));
    // starterCode keep as-is but trim code newline endings
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
    if (!Array.isArray(data.testCasesData) || data.testCasesData.length === 0)
      return "At least one test case is required.";
    for (let i = 0; i < data.testCasesData.length; i++) {
      const tc = data.testCasesData[i];
      if (!tc.input || !tc.input.trim())
        return `Test case #${i + 1} input is empty.`;
      if (!tc.expectedOutput || !tc.expectedOutput.trim())
        return `Test case #${i + 1} expected output is empty.`;
    }
    if (!Array.isArray(data.starterCode) || data.starterCode.length === 0)
      return "Provide at least one starter code snippet.";
    for (let i = 0; i < data.starterCode.length; i++) {
      const s = data.starterCode[i];
      if (!s.language || !s.language.trim())
        return `Starter code #${i + 1} needs a language.`;
    }
    return null;
  };

  // Submit (create or save draft)
  const submitToServer = async (isDraft = false) => {
    // prepare payload
    const payload = normalizeForSubmit({
      ...formData,
      isPublished: !isDraft && formData.isPublished,
    });
    // if draft, ensure isPublished false
    if (isDraft) payload.isPublished = false;

    const validationError = validateBeforeSubmit(payload);
    if (validationError) return toast.error(validationError);

    setLoading(true);
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

      const { data: newProblem } = await axios.post(
        `${serverUrl}/api/problems/createproblem`,
        submissionData,
        { withCredentials: true }
      );
      toast.success(
        isDraft
          ? `Draft saved: ${newProblem.title}`
          : `Problem "${newProblem.title}" created!`
      );
      navigate("/admin/problems");
    } catch (err) {
      console.error("Create Problem Error:", err.response || err);
      toast.error(err.response?.data?.message || "Failed to create problem.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitToServer(false);
  };

  const handleSaveDraft = async () => {
    await submitToServer(true);
  };

  // UI styles
  const cardStyle = `bg-black border border-orange-700/60 rounded-xl p-6 sm:p-8 
                     shadow-[0_0_20px_rgba(255,69,0,0.2)] 
                     transition-all duration-300 
                     hover:shadow-[0_0_35px_rgba(255,69,0,0.3)] hover:border-orange-600/80 mb-6`;
  const buttonPrimaryStyle = `w-full bg-orange-600 text-white font-bold rounded-lg py-2.5 px-6 text-base 
                               shadow-[0_0_15px_rgba(255,69,0,0.4)] 
                               transition-all duration-300 transform 
                               hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-105 
                               disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonSecondaryStyle = `bg-transparent border border-orange-600/50 text-orange-500 font-semibold rounded-lg py-1.5 px-3 text-xs shadow-[0_0_10px_rgba(255,69,0,0.2)] transition-all duration-300 transform hover:bg-orange-950/30 hover:border-orange-600/80 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(255,69,0,0.3)] hover:scale-105`;
  const buttonDangerStyle = `bg-red-900/30 text-red-400 border border-red-600/60 shadow-[0_0_8px_rgba(255,0,0,0.3)] hover:bg-red-800/50 hover:text-red-300 focus:ring-red-500 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black`;
  const headingStyle = `text-2xl font-bold text-orange-400 mb-4 [text-shadow:0_0_10px_rgba(255,69,0,0.6)]`;
  const labelStyle = `block text-sm font-medium text-gray-300 mb-1.5`;

  // sanitize preview HTML with DOMPurify (we sanitize the raw markdown string before rendering to avoid raw HTML injection)

  // will be implement later
  // const safeMarkdown = (raw) => {
  //   if (!raw) return "";
  //   // sanitize any embedded HTML fragments inside the markdown string
  //   return DOMPurify.sanitize(raw, { ALLOWED_TAGS: false });
  // };

  return (
    <>
      <button
        onClick={() => navigate("/admin/problems")}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md 
                           border border-orange-600/50 shadow-[0_0_20px_rgba(255,69,0,0.2)] 
                           text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 
                           text-xs sm:text-sm transition-all duration-300 transform 
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] 
                           hover:text-orange-400 hover:scale-105"
      >
        <FaArrowLeft />
        <span className="hidden sm:inline">Back to Manage</span>
      </button>

      <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
              Create New Problem
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={loadExampleProblem}
                type="button"
                className={`${buttonSecondaryStyle} flex items-center gap-2`}
              >
                <FaFileImport /> Load Example
              </button>
              <button
                onClick={handleSaveDraft}
                type="button"
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
                placeholder="e.g., Two Sum"
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
                  label="Link to Contest (Optional)"
                  value={formData.originContest}
                  onChange={handleInputChange}
                  disabled={loadingContests}
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
                  <div className="flex items-center gap-2">
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
                </div>

                {!showDescriptionPreview ? (
                  <>
                    <GodfatherTextarea
                      id="description"
                      name="description"
                      label=""
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={10}
                      required
                      placeholder={`Write problem description using Markdown. Use code fences for examples:\n\n\`\`\`\nInput:\n4\n2 7 11 15\n9\nOutput:\n0 1\n\`\`\``}
                    />
                    <InfoPanel title="Quick Example / Template">
                      {`## Problem Title

Problem description explaining the task.

### Input
n
arr values...
target

### Output
desired output

### Example
\`\`\`
Input:
4
2 7 11 15
9
Output:
0 1
\`\`\`
Use Markdown code fences for multi-line example blocks.`}
                    </InfoPanel>
                  </>
                ) : (
                  <div className="mt-3 p-3 bg-gray-900/50 border border-orange-700/30 rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      (formData.description)
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
                  {!loadingTags && availableTags.length > 0 && (
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
                  {!loadingCompanies && availableCompanies.length > 0 && (
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

                {!formData.originContest && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                      className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-600/60 mr-2"
                    />
                    <label
                      htmlFor="isPublished"
                      className="text-sm font-medium text-gray-300 select-none"
                    >
                      Publish Immediately
                    </label>
                  </div>
                )}
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
                  <div className="mt-2 p-3 bg-gray-900/50 border border-orange-700/30 rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      (formData.solution)
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Starter Code */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Starter Code</h2>
              <p className="text-xs text-gray-400 mb-3">
                Provide starter template(s) per language. The first one will be
                default.
              </p>
              {formData.starterCode.map((sc, index) => (
                <div
                  key={index}
                  className="mb-4 p-3 bg-gray-950/40 border border-gray-700/50 rounded-lg flex flex-col sm:flex-row gap-3 items-start sm:items-end"
                >
                  <div className="flex-shrink-0 w-full sm:w-40">
                    <label
                      htmlFor={`starterLang-${index}`}
                      className={`${labelStyle} !text-xs`}
                    >
                      Language
                    </label>
                    <input
                      type="text"
                      id={`starterLang-${index}`}
                      placeholder="e.g., javascript"
                      value={sc.language}
                      onChange={(e) =>
                        handleStarterCodeChange(
                          index,
                          "language",
                          e.target.value
                        )
                      }
                      className={`w-full p-2 bg-gray-900/60 text-white rounded border border-gray-600/50 focus:outline-none focus:border-orange-600/70 focus:shadow-[0_0_10px_rgba(255,100,0,0.3)] text-xs`}
                      required
                    />
                  </div>
                  <div className="flex-grow w-full">
                    <label
                      htmlFor={`starterCode-${index}`}
                      className={`${labelStyle} !text-xs`}
                    >
                      Code
                    </label>
                    <textarea
                      id={`starterCode-${index}`}
                      value={sc.code}
                      onChange={(e) =>
                        handleStarterCodeChange(index, "code", e.target.value)
                      }
                      className={`w-full p-2 bg-gray-900/60 text-white rounded border border-gray-600/50 focus:outline-none focus:border-orange-600/70 focus:shadow-[0_0_10px_rgba(255,100,0,0.3)] text-xs font-mono min-h-[100px] resize-y`}
                      rows="5"
                      required
                    />
                  </div>
                  {formData.starterCode.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStarterCode(index)}
                      className={`${buttonDangerStyle} shrink-0 ml-auto sm:ml-0 mt-2 sm:mt-0`}
                      title="Remove Code Snippet"
                    >
                      <FaTrashAlt />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addStarterCode}
                  className={`${buttonSecondaryStyle} !py-1 !px-3`}
                >
                  <FaPlus className="inline mr-1" /> Add Language
                </button>
              </div>
            </div>

            {/* Test Cases */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Test Cases</h2>
              <p className="text-xs text-gray-400 mb-3">
                Add structured test-cases. For multi-line input use newline
                (press Enter). The preview below shows exactly how it will
                appear to users.
              </p>

              <InfoPanel title="Test Case Format Example">
                {`Single test case where user input has multiple lines:

Input:
4
2 7 11 15
9

Expected Output:
0 1

When you type above in the Input field, press Enter for new lines; the system will render them correctly.`}
              </InfoPanel>

              {formData.testCasesData.map((tc, index) => (
                <div
                  key={index}
                  className="mb-4 p-3 bg-gray-950/40 border border-gray-700/50 rounded-lg relative"
                >
                  <p className="text-sm font-semibold text-gray-400 mb-2">
                    Test Case #{index + 1}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Input
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={(e) =>
                          handleTestCaseChange(index, "input", e.target.value)
                        }
                        rows={4}
                        placeholder={
                          "Write the raw input as it would be given to the program\n(e.g., first line n, second line array values, third line target)"
                        }
                        className="w-full p-2.5 bg-black text-white rounded-md border border-orange-700/40 text-sm font-mono"
                      />
                      {index === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Tip: Use Enter to create new lines. Preview below
                          shows how users will see it.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Expected Output
                      </label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          handleTestCaseChange(
                            index,
                            "expectedOutput",
                            e.target.value
                          )
                        }
                        rows={4}
                        placeholder="Expected output for the given input"
                        className="w-full p-2.5 bg-black text-white rounded-md border border-orange-700/40 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!tc.isSample}
                        onChange={() =>
                          handleTestCaseChange(
                            index,
                            "isSample",
                            null,
                            "checkbox"
                          )
                        }
                        id={`tc-isSample-${index}`}
                        className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500 mr-2"
                      />
                      <label
                        htmlFor={`tc-isSample-${index}`}
                        className="text-sm font-medium text-gray-300 select-none"
                      >
                        Mark as Sample (visible to users)
                      </label>
                    </div>
                    {formData.testCasesData.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className={`${buttonDangerStyle} ml-auto`}
                      >
                        <FaTrashAlt />
                      </button>
                    )}
                  </div>

                  {/* Live preview for this case */}
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">
                      Preview (how the input will appear to users):
                    </div>
                    <pre className="whitespace-pre-wrap bg-black/30 px-3 py-2 rounded text-orange-300/90 border border-gray-800/50 text-xs font-mono">
                      {(tc.input || "")
                        .replace(/\\r\\n/g, "\n")
                        .replace(/\\n/g, "\n")}
                    </pre>
                    <div className="text-xs text-gray-400 mt-2">
                      Expected Output Preview:
                    </div>
                    <pre className="whitespace-pre-wrap bg-black/30 px-3 py-2 rounded text-orange-300/90 border border-gray-800/50 text-xs font-mono">
                      {(tc.expectedOutput || "")
                        .replace(/\\r\\n/g, "\n")
                        .replace(/\\n/g, "\n")}
                    </pre>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addTestCase}
                  className={`${buttonSecondaryStyle} !py-1 !px-3`}
                >
                  <FaPlus className="inline mr-1" /> Add Test Case
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="submit"
                disabled={
                  loading || loadingTags || loadingCompanies || loadingContests
                }
                className={`${buttonPrimaryStyle} sm:col-span-2`}
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <FaSave className="inline mr-2" /> Create Problem
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className={`${buttonSecondaryStyle} sm:col-span-1`}
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateProblemPage;
