import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaPlus,
  FaTrashAlt,
  FaSave,
  FaFileImport,
  FaEye,
  FaCodeBranch,
  FaTimes,
  FaFire
} from "react-icons/fa";
import { BsTagsFill } from "react-icons/bs";
import { FaBuilding } from "react-icons/fa6";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import API from "../../api/axios.js";

// --- TAG CONFIGURATION DATA ---
const ALLOWED_PROBLEM_TAGS = [
  "array", "string", "hash-table", "linked-list", "stack", "queue", "deque",
  "tree", "binary-tree", "binary-search-tree", "trie", "segment-tree",
  "fenwick-tree", "heap", "priority-queue", "graph", "depth-first-search", 
  "breadth-first-search", "union-find", "shortest-path", "minimum-spanning-tree", 
  "topological-sort", "sorting", "searching", "binary-search", "two-pointers", 
  "sliding-window", "recursion", "backtracking", "dynamic-programming", "greedy",
  "divide-and-conquer", "memoization", "prefix-sum", "math", "geometry", 
  "bit-manipulation", "number-theory", "combinatorics", "probability",
  "string-matching", "suffix-array", "suffix-tree", "design", "simulation", 
  "matrix", "monotonic-stack", "ordered-set", "randomized", "game-theory", 
  "interactive", "concurrency", "database"
].sort();

const ALLOWED_COMPANY_TAGS = [
  "google", "facebook", "amazon", "apple", "microsoft", "netflix", "airbnb",
  "uber", "linkedin", "twitter", "snapchat", "tiktok", "bloomberg", "adobe",
  "oracle", "salesforce", "cisco", "paypal", "ebay", "intuit", "yahoo",
  "vmware", "goldman sachs", "jpmorgan chase", "capital one", "atlassian",
  "spotify", "roblox", "doordash", "square", "stripe", "twilio", "nvidia"
].sort();

const SIGNATURE_TYPES = ["int", "float", "string", "boolean", "int[]", "string[]", "void"];

// ─── UI COMPONENTS ─────────────────────────────────────────────────────────
const TUFInput = ({ id, name, label, value, onChange, type = "text", required = false, placeholder = "", min, step }) => (
  <div className="w-full mb-5">
    {label && <label htmlFor={id} className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</label>}
    <input
      type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder} min={min} step={step}
      className="w-full p-2.5 bg-zinc-950 text-zinc-100 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm placeholder:text-zinc-600 shadow-inner"
    />
  </div>
);

const TUFTextarea = ({ id, name, label, value, onChange, rows = 4, required = false, placeholder = "" }) => (
  <div className="w-full mb-5">
    {label && <label htmlFor={id} className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</label>}
    <textarea
      id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
      className="w-full p-3 bg-zinc-950 text-zinc-300 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm resize-y font-mono placeholder:text-zinc-600 shadow-inner custom-scrollbar"
    />
  </div>
);

const TUFSelect = ({ id, name, label, value, onChange, children, required = false, disabled = false }) => (
  <div className="w-full mb-5">
    {label && <label htmlFor={id} className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</label>}
    <select
      id={id} name={name || id} value={value} onChange={onChange} required={required} disabled={disabled}
      className="w-full p-2.5 bg-zinc-950 text-zinc-100 rounded-md border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm disabled:opacity-50 shadow-inner cursor-pointer"
    >
      {children}
    </select>
  </div>
);

