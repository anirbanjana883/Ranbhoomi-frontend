import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; 
import {
  FaArrowLeft,
  FaPlus,
  FaTrashAlt,
  FaSave,
  FaEye,
  FaLaptopCode
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

// ---  Input ---
const TUFInput = ({ id, name, label, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div className="w-full mb-5">
    <label htmlFor={id} className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    <input
      type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder}
      className="w-full p-2.5 bg-zinc-950 text-zinc-100 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm placeholder:text-zinc-600 shadow-sm"
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

function EditProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [loading, setLoading] = useState(true); 
  const [saving, setSaving] = useState(false); 
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    isPremium: false,
    isPublished: true,
    originContest: "",
    starterCode: [{ language: "javascript", code: "" }],
    driverCode: [{ language: "javascript", code: "" }], 
    solution: "",
  });

  const [testCases, setTestCases] = useState([]); 
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

  // --- Fetch All Data on Load ---
  useEffect(() => {
    const fetchAllData = async () => {
      if (!slug) return;
      setLoading(true);
      setLoadingDropdowns(true);
      try {
        const problemPromise = API.get(`/problems/admin/${slug}`);
        const testCasesPromise = API.get(`/problems/${slug}/testcases`);
        const tagsPromise = API.get(`/tags/problems`);
        const companiesPromise = API.get(`/tags/companies`);
        const contestsPromise = API.get(`/contests`);

        const [
          problemRes,
          testCasesRes,
          tagsResult,
          companiesResult,
          contestsResult,
        ] = await Promise.allSettled([
          problemPromise, testCasesPromise, tagsPromise, companiesPromise, contestsPromise,
        ]);

        // Process Problem
        if (problemRes.status === "fulfilled") {
          const fetchedProblem = problemRes.value.data?.data || problemRes.value.data;
          
          setFormData({
            title: fetchedProblem.title || "",
            description: fetchedProblem.description || "",
            difficulty: fetchedProblem.difficulty || "Easy",
            isPremium: fetchedProblem.isPremium || false,
            isPublished: fetchedProblem.isPublished,
            originContest: fetchedProblem.originContest || "",
            starterCode: fetchedProblem.starterCode?.length > 0 ? fetchedProblem.starterCode : [{ language: "javascript", code: "" }],
            driverCode: fetchedProblem.driverCode?.length > 0 ? fetchedProblem.driverCode : [{ language: "javascript", code: "" }],
            solution: fetchedProblem.solution || "",
          });
          setTagInput((fetchedProblem.tags || []).join(", "));
          setCompanyTagInput((fetchedProblem.companyTags || []).join(", "));
        } else {
          throw new Error("Failed to load problem data.");
        }

        // Process Test Cases
        if (testCasesRes.status === "fulfilled") {
          setTestCases(testCasesRes.value.data?.data || testCasesRes.value.data || []);
        } else {
          throw new Error("Failed to load test cases.");
        }

        // Process Dropdown Data
        if (tagsResult.status === "fulfilled") setAvailableTags(tagsResult.value.data?.data || tagsResult.value.data || []);
        else toast.error("Failed to load problem tags.");

        if (companiesResult.status === "fulfilled") setAvailableCompanies(companiesResult.value.data?.data || companiesResult.value.data || []);
        else toast.error("Failed to load company tags.");

        if (contestsResult.status === "fulfilled") setUpcomingContests(contestsResult.value.data?.data?.upcoming || contestsResult.value.data?.upcoming || []);
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
  
  // Starter code handlers
  const handleStarterCodeChange = (index, field, value) => {
    const sc = [...formData.starterCode];
    sc[index][field] = value;
    setFormData((prev) => ({ ...prev, starterCode: sc }));
  };
  const addStarterCode = () => setFormData((prev) => ({ ...prev, starterCode: [...prev.starterCode, { language: "", code: "" }] }));
  const removeStarterCode = (index) => {
    if (formData.starterCode.length > 1) setFormData((prev) => ({ ...prev, starterCode: prev.starterCode.filter((_, i) => i !== index) }));
  };

  // Driver code handlers
  const handleDriverCodeChange = (index, field, value) => {
    const dc = [...formData.driverCode];
    dc[index][field] = value;
    setFormData((prev) => ({ ...prev, driverCode: dc }));
  };
  const addDriverCode = () => setFormData((prev) => ({ ...prev, driverCode: [...prev.driverCode, { language: "", code: "" }] }));
  const removeDriverCode = (index) => setFormData((prev) => ({ ...prev, driverCode: prev.driverCode.filter((_, i) => i !== index) }));

  const handleNewTestCaseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTestCase((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // --- Test Case API Handlers ---
  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!newTestCase.input.trim() || newTestCase.expectedOutput === undefined) {
      toast.error("Input and Output required.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await API.post(`/problems/${slug}/testcases`, newTestCase);
      const addedTestCase = data?.data || data;
      setTestCases((prev) => [...prev, addedTestCase]); 
      setNewTestCase({ input: "", expectedOutput: "", isSample: false }); 
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
      await API.delete(`/problems/testcases/${testCaseId}`);
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
    normalized.description = (normalized.description || "").replace(/\r\n/g, "\n").trim();
    normalized.solution = (normalized.solution || "").replace(/\r\n/g, "\n").trim();
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
    if (!Array.isArray(data.starterCode) || data.starterCode.length === 0) return "Provide at least one starter code snippet.";
    for (let i = 0; i < data.starterCode.length; i++) {
      if (!data.starterCode[i].language || !data.starterCode[i].language.trim()) return `Starter code #${i + 1} needs a language.`;
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
      const tagsArray = tagInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const companyTagsArray = companyTagInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

      const submissionData = {
        ...payload,
        tags: tagsArray,
        companyTags: companyTagsArray,
        originContest: payload.originContest || null,
      };

       const { data } = await API.patch(`/problems/${slug}`, submissionData);
      
      const updatedProblem = data?.data || data;

      toast.success(isDraft ? `Draft saved: ${updatedProblem.title}` : `Problem "${updatedProblem.title}" updated!`);

      if (updatedProblem.slug !== slug) {
        navigate(`/admin/problems/edit/${updatedProblem.slug}`, { replace: true });
      } else {
        window.location.reload();
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
    await submitToServer(false); 
  };

  const handleSaveDraft = async () => {
    await submitToServer(true); 
  };

  // ---  Styles ---
  const cardStyle = `bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md mb-8`;
  const headingStyle = `text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2`;
  
  const buttonPrimaryStyle = `w-full bg-red-600 text-white font-semibold rounded-md py-2.5 px-6 text-sm transition-colors hover:bg-red-500 shadow-sm disabled:opacity-50`;
  const buttonSecondaryStyle = `bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-md py-2 px-4 text-xs transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonDangerStyle = `bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 hover:border-zinc-600 rounded-md p-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500`;

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <button
        onClick={() => navigate("/admin/problems")}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 font-medium rounded-full py-2 px-4 text-xs transition-colors hover:bg-zinc-800 hover:text-white shadow-lg"
      >
        <FaArrowLeft size={12}/>
        <span className="hidden sm:inline">Back to Manage</span>
      </button>

      <div className="min-h-screen bg-zinc-950 text-zinc-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 font-sans">
        
        <div className="max-w-[1600px] w-full mx-auto">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Edit Problem
            </h1>
            <button onClick={handleSaveDraft} type="button" disabled={saving} className={buttonSecondaryStyle}>
              Save as Draft
            </button>
          </div>

          {/*  GRID LAYOUT: Left (Editor) | Right (Live Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.5fr_1fr] gap-8 items-start">
            
            {/* ======================= */}
            {/* LEFT COLUMN: THE EDITOR */}
            {/* ======================= */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {/* --- Problem Details --- */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>Problem Overview</h2>

                <TUFInput id="title" name="title" label="Problem Title" value={formData.title} onChange={handleInputChange} required />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
                  <TUFSelect id="difficulty" name="difficulty" label="Difficulty" value={formData.difficulty} onChange={handleInputChange} required>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Super Hard">Super Hard</option>
                  </TUFSelect>

                  <TUFSelect id="originContest" name="originContest" label="Linked Contest (Optional)" value={formData.originContest} onChange={handleInputChange} disabled={loadingDropdowns}>
                    <option value="">None (Public Problem)</option>
                    {upcomingContests.map((contest) => (
                      <option key={contest._id} value={contest._id}>{contest.title}</option>
                    ))}
                  </TUFSelect>
                </div>

                <div className="mt-4">
                  {/* Removed Preview Toggle Button - Just the Textarea now! */}
                  <TUFTextarea id="description" name="description" label="Description (Markdown)" value={formData.description} onChange={handleInputChange} rows={12} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2 pt-6 border-t border-zinc-800/50">
                  <div>
                    <TUFInput id="tags-input" name="tags" label="Problem Tags (comma-separated)" value={tagInput} onChange={handleTagInputChange} />
                    {!loadingDropdowns && availableTags.length > 0 && (
                      <p className="text-[10px] text-zinc-500 -mt-3.5">Allowed: {availableTags.slice(0, 4).join(", ")}...</p>
                    )}
                  </div>
                  <div>
                    <TUFInput id="companyTags-input" name="companyTags" label="Company Tags (comma-separated)" value={companyTagInput} onChange={handleCompanyTagInputChange} />
                    {!loadingDropdowns && availableCompanies.length > 0 && (
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
                  {/* Removed Preview Toggle Button - Just the Textarea now! */}
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
                
                {formData.driverCode && formData.driverCode.map((dc, index) => (
                  <div key={index} className="mb-5 p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-end">
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
                    <button type="button" onClick={() => removeDriverCode(index)} className={`${buttonDangerStyle} sm:mb-1`} title="Remove Driver Code">
                      <FaTrashAlt />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addDriverCode} className={buttonSecondaryStyle}>
                  <FaPlus className="inline mr-1.5" /> Add Driver Code
                </button>
              </div>

              {/* --- Test Cases --- */}
              <div className={cardStyle}>
                <h2 className={headingStyle}>Test Cases ({testCases.length})</h2>
                
                {/* Existing Test Cases */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-8 custom-scrollbar">
                  {testCases.map((tc, index) => (
                    <div key={tc._id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex justify-between items-start gap-4">
                      <div className="flex-grow space-y-3 overflow-hidden">
                        <p className="text-sm font-bold text-zinc-300">
                          Case #{index + 1} {tc.isSample && <span className="text-emerald-400 ml-2 text-xs">(Sample)</span>}
                        </p>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Input</p>
                          <pre className="whitespace-pre-wrap bg-zinc-900 p-2.5 rounded-md border border-zinc-800 text-zinc-300 text-xs font-mono custom-scrollbar">
                            {tc.input}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Expected Output</p>
                          <pre className="whitespace-pre-wrap bg-zinc-900 p-2.5 rounded-md border border-zinc-800 text-zinc-300 text-xs font-mono custom-scrollbar">
                            {tc.expectedOutput}
                          </pre>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleDeleteTestCase(tc._id)} disabled={saving} className={buttonDangerStyle} title="Delete Test Case">
                        <FaTrashAlt size={14}/>
                      </button>
                    </div>
                  ))}
                  {!loading && testCases.length === 0 && (
                    <div className="p-8 border border-dashed border-zinc-800 rounded-lg text-center">
                      <p className="text-zinc-500 text-sm">No test cases added yet.</p>
                    </div>
                  )}
                </div>

                {/* Add New Test Case Form */}
                <div className="bg-zinc-950 p-5 rounded-lg border border-zinc-800">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Add New Test Case</h3>
                  <div className="space-y-4">
                      <TUFTextarea id="new-input" name="input" label="Standard Input" value={newTestCase.input} onChange={handleNewTestCaseChange} rows={3} />
                      <TUFTextarea id="new-output" name="expectedOutput" label="Expected Standard Output" value={newTestCase.expectedOutput} onChange={handleNewTestCaseChange} rows={3} />
                      
                      <div className="flex items-center gap-3 pt-2">
                          <input
                          type="checkbox" id="new-isSample" name="isSample" checked={newTestCase.isSample} onChange={handleNewTestCaseChange}
                          className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-950"
                          />
                          <label htmlFor="new-isSample" className="text-sm font-medium text-zinc-300 select-none">
                              Mark as Sample (Visible in Problem Description)
                          </label>
                      </div>

                      <button type="button" onClick={handleAddTestCase} disabled={saving} className={`${buttonSecondaryStyle} mt-4`}>
                          {saving ? "Processing..." : <><FaPlus className="inline mr-1.5" /> Save Test Case</>}
                      </button>
                  </div>
                </div>
              </div>

              {/* --- Bottom Submit Actions --- */}
              <div className="mb-10 flex flex-col sm:flex-row items-center gap-4">
                <button type="submit" disabled={saving || loadingDropdowns} className={buttonPrimaryStyle}>
                  {saving ? "Saving Changes..." : <><FaSave className="inline mr-2" /> Publish Updates</>}
                </button>
                <button type="button" onClick={handleSaveDraft} disabled={saving || loadingDropdowns} className={`${buttonSecondaryStyle} w-full sm:w-auto py-2.5`}>
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

                {/* 🔥 NEW: Sample Test Cases Preview */}
                {testCases.filter(tc => tc.isSample).length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {testCases.filter(tc => tc.isSample).map((tc, index) => (
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

export default EditProblemPage;