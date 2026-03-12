import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaSave, FaTrashAlt, FaStickyNote } from 'react-icons/fa';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';

/**
 * NoteModal — standalone component.
 *
 * Props:
 *   isOpen        : bool
 *   onClose       : fn()
 *   roadmapId     : string   — from useParams in parent
 *   questionId    : string   — the question being noted
 *   questionTitle : string   — shown in modal header
 *   initialNote   : string   — existing saved note ('' if none)
 *   onNoteSaved   : fn(questionId, noteText)  — called after successful save/delete
 *                   so parent can update progress.notes in state
 */
export default function NoteModal({
  isOpen,
  onClose,
  roadmapId,
  questionId,
  questionTitle,
  initialNote,
  onNoteSaved,
}) {
  const [text,   setText]   = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  /* Re-sync text whenever a different question's modal opens */
  useEffect(() => {
    if (isOpen) {
      setText(initialNote || '');
      setTimeout(() => ref.current?.focus(), 60);
    }
  }, [isOpen, initialNote, questionId]);

  /* Escape key to close */
  useEffect(() => {
    if (!isOpen) return;
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  /* ── API call ─────────────────────────────────────────────────── */
  const save = useCallback(async (noteText) => {
    setSaving(true);
    try {
      await API.patch(`/roadmap/${roadmapId}/progress/note`, {
        questionId,
        noteText: noteText?.trim() ?? '',
      });

      const deleted = !noteText?.trim();
      toast.success(deleted ? 'Note deleted.' : 'Note saved!');

      /* Tell parent to update progress.notes so the amber dot stays correct */
      onNoteSaved?.(questionId, noteText?.trim() ?? '');

      /* Auto-close after save; keep open after delete so user can re-type */
      if (!deleted) onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  }, [roadmapId, questionId, onNoteSaved, onClose]);

  if (!isOpen) return null;

  const isDirty = text !== (initialNote || '');

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-800">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
              <FaStickyNote size={13} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-500 mb-0.5">Note</p>
              <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">
                {questionTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* ── Textarea ── */}
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <textarea
            ref={ref}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your notes, approach, key observations, time/space complexity…"
            rows={10}
            className="w-full min-h-[220px] bg-zinc-950 border border-zinc-800 rounded-xl
                       text-sm text-zinc-200 placeholder:text-zinc-600 leading-relaxed
                       px-4 py-3 resize-none
                       focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700
                       transition-colors
                       [&::-webkit-scrollbar]:w-1
                       [&::-webkit-scrollbar-thumb]:bg-zinc-700
                       [&::-webkit-scrollbar-thumb]:rounded-full"
          />
          <p className="mt-1.5 text-[10px] text-zinc-700 text-right font-mono">
            {text.length} chars
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-zinc-800 bg-zinc-900/80">

          {/* Delete — only enabled when a saved note exists */}
          <button
            onClick={() => save('')}
            disabled={saving || !initialNote}
            title="Delete saved note"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500
                       hover:text-red-400 hover:bg-red-500/10 border border-transparent
                       hover:border-red-500/20 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaTrashAlt size={11} />
            <span className="hidden sm:inline">Delete Note</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400
                         hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800
                         hover:border-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => save(text)}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold
                         bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving
                ? <div className="w-3.5 h-3.5 border-2 border-zinc-800/40 border-t-zinc-800 rounded-full animate-spin" />
                : <FaSave size={12} />
              }
              Save Note
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}