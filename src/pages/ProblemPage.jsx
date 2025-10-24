import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../App';
import { FaArrowLeft } from 'react-icons/fa';
// Consider adding a code editor component later, e.g., Monaco Editor or CodeMirror
// import Editor from '@monaco-editor/react';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

// --- Difficulty Badge --- (Same as in ProblemListPage)
const DifficultyBadge = ({ difficulty }) => {
    let colorClasses = '';
    if (difficulty === 'Easy') {
        colorClasses = 'bg-green-600/20 text-green-300 border-green-600/50 shadow-[0_0_8px_rgba(0,255,0,0.2)]';
    } else if (difficulty === 'Medium') {
        colorClasses = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_8px_rgba(255,215,0,0.2)]';
    } else if (difficulty === 'Hard') {
        colorClasses = 'bg-red-600/20 text-red-400 border-red-600/50 shadow-[0_0_8px_rgba(255,0,0,0.2)]';
    }
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
            {difficulty}
        </span>
    );
};

// --- Test Case Display Component ---
const TestCaseDisplay = ({ testCase, index }) => (
    <div className="mb-4 bg-gray-900/50 p-3 rounded-md border border-gray-700/50">
        <p className="font-semibold text-gray-300 mb-1">Example {index + 1}:</p>
        <div className="space-y-1 text-sm">
            <p><strong className="text-gray-400">Input:</strong> <code className="bg-gray-800 px-1 rounded text-orange-300">{testCase.input}</code></p>
            <p><strong className="text-gray-400">Output:</strong> <code className="bg-gray-800 px-1 rounded text-orange-300">{testCase.expectedOutput}</code></p>
        </div>
    </div>
);


// --- Main Problem Page Component ---
function ProblemPage() {
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { slug } = useParams(); // Get slug from URL
    const navigate = useNavigate();

    // Fetch problem details based on slug
    useEffect(() => {
        const fetchProblem = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                setError(null);
                const { data } = await axios.get(`${serverUrl}/api/problems/${slug}`, { withCredentials: true });
                setProblem(data);
            } catch (err) {
                console.error("Error fetching problem:", err);
                setError(err.response?.data?.message || "Problem not found or failed to load.");
                toast.error(err.response?.data?.message || "Failed to load problem.");
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [slug]); // Refetch if slug changes

    if (loading) return <LoadingSpinner />;

    if (error || !problem) {
        return (
            <div className="bg-black flex flex-col items-center justify-center min-h-screen text-center p-4">
                 <button
                    onClick={() => navigate('/practice')} // Go back to the list
                    className="absolute top-24 left-6 z-10 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-orange-600/30 shadow-[0_0_20px_rgba(255,69,0,0.2)] text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm transition-all duration-300 transform hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] hover:text-orange-400 hover:scale-105"
                 >
                    <FaArrowLeft />
                    <span className="hidden sm:inline">Back to Problems</span>
                </button>
                <h1 className="text-4xl font-bold text-red-500 animate-pulse [text-shadow:0_0_15px_rgba(255,0,0,0.6)]">
                    Error Loading Problem
                </h1>
                <p className="text-xl text-gray-400 mt-4">{error || "The requested problem could not be found."}</p>
            </div>
        );
    }

    // --- Successful Render ---
    return (
        <>
            {/* --- Floating Back Button --- */}
            <button
                onClick={() => navigate('/practice')} // Go back to the list specifically
                className="fixed top-24 left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md
                           border border-orange-600/30 shadow-[0_0_20px_rgba(255,69,0,0.2)]
                           text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm
                           transition-all duration-300 transform
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)]
                           hover:text-orange-400 hover:scale-105"
            >
                <FaArrowLeft />
                <span className="hidden sm:inline">Back to Problems</span>
            </button>

            <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 pb-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Two column layout */}

                    {/* ### LEFT COLUMN: Problem Description ### */}
                    <div className="bg-black border border-orange-600/30
                                    shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                    hover:border-orange-600/50 hover:shadow-[0_0_35px_rgba(255,69,0,0.3)]
                                    rounded-xl p-6 transition-all duration-300 overflow-y-auto"
                         style={{ maxHeight: 'calc(100vh - 10rem)' }} // Limit height and allow scroll
                    >
                         {/* Header */}
                        <div className="mb-4 pb-4 border-b border-gray-700/50">
                            <h1 className="text-3xl font-bold text-white mb-2 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                {problem.title}
                            </h1>
                            <div className="flex items-center gap-3">
                                <DifficultyBadge difficulty={problem.difficulty} />
                                <div className="flex flex-wrap gap-1.5">
                                    {problem.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                         {/* Problem Description (using dangerouslySetInnerHTML if description contains HTML/Markdown) */}
                         {/* IMPORTANT: Only use this if you trust the source of your problem descriptions
                              or sanitize the HTML on the backend before saving. */}
                        <div
                            className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed" // Basic styling for rendered HTML/Markdown
                            dangerouslySetInnerHTML={{ __html: problem.description }}
                         />
                         {/* Alternatively, if description is plain text:
                         <p className="text-gray-300 leading-relaxed text-base whitespace-pre-wrap">{problem.description}</p>
                         */}

                         {/* Sample Test Cases */}
                         <div className="mt-6">
                            <h2 className="text-xl font-semibold text-white mb-3 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                Examples
                            </h2>
                            {problem.testCases && problem.testCases.length > 0 ? (
                                problem.testCases.map((tc, index) => (
                                    <TestCaseDisplay key={tc._id || index} testCase={tc} index={index} />
                                ))
                            ) : (
                                <p className="text-gray-500">No sample test cases provided.</p>
                            )}
                         </div>
                    </div>

                    {/* ### RIGHT COLUMN: Code Editor & Submission ### */}
                    <div className="bg-black border border-orange-600/30
                                    shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                    hover:border-orange-600/50 hover:shadow-[0_0_35px_rgba(255,69,0,0.3)]
                                    rounded-xl p-4 transition-all duration-300 flex flex-col" // flex-col to push button down
                         style={{ maxHeight: 'calc(100vh - 10rem)' }} // Match height
                    >
                        <div className="flex-grow mb-4 bg-gray-900/50 rounded-lg flex items-center justify-center border border-gray-700/50">
                           {/* Placeholder for Code Editor */}
                           {/* Replace this div with your <Editor /> component later */}
                           <p className="text-gray-500 text-lg">Code Editor (Coming Soon)</p>
                        </div>

                        {/* Language Selector & Buttons */}
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-700/50">
                            {/* Placeholder for language selector */}
                            <select className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2 focus:outline-none focus:border-orange-500">
                                <option>JavaScript</option>
                                <option>Python</option>
                                <option>C++</option>
                                {/* Add more languages based on starterCode */}
                            </select>
                            <button
                                // onClick={handleSubmitCode} // Add this later
                                disabled // Disable for now
                                className="bg-orange-600 text-white font-bold rounded-lg py-2 px-5 text-sm
                                           shadow-[0_0_15px_rgba(255,69,0,0.4)]
                                           transition-all duration-300 transform
                                           hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-105
                                           disabled:bg-gray-700/50 disabled:text-gray-500 disabled:shadow-none
                                           disabled:cursor-not-allowed disabled:scale-100"
                            >
                                Submit
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default ProblemPage;