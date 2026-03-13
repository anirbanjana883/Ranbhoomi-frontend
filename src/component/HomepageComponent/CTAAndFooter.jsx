import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFireAlt, FaTwitter, FaGithub, FaDiscord, FaYoutube, FaArrowRight } from 'react-icons/fa';

function useInView(t = 0.15) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: t }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

/* ── Animated counter in CTA ── */
function AnimCount({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [ref, vis] = useInView(0.3);
  useEffect(() => {
    if (!vis) return;
    let start = 0;
    const step = target / 60;
    const id = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [vis, target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export function CTASection() {
  const [ref, vis] = useInView(0.15);
  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 bg-zinc-950">
      <div className={`max-w-5xl mx-auto ${vis ? 'fu d1' : 'opacity-0'}`}>
        <div className="relative rounded-3xl border border-red-500/30 bg-zinc-900/90 backdrop-blur-sm overflow-hidden p-10 sm:p-20 text-center shadow-2xl shadow-red-900/10">

          {/* BG glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 text-red-500/5 pointer-events-none animate-[spin_20s_linear_infinite]">
            <FaFireAlt size={280} />
          </div>

          {/* Top accent */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]" />

          <div className="relative z-10">
            <div className="ff-mono text-[11px] font-bold uppercase tracking-[0.35em] text-red-500 mb-5 drop-shadow-sm">Join the fight</div>

            <h2 className="ff-syne text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight">
              Stop Preparing.<br />
              <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">Start Fighting.</span>
            </h2>

            {/* Live stats inline */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-10">
              {[
                { target: 25000, suffix: '+', label: 'Developers' },
                { target: 100000, suffix: '+', label: 'Submissions' },
                { target: 2400, suffix: '+', label: 'Problems' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="ff-syne text-3xl sm:text-4xl font-black text-white drop-shadow-md">
                    <AnimCount target={s.target} suffix={s.suffix} />
                  </div>
                  <div className="ff-mono text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>

            <Link to="/signup">
              <button className="btn-sweep inline-flex items-center justify-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white ff-mono text-sm sm:text-base font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_25px_rgba(220,38,38,0.35)] w-full sm:w-auto">
                Join the Ranks <FaArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_LINKS = {
  Platform: ['Problems', 'Contests', 'Leaderboard', 'Roadmaps', 'Pricing'],
  Company:  ['About Us', 'Careers', 'Blog', 'Privacy Policy', 'Terms'],
};
const SOCIALS = [
  { icon: <FaTwitter size={16} />, href: '#' },
  { icon: <FaGithub size={16} />,  href: '#' },
  { icon: <FaDiscord size={16} />, href: '#' },
  { icon: <FaYoutube size={16} />, href: '#' },
];

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 pt-16 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">

          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <FaFireAlt className="text-red-500" size={22} />
              <span className="ff-syne text-xl font-black text-white tracking-tighter">RANBHOOMI</span>
            </div>
            <p className="ff-inter text-sm text-zinc-400 leading-relaxed mb-6 font-medium">
              The ultimate platform for competitive programming and FAANG interview prep.
            </p>
            <div className="flex gap-2.5">
              {SOCIALS.map((s, i) => (
                <a key={i} href={s.href}
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all shadow-sm">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="ff-mono text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-300 mb-5">{heading}</h4>
              <ul className="space-y-3.5">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="ff-inter text-sm text-zinc-400 hover:text-red-400 transition-colors font-medium">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 sm:col-span-1">
            <h4 className="ff-mono text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-300 mb-5">Stay Sharp</h4>
            <p className="ff-inter text-sm text-zinc-400 mb-4 font-medium">Weekly curated problems in your inbox.</p>
            <div className="flex flex-col gap-2.5">
              <input
                type="email"
                placeholder="you@domain.com"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl ff-mono text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors shadow-inner"
              />
              <button className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500/60 text-red-400 ff-mono text-xs font-bold rounded-xl transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="ff-mono text-xs text-zinc-500 font-medium">© 2026 Ranbhoomi Inc. All rights reserved.</span>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Cookies'].map(l => (
              <a key={l} href="#" className="ff-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}