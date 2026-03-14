// CreatePostModal.jsx — new post composer
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaTimes, FaBolt, FaHashtag } from 'react-icons/fa';
import { SectionLabel } from './CommunityAtoms.jsx';
import { serverUrl } from '../../App';
import API from '../../api/axios.js';

export default function CreatePostModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- Dynamic Tag Handling ---
  const handleTagKeyDown = (e) => {
    // Add tag on Enter or Comma
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      
      if (tags.length >= 5) {
        toast.error("Maximum 5 tags allowed.");
        return;
      }
      
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // --- Submission ---
  const submit = async () => {
    if (!title.trim()) return toast.error('Title is required');
    if (!content.trim()) return toast.error('Content is required');
    setSubmitting(true);
    try {
      const { data } = await API.post(
        `/community/post`, // Added /v1/ to match backend
        { title: title.trim(), content: content.trim(), tags },
      );
      const newPost = data.data || data;
      onCreate(newPost);
      onClose();
      toast.success('Post deployed to the War Room! ⚔️');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div>
            <SectionLabel>New Post</SectionLabel>
            <h2 className="text-xl font-black text-zinc-100 mt-1 tracking-tight">Share with the War Room</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* --- Form Body (Scrollable if needed) --- */}
        <div className="px-6 py-6 space-y-5 overflow-y-auto custom-scrollbar">

          {/* Title */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={300} // Matched backend schema maxlength
              placeholder="e.g. Google L3 Interview Experience - Bangalore"
              className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-zinc-600 transition-colors duration-200"
            />
            <p className="font-mono text-[10px] text-zinc-600 text-right mt-1.5">{title.length}/300</p>
          </div>

          {/* Content */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-2">
              Content (Markdown Supported) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={50000} // Matched backend schema limit
              rows={8}
              placeholder="Explain your system design approach, interview questions, or share code snippets..."
              className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-zinc-600 transition-colors duration-200 resize-y"
            />
            <p className="font-mono text-[10px] text-zinc-600 text-right mt-1.5">{content.length}/50000</p>
          </div>

          {/* Dynamic Tags */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-2">
              Tags <span className="text-zinc-600 font-normal lowercase tracking-normal">(Press Enter to add)</span>
            </label>
            
            <div className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 flex flex-wrap gap-2 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-colors duration-200">
              {/* Render Selected Tags */}
              {tags.map(t => (
                <span
                  key={t}
                  onClick={() => removeTag(t)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-widest font-bold border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-red-500/50 hover:text-red-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Click to remove"
                >
                  <FaHashtag size={8} /> {t} <FaTimes size={8} className="ml-0.5 opacity-50" />
                </span>
              ))}
              
              {/* Tag Input Field */}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length < 5 ? "Type a tag..." : "Limit reached"}
                disabled={tags.length >= 5}
                className="flex-1 min-w-[120px] bg-transparent text-zinc-200 text-sm focus:outline-none placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* --- Footer --- */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
          <button
            onClick={onClose}
            className="font-mono text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || !content.trim() || submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-md transition-colors"
          >
            <FaBolt size={10} /> {submitting ? 'Deploying...' : 'Deploy Intel'}
          </button>
        </div>
      </div>
    </div>
  );
}