import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App.jsx';
import { FaArrowLeft, FaSave, FaTrashAlt, FaSearch } from 'react-icons/fa';

// --- 1. HELPER COMPONENTS (Styles & UI) ---

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

const GodfatherInput = ({ id, name, label, value, onChange, type = "text", required = false, placeholder = "" }) => (
    <div className="w-full mb-5">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5"> {label} </label>
        <input 
            type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder}
            className={`w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm ${type === 'date' ? 'text-gray-300' : ''}`}
        />
    </div>
);

const GodfatherTextarea = ({ id, name, label, value, onChange, rows = 4, required = false, placeholder = "" }) => (
     <div className="w-full mb-5">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5"> {label} </label>
        <textarea 
            id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
            className="w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm resize-y font-mono"
        />
     </div>
);

const GodfatherSelect = ({ id, name, label, value, onChange, children, required = false }) => (
    <div className="w-full mb-5">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5"> {label} </label>
        <select
            id={id} name={name || id} value={value} onChange={onChange} required={required}
            className="w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm"
        >
            {children}
        </select>
    </div>
);

const ProblemSelector = ({ allProblems, selectedProblems, onAdd, onRemove }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Filter out already selected problems and filter by search term
    const filteredProblems = allProblems.filter(p =>
        !selectedProblems.some(sp => sp._id === p._id) &&
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full mb-5">
            <label htmlFor="problem-search" className="block text-sm font-medium text-gray-300 mb-1.5"> Select Problems </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaSearch className="text-gray-500" size={12} /></div>
                <input
                    type="text" id="problem-search" placeholder="Search problems..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full p-2.5 pl-9 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm"
                />
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-black border border-orange-700/60 rounded-lg shadow-[0_0_20px_rgba(255,69,0,0.3)] max-h-60 overflow-y-auto z-50">
                        {filteredProblems.length > 0 ? (
                            filteredProblems.map(prob => (
                                <button type="button" key={prob._id}
                                    onClick={() => { onAdd(prob); setSearchTerm(''); setShowDropdown(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-orange-900/50 hover:text-orange-300 flex justify-between"
                                >
                                    <span>{prob.title}</span>
                                    <span className={`text-xs ${prob.difficulty === 'Easy' ? 'text-green-400' : prob.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {prob.difficulty}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-gray-500 italic">No matching problems found.</div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-3 space-y-2">
                {selectedProblems.map((prob, index) => (
                    <div key={prob._id} className="flex items-center justify-between p-2 bg-gray-950/50 border border-gray-700/50 rounded-md">
                        <span className="text-sm text-white">{index + 1}. {prob.title}</span>
                        <button type="button" onClick={() => onRemove(prob._id)} className="text-red-500 hover:text-red-400" title="Remove"><FaTrashAlt /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 2. UTILITY FUNCTIONS ---

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const formatDate = (date) => new Date(date).toISOString().split('T')[0];
const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });


// --- 3. MAIN COMPONENT ---

function EditPrivateContest() {
    const { slug } = useParams();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        title: '', description: '',
        startDate: '', startTimeHour: '12', startTimeMinute: '00',
        endDate: '', endTimeHour: '14', endTimeMinute: '00',
    });

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allProblems, setAllProblems] = useState([]);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [loadingProblems, setLoadingProblems] = useState(true);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setLoadingProblems(true);
            try {
                // A. Get Contest Details
                const contestRes = await axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
                const contest = contestRes.data;

                // SECURITY: Lockout if already started
                if (new Date(contest.startTime) < new Date()) {
                    toast.error("Contest has already started. Editing is locked.");
                    navigate('/contests'); // Redirect to safe area
                    return;
                }

                // SECURITY: Check ownership implies user must be the creator (Backend will double check this too)
                
                // B. Get Public Problems (Safe List)
                const problemsRes = await axios.get(`${serverUrl}/api/problems`, { withCredentials: true });
                const publicProblems = problemsRes.data.problems || problemsRes.data;

                // C. Populate Form
                setFormData({
                    title: contest.title,
                    description: contest.description,
                    startDate: formatDate(contest.startTime),
                    startTimeHour: formatTime(contest.startTime).split(':')[0],
                    startTimeMinute: formatTime(contest.startTime).split(':')[1],
                    endDate: formatDate(contest.endTime),
                    endTimeHour: formatTime(contest.endTime).split(':')[0],
                    endTimeMinute: formatTime(contest.endTime).split(':')[1],
                });

                // D. Populate Problems
                setAllProblems(publicProblems);
                // Map the contest's problems (which might be fully populated objects) to just the problem details
                setSelectedProblems(contest.problems.map(p => p.problem));

            } catch (err) {
                console.error(err);
                toast.error("Could not load contest details.");
                navigate('/contests');
            } finally {
                setLoading(false);
                setLoadingProblems(false);
            }
        };
        fetchAllData();
    }, [slug, navigate]);

    // --- HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddProblem = (problem) => setSelectedProblems(prev => [...prev, problem]);
    const handleRemoveProblem = (problemId) => setSelectedProblems(prev => prev.filter(p => p._id !== problemId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Validation
        if (selectedProblems.length === 0) {
            toast.error("Contest must have at least one problem.");
            setSaving(false);
            return;
        }

        const combinedStartTime = `${formData.startDate}T${formData.startTimeHour}:${formData.startTimeMinute}:00`;
        const combinedEndTime = `${formData.endDate}T${formData.endTimeHour}:${formData.endTimeMinute}:00`;

        if (new Date(combinedEndTime) <= new Date(combinedStartTime)) {
            toast.error("End time must be after start time.");
            setSaving(false);
            return;
        }

        const submissionData = {
            title: formData.title,
            description: formData.description,
            startTime: combinedStartTime,
            endTime: combinedEndTime,
            problemIds: selectedProblems.map(p => p._id),
        };

        try {
            // HIT THE PRIVATE UPDATE ENDPOINT
            await axios.put(
                `${serverUrl}/api/contests/private/${slug}`, 
                submissionData,
                { withCredentials: true }
            );
            toast.success("Contest updated successfully!");
            navigate(`/contest/${slug}`); // Return to lobby
        } catch (err) {
            console.error("Update Error:", err);
            toast.error(err.response?.data?.message || "Failed to update contest.");
        } finally {
            setSaving(false);
        }
    };

    // --- RENDER ---
    const cardStyle = `bg-black border border-orange-700/60 rounded-xl p-6 sm:p-8 shadow-[0_0_20px_rgba(255,69,0,0.2)] mb-6`;
    const buttonStyle = `w-full bg-orange-600 text-white font-bold rounded-lg py-3 shadow-[0_0_15px_rgba(255,69,0,0.4)] hover:bg-orange-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;

    if (loading) return <LoadingSpinner />;

    return (
        <>
            {/* Back Button */}
            <button
                onClick={() => navigate('/contests')}
                className="fixed top-24 left-4 z-40 text-orange-500 font-bold bg-black/80 px-4 py-2 rounded-full border border-orange-600/50 hover:text-orange-400 flex items-center gap-2 backdrop-blur-md"
            >
                <FaArrowLeft /> <span className="hidden sm:inline">Back</span>
            </button>

            <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 pb-20">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center [text-shadow:0_0_15px_rgba(255,69,0,0.5)]">
                        Edit Private Contest
                    </h1>
                    <p className="text-center text-gray-500 mb-8 text-sm">Update your arena settings.</p>

                    <form onSubmit={handleSubmit} className={cardStyle}>
                        <GodfatherInput
                            id="title" name="title" label="Contest Title"
                            value={formData.title} onChange={handleInputChange} required
                        />
                        <GodfatherTextarea
                            id="description" name="description" label="Description"
                            value={formData.description} onChange={handleInputChange} rows={5} required
                        />

                        {/* Date/Time Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <GodfatherInput type="date" id="startDate" name="startDate" label="Start Date" value={formData.startDate} onChange={handleInputChange} required />
                                <div className="flex gap-2">
                                    <GodfatherSelect id="startTimeHour" name="startTimeHour" label="Hour" value={formData.startTimeHour} onChange={handleInputChange}>
                                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                    </GodfatherSelect>
                                    <GodfatherSelect id="startTimeMinute" name="startTimeMinute" label="Min" value={formData.startTimeMinute} onChange={handleInputChange}>
                                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                    </GodfatherSelect>
                                </div>
                            </div>
                            <div>
                                <GodfatherInput type="date" id="endDate" name="endDate" label="End Date" value={formData.endDate} onChange={handleInputChange} required />
                                <div className="flex gap-2">
                                    <GodfatherSelect id="endTimeHour" name="endTimeHour" label="Hour" value={formData.endTimeHour} onChange={handleInputChange}>
                                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                    </GodfatherSelect>
                                    <GodfatherSelect id="endTimeMinute" name="endTimeMinute" label="Min" value={formData.endTimeMinute} onChange={handleInputChange}>
                                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                    </GodfatherSelect>
                                </div>
                            </div>
                        </div>

                        {/* Problem Selection */}
                        <div className="pt-4 border-t border-orange-800/30 mt-4">
                            {loadingProblems ? (
                                <div className="text-gray-500 animate-pulse">Loading available problems...</div>
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
                        <div className="mt-8 pt-6 border-t border-orange-800/50">
                            <button type="submit" disabled={saving || loadingProblems} className={buttonStyle}>
                                {saving ? 'Saving Changes...' : <><FaSave className='inline mr-2'/> Update Contest</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default EditPrivateContest;