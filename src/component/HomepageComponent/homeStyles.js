export const HOME_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@700;800;900&family=Inter:wght@300;400;500;600&display=swap');

  .ff-mono  { font-family: 'JetBrains Mono', monospace; }
  .ff-syne  { font-family: 'Syne', sans-serif; }
  .ff-inter { font-family: 'Inter', sans-serif; }

  /* ── Keyframes ── */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes glowPulse {
    0%,100% { text-shadow: 0 0 20px rgba(220,38,38,0.4), 0 0 60px rgba(220,38,38,0.2); }
    50%      { text-shadow: 0 0 40px rgba(220,38,38,0.8), 0 0 120px rgba(220,38,38,0.4), 0 0 200px rgba(220,38,38,0.15); }
  }
  @keyframes scanDown {
    0%   { top: 0; opacity: 0.7; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes ticker  { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
  @keyframes blink   { 50% { opacity:0; } }
  @keyframes float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
  @keyframes orbMove {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(40px,-30px) scale(1.05); }
    66%  { transform: translate(-20px,20px) scale(0.97); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes shimmerMove {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes countUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes gridFade {
    0%,100% { opacity: 0.04; }
    50%     { opacity: 0.08; }
  }
  @keyframes lineGrow { from { width: 0; } to { width: 100%; } }
  @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes particleDrift {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
    50%  { transform: translateY(-120px) translateX(30px) scale(1.2); opacity: 1; }
    100% { transform: translateY(-240px) translateX(-10px) scale(0.8); opacity: 0; }
  }

  /* ── Utility classes ── */
  .fu { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .fi { animation: fadeIn 0.7s ease both; }
  .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.15s; }
  .d3 { animation-delay: 0.25s; } .d4 { animation-delay: 0.35s; }
  .d5 { animation-delay: 0.45s; } .d6 { animation-delay: 0.55s; }
  .d7 { animation-delay: 0.65s; } .d8 { animation-delay: 0.75s; }

  .glow-red    { animation: glowPulse 3s ease-in-out infinite; }
  .float-anim  { animation: float 4s ease-in-out infinite; }
  .blink-caret { animation: blink 1s step-end infinite; }
  .orb-move    { animation: orbMove 12s ease-in-out infinite; }
  .spin-slow   { animation: spinSlow 20s linear infinite; }

  /* ── Shimmer text ── */
  .shimmer-text {
    background: linear-gradient(90deg,
      #fff 0%, #fff 30%,
      #dc2626 45%, #ff4444 50%, #dc2626 55%,
      #fff 70%, #fff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerMove 3s linear infinite;
    white-space: nowrap;
    display: inline-block;
    max-width: 100%;
  }

  /* ── Grid background ── */
  .grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridFade 6s ease-in-out infinite;
  }

  /* ── Scrolling ticker ── */
  .ticker-wrap  { overflow: hidden; white-space: nowrap; }
  .ticker-inner { display: inline-flex; animation: ticker 35s linear infinite; }

  /* ── Red glow card ── */
  .card-glow {
    transition: box-shadow 0.35s, border-color 0.35s, transform 0.35s;
  }
  .card-glow:hover {
    border-color: rgba(220,38,38,0.4);
    box-shadow: 0 0 40px rgba(220,38,38,0.08), inset 0 0 40px rgba(220,38,38,0.04);
    transform: translateY(-3px);
  }

  /* ── Top red accent line ── */
  .card-top::before {
    content: '';
    position: absolute;
    top: 0; left: 24px; right: 24px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(220,38,38,0.6) 50%, transparent);
  }

  /* ── Button sweep ── */
  .btn-sweep {
    position: relative; overflow: hidden;
  }
  .btn-sweep::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: left 0.5s;
  }
  .btn-sweep:hover::after { left: 150%; }

  /* ── Scan line ── */
  .scan-wrap { position: relative; overflow: hidden; }
  .scan-wrap::after {
    content: '';
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent);
    animation: scanDown 3s linear infinite;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar       { width: 3px; }
  ::-webkit-scrollbar-track { background: #09090b; }
  ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 9px; }
  ::-webkit-scrollbar-thumb:hover { background: #dc2626; }

  /* ── Particle ── */
  .particle {
    position: absolute;
    width: 3px; height: 3px;
    border-radius: 50%;
    background: rgba(220,38,38,0.8);
    animation: particleDrift linear infinite;
    pointer-events: none;
  }
`;