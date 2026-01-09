import React, { useState } from "react";
import axios from "axios";
import { serverUrl } from "../../App";
import { FaTimes, FaPaperPlane, FaTag } from "react-icons/fa";
import { toast } from "react-toastify";

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle Tag Input (Enter key adds tag)
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (tags.length >= 5) return toast.warning("Max 5 tags allowed!");
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return toast.error("Title and Content are required!");

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/community/create`,
        { title, content, tags },
        { withCredentials: true }
      );
      toast.success("Post deployed to the arena!");
      onPostCreated(data); // Update feed instantly
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-orange-500/30 w-full max-w-2xl rounded-xl shadow-[0_0_50px_rgba(234,88,12,0.2)] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-orange-500 flex items-center gap-2">
            <FaPaperPlane /> New Discussion
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Title</label>
            <input
              type="text"
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
              placeholder="e.g., How do I optimize DP solution for 2D Grid?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Content (Text Area) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Description</label>
            <textarea
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white h-40 focus:border-orange-500 focus:outline-none transition-colors resize-none"
              placeholder="Describe your doubt or share your knowledge..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Tags (Press Enter)</label>
            <div className="flex flex-wrap items-center gap-2 bg-black/50 border border-gray-700 rounded-lg p-2">
              <FaTag className="text-gray-500 ml-2" />
              {tags.map((tag) => (
                <span key={tag} className="bg-orange-900/40 text-orange-300 text-xs px-2 py-1 rounded border border-orange-700/50 flex items-center gap-1">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-white ml-1">×</button>
                </span>
              ))}
              <input
                type="text"
                className="bg-transparent text-white text-sm flex-grow focus:outline-none min-w-[100px]"
                placeholder={tags.length === 0 ? "Add tags..." : ""}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white mr-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg shadow-lg hover:shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Deploying..." : "Post to Arena"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;