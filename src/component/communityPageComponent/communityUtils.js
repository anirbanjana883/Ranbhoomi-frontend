// communityUtils.js — shared helpers

/**
 * Returns a compact, Reddit/Twitter style relative time string.
 * Added clock-drift safety and yearly fallback.
 */
export function timeAgo(date) {
  if (!date) return '';
  
  // Math.max prevents negative values caused by minor client/server clock sync issues
  const s = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  
  const days = Math.floor(s / 86400);
  if (days > 365) return `${Math.floor(days / 365)}y`;
  
  return `${days}d`;
}

/**
 * TUF plan badge styling.
 * Normalized to standard Tailwind opacities (/10 for bg, /20 for borders)
 * to perfectly match the Difficulty Badges.
 */
export function planBadgeClass(plan) {
  if (plan === 'Gladiator') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (plan === 'Warrior')   return 'text-red-400 bg-red-500/10 border-red-500/20';
  return null;
}

/**
 * Deterministic avatar color from username.
 * Shifted to the '600' color tier for premium contrast against zinc-900.
 */
const AVATAR_COLORS = [
  'bg-red-600', 'bg-amber-600', 'bg-emerald-600',
  'bg-blue-600', 'bg-violet-600', 'bg-pink-600', 'bg-cyan-600',
];

export function avatarColor(name = '') {
  if (!name) return 'bg-zinc-700'; // Default fallback
  
  const charCode = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
}