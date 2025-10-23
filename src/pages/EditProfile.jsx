import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import { FaArrowLeft, FaUpload } from 'react-icons/fa';

// --- NEW INPUT COMPONENT ---
// This is a solid input field, like a login form
const GodfatherInput = ({ id, label, value, onChange, type = "text" }) => (
  <div className="w-full mb-6">
    <label
      htmlFor={id}
      className="block text-lg font-medium text-orange-400 mb-2 
                 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]"
    >
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-gray-950/50 text-white rounded-lg 
                 border-2 border-orange-600/30 
                 focus:outline-none focus:border-orange-500
                 focus:shadow-[0_0_20px_rgba(255,69,0,0.5)] 
                 transition-all duration-300
                 [text-shadow:0_0_5px_rgba(255,255,255,0.3)]"
    />
  </div>
);

// --- NEW TEXTAREA COMPONENT ---
const GodfatherTextarea = ({ id, label, value, onChange }) => (
  <div className="w-full mb-6">
    <label
      htmlFor={id}
      className="block text-lg font-medium text-orange-400 mb-2 
                 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]"
    >
      {label}
    </label>
    <textarea
      id={id}
      name={id}
      rows="4"
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-gray-950/50 text-white rounded-lg 
                 border-2 border-orange-600/30 
                 focus:outline-none focus:border-orange-500
                 focus:shadow-[0_0_20px_rgba(255,69,0,0.5)] 
                 transition-all duration-300
                 [text-shadow:0_0_5px_rgba(255,255,255,0.3)]"
    />
  </div>
);

function EditProfile() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    description: '',
    github: '',
    linkedin: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Pre-fill the form with user data from Redux
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        description: userData.description || '',
        github: userData.github || '',
        linkedin: userData.linkedin || '',
      });
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

    if (photoFile) {
      data.append('photoUrl', photoFile); 
    }
    
    try {
      const res = await axios.put(
        `${serverUrl}/api/user/updateprofile`, 
        data, 
        { withCredentials: true }
      );
      
      dispatch(setUserData(res.data)); // Update Redux state
      toast.success("Profile updated successfully!");
      navigate(`/profile/${res.data.username}`); // Go back to profile page
      
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
        className="fixed top-7 left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-lg 
                   border border-orange-600/30 shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                   text-orange-500 font-bold rounded-full py-2 px-4 
                   transition-all duration-300 transform 
                   hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] 
                   hover:text-orange-400 hover:scale-105"
      >
        <FaArrowLeft />
        Back
      </button>

      {/* --- Main Content --- */}
      <div className="min-h-screen text-gray-300 pt-28 px-4 bg-black">
        
        <div className="max-w-3xl mx-auto pb-20">
          {/* --- The Godfather Card --- */}
          {/* --- CHANGED --- Adjusted padding for mobile (p-4 sm:p-8) */}
          <div className="bg-black border border-orange-600/30 
                          shadow-[0_0_25px_rgba(255,69,0,0.2)] 
                          hover:border-orange-600/70 hover:shadow-[0_0_45px_rgba(255,69,0,0.5)] 
                          rounded-2xl p-4 sm:p-8 transition-all duration-300">
            
            <h1 className="text-4xl font-black text-white text-center mb-8 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
              Edit Your Profile
            </h1>

            <form onSubmit={handleSubmit}>
              {/* --- Photo Upload Section --- */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-orange-500 object-cover 
                             shadow-[0_0_30px_rgba(255,69,0,0.5)]"
                />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  hidden // Hide the default ugly input
                />
                <button
                  type="button" 
                  onClick={() => fileInputRef.current.click()} 
                  className="flex items-center gap-2 bg-transparent border border-orange-600/50 text-orange-500 
                             font-bold rounded-lg py-2 px-4
                             shadow-[0_0_15px_rgba(255,69,0,0.2)] 
                             transition-all duration-300 transform 
                             hover:bg-orange-600/10 hover:border-orange-600/80 
                             hover:text-orange-400 hover:shadow-[0_0_25px_rgba(255,69,0,0.4)] hover:scale-105"
                >
                  <FaUpload />
                  Change Photo
                </button>
              </div>

              {/* --- Form Fields --- */}
              {/* --- CHANGED --- Replaced with new components */}
              <GodfatherInput id="name" label="Name" value={formData.name} onChange={handleChange} />
              
              <GodfatherInput id="username" label="Username" value={formData.username} onChange={handleChange} />
              
              <GodfatherTextarea id="description" label="Description / Bio" value={formData.description} onChange={handleChange} />
              
              <GodfatherInput id="github" label="GitHub URL (e.g., https://github.com/your-name)" value={formData.github} onChange={handleChange} />
              
              <GodfatherInput id="linkedin" label="LinkedIn URL (e.g., https://linkedin.com/in/your-name)" value={formData.linkedin} onChange={handleChange} />

              {/* --- Submit Button --- */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-orange-600 text-white font-bold rounded-lg py-3 px-5 text-lg
                           shadow-[0_0_20px_rgba(255,69,0,0.5)] 
                           transition-all duration-300 transform 
                           hover:bg-orange-700 hover:shadow-[0_0_35px_rgba(255,69,0,0.8)] hover:scale-[1.02]
                           disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none 
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