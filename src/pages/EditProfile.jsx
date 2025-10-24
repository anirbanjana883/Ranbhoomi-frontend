import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import { FaArrowLeft, FaUpload } from 'react-icons/fa';

// --- INPUT COMPONENT (Refined Glow) ---
const GodfatherInput = ({ id, label, value, onChange, type = "text" }) => (
    <div className="w-full mb-5"> {/* Reduced mb */}
        <label
            htmlFor={id}
            // Reduced text size, subtler glow
            className="block text-base font-medium text-orange-400 mb-1.5
                       [text-shadow:0_0_8px_rgba(255,69,0,0.4)]"
        >
            {label}
        </label>
        <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            // Adjusted padding, border opacity, focus shadow
            className="w-full p-2.5 bg-gray-950/60 text-white rounded-md
                       border border-orange-600/30
                       focus:outline-none focus:border-orange-500/80
                       focus:shadow-[0_0_15px_rgba(255,69,0,0.4)]
                       transition-all duration-300 text-base
                       [text-shadow:0_0_4px_rgba(255,255,255,0.2)]"
        />
    </div>
);

// --- TEXTAREA COMPONENT (Refined Glow) ---
const GodfatherTextarea = ({ id, label, value, onChange }) => (
    <div className="w-full mb-5"> {/* Reduced mb */}
        <label
            htmlFor={id}
            // Reduced text size, subtler glow
            className="block text-base font-medium text-orange-400 mb-1.5
                       [text-shadow:0_0_8px_rgba(255,69,0,0.4)]"
        >
            {label}
        </label>
        <textarea
            id={id}
            name={id}
            rows="4"
            value={value}
            onChange={onChange}
            // Adjusted padding, border opacity, focus shadow
            className="w-full p-2.5 bg-gray-950/60 text-white rounded-md
                       border border-orange-600/30
                       focus:outline-none focus:border-orange-500/80
                       focus:shadow-[0_0_15px_rgba(255,69,0,0.4)]
                       transition-all duration-300 text-base resize-none
                       [text-shadow:0_0_4px_rgba(255,255,255,0.2)]"
        />
    </div>
);

function EditProfile() {
    const { userData } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ name: '', username: '', description: '', github: '', linkedin: '' });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                username: userData.username || '',
                description: userData.description || '',
                github: userData.github || '',
                linkedin: userData.linkedin || '',
            });
            // Use null check for initial state if photoUrl might be empty string
            setPhotoPreview(userData.photoUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${userData.username}`);
        }
    }, [userData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Basic size check (e.g., 5MB)
             if (file.size > 5 * 1024 * 1024) {
                 toast.error("File size exceeds 5MB limit.");
                 return;
             }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('username', formData.username);
        data.append('description', formData.description);
        data.append('github', formData.github);
        data.append('linkedin', formData.linkedin);

        if (photoFile) { data.append('photoUrl', photoFile); }

        try {
            // Corrected API endpoint based on router
            const res = await axios.put(`${serverUrl}/api/user/updateprofile`, data, { withCredentials: true });
            dispatch(setUserData(res.data));
            toast.success("Profile updated successfully!");
            navigate(`/profile/${res.data.username}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* --- Floating Back Button --- */}
            <button
                onClick={() => navigate(-1)}
                // Adjusted top position slightly
                className="fixed top-24 left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md
                           border border-orange-600/30 shadow-[0_0_20px_rgba(255,69,0,0.2)]
                           text-orange-500 font-bold rounded-full py-2 px-4 text-sm
                           transition-all duration-300 transform
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)]
                           hover:text-orange-400 hover:scale-105"
            >
                <FaArrowLeft />
                Back
            </button>

            {/* --- Main Content --- */}
            <div className="min-h-screen text-gray-300 pt-28 px-4 bg-black pb-20"> {/* Added pb-20 */}

                <div className="max-w-2xl mx-auto"> {/* Adjusted max-width */}
                    {/* --- The Godfather Card --- */}
                    <div className="bg-black border border-orange-600/30
                                    shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                    hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)]
                                    rounded-xl p-6 sm:p-8 transition-all duration-300"> {/* Adjusted padding and rounded */}

                        <h1 className="text-3xl font-bold text-white text-center mb-6 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]"> {/* Reduced size */}
                            Edit Your Profile
                        </h1>

                        <form onSubmit={handleSubmit}>
                            {/* --- Photo Upload Section --- */}
                            <div className="flex flex-col items-center gap-3 mb-6"> {/* Reduced gap/mb */}
                                <img
                                    src={photoPreview || `https://api.dicebear.com/8.x/lorelei/svg?seed=${formData.username || 'default'}`} // Fallback for null preview
                                    alt="Profile Preview"
                                    // Reduced size, adjusted glow
                                    className="w-28 h-28 rounded-full border-4 border-orange-500 object-cover
                                               shadow-[0_0_25px_rgba(255,69,0,0.4)]"
                                />
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/webp" // Specify accepted types
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    hidden
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    // Adjusted styles for refinement
                                    className="flex items-center gap-2 bg-transparent border border-orange-600/50 text-orange-500
                                               font-semibold rounded-lg py-1.5 px-3 text-sm
                                               shadow-[0_0_10px_rgba(255,69,0,0.2)]
                                               transition-all duration-300 transform
                                               hover:bg-orange-600/10 hover:border-orange-600/80
                                               hover:text-orange-400 hover:shadow-[0_0_20px_rgba(255,69,0,0.3)] hover:scale-105"
                                >
                                    <FaUpload />
                                    Change Photo
                                </button>
                            </div>

                            {/* --- Form Fields --- */}
                            <GodfatherInput id="name" label="Name" value={formData.name} onChange={handleChange} />
                            <GodfatherInput id="username" label="Username" value={formData.username} onChange={handleChange} />
                            <GodfatherTextarea id="description" label="Description / Bio" value={formData.description} onChange={handleChange} />
                            <GodfatherInput id="github" label="GitHub URL" value={formData.github} onChange={handleChange} />
                            <GodfatherInput id="linkedin" label="LinkedIn URL" value={formData.linkedin} onChange={handleChange} />

                            {/* --- Submit Button --- */}
                            <button
                                type="submit"
                                disabled={loading}
                                // Adjusted styles for refinement
                                className="w-full mt-4 bg-orange-600 text-white font-bold rounded-lg py-2.5 px-5 text-base
                                           shadow-[0_0_15px_rgba(255,69,0,0.4)]
                                           transition-all duration-300 transform
                                           hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(255,69,0,0.6)] hover:scale-[1.02]
                                           disabled:bg-gray-700/50 disabled:text-gray-500 disabled:shadow-none
                                           disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EditProfile;