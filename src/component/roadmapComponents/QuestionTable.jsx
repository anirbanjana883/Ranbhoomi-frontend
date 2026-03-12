import React, { useState, useRef, useEffect } from 'react';
import {
  FaPlayCircle, FaCode, FaStar, FaRegStar,
  FaStickyNote, FaCheckSquare, FaRegSquare,
} from 'react-icons/fa';
import { DIFFICULTY_STYLES, DIFFICULTY_DOT, comingSoon } from './constants';
import NoteModal from './NoteModal';

const TH = ({ children, center }) => (
  <th className={`py-3 px-4 ${center ? 'text-center' : ''}`}>
    <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">{children}</span>
  </th>
);

export default function QuestionTable({
  questions, template, progress,
  onToggleSolve, onTogglePin,
  roadmapId, onNoteSaved,
}) {
  /* ── localNotes ref ─────────────────────────────────────────────────
     progress.notes is a prop → React re-renders are async.
     If the user saves and immediately reopens the modal, the prop may
     still hold the old (pre-save) value, making initialNote appear empty.

     Fix: mirror notes into a plain ref that is written SYNCHRONOUSLY on
     every save. openNote() reads from this ref, so it always gets the
     latest value regardless of where React is in its render cycle.
  ────────────────────────────────────────────────────────────────────── */
  const localNotes = useRef({ ...(progress.notes || {}) });

  useEffect(() => {
    localNotes.current = { ...(progress.notes || {}) };
  }, [progress.notes]);

  const [modal, setModal] = useState({
    open: false, questionId: null, questionTitle: '', initialNote: '',
  });

  const openNote = (qId, title) => setModal({
    open:          true,
    questionId:    qId,
    questionTitle: title,
    initialNote:   localNotes.current[qId] || '',   // ← always fresh
  });

  const closeNote = () => setModal(p => ({ ...p, open: false }));

  const handleNoteSaved = (qId, text) => {
    // 1. Sync ref immediately — no waiting for parent re-render
    if (text) localNotes.current[qId] = text;
    else      delete localNotes.current[qId];

    // 2. Reset isDirty inside the open modal
    setModal(p => ({ ...p, initialNote: text }));

    // 3. Bubble up so RoadmapSheet can update its state
    onNoteSaved?.(qId, text);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-t border-zinc-800/60 bg-zinc-900/40">
              <TH center>Done</TH>
              <TH>Problem</TH>
              <TH center>Arena</TH>
              <TH center>Video</TH>
              <TH center>Practice</TH>
              <TH center>Note</TH>
              <TH center>Revise</TH>
              <TH center>Level</TH>
            </tr>
          </thead>
          <tbody>
            {questions.map((qId) => {
              const question = template.questions[qId];
              if (!question) return null;

              const isSolved  = !!progress.solved[qId];
              const isPinned  = !!progress.bookmarked[qId];
              const hasNote   = !!(localNotes.current[qId]);  // ← ref, not prop
              const diffStyle = DIFFICULTY_STYLES[question.difficulty] || 'text-zinc-400 border-zinc-700 bg-zinc-800/40';
              const diffDot   = DIFFICULTY_DOT[question.difficulty]   || 'bg-zinc-500';

              return (
                <tr
                  id={`q-${qId}`}
                  key={qId}
                  className={`border-t border-zinc-800/30 transition-colors group/row ${
                    isSolved ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]' : 'hover:bg-zinc-800/25'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onToggleSolve(qId, question.difficulty)}
                      className="inline-flex items-center justify-center w-5 h-5 transition-transform hover:scale-110"
                    >
                      {isSolved
                        ? <FaCheckSquare className="text-emerald-500" size={16} />
                        : <FaRegSquare   className="text-zinc-700 hover:text-green-600" size={16} />
                      }
                    </button>
                  </td>

                  {/* Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${diffDot} shrink-0 opacity-70`} />
                      <span className={`text-sm font-medium transition-colors ${
                        isSolved ? 'text-green-300' : 'text-zinc-200 group-hover/row:text-white'
                      }`}>
                        {question.title}
                      </span>
                    </div>
                  </td>

                  {/* Arena */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => comingSoon('Arena')}
                      className="text-xs font-bold uppercase tracking-widest text-orange-500/80 hover:text-yellow-400 transition-colors border border-orange-500/20 hover:border-orange-400/40 px-2.5 py-1 rounded"
                    >
                      Solve
                    </button>
                  </td>

                  {/* Video */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => comingSoon('Video')}
                      className="inline-flex justify-center w-full text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <FaPlayCircle size={16} />
                    </button>
                  </td>

                  {/* Practice */}
                  <td className="py-3 px-4 text-center">
                    <a
                      href={question.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex justify-center w-full text-zinc-400 hover:text-blue-400 transition-colors"
                    >
                      <FaCode size={16} />
                    </a>
                  </td>

                  {/* Note */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openNote(qId, question.title)}
                      title={hasNote ? 'Edit note' : 'Add note'}
                      className="relative inline-flex justify-center w-full transition-colors"
                    >
                      <FaStickyNote
                        size={15}
                        className={hasNote
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-zinc-400 hover:text-lime-300'}
                      />
                      {hasNote && (
                        <span className="absolute -top-0.5 right-[calc(50%-10px)] w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-zinc-900" />
                      )}
                    </button>
                  </td>

                  {/* Revise / Star */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onTogglePin(qId)}
                      className="inline-flex justify-center w-full transition-transform hover:scale-110"
                    >
                      {isPinned
                        ? <FaStar    className="text-amber-400" size={15} />
                        : <FaRegStar className="text-zinc-400 hover:text-yellow-400" size={15} />
                      }
                    </button>
                  </td>

                  {/* Difficulty badge */}
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${diffStyle}`}>
                      {question.difficulty || 'Medium'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NoteModal
        isOpen={modal.open}
        onClose={closeNote}
        roadmapId={roadmapId}
        questionId={modal.questionId}
        questionTitle={modal.questionTitle}
        initialNote={modal.initialNote}
        onNoteSaved={handleNoteSaved}
      />
    </>
  );
}