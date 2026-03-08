import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaPlus,
  FaTrashAlt,
  FaSave,
  FaFileImport,
  FaLaptopCode,
  FaEye
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// API instance
import API from "../../api/axios.js";

// --- Loading Spinner  ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
  </div>
);

// ---  Info Panel ---
const InfoPanel = ({ title, children }) => (
  <details className="mb-6 bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden transition-all" open>
    <summary className="cursor-pointer select-none text-xs text-zinc-300 font-bold uppercase tracking-widest p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
      {title}
    </summary>
    <div className="p-4 text-xs text-zinc-400 font-mono whitespace-pre-wrap border-t border-zinc-800/50 leading-relaxed custom-scrollbar overflow-x-auto">
      {children}
    </div>
  </details>
);

// ---  Input ---
const TUFInput = ({ id, name, label, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div className="w-full mb-5">
    <label htmlFor={id} className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    <input
      type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder}
      className={`w-full p-2.5 bg-zinc-950 text-zinc-100 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm placeholder:text-zinc-600 shadow-sm`}
    />
  </div>
);

// ---  Textarea ---
const TUFTextarea = ({ id, name, label, value, onChange, rows = 4, required = false, placeholder = "" }) => (
  <div className="w-full mb-5">
    {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
        {label}
        </label>
    )}
    <textarea
      id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
      className="w-full p-3 bg-zinc-950 text-zinc-300 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm resize-y font-mono placeholder:text-zinc-600 shadow-sm custom-scrollbar"
    />
  </div>
);

// ---  Select ---
const TUFSelect = ({ id, name, label, value, onChange, children, required = false, disabled = false }) => (
  <div className="w-full mb-5">
    <label htmlFor={id} className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    <select
      id={id} name={name || id} value={value} onChange={onChange} required={required} disabled={disabled}
      className="w-full p-2.5 bg-zinc-950 text-zinc-100 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm disabled:opacity-50 shadow-sm cursor-pointer"
    >
      {children}
    </select>
  </div>
);

// Helper for Preview Difficulty Color
const getDifficultyColor = (diff) => {
  if (diff === "Easy") return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  if (diff === "Medium") return "text-amber-400 border-amber-500/20 bg-amber-500/10";
  if (diff === "Hard") return "text-red-400 border-red-500/20 bg-red-500/10";
  if (diff === "Super Hard") return "text-purple-400 border-purple-500/20 bg-purple-500/10";
  return "text-zinc-400 border-zinc-500/20 bg-zinc-500/10";
};

function CreateProblemPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    isPremium: false,
    starterCode: [{ language: "javascript", code: "" }],
    driverCode: [{ language: "javascript", code: "" }], 
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

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingTags(true);
      setLoadingCompanies(true);
      setLoadingContests(true);
      try {
        const tagsPromise = API.get(`/tags/problems`);
        const companiesPromise = API.get(`/tags/companies`);
        const contestsPromise = API.get(`/contests`);

        const [tagsResult, companiesResult, contestsResult] = await Promise.allSettled([
            tagsPromise, companiesPromise, contestsPromise,
        ]);

        if (tagsResult.status === "fulfilled") setAvailableTags(tagsResult.value.data?.data || tagsResult.value.data || []);
        else toast.error("Failed to load problem tags.");

        if (companiesResult.status === "fulfilled") setAvailableCompanies(companiesResult.value.data?.data || companiesResult.value.data || []);
        else toast.error("Failed to load company tags.");

        if (contestsResult.status === "fulfilled") setUpcomingContests(contestsResult.value.data?.data?.upcoming || contestsResult.value.data?.upcoming || []);
        else toast.error("Failed to load contests list.");

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
  const addStarterCode = () => setFormData((prev) => ({ ...prev, starterCode: [...prev.starterCode, { language: "", code: "" }] }));
  const removeStarterCode = (index) => setFormData((prev) => ({ ...prev, starterCode: prev.starterCode.filter((_, i) => i !== index) }));
    
  // Driver code handlers
  const handleDriverCodeChange = (index, field, value) => {
    const dc = [...formData.driverCode];
    dc[index][field] = value;
    setFormData((prev) => ({ ...prev, driverCode: dc }));
  };
  const addDriverCode = () => setFormData((prev) => ({ ...prev, driverCode: [...prev.driverCode, { language: "", code: "" }] }));
  const removeDriverCode = (index) => setFormData((prev) => ({ ...prev, driverCode: prev.driverCode.filter((_, i) => i !== index) }));

  // Test case handlers
  const handleTestCaseChange = (index, field, value, type = "text") => {
    const tc = [...formData.testCasesData];
    tc[index][field] = type === "checkbox" ? !tc[index][field] : value;
    setFormData((prev) => ({ ...prev, testCasesData: tc }));
  };
  const addTestCase = () => setFormData((prev) => ({ ...prev, testCasesData: [...prev.testCasesData, { input: "", expectedOutput: "", isSample: false }] }));
  const removeTestCase = (index) => setFormData((prev) => ({ ...prev, testCasesData: prev.testCasesData.filter((_, i) => i !== index) }));

  // Example loader
  const loadExampleProblem = () => {
    const example = {
      title: "Two Sum (Example)",
      description: `## Two Sum\n\nGiven an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.\n\n### Input\nFirst line: n (size of array)  \nSecond line: n space-separated integers  \nThird line: target\n\n### Output\nSingle line with two indices (0-based) in any order.\n\n### Example\n\`\`\`\nInput:\n4\n2 7 11 15\n9\nOutput:\n0 1\n\`\`\`\n\n`,
      difficulty: "Easy",
      starterCode: [{ language: "javascript", code: `// Example starter (JS)\nfunction twoSum(nums, target) {\n  // write your code\n}` }],
      driverCode: [{ language: "javascript", code: `// Read input and execute twoSum` }],
      testCasesData: [
        { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isSample: true },
        { input: "3\n3 2 4\n6", expectedOutput: "1 2", isSample: true },
      ],
      solution: `### Approach\nUse a hash map to store seen values and indices. For each number, check if (target - num) exists.\n\n\`\`\`js\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (map.has(need)) return [map.get(need), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\`\`\``,
    };
    setFormData((prev) => ({ ...prev, ...example }));
    setTagInput("array, hash-table");
    setCompanyTagInput("leetcode, google");
    toast.success("Loaded example problem template.");
  };

  // Normalize and validate
  const normalizeForSubmit = (data) => {
    const normalized = { ...data };
    normalized.description = (normalized.description || "").replace(/\r\n/g, "\n").trim();
    normalized.solution = (normalized.solution || "").replace(/\r\n/g, "\n").trim();
    normalized.testCasesData = (normalized.testCasesData || []).map((tc) => ({
      input: (tc.input || "").replace(/\r\n/g, "\n").trim(),
      expectedOutput: (tc.expectedOutput || "").replace(/\r\n/g, "\n").trim(),
      isSample: !!tc.isSample,
    }));
    normalized.starterCode = (normalized.starterCode || []).map((s) => ({
      language: (s.language || "").trim(),
      code: (s.code || "").replace(/\r\n/g, "\n"),
    }));
    normalized.driverCode = (normalized.driverCode || []).map((s) => ({
      language: (s.language || "").trim(),
      code: (s.code || "").replace(/\r\n/g, "\n"),
    }));
    return normalized;
  };

  const validateBeforeSubmit = (data) => {
    if (!data.title || !data.title.trim()) return "Title is required.";
    if (!data.description || !data.description.trim()) return "Description is required.";
    if (!Array.isArray(data.testCasesData) || data.testCasesData.length === 0) return "At least one test case is required.";
    for (let i = 0; i < data.testCasesData.length; i++) {
      const tc = data.testCasesData[i];
      if (!tc.input || !tc.input.trim()) return `Test case #${i + 1} input is empty.`;
      if (!tc.expectedOutput || !tc.expectedOutput.trim()) return `Test case #${i + 1} expected output is empty.`;
    }
    if (!Array.isArray(data.starterCode) || data.starterCode.length === 0) return "Provide at least one starter code snippet.";
    for (let i = 0; i < data.starterCode.length; i++) {
      const s = data.starterCode[i];
      if (!s.language || !s.language.trim()) return `Starter code #${i + 1} needs a language.`;
    }
    return null;
  };

  // Submit
  const submitToServer = async (isDraft = false) => {
    const payload = normalizeForSubmit({
      ...formData,
      isPublished: !isDraft && formData.isPublished,
    });
    if (isDraft) payload.isPublished = false;

    const validationError = validateBeforeSubmit(payload);
    if (validationError) return toast.error(validationError);

    setLoading(true);
    try {
      const tagsArray = tagInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const companyTagsArray = companyTagInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

      const submissionData = {
        ...payload,
        tags: tagsArray,
        companyTags: companyTagsArray,
        originContest: payload.originContest || null,
      };

      // Ensure this points to the exact route your backend uses for creation
      const { data } = await API.post(`/problems/`, submissionData);
      const newProblem = data?.data || data;

      toast.success(isDraft ? `Draft saved: ${newProblem.title}` : `Problem "${newProblem.title}" created!`);
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

  // --- TUF Styles ---
  const cardStyle = `bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md mb-8`;
  const headingStyle = `text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2`;
  const buttonPrimaryStyle = `w-full bg-red-600 text-white font-semibold rounded-md py-2.5 px-6 text-sm transition-colors hover:bg-red-500 shadow-sm disabled:opacity-50`;
  const buttonSecondaryStyle = `bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-md py-2 px-4 text-xs transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonDangerStyle = `bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 hover:border-zinc-600 rounded-md p-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500`;

  return (
    <>
      <button
        onClick={() => navigate("/admin/problems")}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 font-medium rounded-full py-2 px-4 text-xs transition-colors hover:bg-zinc-800 hover:text-white shadow-lg"
      >
        <FaArrowLeft size={12}/>
        <span className="hidden sm:inline">Back to Manage</span>
      </button>

      <div className="min-h-screen bg-zinc-950 text-zinc-300 pt-34 px-4 sm:px-6 lg:px-8 pb-20 font-sans">
        
        {/* 🔥 MASSIVE WIDE CONTAINER FOR SPLIT SCREEN */}
        <div className="max-w-[1600px] w-full mx-auto">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Create New Problem
            </h1>
            <div className="flex items-center gap-3">
              <button onClick={loadExampleProblem} type="button" className={buttonSecondaryStyle + " flex items-center gap-2"}>
                <FaFileImport /> Load Example
              </button>
              <button onClick={handleSaveDraft} type="button" disabled={loading} className={buttonSecondaryStyle}>
                Save as Draft
              </button>
            </div>
          </div>

          {/* 🔥 GRID LAYOUT: Left (Editor) | Right (Live Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.5fr_1fr] gap-8 items-start">
            
            {/* ======================= */}
            {/* LEFT COLUMN: THE EDITOR */}
            {/* ======================= */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {/* --- Problem Details --- */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>Problem Overview</h2>

                <TUFInput id="title" name="title" label="Problem Title" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Two Sum" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
                  <TUFSelect id="difficulty" name="difficulty" label="Difficulty" value={formData.difficulty} onChange={handleInputChange} required>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Super Hard">Super Hard</option>
                  </TUFSelect>

                  <TUFSelect id="originContest" name="originContest" label="Linked Contest (Optional)" value={formData.originContest} onChange={handleInputChange} disabled={loadingContests}>
                    <option value="">None (Public Problem)</option>
                    {upcomingContests.map((contest) => (
                      <option key={contest._id} value={contest._id}>{contest.title}</option>
                    ))}
                  </TUFSelect>
                </div>

                <div className="mt-4">
                  <TUFTextarea id="description" name="description" label="Description (Markdown)" value={formData.description} onChange={handleInputChange} rows={12} required placeholder="Write problem description using Markdown..." />
                  
                  <InfoPanel title="Quick Markdown Template">
{`## Problem Title

Explain the task clearly here.

### Input
n (size of array)
arr values (space-separated)
target

### Output
Desired output format

### Example
\`\`\`
Input:
4
2 7 11 15
9
Output:
0 1
\`\`\``}
                  </InfoPanel>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2 pt-6 border-t border-zinc-800/50">
                  <div>
                    <TUFInput id="tags-input" name="tags" label="Problem Tags (comma-separated)" value={tagInput} onChange={handleTagInputChange} placeholder="e.g., array, hash-table" />
                    {!loadingTags && availableTags.length > 0 && (
                      <p className="text-[10px] text-zinc-500 -mt-3.5">Allowed: {availableTags.slice(0, 4).join(", ")}...</p>
                    )}
                  </div>
                  <div>
                    <TUFInput id="companyTags-input" name="companyTags" label="Company Tags (comma-separated)" value={companyTagInput} onChange={handleCompanyTagInputChange} placeholder="e.g., google, amazon" />
                    {!loadingCompanies && availableCompanies.length > 0 && (
                      <p className="text-[10px] text-zinc-500 -mt-3.5">Allowed: {availableCompanies.slice(0, 4).join(", ")}...</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 pt-6 border-t border-zinc-800/50">
                  <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                    <input
                      type="checkbox" id="isPremium" name="isPremium" checked={formData.isPremium} onChange={handleInputChange}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-950"
                    />
                    <label htmlFor="isPremium" className="text-sm font-medium text-amber-500 select-none">
                      Mark as Premium Content
                    </label>
                  </div>

                  {!formData.originContest && (
                    <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                      <input
                        type="checkbox" id="isPublished" name="isPublished" checked={formData.isPublished} onChange={handleInputChange}
                        className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-950"
                      />
                      <label htmlFor="isPublished" className="text-sm font-medium text-emerald-400 select-none">
                        Publish to General Public
                      </label>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800/50">
                  <TUFTextarea id="solution" name="solution" label="Solution / Editorial (Optional)" value={formData.solution} onChange={handleInputChange} rows={8} />
                </div>
              </div>

              {/* --- Starter Code --- */}
              <div className={cardStyle}>
                <h2 className={headingStyle}><FaLaptopCode className="text-red-500"/> Starter Code</h2>
                <p className="text-xs text-zinc-500 mb-5">Provide boilerplate templates. The first language listed will be the default.</p>
                
                {formData.starterCode.map((sc, index) => (
                  <div key={index} className="mb-5 p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-shrink-0 w-full sm:w-48">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Language</label>
                      <input
                        type="text" placeholder="e.g., javascript" value={sc.language} onChange={(e) => handleStarterCodeChange(index, "language", e.target.value)} required
                        className="w-full p-2 bg-zinc-900 text-zinc-200 rounded border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm"
                      />
                    </div>
                    <div className="flex-grow w-full">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Code Boilerplate</label>
                      <textarea
                        value={sc.code} onChange={(e) => handleStarterCodeChange(index, "code", e.target.value)} required rows="5"
                        className="w-full p-3 bg-zinc-900 text-zinc-300 rounded border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs font-mono resize-y custom-scrollbar"
                      />
                    </div>
                    {formData.starterCode.length > 1 && (
                      <button type="button" onClick={() => removeStarterCode(index)} className={`${buttonDangerStyle} sm:mb-1`} title="Remove Code Snippet">
                        <FaTrashAlt />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addStarterCode} className={buttonSecondaryStyle}>
                  <FaPlus className="inline mr-1.5" /> Add Language
                </button>
              </div>

              {/* --- Driver Code --- */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>Backend Driver Code</h2>
                <p className="text-xs text-zinc-500 mb-5 leading-relaxed max-w-2xl">
                  This is the hidden execution wrapper. It must read test cases from standard input, call the user's function, and print the output to standard output. Do not show this to the user.
                </p>
                
                {formData.driverCode.map((dc, index) => (
                  <div key={`dc-${index}`} className="mb-5 p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-shrink-0 w-full sm:w-48">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Language</label>
                      <input
                        type="text" placeholder="e.g., javascript" value={dc.language} onChange={(e) => handleDriverCodeChange(index, "language", e.target.value)} required
                        className="w-full p-2 bg-zinc-900 text-zinc-200 rounded border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm"
                      />
                    </div>
                    <div className="flex-grow w-full">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Driver Logic</label>
                      <textarea
                        value={dc.code} onChange={(e) => handleDriverCodeChange(index, "code", e.target.value)} required rows="5" placeholder="// Read stdin, execute, write stdout"
                        className="w-full p-3 bg-zinc-900 text-zinc-300 rounded border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs font-mono resize-y custom-scrollbar"
                      />
                    </div>
                    {formData.driverCode.length > 1 && (
                      <button type="button" onClick={() => removeDriverCode(index)} className={`${buttonDangerStyle} sm:mb-1`} title="Remove Driver Code">
                        <FaTrashAlt />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addDriverCode} className={buttonSecondaryStyle}>
                  <FaPlus className="inline mr-1.5" /> Add Driver Code
                </button>
              </div>

              {/* --- Initial Test Cases Setup --- */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>Initial Test Cases</h2>
                <p className="text-xs text-zinc-500 mb-5">
                  Add the core test cases that will be saved alongside this problem during creation. 
                  (You can add more via the Edit page later).
                </p>

                {formData.testCasesData.map((tc, index) => (
                  <div key={`tc-${index}`} className="mb-6 p-5 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
                        Test Case #{index + 1}
                      </p>
                      {formData.testCasesData.length > 1 && (
                        <button type="button" onClick={() => removeTestCase(index)} className={buttonDangerStyle} title="Remove Test Case">
                          <FaTrashAlt size={12}/>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Input</label>
                        <textarea
                          value={tc.input} onChange={(e) => handleTestCaseChange(index, "input", e.target.value)} rows={4}
                          placeholder="e.g.,\n4\n2 7 11 15\n9"
                          className="w-full p-3 bg-zinc-900 text-zinc-300 rounded border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs font-mono resize-y custom-scrollbar"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Expected Output</label>
                        <textarea
                          value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)} rows={4}
                          placeholder="e.g.,\n0 1"
                          className="w-full p-3 bg-zinc-900 text-zinc-300 rounded border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs font-mono resize-y custom-scrollbar"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox" id={`tc-sample-${index}`} checked={!!tc.isSample}
                        onChange={() => handleTestCaseChange(index, "isSample", null, "checkbox")}
                        className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-950"
                      />
                      <label htmlFor={`tc-sample-${index}`} className="text-sm font-medium text-zinc-300 select-none">
                        Mark as Sample (Visible to user)
                      </label>
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={addTestCase} className={buttonSecondaryStyle}>
                  <FaPlus className="inline mr-1.5" /> Add Another Test Case
                </button>
              </div>

              {/* --- Bottom Submit Actions --- */}
              <div className="mb-10 flex flex-col sm:flex-row items-center gap-4">
                <button type="submit" disabled={loading} className={buttonPrimaryStyle}>
                  {loading ? "Creating..." : <><FaSave className="inline mr-2" /> Create Problem</>}
                </button>
                <button type="button" onClick={handleSaveDraft} disabled={loading} className={`${buttonSecondaryStyle} w-full sm:w-auto py-2.5`}>
                  Save as Draft
                </button>
              </div>
            </form>

            {/* ===================================== */}
            {/* RIGHT COLUMN: STICKY LIVE PREVIEW     */}
            {/* ===================================== */}
            <div className="hidden lg:block sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl custom-scrollbar">
              
              {/* Preview Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-10 backdrop-blur-md flex justify-between items-center">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                  <FaEye className="text-emerald-500" size={16} /> Live Preview
                </h2>
                <span className="text-[10px] text-zinc-500 font-medium">Updates Automatically</span>
              </div>

              {/* Preview Body */}
              <div className="p-8 space-y-8">
                
                {/* Problem Header Preview */}
                <div>
                  <h1 className="text-3xl font-bold text-zinc-100 mb-4 tracking-tight">
                    {formData.title || "Untitled Problem"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-md border ${getDifficultyColor(formData.difficulty)}`}>
                      {formData.difficulty}
                    </span>
                    {formData.isPremium && (
                      <span className="px-3 py-1 text-xs font-bold rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-500">
                        Premium
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags Preview */}
                {(tagInput.trim() || companyTagInput.trim()) && (
                  <div className="flex flex-wrap gap-2">
                    {tagInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                      <span key={`tag-${i}`} className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md text-[11px] font-medium">
                        {tag}
                      </span>
                    ))}
                    {companyTagInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                      <span key={`comp-${i}`} className="px-2.5 py-1 bg-blue-900/10 border border-blue-500/20 text-blue-400 rounded-md text-[11px] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description Preview */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
                    Description
                  </h3>
                  <div className="problem-description-markdown text-zinc-300 leading-relaxed text-sm">
                    {formData.description ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {formData.description}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-zinc-600 italic">Start typing in the description editor to see the preview here...</p>
                    )}
                  </div>
                </div>

                {/* Sample Test Cases Preview */}
                {formData.testCasesData.filter(tc => tc.isSample && (tc.input || tc.expectedOutput)).length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {formData.testCasesData.filter(tc => tc.isSample).map((tc, index) => (
                        <div key={`preview-tc-${index}`} className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4">
                          <p className="text-xs font-bold text-zinc-200 mb-3">Example {index + 1}:</p>
                          <div className="mb-3">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Input:</span>
                            <div className="font-mono text-sm text-zinc-300 bg-zinc-900 p-2 rounded-md border border-zinc-800/80 whitespace-pre-wrap">
                              {tc.input}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Output:</span>
                            <div className="font-mono text-sm text-zinc-300 bg-zinc-900 p-2 rounded-md border border-zinc-800/80 whitespace-pre-wrap">
                              {tc.expectedOutput}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editorial/Solution Preview */}
                {formData.solution && (
                  <div className="pt-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
                      Solution / Editorial
                    </h3>
                    <div className="problem-description-markdown text-zinc-300 leading-relaxed text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {formData.solution}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateProblemPage;