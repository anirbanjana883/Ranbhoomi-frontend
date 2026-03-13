import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCaretUp } from 'react-icons/fa';

/* ─────────────────────────────────────────
   LIVE RATING CHART (SVG, fully animated)
───────────────────────────────────────── */
function LiveRatingChart() {
  const [points, setPoints] = useState([820, 940, 880, 1020, 970, 1150, 1090, 1280, 1240, 1390, 1350, 1480]);
  const W = 320, H = 90;

  useEffect(() => {
    const id = setInterval(() => {
      setPoints(prev => {
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.38) * 80;
        const next = Math.max(800, Math.min(1800, last + delta));
        return [...prev.slice(-19), Math.round(next)];
      });
    }, 900);
    return () => clearInterval(id);
  }, []);

  const min = Math.min(...points) - 40;
  const max = Math.max(...points) + 40;
  const sy = v => H - ((v - min) / (max - min)) * H;
  const sx = (i, len) => (i / (len - 1)) * W;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i, points.length).toFixed(1)},${sy(p).toFixed(1)}`).join(' ');
  const fillD = pathD + ` L${W},${H} L0,${H}Z`;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const isUp = last >= prev;

  return (
    <div className="w-full flex flex-col h-full justify-between">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="ff-mono text-[10px] text-zinc-300 uppercase tracking-widest mb-1 font-semibold">ELO Rating</div>
          <div className="ff-syne text-2xl lg:text-3xl font-black text-white">{last.toLocaleString()}</div>
        </div>
        <div className={`flex items-center gap-1 ff-mono text-[10px] font-bold px-2 py-1 rounded-lg ${
          isUp ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
               : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          <FaCaretUp size={11} className={isUp ? '' : 'rotate-180'} />
          {isUp ? '+' : ''}{(last - prev).toFixed(0)}
        </div>
      </div>
      
      <div className="scan-wrap rounded-xl overflow-hidden mt-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24 sm:h-28" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#dc2626" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff6b6b" stopOpacity="1" />
            </linearGradient>
            <filter id="gw"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {[0.25,0.5,0.75].map(r => <line key={r} x1="0" y1={H*r} x2={W} y2={H*r} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>)}
          <path d={fillD} fill="url(#cf)" />
          <path d={pathD} fill="none" stroke="url(#cl)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#gw)" />
          <circle cx={sx(points.length-1,points.length)} cy={sy(last)} r="4.5" fill="#ef4444" filter="url(#gw)" />
          <circle cx={sx(points.length-1,points.length)} cy={sy(last)} r="8" fill="#ef4444" fillOpacity="0.3">
            <animate attributeName="r" values="4;14;4" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="fill-opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   LIVE SOLVE COUNTER
───────────────────────────────────────── */
const COUNTERS = [
  { label: 'Solved Today', base: 8241,  delta: [1,3], color: 'text-emerald-300', accent: 'bg-emerald-400' },
  { label: 'Active Now',   base: 3182,  delta: [0,2], color: 'text-amber-300',   accent: 'bg-amber-400' },
  { label: 'Submits/min',  base: 94,    delta: [1,4], color: 'text-red-300',     accent: 'bg-red-500' },
];

function LiveCounter({ label, base, delta, color, accent }) {
  const [val, setVal] = useState(base);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      const inc = Math.floor(Math.random() * (delta[1] - delta[0] + 1)) + delta[0];
      if (inc > 0) { setVal(v => v + inc); setFlash(true); setTimeout(() => setFlash(false), 300); }
    }, 1800 + Math.random() * 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${accent} ${flash ? 'scale-150 shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''} transition-all`} />
        <span className="ff-mono text-[8px] sm:text-[10px] text-zinc-300 font-semibold uppercase tracking-widest whitespace-nowrap">{label}</span>
      </div>
      <span className={`ff-syne text-xl sm:text-2xl font-black ${color} ${flash ? 'scale-105 brightness-125' : ''} transition-all origin-left`}>
        {val.toLocaleString()}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────
   LIVE CODE FEED
───────────────────────────────────────── */
const CODE_SNIPPETS = [
  { user:'user_42',  lang:'Python', prob:'LRU Cache',        status:'AC',  ms:48 },
  { user:'k_arjun',  lang:'C++',    prob:'Segment Tree',       status:'AC',  ms:12 },
  { user:'n_byte',   lang:'Java',   prob:'Edit Distance',      status:'TLE', ms:null },
  { user:'xr_void',  lang:'Go',     prob:'Dijkstra Shortest',  status:'AC',  ms:5 },
  { user:'dev_91',   lang:'Rust',   prob:'Trie Prefix Search', status:'AC',  ms:2 },
  { user:'lcode_z',  lang:'Python', prob:'Knapsack DP',        status:'WA',  ms:null },
  { user:'m_sinha',  lang:'C++',    prob:'Red-Black Tree',     status:'AC',  ms:8 },
];
const STATUS_STYLE = {
  AC:  'text-emerald-300 bg-emerald-500/20 border-emerald-500/30',
  TLE: 'text-amber-300  bg-amber-500/20  border-amber-500/30',
  WA:  'text-red-300    bg-red-500/20    border-red-500/30',
};

function LiveCodeFeed() {
  const [feed, setFeed] = useState(CODE_SNIPPETS.slice(0,3));
  const [newIdx, setNewIdx] = useState(null);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      const next = { ...CODE_SNIPPETS[i % CODE_SNIPPETS.length], user: `user_${Math.floor(1000+Math.random()*8999)}` };
      setFeed(prev => [next, ...prev.slice(0,2)]);
      setNewIdx(0);
      setTimeout(() => setNewIdx(null), 600);
      i++;
    }, 2400);
    return () => clearInterval(id);
  }, []);
  
  return (
    <div className="flex flex-col gap-2.5">
      {feed.map((row, i) => (
        <div key={i} className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-800/60 shadow-sm transition-all duration-500 ${
          i === newIdx ? 'border-red-500/40 bg-red-900/20 translate-x-1' : ''
        }`}>
          <div className="w-7 h-7 rounded-lg bg-zinc-700 border border-zinc-600 flex items-center justify-center ff-mono text-[10px] text-zinc-200 shrink-0 font-bold">
            {row.user[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2">
             <div className="flex items-baseline gap-1.5">
                <span className="ff-mono text-[11px] sm:text-[12px] text-zinc-100 font-bold shrink-0">{row.user}</span>
                <span className="ff-mono text-[9px] sm:text-[10px] text-zinc-400 shrink-0">solved</span>
             </div>
            <span className="ff-mono text-[10px] sm:text-[11px] text-zinc-300 font-medium truncate">{row.prob}</span>
          </div>
          <span className={`ff-mono text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded border shrink-0 shadow-sm ${STATUS_STYLE[row.status]}`}>
            {row.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   PARTICLES
───────────────────────────────────────── */
function Particles() {
  const ps = Array.from({ length: 14 }, (_, i) => ({
    id: i, left: `${5+Math.random()*90}%`, bottom: `${Math.random()*25}%`,
    delay: `${Math.random()*6}s`, dur: `${6+Math.random()*8}s`, size: Math.random()>0.7?4:2,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {ps.map(p => (
        <div key={p.id} className="particle"
          style={{ left:p.left, bottom:p.bottom, width:p.size, height:p.size, animationDuration:p.dur, animationDelay:p.delay }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────── */
export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[650px] w-full bg-zinc-950 overflow-hidden flex items-center">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-60" />

      {/* Ambient orbs - slightly brightened */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none orb-move" />
      <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] bg-red-800/10 rounded-full blur-[90px] pointer-events-none" />

      <Particles />

      <div className="w-full px-6 md:px-12 lg:px-24 pt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* ════════ LEFT ════════ */}
          <div className="flex flex-col gap-5 w-full">

            {/* Live badge */}
            <div className="fu d1 inline-flex items-center gap-2.5 self-start px-3.5 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 shadow-md ff-mono text-[11px] sm:text-xs text-zinc-200 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </span>
              LIVE — 3,182 coders active right now
            </div>

            {/* ★ RANBHOOMI */}
            <div className="fu d2 w-full">
              <div className="ff-mono text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-zinc-300 font-semibold mb-2">
                The Battleground
              </div>
              <h1
                className="ff-syne font-black tracking-tighter leading-none py-1 break-words"
                style={{ fontSize: 'clamp(2.2rem, 4vw, 5rem)' }}
              >
                <span className="shimmer-text glow-red block text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">RANBHOOMI</span>
              </h1>

              <div className="mt-3 ff-mono text-[11px] sm:text-xs text-zinc-300 font-medium tracking-[0.25em] uppercase flex items-center gap-2">
                Where engineers are forged
                <span className="blink-caret text-red-500 font-bold">_</span>
              </div>
            </div>

            <p className="fu d3 ff-inter text-base sm:text-lg text-zinc-300 leading-relaxed max-w-[440px] font-medium">
              Compete, solve DSA problems live, and climb the global ELO leaderboard — or get left behind.
            </p>

            {/* CTAs */}
            <div className="fu d4 flex flex-wrap gap-3.5 mt-2">
              <Link to="/practice">
                <button className="btn-sweep flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] ff-mono text-sm font-bold rounded-xl transition-all hover:scale-[1.02]">
                  Start Solving <FaArrowRight size={11} />
                </button>
              </Link>
              <Link to="/premium">
                <button className="flex items-center gap-2 px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-zinc-500 text-zinc-100 shadow-md ff-mono text-sm font-bold rounded-xl transition-all">
                  View Plans
                </button>
              </Link>
            </div>

            {/* Live counters */}
            <div className="fu d5 grid grid-cols-3 gap-2 sm:gap-6 pt-5 mt-3 border-t border-zinc-700/60 w-full max-w-[500px]">
              {COUNTERS.map(c => <LiveCounter key={c.label} {...c} />)}
            </div>
          </div>

          {/* ════════ RIGHT ════════ */}
          <div className="flex flex-col gap-6 w-full">

            {/* Rating chart card */}
            <div className="fu d3 relative card-top card-glow bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-6 shadow-2xl w-full">
              <div className="absolute top-4 right-5 flex items-center gap-2 bg-zinc-800/80 px-2 py-1 rounded-md border border-zinc-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                <span className="ff-mono text-[9px] sm:text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Live</span>
              </div>
              <LiveRatingChart />
            </div>

            {/* Live submissions card */}
            <div className="fu d4 relative card-top card-glow bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-6 shadow-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="ff-mono text-[11px] sm:text-xs text-zinc-200 uppercase tracking-widest font-bold">Live Submissions</div>
                <div className="flex items-center gap-2 bg-zinc-800/80 px-2 py-1 rounded-md border border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                  <span className="ff-mono text-[9px] sm:text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Streaming</span>
                </div>
              </div>
              <LiveCodeFeed />
            </div>

          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-20" />
    </section>
  );
}