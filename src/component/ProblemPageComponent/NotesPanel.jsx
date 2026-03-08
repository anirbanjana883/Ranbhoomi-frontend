import React, { useState, useEffect } from 'react';
import { FaStickyNote, FaSave, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function NotesPanel({ slug }) {
  const storageKey = `tuf_notes_${slug}`;
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load existing notes on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [storageKey]);

  // Handle typing and auto-save (simulated with a small timeout for UX)
  const handleNotesChange = (e) => {
    const value = e.target.value;
    setNotes(value);
    setIsSaving(true);
    localStorage.setItem(storageKey, value);
    
    // Quick timeout to show the "Saving..." UI flicker for a premium feel
    setTimeout(() => setIsSaving(false), 500);
  };

  const clearNotes = () => {
    if (window.confirm("Are you sure you want to clear your notes for this problem?")) {
      setNotes("");
      localStorage.removeItem(storageKey);
      toast.success("Notes cleared");
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
          <FaStickyNote className="text-amber-500" /> Personal Scratchpad
        </h2>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            {isSaving ? (
              <><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Saving...</>
            ) : (
              <><FaSave size={10} className="text-emerald-500" /> Saved Locally</>
            )}
          </span>
          <button 
            onClick={clearNotes}
            disabled={!notes}
            className="text-zinc-500 hover:text-red-500 disabled:opacity-30 transition-colors"
            title="Clear Notes"
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        Jot down your logic, edge cases, or time complexity thoughts here. These notes are saved securely in your browser.
      </p>

      {/* Text Area */}
      <textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="Write your thoughts here..."
        className="flex-grow w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 resize-none transition-colors custom-scrollbar shadow-inner leading-relaxed"
      />
    </div>
  );
}