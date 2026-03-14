// communityStyles.js — TUF Dark Mode Design System core utilities

export const COMMUNITY_STYLES = `
  /* ── Custom Scrollbar (TUF Standard) ── */
  .custom-scrollbar::-webkit-scrollbar { 
    width: 4px; 
    height: 4px; 
  }
  .custom-scrollbar::-webkit-scrollbar-track { 
    background: transparent; 
  }
  .custom-scrollbar::-webkit-scrollbar-thumb { 
    background: #27272a; /* border-zinc-800 */
    border-radius: 10px; 
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
    background: #3f3f46; /* border-zinc-700 */
  }

  /* ── Modal & Overlay Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn { 
    from { opacity: 0; } 
    to   { opacity: 1; } 
  }
  
  .modal-overlay { 
    animation: fadeIn 0.2s ease-out forwards; 
  }
  .modal-card { 
    animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
  }
`;

// Shared standard for difficulty badges across the platform
export const DIFFICULTY_MAP = {
  Easy:         'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium:       'text-amber-400   bg-amber-500/10   border-amber-500/20',
  Hard:         'text-red-400     bg-red-500/10     border-red-500/20',
  'Super Hard': 'text-purple-400  bg-purple-500/10  border-purple-500/20',
};