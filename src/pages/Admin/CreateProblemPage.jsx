import React, { useState, useEffect, Fragment } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx"; 
import { FaArrowLeft, FaPlus, FaTrashAlt, FaSave } from "react-icons/fa";

// --- Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_30px_rgba(255,69,0,0.7),inset_0_0_8px_rgba(255,69,0,0.4)]"></div>
  </div>
);
// --- Godfather Input/Textarea Components

const GodfatherInput = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) => (
  <div className="w-full mb-5">
    {" "}
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-300 mb-1.5"
    >
      {" "}
      {label}{" "}
    </label>{" "}
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm"
    />{" "}
  </div>
);
const GodfatherTextarea = ({
  id,
  label,
  value,
  onChange,
  rows = 4,
  required = false,
  placeholder = "",
}) => (
  <div className="w-full mb-5">
    {" "}
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-300 mb-1.5"
    >
      {" "}
      {label}{" "}
    </label>{" "}
    <textarea
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm resize-none font-mono"
    />{" "}
  </div>
);

function CreateProblemPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    tags: [], 
    companyTags: [], 
    isPremium: false,
    starterCode: [{ language: "javascript", code: "" }],
    testCasesData: [{ input: "", expectedOutput: "", isSample: true }], 
    solution: "",
  });
  const [tagInput, setTagInput] = useState(""); 
  const [companyTagInput, setCompanyTagInput] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [availableTags, setAvailableTags] = useState([]); 
  const [loadingTags, setLoadingTags] = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState([]); 
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // --- Fetch Tag/Company Lists for Helper Text ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingTags(true);
        const tagsRes = await axios.get(`${serverUrl}/api/tags/problems`, {
          withCredentials: true,
        });
        setAvailableTags(tagsRes.data);
      } catch (err) {
        console.error("Failed to load problem tags.");
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
        console.error("Failed to load company tags.");
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  const handleCompanyTagInputChange = (e) => {
    setCompanyTagInput(e.target.value);
  };

  // Starter Code Handlers
  const handleStarterCodeChange = (index, field, value) => {
    const sc = [...formData.starterCode];
    sc[index][field] = value;
    setFormData((prev) => ({ ...prev, starterCode: sc }));
  };
  const addStarterCode = () => {
    setFormData((prev) => ({
      ...prev,
      starterCode: [...prev.starterCode, { language: "", code: "" }],
    }));
  };
  const removeStarterCode = (index) => {
    if (formData.starterCode.length > 1)
      setFormData((prev) => ({
        ...prev,
        starterCode: formData.starterCode.filter((_, i) => i !== index),
      }));
  };

  // Test Case Handlers
  const handleTestCaseChange = (index, field, value, type = "text") => {
    const tc = [...formData.testCasesData];
    tc[index][field] = type === "checkbox" ? !tc[index][field] : value;
    setFormData((prev) => ({ ...prev, testCasesData: tc }));
  };
  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCasesData: [
        ...prev.testCasesData,
        { input: "", expectedOutput: "", isSample: false },
      ],
    }));
  };
  const removeTestCase = (index) => {
    if (formData.testCasesData.length > 1)
      setFormData((prev) => ({
        ...prev,
        testCasesData: formData.testCasesData.filter((_, i) => i !== index),
      }));
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);


    const tagsArray = tagInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const companyTagsArray = companyTagInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    const submissionData = {
      ...formData,
      tags: tagsArray,
      companyTags: companyTagsArray,
    };

    try {

      const { data: newProblem } = await axios.post(
        `${serverUrl}/api/problems/createproblem`,
        submissionData,
        { withCredentials: true }
      );
      toast.success(`Problem "${newProblem.title}" created successfully!`);
      navigate(`/admin/problems`); 
      
    } catch (err) {
      console.error("Create Problem Error:", err.response || err);
      toast.error(err.response?.data?.message || "Failed to create problem.");
    } finally {
      setLoading(false);
    }
  };

  // --- Theme Styles ---
  const cardStyle = `bg-gradient-to-br from-black via-gray-950 to-black border border-orange-700/40 rounded-xl p-6 shadow-[0_0_30px_rgba(255,69,0,0.2)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(255,69,0,0.3)] hover:border-orange-600/60 mb-6`;
  const headingStyle = `text-2xl font-bold text-orange-400 mb-4 [text-shadow:0_0_10px_rgba(255,69,0,0.6)]`;
  const labelStyle = `block text-sm font-medium text-gray-300 mb-1.5`;
  const buttonPrimaryStyle = `bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg py-2.5 px-6 text-base shadow-[0_0_20px_rgba(255,69,0,0.5)] transition-all duration-300 transform hover:from-orange-700 hover:to-red-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.7)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;
  const buttonSecondaryStyle = `bg-transparent border border-orange-600/50 text-orange-500 font-semibold rounded-lg py-1.5 px-3 text-xs shadow-[0_0_10px_rgba(255,69,0,0.2)] transition-all duration-300 transform hover:bg-orange-950/30 hover:border-orange-600/80 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(255,69,0,0.3)] hover:scale-105`;
  const buttonDangerStyle = `bg-red-900/30 text-red-400 border border-red-600/60 shadow-[0_0_8px_rgba(255,0,0,0.3)] hover:bg-red-800/50 hover:text-red-300 focus:ring-red-500 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black`;

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
            Create New Problem
          </h1>

          <form onSubmit={handleSubmit}>
            {/* --- Problem Details Section --- */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Problem Details</h2>
              <GodfatherInput
                id="title"
                label="Title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Two Sum"
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
                placeholder="Enter the full problem statement..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                <div>
                  <GodfatherInput
                    id="tags-input"
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
              <div className="mt-6 pt-4 border-t border-orange-800/30">
                <GodfatherTextarea
                  id="solution"
                  label="Solution / Editorial (Optional)"
                  value={formData.solution}
                  onChange={handleInputChange}
                  rows={8}
                />
              </div>
            </div>

            {/* --- Starter Code Section --- */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Starter Code</h2>
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
                className={`${buttonSecondaryStyle} !py-1 !px-3`}
              >
                {" "}
                <FaPlus className="inline mr-1" /> Add Language{" "}
              </button>
            </div>

            {/* --- Test Cases Section --- */}
            <div className={cardStyle}>
              <h2 className={headingStyle}>Test Cases</h2>
              {formData.testCasesData.map((tc, index) => (
                <div
                  key={index}
                  className="mb-4 p-3 bg-gray-950/40 border border-gray-700/50 rounded-lg relative"
                >
                  <p className="text-sm font-semibold text-gray-400 mb-2">
                    Test Case #{index + 1}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GodfatherTextarea
                      id={`tc-input-${index}`}
                      label="Input"
                      value={tc.input}
                      onChange={(e) =>
                        handleTestCaseChange(index, "input", e.target.value)
                      }
                      rows={3}
                      required
                      placeholder="Input arguments, newline separated if needed"
                    />
                    <GodfatherTextarea
                      id={`tc-output-${index}`}
                      label="Expected Output"
                      value={tc.expectedOutput}
                      onChange={(e) =>
                        handleTestCaseChange(
                          index,
                          "expectedOutput",
                          e.target.value
                        )
                      }
                      rows={3}
                      required
                      placeholder="Expected return value"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`tc-isSample-${index}`}
                        name={`tc-isSample-${index}`}
                        checked={tc.isSample}
                        onChange={(e) =>
                          handleTestCaseChange(
                            index,
                            "isSample",
                            e.target.checked,
                            "checkbox"
                          )
                        }
                        className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-600/60 focus:ring-offset-0 focus:ring-offset-black"
                      />
                      <label
                        htmlFor={`tc-isSample-${index}`}
                        className="text-sm font-medium text-gray-300 select-none"
                      >
                        Mark as Sample (Visible)
                      </label>
                    </div>
                    {formData.testCasesData.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className={`${buttonDangerStyle} ml-auto`}
                        title="Remove Test Case"
                      >
                        {" "}
                        <FaTrashAlt />{" "}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addTestCase}
                className={`${buttonSecondaryStyle} !py-1 !px-3`}
              >
                {" "}
                <FaPlus className="inline mr-1" /> Add Test Case{" "}
              </button>
            </div>

            {/* --- Submit Button --- */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`${buttonPrimaryStyle} w-full`}
              >
                {" "}
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <FaSave className="inline mr-2" /> Create Problem
                  </>
                )}{" "}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateProblemPage;
