import toast from 'react-hot-toast';

export const comingSoon = (feature) => {
  toast(`🚀 ${feature} is coming soon`, {
    style: { borderRadius: '6px', background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a' }
  });
};

export const DIFFICULTY_STYLES = {
  Basic:  "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
  Easy:   "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  Hard:   "text-red-400 border-red-500/20 bg-red-500/10",
};

export const DIFFICULTY_DOT = {
  Basic:  "bg-cyan-500",
  Easy:   "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard:   "bg-red-500",
};

export const SEARCH_TYPE = {
  TOPIC: 'topic',
  SUBTOPIC: 'subtopic',
  QUESTION: 'question',
};