// ─── SEARCHABLE MULTI-SELECT DROPDOWN ──────────────────────────────────────
const TUFMultiSelect = ({ label, options, selected, onChange, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(opt)
  );

  const handleSelect = (option) => {
    onChange([...selected, option]);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleRemove = (option) => {
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className="w-full mb-5 relative" ref={dropdownRef}>
      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={10} />} {label}
      </label>
      
      <div className="min-h-[42px] p-1.5 bg-zinc-950 rounded-md border border-zinc-800 flex flex-wrap gap-2 items-center focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all cursor-text shadow-inner" onClick={() => setIsOpen(true)}>
        {selected.map((item) => (
          <span key={item} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md text-[11px] font-medium capitalize select-none">
            {item.replace(/-/g, " ")}
            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(item); }} className="text-zinc-500 hover:text-red-400 transition-colors"><FaTimes size={10} /></button>
          </span>
        ))}
        <input
          type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }} placeholder={selected.length === 0 ? placeholder : ""}
          className="flex-grow bg-transparent text-sm text-zinc-200 outline-none p-1 min-w-[120px] placeholder:text-zinc-600"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 py-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div key={option} onClick={() => handleSelect(option)} className="px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors capitalize">
                {option.replace(/-/g, " ")}
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-xs text-zinc-500 italic text-center">No matching options found.</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE COMPONENT ───────────────────────────────────────────────────
export default function CreateProblemPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    isPremium: false,
    solution: "",
    isPublished: true,
    originContest: "",
    timeLimit: 2.0,
    memoryLimit: 256000,
    signature: {
      functionName: "solution",
      returnType: "void",
      parameters: []
    },
    testCasesData: [{ input: "", expectedOutput: "", isSample: true }]
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCompanyTags, setSelectedCompanyTags] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loadingContests, setLoadingContests] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const { data } = await API.get(`/contests`);
        setUpcomingContests(data?.data?.upcoming || data?.upcoming || []);
      } catch (err) {
        toast.error("Failed to load contests list.");
      } finally {
        setLoadingContests(false);
      }
    };
    fetchContests();
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

  const handleSignatureChange = (field, value) => {
    setFormData(prev => ({ ...prev, signature: { ...prev.signature, [field]: value } }));
  };

  const handleParamChange = (index, field, value) => {
    const newParams = [...formData.signature.parameters];
    newParams[index][field] = value;
    setFormData(prev => ({ ...prev, signature: { ...prev.signature, parameters: newParams } }));
  };

  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      signature: {
        ...prev.signature,
        parameters: [...prev.signature.parameters, { name: `param${prev.signature.parameters.length + 1}`, type: "int" }]
      }
    }));
  };

  const removeParameter = (index) => {
    const newParams = formData.signature.parameters.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, signature: { ...prev.signature, parameters: newParams } }));
  };

  const handleTestCaseChange = (index, field, value, type = "text") => {
    const tc = [...formData.testCasesData];
    tc[index][field] = type === "checkbox" ? !tc[index][field] : value;
    setFormData((prev) => ({ ...prev, testCasesData: tc }));
  };
  
  const addTestCase = () => setFormData((prev) => ({ ...prev, testCasesData: [...prev.testCasesData, { input: "", expectedOutput: "", isSample: false }] }));
  const removeTestCase = (index) => setFormData((prev) => ({ ...prev, testCasesData: prev.testCasesData.filter((_, i) => i !== index) }));

  const loadExampleProblem = () => {
    setFormData({
      title: "Two Sum (Example)",
      description: `## Two Sum\n\nGiven an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.\n\n### Constraints\n- \`2 <= nums.length <= 10^4\`\n- \`-10^9 <= nums[i] <= 10^9\`\n- \`-10^9 <= target <= 10^9\``,
      difficulty: "Easy",
      timeLimit: 2.0,
      memoryLimit: 256000,
      isPremium: false,
      isPublished: true,
      originContest: "",
      solution: `### Approach\nUse a hash map to store seen values and indices. For each number, check if (target - num) exists.\n\nTime Complexity: $O(N)$`,
      signature: {
        functionName: "twoSum",
        returnType: "int[]",
        parameters: [
          { name: "nums", type: "int[]" },
          { name: "target", type: "int" }
        ]
      },
      testCasesData: [
        { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isSample: true },
        { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isSample: true },
      ],
    });
    setSelectedTags(["array", "hash-table"]);
    setSelectedCompanyTags(["google", "amazon"]);
    toast.success("Loaded example problem template.");
  };

  const validateBeforeSubmit = (data) => {
    if (!data.title?.trim()) return "Title is required.";
    if (!data.description?.trim()) return "Description is required.";
    
    if (!data.signature.functionName?.trim()) return "Function Name is required.";
    if (!data.signature.returnType) return "Return Type is required.";
    if (data.signature.parameters.length === 0) return "At least one parameter is required in the signature.";
    for (let i = 0; i < data.signature.parameters.length; i++) {
        if (!data.signature.parameters[i].name?.trim()) return `Parameter #${i + 1} name is missing.`;
    }

    if (!Array.isArray(data.testCasesData) || data.testCasesData.length === 0) return "At least one test case is required.";
    for (let i = 0; i < data.testCasesData.length; i++) {
      const tc = data.testCasesData[i];
      if (!tc.input?.trim()) return `Test case #${i + 1} input is empty.`;
      if (!tc.expectedOutput?.trim()) return `Test case #${i + 1} expected output is empty.`;
    }
    return null;
  };

  const submitToServer = async (isDraft = false) => {
    const payload = {
      ...formData,
      description: formData.description.replace(/\r\n/g, "\n").trim(),
      solution: formData.solution.replace(/\r\n/g, "\n").trim(),
      isPublished: !isDraft && formData.isPublished,
      tags: selectedTags,
      companyTags: selectedCompanyTags
    };

    const validationError = validateBeforeSubmit(payload);
    if (validationError) return toast.error(validationError);

    setLoading(true);
    try {
      const { data } = await API.post(`/problems/`, payload);
      const newProblem = data?.data || data;
      toast.success(isDraft ? `Draft saved: ${newProblem.title}` : `Problem "${newProblem.title}" created!`);
      navigate("/admin/problems");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create problem.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => { e.preventDefault(); await submitToServer(false); };
  const handleSaveDraft = async () => { await submitToServer(true); };

  // --- Styles ---
  const cardStyle = `bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm mb-6`;
  const headingStyle = `text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-zinc-800/80 pb-3`;
  const buttonSecondaryStyle = `bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold tracking-wider uppercase rounded-md py-2 px-4 text-[10px] transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50`;
  const buttonDangerStyle = `text-zinc-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-800`;

  const getDifficultyColor = (diff) => {
    if (diff === "Easy") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (diff === "Medium") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (diff === "Hard") return "text-red-400 bg-red-500/10 border-red-500/20";
    if (diff === "Super Hard") return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    return "text-zinc-400 bg-zinc-800 border-zinc-700";
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30 overflow-hidden">
      
      {/* ── TOP NAV BAR ── */}
      <header className="shrink-0 h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/admin/problems')}
            className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
          >
            <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="uppercase hidden sm:inline">Manage</span>
          </button>
          <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate flex items-center gap-2">
               <FaFire className="text-red-500" size={14}/> Forge Problem
            </h1>
            <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 leading-none mt-1 hidden sm:block">
              Auto-Compiler Engine Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={loadExampleProblem} type="button" className={buttonSecondaryStyle + " hidden sm:flex items-center gap-2"}>
            <FaFileImport size={10}/> Load Example
          </button>
          <button onClick={handleSaveDraft} type="button" disabled={loading} className={buttonSecondaryStyle}>
            Save Draft
          </button>
          <button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider uppercase rounded-md py-2 px-5 text-[10px] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
            {loading ? "Forging..." : <><FaSave size={12}/> Publish</>}
          </button>
        </div>
      </header>

      {/* ── MAIN SPLIT CONTENT AREA ── */}
      <div className="flex-1 min-h-0 max-w-[1800px] mx-auto w-full flex flex-col lg:flex-row p-4 sm:p-6 gap-6">
        
        {/* ======================================= */}
        {/* LEFT COLUMN: THE EDITOR (Scrollable)    */}
        {/* ======================================= */}
        <div className="flex-[1.3] xl:flex-[1.1] overflow-y-auto custom-scrollbar pr-2 pb-10">
          <form id="problem-form" onSubmit={handleSubmit} className="flex flex-col">
            
            {/* 1. Problem Overview */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Core Metadata</h2>
              <TUFInput id="title" name="title" label="Problem Title" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Merge K Sorted Lists" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
                <TUFSelect id="difficulty" name="difficulty" label="Difficulty" value={formData.difficulty} onChange={handleInputChange} required>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Super Hard">Super Hard</option>
                </TUFSelect>
                <TUFSelect id="originContest" name="originContest" label="Linked Contest (Optional)" value={formData.originContest} onChange={handleInputChange} disabled={loadingContests}>
                  <option value="">None (Public Library)</option>
                  {upcomingContests.map((contest) => (
                    <option key={contest._id} value={contest._id}>{contest.title}</option>
                  ))}
                </TUFSelect>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
                <TUFInput type="number" id="timeLimit" name="timeLimit" label="Time Limit (Seconds)" value={formData.timeLimit} onChange={handleInputChange} min="0.1" step="0.1" required />
                <TUFInput type="number" id="memoryLimit" name="memoryLimit" label="Memory Limit (KB)" value={formData.memoryLimit} onChange={handleInputChange} min="32000" step="1000" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2 pt-6 border-t border-zinc-800/50">
                <TUFMultiSelect label="Problem Tags" icon={BsTagsFill} options={ALLOWED_PROBLEM_TAGS} selected={selectedTags} onChange={setSelectedTags} placeholder="Search algorithms..." />
                <TUFMultiSelect label="Company Tags" icon={FaBuilding} options={ALLOWED_COMPANY_TAGS} selected={selectedCompanyTags} onChange={setSelectedCompanyTags} placeholder="Search companies..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2 pt-6 border-t border-zinc-800/50">
                <label className="flex items-center gap-3 bg-zinc-950 p-3 rounded-md border border-zinc-800 cursor-pointer group">
                  <input type="checkbox" name="isPremium" checked={formData.isPremium} onChange={handleInputChange} className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-amber-500 transition-colors">Premium Content</span>
                </label>
                {!formData.originContest && (
                  <label className="flex items-center gap-3 bg-zinc-950 p-3 rounded-md border border-zinc-800 cursor-pointer group">
                    <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleInputChange} className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-emerald-400 transition-colors">Publish Immediately</span>
                  </label>
                )}
              </div>
            </div>

            {/* 2. Content */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Problem Statement & Editorial</h2>
              <TUFTextarea id="description" name="description" label="Description (Markdown)" value={formData.description} onChange={handleInputChange} rows={12} required placeholder="Write problem description using Markdown..." />
              <div className="mt-8 pt-6 border-t border-zinc-800/50">
                <TUFTextarea id="solution" name="solution" label="Editorial / Solution (Optional)" value={formData.solution} onChange={handleInputChange} rows={8} placeholder="Explain the intuition and time complexity..." />
              </div>
            </div>

            {/* 3. Signature Builder */}
            <div className={`${cardStyle} border-red-500/20 bg-zinc-900/80`}>
              <div className="flex items-center justify-between mb-6 border-b border-zinc-800/80 pb-3">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2"><FaCodeBranch className="text-red-500"/> Engine Signature</h2>
                <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-widest">Auto-Compiler</span>
              </div>
              
              <div className="grid grid-cols-[1fr_1fr] gap-4 mb-6">
                <TUFInput id="functionName" label="Function Name" value={formData.signature.functionName} onChange={(e) => handleSignatureChange("functionName", e.target.value)} required placeholder="e.g. twoSum" />
                <TUFSelect id="returnType" label="Return Type" value={formData.signature.returnType} onChange={(e) => handleSignatureChange("returnType", e.target.value)} required>
                  {SIGNATURE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </TUFSelect>
              </div>

              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Parameters ({formData.signature.parameters.length})</label>
                {formData.signature.parameters.map((param, index) => (
                  <div key={`param-${index}`} className="flex items-center gap-3 bg-zinc-950 p-2 rounded border border-zinc-800 shadow-inner">
                    <div className="flex-grow">
                      <input type="text" value={param.name} onChange={(e) => handleParamChange(index, "name", e.target.value)} placeholder="Param Name (e.g. nums)" className="w-full bg-transparent text-sm text-zinc-200 outline-none px-2 font-mono placeholder:text-zinc-600" required />
                    </div>
                    <span className="text-zinc-600 font-mono">:</span>
                    <div className="flex-shrink-0 w-32">
                      <select value={param.type} onChange={(e) => handleParamChange(index, "type", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded p-1.5 focus:border-red-500 outline-none font-mono cursor-pointer">
                        {SIGNATURE_TYPES.filter(t => t !== "void").map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => removeParameter(index)} className={buttonDangerStyle}><FaTimes size={12}/></button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addParameter} className={buttonSecondaryStyle + " w-full border-dashed border-zinc-700 bg-transparent hover:bg-zinc-800/50 hover:border-zinc-500"}>
                <FaPlus className="inline mr-1.5" /> Add Parameter
              </button>
            </div>

            {/* 4. Test Cases */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Execution Test Cases</h2>
              {formData.testCasesData.map((tc, index) => (
                <div key={`tc-${index}`} className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800/50 pb-2">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Test Case #{index + 1}</p>
                    {formData.testCasesData.length > 1 && (
                      <button type="button" onClick={() => removeTestCase(index)} className={buttonDangerStyle}><FaTrashAlt size={12}/></button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <TUFTextarea label="Raw Input (One Param per Line)" value={tc.input} onChange={(e) => handleTestCaseChange(index, "input", e.target.value)} rows={3} 
                    placeholder={`[2,7,11,15]\n9`}/>
                    <TUFTextarea label="Expected Output" value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)} rows={3} placeholder="[0,1]" />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group w-max">
                    <input type="checkbox" checked={!!tc.isSample} onChange={() => handleTestCaseChange(index, "isSample", null, "checkbox")} className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950"/>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-emerald-400 transition-colors">Mark as Sample (Visible in Preview)</span>
                  </label>
                </div>
              ))}
              
              <button type="button" onClick={addTestCase} className={buttonSecondaryStyle + " w-full border-dashed border-zinc-700 bg-transparent hover:bg-zinc-800/50 hover:border-zinc-500"}>
                <FaPlus className="inline mr-1.5" /> Add Test Case
              </button>
            </div>
          </form>
        </div>

        {/* ======================================= */}
        {/* RIGHT COLUMN: LIVE PREVIEW (Scrollable) */}
        {/* ======================================= */}
        <div className="hidden lg:flex flex-1 flex-col bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden mb-10">
          
          {/* Header */}
          <div className="shrink-0 p-3 px-5 border-b border-zinc-800 bg-zinc-950/80 flex justify-between items-center">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <FaEye className="text-emerald-500" size={12} /> Live Render
            </h2>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            <div className="border-b border-zinc-800/50 pb-6">
              <h1 className="text-2xl font-bold text-zinc-100 mb-4 tracking-tight">{formData.title || "Untitled Problem"}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-widest ${getDifficultyColor(formData.difficulty)}`}>{formData.difficulty}</span>
                <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-widest bg-zinc-950 border-zinc-800 text-zinc-400">{formData.timeLimit} sec</span>
                <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-widest bg-zinc-950 border-zinc-800 text-zinc-400">{Math.round(formData.memoryLimit / 1000)}MB</span>
                {formData.isPremium && <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 border-amber-500/20 text-amber-500">Premium</span>}
              </div>
            </div>

            {/* Signature Preview */}
            <div>
               <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Compiled Signature</h3>
               <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 font-mono text-xs overflow-x-auto text-zinc-300">
                  <span className="text-purple-400">{formData.signature.returnType}</span> <span className="text-blue-400">{formData.signature.functionName}</span>(
                  {formData.signature.parameters.map((p, i) => (
                     <span key={i}><span className="text-emerald-400">{p.type}</span> <span className="text-zinc-300">{p.name}</span>{i < formData.signature.parameters.length - 1 ? ", " : ""}</span>
                  ))}
                  )
               </div>
            </div>

            {(selectedTags.length > 0 || selectedCompanyTags.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag, i) => (
                  <span key={`tag-${i}`} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold capitalize">{tag.replace(/-/g, " ")}</span>
                ))}
                {selectedCompanyTags.map((tag, i) => (
                  <span key={`comp-${i}`} className="px-2 py-0.5 bg-blue-900/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold capitalize">{tag.replace(/-/g, " ")}</span>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 border-b border-zinc-800/50 pb-2">Description</h3>
              <div className="problem-description-markdown text-zinc-300 leading-relaxed text-sm">
                {formData.description ? <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formData.description}</ReactMarkdown> : <p className="text-zinc-700 italic">Description preview...</p>}
              </div>
            </div>

            {formData.testCasesData.filter(tc => tc.isSample && (tc.input || tc.expectedOutput)).length > 0 && (
              <div className="pt-2 border-t border-zinc-800/50">
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 mt-4">Sample Test Cases</h3>
                <div className="space-y-4">
                  {formData.testCasesData.filter(tc => tc.isSample).map((tc, index) => (
                    <div key={`preview-tc-${index}`} className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 shadow-sm">
                      <p className="text-[11px] font-bold text-zinc-400 mb-3 uppercase tracking-widest">Example {index + 1}</p>
                      <div className="mb-3">
                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest block mb-1">Input</span>
                        <div className="font-mono text-xs text-zinc-300 bg-zinc-900 p-2.5 rounded border border-zinc-800 whitespace-pre-wrap">{tc.input}</div>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest block mb-1">Output</span>
                        <div className="font-mono text-xs text-zinc-300 bg-zinc-900 p-2.5 rounded border border-zinc-800 whitespace-pre-wrap">{tc.expectedOutput}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}