import React from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import SubTopicRow from './SubTopicRow';

export default function TopicCard({
  topicId, topicIndex, topic,
  isExpanded, onToggle,
  expandedSubtopics, onToggleSubtopic,
  subTopicsToRender,
  template, progress,
  onToggleSolve, onTogglePin,
  roadmapId,       
  onNoteSaved,
}) {
  const totalQ  = topic.subTopicOrder.reduce((acc, subId) =>
    acc + (template.subTopics[subId]?.questionOrder?.length || 0), 0);
  const solvedQ = topic.subTopicOrder.reduce((acc, subId) =>
    acc + (template.subTopics[subId]?.questionOrder?.filter(qId => progress.solved[qId]).length || 0), 0);
  const pct = totalQ > 0 ? Math.round((solvedQ / totalQ) * 100) : 0;
  const barColor = pct === 100 ? '#10b981' : pct > 50 ? '#f59e0b' : '#dc2626';

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/20 hover:border-zinc-700 transition-colors duration-200">

      {/* Topic header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-800 px-2 py-1 rounded shrink-0">
            {String(topicIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0">
            {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
          </span>
          <h2 className="text-base font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
            {topic.title}
          </h2>
          {pct === 100 && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Complete
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 sm:w-36 hidden sm:flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: barColor,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>
          <span className="text-sm font-mono text-white">
            {solvedQ}<span className="text-white">/{totalQ}</span>
          </span>
        </div>
      </div>

      {/* Sub-topics */}
      {isExpanded && (
        <div className="border-t border-zinc-800/60 p-2.5 space-y-2 topic-enter">
          {subTopicsToRender.map(({ subId, subTopic, visibleQuestions }) => {
            if (visibleQuestions.length === 0) return null;
            return (
              <SubTopicRow
                key={subId}
                subId={subId}
                subTopic={subTopic}
                visibleQuestions={visibleQuestions}
                isExpanded={!!expandedSubtopics[subId]}
                onToggle={() => onToggleSubtopic(subId)}
                template={template}
                progress={progress}
                onToggleSolve={onToggleSolve}
                onTogglePin={onTogglePin}
                roadmapId={roadmapId}     
                onNoteSaved={onNoteSaved}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}