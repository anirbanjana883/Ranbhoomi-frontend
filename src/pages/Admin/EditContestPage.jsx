import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App.jsx';
import { FaArrowLeft, FaSave, FaPlus, FaTrashAlt, FaSearch } from 'react-icons/fa';

// --- Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    </div>
);

// --- Reusable Input Components ---
const GodfatherInput = ({ id, name, label, value, onChange, type = "text", required = false, placeholder = "" }) => (
    <div className="w-full mb-5">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5"> {label} </label>
        <input 
           type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder}
           className={`w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm
                       ${type === 'date' || type === 'time' ? 'text-gray-300' : ''}`}
        />
    </div>
);
const GodfatherTextarea = ({ id, name, label, value, onChange, rows = 4, required = false, placeholder = "" }) => (
     <div className="w-full mb-5">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5"> {label} </label>
        <textarea 
           id={id} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
           className="w-full p-2.5 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm resize-y font-mono" />
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
    const filteredProblems = allProblems.filter(p =>
        !selectedProblems.some(sp => sp._id === p._id) &&
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="w-full mb-5">
            <label htmlFor="problem-search" className="block text-sm font-medium text-gray-300 mb-1.5"> Add Problems </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaSearch className="text-gray-500" size={12} /></div>
                <input
                    type="text" id="problem-search" placeholder="Search problems by title..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full p-2.5 pl-9 bg-gray-950/60 text-white rounded-md border border-orange-600/30 focus:outline-none focus:border-orange-500/80 focus:shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all duration-300 text-sm"
                />
                {showDropdown && filteredProblems.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-black border border-orange-700/60 rounded-lg shadow-[0_0_20px_rgba(255,69,0,0.3)] max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black/50">
                        {filteredProblems.map(prob => (
                            <button type="button" key={prob._id}
                                onClick={() => { onAdd(prob); setSearchTerm(''); setShowDropdown(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-orange-900/50 hover:text-orange-300"
                            >
                                {prob.title} <span className={`text-xs ml-2 ${prob.difficulty === 'Easy' ? 'text-green-400' : prob.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>({prob.difficulty})</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-3 space-y-2">
                {selectedProblems.length === 0 ? ( <p className="text-xs text-gray-500 italic">No problems added yet.</p> ) : (
                    selectedProblems.map((prob, index) => (
                        <div key={prob._id} className="flex items-center justify-between p-2 bg-gray-950/50 border border-gray-700/50 rounded-md">
                            <span className="text-sm text-white">{index + 1}. {prob.title}</span>
                            <button type="button" onClick={() => onRemove(prob._id)} className="text-red-500 hover:text-red-400" title="Remove"><FaTrashAlt /></button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
// --- Time options ---
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')); // 00-23
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')); // 00-59

// --- Helper to format Date for input[type=date] ---
const formatDate = (date) => new Date(date).toISOString().split('T')[0];
// --- Helper to format Date for input[type=time] ---
const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

function EditContestPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '', description: '',
        startDate: '', startTimeHour: '12', startTimeMinute: '00',
        endDate: '', endTimeHour: '14', endTimeMinute: '00',
    });
    const [loading, setLoading] = useState(true); // Start loading true
    const [saving, setSaving] = useState(false);
    const [allProblems, setAllProblems] = useState([]);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [loadingProblems, setLoadingProblems] = useState(true);

    // --- Fetch ALL data on mount ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setLoadingProblems(true);
            try {
                // Fetch contest and problems in parallel
                const contestPromise = axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
                const problemsPromise = axios.get(`${serverUrl}/api/problems/getallproblem`, { withCredentials: true });
                
                const [contestRes, problemsRes] = await Promise.all([contestPromise, problemsPromise]);
                
                const contest = contestRes.data;
                const allProbs = problemsRes.data;

                // Populate form
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
                
                // Populate problem selector
                setAllProblems(allProbs);
                // Set selected problems (contest data populates problem details)
                setSelectedProblems(contest.problems.map(p => p.problem));

            } catch (err) {
                toast.error("Failed to load contest data.");
                console.error(err);
                navigate("/admin/contests");
            } finally {
                setLoading(false);
                setLoadingProblems(false);
            }
        };
        fetchAllData();
    }, [slug, navigate]);

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleAddProblem = (problem) => setSelectedProblems(prev => [...prev, problem]);
    const handleRemoveProblem = (problemId) => setSelectedProblems(prev => prev.filter(p => p._id !== problemId));

    // --- Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const problemIdsArray = selectedProblems.map(p => p._id);
        if (problemIdsArray.length === 0) {
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
            problemIds: problemIdsArray,
        };

        try {
            // Use the PUT endpoint
            const { data: updatedContest } = await axios.put(
                `${serverUrl}/api/contests/${slug}`, // Use original slug for update
                submissionData,
                { withCredentials: true }
            );
            toast.success(`Contest "${updatedContest.title}" updated!`);
            navigate(`/admin/contests`); // Go back to list
        } catch (err) {
            console.error("Update Contest Error:", err.response || err);
            toast.error(err.response?.data?.message || "Failed to update contest.");
        } finally {
            setSaving(false);
        }
    };

    // --- Theme Styles ---
    const cardStyle = `bg-gradient-to-br from-black via-gray-950 to-black border border-orange-700/40 rounded-xl p-6 sm:p-8 shadow-[0_0_30px_rgba(255,69,0,0.2)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(255,69,0,0.3)] hover:border-orange-600/60 mb-6`;
    const buttonPrimaryStyle = `w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg py-2.5 px-6 text-base shadow-[0_0_20px_rgba(255,69,0,0.5)] transition-all duration-300 transform hover:from-orange-700 hover:to-red-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.7)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;
    
    if (loading) return <LoadingSpinner />; // Show full page loader while fetching

    return (
        <>
            {/* Back Button */}
            <button
                onClick={() => navigate('/admin/contests')}
                className="fixed top-24 left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md 
                           border border-orange-600/40 shadow-[0_0_20px_rgba(255,69,0,0.25)] 
                           text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 
                           text-xs sm:text-sm transition-all duration-300 transform 
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)] 
                           hover:text-orange-400 hover:scale-105"
            >
                <FaArrowLeft />
                <span className="hidden sm:inline">Back to Contests</span>
            </button>

            <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-6 [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
                        Edit Contest
                    </h1>

                    <form onSubmit={handleSubmit} className={cardStyle}>
                        <GodfatherInput
                            id="title" name="title" label="Contest Title"
                            value={formData.title} onChange={handleInputChange} required
                        />
                        <GodfatherTextarea
                            id="description" name="description" label="Description (Rules, Details)"
                            value={formData.description} onChange={handleInputChange} rows={5} required
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
                            <GodfatherInput
                                id="startDate" name="startDate" label="Start Date" type="date"
                                value={formData.startDate} onChange={handleInputChange} required
                            />
                            <div className="grid grid-cols-2 gap-x-3">
                                <GodfatherSelect id="startTimeHour" name="startTimeHour" label="Hour" value={formData.startTimeHour} onChange={handleInputChange} required>
                                    {hours.map(h => <option key={`start-h-${h}`} value={h}>{h}</option>)}
                                </GodfatherSelect>
                                <GodfatherSelect id="startTimeMinute" name="startTimeMinute" label="Min" value={formData.startTimeMinute} onChange={handleInputChange} required>
                                    {minutes.map(m => <option key={`start-m-${m}`} value={m}>{m}</option>)}
                                </GodfatherSelect>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
                             <GodfatherInput
                                id="endDate" name="endDate" label="End Date" type="date"
                                value={formData.endDate} onChange={handleInputChange} required
                            />
                            <div className="grid grid-cols-2 gap-x-3">
                                 <GodfatherSelect id="endTimeHour" name="endTimeHour" label="Hour" value={formData.endTimeHour} onChange={handleInputChange} required>
                                    {hours.map(h => <option key={`end-h-${h}`} value={h}>{h}</option>)}
                                </GodfatherSelect>
                                <GodfatherSelect id="endTimeMinute" name="endTimeMinute" label="Min" value={formData.endTimeMinute} onChange={handleInputChange} required>
                                    {minutes.map(m => <option key={`end-m-${m}`} value={m}>{m}</option>)}
                                </GodfatherSelect>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-orange-800/30">
                            {loadingProblems ? (
                                <div className="text-gray-500">Loading problems...</div>
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
                            <button
                                type="submit"
                                disabled={saving || loadingProblems}
                                className={buttonPrimaryStyle}
                            >
                                {saving ? 'Saving...' : <><FaSave className='inline mr-2'/> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default EditContestPage;