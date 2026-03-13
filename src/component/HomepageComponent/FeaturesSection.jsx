import React, { useEffect, useRef, useState } from 'react';
import {
  FaBrain, FaTerminal, FaTrophy, FaUserNinja, FaCode, FaCrown, FaChartLine,
} from 'react-icons/fa';

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

/* ── Mini sparkline that animates live ── */
function MiniSparkline({ color = '#ef4444' }) { // Brightened default color
  const [pts, setPts] = useState([40, 55, 45, 70, 60, 80, 72, 90, 85, 95]);
  useEffect(() => {
    const id = setInterval(() => {
      setPts(p => {
        const last = p[p.length - 1];
        const next = Math.max(20, Math.min(100, last + (Math.random() - 0.4) * 20));
        return [...p.slice(-11), Math.round(next)];
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  const W = 200, H = 48;
  const min = Math.min(...pts) - 5, max = Math.max(...pts) + 5;
  const sx = (i) => (i / (pts.length - 1)) * W;
  const sy = (v) => H - ((v - min) / (max - min)) * H;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(p).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`mg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + ` L${W},${H} L0,${H}Z`} fill={`url(#mg${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── AI Chat ── */
const CHAT = [
  { from: 'user', text: 'Why is my DP TLE-ing?' },
  { from: 'ai',   text: 'Recalculating subproblems. Memoize fib(n-2).' },
  { from: 'user', text: 'Fixed! Now O(n). AC 🎉' },
  { from: 'ai',   text: 'Good. Now optimize to O(1) space.' },
];
function LiveChat() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= CHAT.length) return;
    const t = setTimeout(() => setN(v => v + 1), 1000);
    return () => clearTimeout(t);
  }, [n]);
  useEffect(() => {
    const restart = setTimeout(() => setN(0), 8000);
    return () => clearTimeout(restart);
  }, []);
  return (
    <div className="mt-4 space-y-2.5 min-h-[110px]">
      {CHAT.slice(0, n).map((m, i) => (
        <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`px-3 py-2 rounded-xl text-[11px] ff-mono max-w-[88%] transition-all duration-300 font-medium shadow-sm ${
            m.from === 'user'
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
              : 'bg-red-500/15 border border-red-500/30 text-red-200'
          }`}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Company tag ── */
const COMPANIES = ['Google', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Microsoft', 'Adobe', 'Uber'];

/* ── Feature card wrapper ── */
function FeatCard({ children, className = '', delay = 'd1', vis }) {
  return (
    <div className={`relative card-top card-glow bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/60 rounded-2xl p-6 shadow-xl overflow-hidden ${
      vis ? `fu ${delay}` : 'opacity-0'
    } ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
        {icon}
      </div>
      <div>
        {label && <div className="ff-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold mb-0.5">{label}</div>}
        <h3 className="ff-syne text-base font-black text-white">{title}</h3>
      </div>
    </div>
  );
}

/* ── Difficulty bars ── */
const DIFFS = [
  { label: 'Easy',   pct: 72, color: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]', solved: 1728 },
  { label: 'Medium', pct: 51, color: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',   solved: 892 },
  { label: 'Hard',   pct: 29, color: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',     solved: 341 },
];
function DiffBars({ vis }) {
  return (
    <div className="space-y-4 mt-4">
      {DIFFS.map(d => (
        <div key={d.label}>
          <div className="flex justify-between ff-mono text-[11px] font-semibold mb-1.5">
            <span className="text-zinc-300">{d.label}</span>
            <span className="text-zinc-400">{d.solved} solved</span>
          </div>
          <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50">
            <div
              className={`h-full rounded-full ${d.color} transition-all duration-1500 ease-out`}
              style={{ width: vis ? `${d.pct}%` : '0%', transitionDuration: '1.5s' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturesSection() {
  const [ref, vis] = useInView(0.05);

  return (
    <section ref={ref} className="py-28 px-4 sm:px-6 bg-zinc-950 relative">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className={`mb-16 ${vis ? 'fu d1' : 'opacity-0'}`}>
          <div className="ff-mono text-[11px] font-bold uppercase tracking-[0.35em] text-red-500 mb-3">The Platform</div>
          <h2 className="ff-syne text-4xl sm:text-5xl lg:text-6xl font-black text-white">
            Forged for <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">Performance.</span>
          </h2>
          <p className="ff-inter text-zinc-300 text-lg mt-4 max-w-xl leading-relaxed font-medium">
            A high-performance engine for developers. Every feature is meticulously built to help you get hired faster.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* AI — spans 2 cols on tablet, 1 on desktop */}
          <FeatCard className="md:row-span-2 lg:col-span-1 flex flex-col" delay="d2" vis={vis}>
            <CardHeader icon={<FaBrain size={18} />} title="AI Sensei" label="Intelligent hints" />
            <p className="ff-inter text-sm text-zinc-300 leading-relaxed font-medium">
              Analyzes your code logic, finds the exact flaw, and nudges you toward the solution without spoiling it entirely.
            </p>
            <div className="mt-auto pt-4">
              <LiveChat />
            </div>
          </FeatCard>

          {/* Cloud IDE */}
          <FeatCard delay="d3" vis={vis}>
            <CardHeader icon={<FaTerminal size={16} />} title="Cloud IDE" label="Monaco · 20+ langs" />
            <div className="bg-zinc-950/80 rounded-xl border border-zinc-700/80 p-4 ff-mono text-[11px] sm:text-xs mt-3 shadow-inner">
              <div><span className="text-zinc-500">01  </span><span className="text-blue-400 font-semibold">def </span><span className="text-emerald-300">dp</span><span className="text-zinc-200">(n, memo={}):</span></div>
              <div><span className="text-zinc-500">02  </span><span className="text-zinc-300">    if n in memo: return memo[n]</span></div>
              <div><span className="text-zinc-500">03  </span><span className="text-zinc-300">    memo[n] = dp(n-1)+dp(n-2)</span></div>
              <div className="mt-3 pt-3 border-t border-zinc-800 text-emerald-400 font-bold text-[10px] sm:text-[11px]">
                ✓ 52 / 52 passed · 34ms
              </div>
            </div>
          </FeatCard>

          {/* ELO rating with live sparkline */}
          <FeatCard delay="d4" vis={vis}>
            <CardHeader icon={<FaChartLine size={16} />} title="ELO Rating" label="Live rank" />
            <div className="flex justify-between items-end mb-2 mt-2">
              <span className="ff-syne text-3xl font-black text-white drop-shadow-md">1,482</span>
              <span className="ff-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                +94 this week
              </span>
            </div>
            <MiniSparkline color="#ef4444" />
          </FeatCard>

          {/* Problem archive */}
          <FeatCard delay="d5" vis={vis}>
            <CardHeader icon={<FaCode size={16} />} title="2,400+ Problems" label="Curated archive" />
            <DiffBars vis={vis} />
          </FeatCard>

          {/* Mock interviews */}
          <FeatCard delay="d6" vis={vis}>
            <CardHeader icon={<FaUserNinja size={16} />} title="Mock Interviews" label="Peer sessions" />
            <p className="ff-inter text-sm text-zinc-300 leading-relaxed font-medium mb-5">
              Live peer coding with video, synced whiteboards, and highly-detailed post-session AI reports.
            </p>
            <div className="flex -space-x-3">
              {['A', 'K', 'N', 'X', 'R'].map((l, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center ff-mono text-sm text-zinc-200 font-black shadow-md z-10 relative hover:-translate-y-1 transition-transform">
                  {l}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center ff-mono text-[10px] text-red-300 font-bold z-0 relative">
                +41
              </div>
            </div>
          </FeatCard>

          {/* Company tags */}
          <FeatCard delay="d7" vis={vis}>
            <CardHeader icon={<FaCrown size={16} />} title="Company Tags" label="FAANG-targeted" />
            <div className="flex flex-wrap gap-2 mt-3">
              {COMPANIES.map(c => (
                <span key={c} className="ff-mono text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 transition-all cursor-default">
                  {c}
                </span>
              ))}
            </div>
          </FeatCard>

          {/* Leagues — wide bottom */}
          <FeatCard className="lg:col-span-2" delay="d8" vis={vis}>
            <CardHeader icon={<FaTrophy size={16} />} title="Ranked Leagues" label="Weekly ELO contests" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              {[
                { tier: 'Iron',       color: 'text-zinc-400',  bg: 'bg-zinc-800/80',      border: 'border-zinc-600', count: 18241 },
                { tier: 'Bronze',     color: 'text-orange-400',bg: 'bg-orange-950/40',    border: 'border-orange-700/50', count: 8832 },
                { tier: 'Silver',     color: 'text-zinc-200',  bg: 'bg-zinc-700/50',      border: 'border-zinc-500', count: 4191 },
                { tier: 'Gold',       color: 'text-amber-300', bg: 'bg-amber-500/20',     border: 'border-amber-500/40', count: 1284 },
                { tier: 'Challenger', color: 'text-red-400',   bg: 'bg-red-600/20',       border: 'border-red-500/40', count: 312 },
              ].map(t => (
                <div key={t.tier} className={`${t.bg} border ${t.border} rounded-xl p-3.5 text-center shadow-inner hover:scale-105 transition-transform`}>
                  <div className={`ff-syne text-base sm:text-lg font-black ${t.color}`}>{t.tier}</div>
                  <div className="ff-mono text-[10px] font-medium text-zinc-400 mt-1">{t.count.toLocaleString()} coders</div>
                </div>
              ))}
            </div>
          </FeatCard>

        </div>
      </div>
    </section>
  );
}