import React from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import QuestionTable from './QuestionTable';

export default function SubTopicRow({
  subId, subTopic, visibleQuestions,
  isExpanded, onToggle,
  template, progress,
  onToggleSolve, onTogglePin,roadmapId,     
  onNoteSaved,
}) {
  const subTotalQ  = subTopic.questionOrder.length;
  const subSolvedQ = subTopic.questionOrder.filter(qId => progress.solved[qId]).length;
  const dotsFilled = subTotalQ > 0
    ? Math.round((subSolvedQ / subTotalQ) * Math.min(subTotalQ, 10))
    : 0;

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/40 rounded-lg overflow-hidden hover:border-zinc-700/50 transition-colors">

      {/* Sub-header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-800/30 transition-colors group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-zinc-600 group-hover:text-zinc-400 shrink-0">
            {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </span>
          <h3 className="text-sm font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
            {subTopic.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Dot pips */}
          <div className="hidden sm:flex gap-1">
            {Array.from({ length: Math.min(subTotalQ, 10) }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i < dotsFilled ? 'bg-red-600' : 'bg-zinc-800'}`}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-white">
            {subSolvedQ}<span className="text-white">/{subTotalQ}</span>
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="topic-enter">
          <QuestionTable
            questions={visibleQuestions}
            template={template}
            progress={progress}
            onToggleSolve={onToggleSolve}
            onTogglePin={onTogglePin}
            roadmapId={roadmapId}     
            onNoteSaved={onNoteSaved}
          />
        </div>
      )}
    </div>
  );
}