import React, {
  useState,
  useEffect,
  useCallback,
  Fragment,
  useRef,
} from "react"; 
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx"; 
import { FaArrowLeft, FaPlus, FaTrashAlt, FaSave } from "react-icons/fa";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div
      className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_30px_rgba(255,69,0,0.7),inset_0_0_8px_rgba(255,69,0,0.4)]"
    ></div>
  </div>
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
      className="w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm"
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
      className="w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm resize-none font-mono"
    />
  </div>
);

function EditProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Problem and Test Case Data State
  const [problemData, setProblemData] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    tags: [],
    companyTags: [],
    starterCode: [{ language: "cpp", code: "" }],
    solution: "",
    isPremium: false,
  });
  const [newTestCase, setNewTestCase] = useState({
    input: "",
    expectedOutput: "",
    isSample: false,
  });

  // State for Filter Options (fetched via API)
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // --- Fetch Initial Problem and Test Case Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch problem details AND create/use the endpoint for ALL test cases
      const problemPromise = axios.get(
        `${serverUrl}/api/problems/getoneproblem/${slug}`,
        { withCredentials: true }
      );

      const testCasesPromise = axios.get(
        `${serverUrl}/api/problems/${slug}/alltestcases`,
        { withCredentials: true }
      );

      const [problemRes, allTestCasesRes] = await Promise.all([
        problemPromise,
        testCasesPromise,
      ]);

      const fetchedProblem = problemRes.data;
      const fetchedTestCases = allTestCasesRes.data; 
      setProblemData(fetchedProblem);
      setTestCases(fetchedTestCases);
      setFormData({
        title: fetchedProblem.title || "",
        description: fetchedProblem.description || "",
        difficulty: fetchedProblem.difficulty || "Easy",
        tags: fetchedProblem.tags || [],
        companyTags: fetchedProblem.companyTags || [],
        starterCode:
          fetchedProblem.starterCode?.length > 0
            ? fetchedProblem.starterCode
            : [{ language: "javascript", code: "" }],
        solution: fetchedProblem.solution || "",
        isPremium: fetchedProblem.isPremium || false,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load problem data.");
      toast.error(
        err.response?.data?.message || "Failed to load problem data."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // --- Fetch Tag/Company Lists ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingTags(true);
        const tagsRes = await axios.get(`${serverUrl}/api/tags/problems`, {
          withCredentials: true,
        });
        setAvailableTags(tagsRes.data);
      } catch (err) {
        toast.error("Failed to load problem tags.");
      } finally {
        setLoadingTags(false);
      }
      try {
        setLoadingCompanies(true);
        const compRes = await axios.get(`${serverUrl}/api/tags/companies`, {
          withCredentials: true,
        });
        setAvailableCompanies(compRes.data);
      } catch (err) {
        toast.error("Failed to load company tags.");
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchFilterOptions();
  }, []); 

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Fetch problem data on slug change

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleTagChange = (e, fieldName) => {
    const tagsArray = e.target.value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, [fieldName]: tagsArray }));
  };
  const handleStarterCodeChange = (index, field, value) => {
    const updatedCode = [...formData.starterCode];
    updatedCode[index] = { ...updatedCode[index], [field]: value };
    setFormData((prev) => ({ ...prev, starterCode: updatedCode }));
  };
  const addStarterCode = () => {
    setFormData((prev) => ({
      ...prev,
      starterCode: [...prev.starterCode, { language: "", code: "" }],
    }));
  };
  const removeStarterCode = (index) => {
    if (formData.starterCode.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      starterCode: formData.starterCode.filter((_, i) => i !== index),
    }));
  };
  const handleNewTestCaseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTestCase((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- API Call Handlers ---
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

  const handleUpdateProblem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = { ...formData };
      
      const { data: updatedProblem } = await axios.put(
        `${serverUrl}/api/problems/updateproblem/${slug}`,
        updateData,
        { withCredentials: true }
      );
      toast.success(`Problem "${updatedProblem.title}" updated!`);
      
      setProblemData(updatedProblem);
      if (updatedProblem.slug !== slug) {
        navigate(`/admin/problems/edit/${updatedProblem.slug}`, {
          replace: true,
        }); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  // --- Render Logic ---
  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="min-h-screen bg-black text-red-500 p-20">{error}</div>
    );

  // --- Styles ---
  const cardStyle = `bg-gradient-to-br from-black via-gray-950 to-black border border-orange-700/40 rounded-xl p-6 shadow-[0_0_30px_rgba(255,69,0,0.2)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(255,69,0,0.3)] hover:border-orange-600/60 mb-6`;
  const headingStyle = `text-2xl font-bold text-orange-400 mb-4 [text-shadow:0_0_10px_rgba(255,69,0,0.6)]`;
  const labelStyle = `block text-sm font-medium text-gray-300 mb-1.5`;
  const buttonPrimaryStyle = `bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg py-2.5 px-6 text-base shadow-[0_0_20px_rgba(255,69,0,0.5)] transition-all duration-300 transform hover:from-orange-700 hover:to-red-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.7)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonSecondaryStyle = `bg-transparent border border-orange-600/50 text-orange-500 font-semibold rounded-lg py-2 px-4 text-sm shadow-[0_0_10px_rgba(255,69,0,0.2)] transition-all duration-300 transform hover:bg-orange-950/30 hover:border-orange-600/80 hover:text-orange-400 hover:shadow-[0_0_20px_rgba(255,69,0,0.3)] hover:scale-105`;
  const buttonDangerStyle = `bg-red-900/30 text-red-400 border border-red-600/60 shadow-[0_0_10px_rgba(255,0,0,0.4)] hover:bg-red-800/50 hover:text-red-300 focus:ring-red-500 rounded p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black`;

  return (
    <>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/problems")}
        className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-orange-600/40 shadow-[0_0_20px_rgba(255,69,0,0.25)] text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm transition-all duration-300 transform hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:text-orange-400 hover:scale-105"
      >
        {" "}
        <FaArrowLeft /> <span className="hidden sm:inline">
          Back to Manage
        </span>{" "}
      </button>

      <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-6 [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
            Edit Problem:{" "}
            <span className="text-orange-400">{problemData?.title}</span>
          </h1>

          {/* --- Main Problem Edit Form --- */}
          <form onSubmit={handleUpdateProblem} className={cardStyle}>
            <h2 className={headingStyle}>Problem Details</h2>

            <GodfatherInput
              id="title"
              label="Title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              <div>
                <label htmlFor="difficulty" className={labelStyle}>
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className={`w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm`}
                  required
                >
                  <option value="Easy">Easy</option>{" "}
                  <option value="Medium">Medium</option>{" "}
                  <option value="Hard">Hard</option>{" "}
                  <option value="Super Hard">Super Hard</option>
                </select>
              </div>
              <div className="flex items-end pb-1.5">
                <input
                  type="checkbox"
                  id="isPremium"
                  name="isPremium"
                  checked={formData.isPremium}
                  onChange={handleInputChange}
                  className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-600/60 focus:ring-offset-0 focus:ring-offset-black mr-2"
                />
                <label
                  htmlFor="isPremium"
                  className="text-sm font-medium text-gray-300 select-none"
                >
                  Mark as Premium Problem
                </label>
              </div>
            </div>

            <GodfatherTextarea
              id="description"
              label="Description (Markdown/HTML)"
              value={formData.description}
              onChange={handleInputChange}
              rows={10}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              <div>
                <label htmlFor="tags-input" className={labelStyle}>
                  Problem Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags-input"
                  name="tags"
                  value={formData.tags.join(", ")}
                  onChange={(e) => handleTagChange(e, "tags")}
                  className={`w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm`}
                  placeholder="e.g., array, hash-table, dp"
                />
                {!loadingTags && availableTags.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Allowed examples: {availableTags.slice(0, 3).join(", ")}...
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="companyTags-input" className={labelStyle}>
                  Company Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="companyTags-input"
                  name="companyTags"
                  value={formData.companyTags.join(", ")}
                  onChange={(e) => handleTagChange(e, "companyTags")}
                  className={`w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm`}
                  placeholder="e.g., google, amazon"
                />
                {!loadingCompanies && availableCompanies.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Allowed examples:{" "}
                    {availableCompanies.slice(0, 3).join(", ")}...
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-orange-800/30">
              <GodfatherTextarea
                id="solution"
                label="Solution / Editorial (Optional)"
                value={formData.solution}
                onChange={handleInputChange}
                rows={8}
              />
            </div>

            {/* --- Starter Code --- */}
            <div className="mt-6 pt-4 border-t border-orange-800/30">
              <h3 className={headingStyle + " !mb-2 !text-xl"}>Starter Code</h3>
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
                      {" "}
                      <FaTrashAlt />{" "}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStarterCode}
                className={`${buttonSecondaryStyle} !w-auto !py-1 !px-3 !text-xs`}
              >
                {" "}
                <FaPlus className="inline mr-1" /> Add Language{" "}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-orange-800/50">
              <button
                type="submit"
                disabled={saving || loading}
                className={`${buttonPrimaryStyle} w-full`}
              >
                {" "}
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <FaSave className="inline mr-2" /> Save Problem Changes
                  </>
                )}{" "}
              </button>
            </div>
          </form>

          {/* --- Test Case Management --- */}
          <div className={`${cardStyle} p-6 mt-8`}>
            <h2 className={headingStyle}>
              Manage Test Cases ({testCases.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 mb-6 border-b border-orange-800/30 pb-4">
              {testCases.map((tc, index) => (
                <div
                  key={tc._id}
                  className="p-3 bg-gray-950/50 border border-gray-700/60 rounded-lg flex justify-between items-start gap-4"
                >
                  <div className="flex-grow text-xs space-y-1 overflow-hidden">
                    <p className="font-semibold text-gray-400">
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
                  No test cases added yet.
                </p>
              )}
            </div>

            <form onSubmit={handleAddTestCase}>
              <h3 className="text-lg font-semibold text-white mb-3">
                Add New Test Case
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
                  Mark as Sample (Visible to User)
                </label>
              </div>
              <button
                type="submit"
                disabled={saving || loading}
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
