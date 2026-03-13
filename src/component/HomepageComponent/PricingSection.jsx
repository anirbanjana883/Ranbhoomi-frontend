import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaCheck, FaTimes, FaBolt, FaCrown,
  FaUserNinja, FaArrowRight, FaShieldAlt,
  FaStar, FaRocket
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App';

/* ─── Styles ─────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Syne:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');

  .ff-mono  { font-family: 'JetBrains Mono', monospace; }
  .ff-syne  { font-family: 'Syne', sans-serif; }
  .ff-inter { font-family: 'Inter', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerMove {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes orbFloat {
    0%,100% { transform: translateY(0) scale(1); }
    50%     { transform: translateY(-20px) scale(1.02); }
  }

  .fu { animation: fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) both; }
  .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.15s; }
  .d3 { animation-delay: 0.25s; } .d4 { animation-delay: 0.35s; }
  .d5 { animation-delay: 0.45s; }

  .shimmer-name {
    background: linear-gradient(90deg, #fff 0%, #fff 25%, #ef4444 40%, #ff6666 50%, #ef4444 60%, #fff 75%, #fff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerMove 3s linear infinite;
  }

  .card-flip-container { perspective: 1200px; }
  .card-flip-inner {
    position: relative;
    width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.75s cubic-bezier(0.4, 0.2, 0.2, 1);
  }
  .card-flip-container:hover .card-flip-inner,
  .card-flip-container.flipped .card-flip-inner {
    transform: rotateY(180deg);
  }
  
  /* 3D Flip Card Fix: Stop invisible faces from stealing clicks! */
  .card-face {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 1.5rem;
    overflow: hidden;
  }
  .card-front {
    transform: rotateY(0deg);
    z-index: 2;
  }
  .card-back {
    transform: rotateY(180deg);
    z-index: 1;
    pointer-events: none; /* Ignore clicks while hidden */
  }
  .card-flip-container:hover .card-front,
  .card-flip-container.flipped .card-front {
    pointer-events: none; /* Ignore clicks on front when flipped */
  }
  .card-flip-container:hover .card-back,
  .card-flip-container.flipped .card-back {
    pointer-events: auto; /* Enable clicks on back when flipped */
    z-index: 3;
  }

  .grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 36px 36px;
  }
  .orb-float { animation: orbFloat 6s ease-in-out infinite; }

  ::-webkit-scrollbar       { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
`;

/* ─── Plan data ───────────────────────────────────────────────────── */
const PLANS = [
  {
    key:   'Scout',
    price: 0,
    icon:  <FaUserNinja size={32} />,
    tagline: 'Start your journey.',
    frontGrad: 'from-zinc-900 via-zinc-950 to-black',
    accentColor: 'zinc',
    frontTextColor: 'text-zinc-300',
    borderColor: 'border-zinc-800',
    glowColor: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]',
    badgeText: null,
    features: [
      { text: '3 AI Hints / Day',         ok: true },
      { text: 'Public Contests',          ok: true },
      { text: 'Standard Problem Set',     ok: true },
      { text: 'Basic Progress Tracking',  ok: true },
      { text: 'Company Tags',             ok: false },
      { text: 'Video Solutions',          ok: false },
      { text: 'Mock Interviews',          ok: false },
      { text: 'Host Private Contests',    ok: false },
      { text: 'Legendary Profile Badge',  ok: false },
    ],
    perks: ['Community access', 'Public leaderboard', 'Basic analytics'],
  },
  {
    key:   'Warrior',
    price: 499,
    icon:  <FaBolt size={32} />,
    tagline: 'For serious grinders.',
    frontGrad: 'from-red-900 via-zinc-950 to-black',
    accentColor: 'red',
    frontTextColor: 'text-red-100',
    borderColor: 'border-red-600/50',
    glowColor: 'shadow-[0_0_50px_rgba(220,38,38,0.15)] hover:shadow-[0_0_60px_rgba(220,38,38,0.25)]',
    badgeText: '⚡ MOST POPULAR',
    recommended: true,
    features: [
      { text: 'Unlimited AI Assistant',   ok: true },
      { text: 'Company Tags (FAANG)',     ok: true },
      { text: 'Premium Problem Archive',  ok: true },
      { text: 'Advanced Analytics',       ok: true },
      { text: '5 Mock Interviews / Month',ok: true },
      { text: 'Video Solutions',          ok: false },
      { text: 'Host Private Contests',    ok: false },
      { text: 'Unlimited Mock Interviews',ok: false },
      { text: 'Legendary Profile Badge',  ok: false },
    ],
    perks: ['Priority queue', 'ELO boost events', 'Warrior badge'],
  },
  {
    key:   'Gladiator',
    price: 999,
    icon:  <FaCrown size={32} />,
    tagline: 'No compromises.',
    frontGrad: 'from-amber-900 via-zinc-950 to-black',
    accentColor: 'amber',
    frontTextColor: 'text-amber-100',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-[0_0_50px_rgba(245,158,11,0.15)] hover:shadow-[0_0_60px_rgba(245,158,11,0.25)]',
    badgeText: '👑 LEGENDARY',
    features: [
      { text: 'Everything in Warrior',    ok: true },
      { text: 'Host Private Contests',    ok: true },
      { text: 'Unlimited Mock Interviews',ok: true },
      { text: 'Video Solutions',          ok: true },
      { text: 'Legendary Profile Badge',  ok: true },
      { text: 'Priority Support',         ok: true },
      { text: 'Early Feature Access',     ok: true },
      { text: 'Custom Profile Theme',     ok: true },
      { text: 'Export Progress Report',   ok: true },
    ],
    perks: ['Gladiator ring', 'Private lobby', 'All-access pass'],
  },
];

/* ─── Comparison table data ───────────────────────────────────────── */
const COMPARE_ROWS = [
  { label: 'AI Hints',         scout: '3/day',     warrior: 'Unlimited', gladiator: 'Unlimited' },
  { label: 'Problems',         scout: 'Standard',  warrior: 'Premium',   gladiator: 'All' },
  { label: 'Company Tags',     scout: '✗',         warrior: 'FAANG',     gladiator: 'FAANG+' },
  { label: 'Mock Interviews',  scout: '✗',         warrior: '5/mo',      gladiator: 'Unlimited' },
  { label: 'Video Solutions',  scout: '✗',         warrior: '✗',         gladiator: '✓' },
  { label: 'Private Contests', scout: '✗',         warrior: '✗',         gladiator: '✓' },
  { label: 'Profile Badge',    scout: '—',         warrior: 'Warrior',   gladiator: 'Legendary' },
  { label: 'Support',          scout: 'Community', warrior: 'Email',     gladiator: 'Priority' },
];

/* ─── Flip card ───────────────────────────────────────────────────── */
function PricingFlipCard({ plan, userPlan, onBuy, animDelay }) {
  const isCurrent = userPlan === plan.key;
  
  // React state ensures mobile users can tap to flip reliably
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className={`fu ${animDelay} card-flip-container h-[500px] cursor-pointer group ${flipped ? 'flipped' : ''}`}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="card-flip-inner">

        {/* ── FRONT ── */}
        <div className={`card-face card-front border ${plan.borderColor} ${plan.glowColor} bg-gradient-to-br ${plan.frontGrad} transition-shadow duration-500`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

          {plan.badgeText && (
            <div className={`absolute top-5 left-1/2 -translate-x-1/2 ff-mono text-[10px] sm:text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full z-10 whitespace-nowrap ${
              plan.recommended ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
            }`}>
              {plan.badgeText}
            </div>
          )}

          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 sm:px-8 text-center gap-6">
  <div className={`w-28 h-28 rounded-full flex items-center justify-center bg-zinc-950/50 backdrop-blur-md border border-white/10 shadow-xl ${plan.frontTextColor}`}>
    {plan.icon}
  </div>

  <div className="w-full flex flex-col items-center">
    <h3
      className={`ff-syne text-3xl sm:text-4xl xl:text-3xl font-black uppercase text-center wrap-break-word ${plan.frontTextColor}`}
    >
      {plan.key}
    </h3>
    <p className={`ff-mono text-xs sm:text-sm mt-2 opacity-70 text-center ${plan.frontTextColor}`}>
      {plan.tagline}
    </p>
  </div>

  <div className={`ff-syne font-black text-center ${plan.frontTextColor}`}>
    {plan.price === 0 ? (
      <span className="text-4xl">Free</span>
    ) : (
      <div className="flex items-baseline gap-1 justify-center">
        <span className="text-xl opacity-70">₹</span>
        <span className="text-4xl xl:text-5xl">{plan.price}</span>
        <span className="text-sm xl:text-lg opacity-60 ff-mono">/mo</span>
      </div>
    )}
  </div>

  <div className="flex gap-2 flex-wrap justify-center mt-2">
    {plan.perks.map((p) => (
      <span
        key={p}
        className={`ff-mono text-[9px] sm:text-[10px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 ${plan.frontTextColor} opacity-90`}
      >
        {p}
      </span>
    ))}
  </div>
</div>


          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 ff-mono text-[10px] sm:text-xs opacity-50 group-hover:opacity-100 transition-opacity text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-md whitespace-nowrap">
            <span>Click/Hover to explore</span>
            <FaArrowRight size={10} className="animate-bounce" />
          </div>
        </div>

        {/* ── BACK ── */}
        <div className={`card-face card-back border ${plan.borderColor} bg-zinc-950 flex flex-col shadow-2xl`}>
          <div className={`px-6 pt-8 pb-5 border-b border-zinc-800/80 bg-gradient-to-r ${
            plan.key === 'Scout'    ? 'from-zinc-900 to-transparent' :
            plan.key === 'Warrior'  ? 'from-red-950/40 to-transparent' :
                                      'from-amber-950/40 to-transparent'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                plan.key === 'Scout'    ? 'bg-zinc-800 border border-zinc-700 text-zinc-400' :
                plan.key === 'Warrior'  ? 'bg-red-600/20 border border-red-600/30 text-red-400' :
                                          'bg-amber-500/20 border border-amber-500/30 text-amber-400'
              }`}>
                {React.cloneElement(plan.icon, { size: 20 })}
              </div>
              <div className="min-w-0 flex-1">
                <div className="ff-syne text-xl font-black text-zinc-100 truncate">{plan.key}</div>
                <div className="ff-mono text-[10px] sm:text-xs text-zinc-500 truncate">{plan.tagline}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 px-5 lg:px-4 xl:px-6 py-5 overflow-y-auto space-y-3.5 custom-scrollbar">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                {f.ok
                  ? <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <FaCheck size={9} className="text-emerald-500" />
                    </div>
                  : <div className="w-5 h-5 rounded-full bg-zinc-800/50 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      <FaTimes size={8} className="text-zinc-600" />
                    </div>
                }
                <span className={`ff-inter text-sm sm:text-[15px] lg:text-sm leading-tight ${f.ok ? 'text-zinc-200' : 'text-zinc-600'}`}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>

          <div className="p-6 bg-zinc-900/30 border-t border-zinc-800/50">
            <button
              onClick={(e) => { 
                e.stopPropagation(); // Stops the card from flipping back when you click!
                onBuy(plan.key, plan.price); 
              }}
              disabled={isCurrent || plan.price === 0}
              className={`w-full py-4 rounded-xl ff-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] relative z-50 ${
                isCurrent
                  ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
                  : plan.price === 0
                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-default'
                    : plan.key === 'Warrior'
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              }`}
            >
              {isCurrent
                ? '✓ Current Plan'
                : plan.price === 0
                  ? 'Active Default'
                  : <><FaRocket size={14} /> Upgrade to {plan.key}</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Comparison table ────────────────────────────────────────────── */
function ComparisonTable({ vis }) {
  return (
    <div className={`mt-24 ${vis ? 'fu d3' : 'opacity-0'}`}>
      <div className="ff-mono text-[10px] uppercase tracking-[0.35em] text-red-600 mb-3 text-center">Full Breakdown</div>
      <h3 className="ff-syne text-3xl sm:text-4xl font-black text-zinc-100 text-center mb-10">Compare Features</h3>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800/60 shadow-2xl bg-zinc-900/20 backdrop-blur-sm">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="px-6 py-5 text-left ff-mono text-xs uppercase tracking-widest text-zinc-400">Feature</th>
              <th className="px-6 py-5 text-center ff-mono text-xs uppercase tracking-widest text-zinc-400">Scout</th>
              <th className="px-6 py-5 text-center ff-mono text-xs uppercase tracking-widest text-red-500 bg-red-950/20">Warrior</th>
              <th className="px-6 py-5 text-center ff-mono text-xs uppercase tracking-widest text-amber-500 bg-amber-950/20">Gladiator</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, i) => (
              <tr key={i} className={`border-b border-zinc-800/30 ${i % 2 === 0 ? 'bg-zinc-900/10' : 'bg-transparent'} hover:bg-zinc-800/30 transition-colors`}>
                <td className="px-6 py-4 ff-inter text-sm font-medium text-zinc-300">{row.label}</td>
                <td className="px-6 py-4 text-center ff-mono text-sm text-zinc-500">{row.scout}</td>
                <td className="px-6 py-4 text-center ff-mono text-sm font-semibold text-red-400 bg-red-950/10">{row.warrior}</td>
                <td className="px-6 py-4 text-center ff-mono text-sm font-semibold text-amber-400 bg-amber-950/10">{row.gladiator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── FAQs ────────────────────────────────────────────────────────── */
const FAQS = [
  { q: 'Can I switch plans anytime?',             a: 'Yes. Upgrades take effect immediately. Downgrades activate on your next billing cycle.' },
  { q: 'Is there a free trial for paid plans?',   a: 'No trial, but the Scout plan is permanently free — try everything before committing.' },
  { q: 'What payment methods are accepted?',      a: 'All major cards, UPI, net banking, and wallets via Razorpay.' },
  { q: 'Will my progress carry over on upgrade?', a: 'Absolutely. All your solved problems, ratings, and history persist across all plans.' },
];

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${open ? 'border-red-600/40 bg-zinc-900/50' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="ff-inter text-[15px] font-semibold text-zinc-200">{faq.q}</span>
        <span className={`ff-mono text-red-500 text-xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-5 ff-inter text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-4">
          {faq.a}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────────── */
export default function PremiumPage() {
  const { userData } = useSelector(s => s.user);
  const navigate = useNavigate();
  const [sectionVis, setSectionVis] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSectionVis(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Helper function to force load the Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planType, price) => {
    if (price === 0) return;
    if (!userData) {
      toast.error('Log in to upgrade!');
      return;
    }

    // Force load the Razorpay checkout script dynamically
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      const { data: order } = await axios.post(
        `${serverUrl}/api/payment/create-order`,
        { planType },
        { withCredentials: true }
      );
      
      const options = {
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency || 'INR',
        name:        'Ranbhoomi',
        description: `Ranbhoomi ${planType}`,
        order_id:    order.orderId,
        handler: async (response) => {
          try {
            const res = await axios.post(
              `${serverUrl}/api/payment/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType: planType
              },
              { withCredentials: true }
            );
            if (res.data.success) {
              toast.success(`⚔️ Welcome to ${planType}!`);
              window.location.reload();
            }
          } catch { toast.error('Verification failed on the server.'); }
        },
        theme: { color: '#dc2626' },
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
          toast.error(response.error.description || "Payment Failed");
      });
      rzp.open();
      
    } catch (err) { 
      console.error("Order creation failed:", err);
      toast.error('Could not initiate payment. Check console for details.'); 
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ff-inter bg-zinc-950 text-zinc-100 min-h-screen overflow-x-hidden relative">

        {/* ── Background ── */}
        <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none z-0" />
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-red-700/10 rounded-full blur-[120px] pointer-events-none orb-float z-0" />
        <div className="fixed top-1/2 right-1/4 w-[300px] h-[300px] bg-amber-700/10 rounded-full blur-[100px] pointer-events-none z-0" />

        {/* ── TOP NAV BAR (Fixed) ── */}
        <header className="fixed top-0 left-0 right-0 h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 z-50 flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
            >
              <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="uppercase hidden sm:inline">Home</span>
            </button>
  
            <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
  
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
                Ranbhoomi Plans
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-500 leading-none mt-1 hidden sm:block">
                Upgrade To Get Personalized learning
              </p>
            </div>
          </div>
        </header>

        {/* ── Main Content Container ── */}
        <div className="relative z-10 pt-28 pb-16">
          
          {/* ════════════════════════════════════════
              PAGE HERO
          ════════════════════════════════════════ */}
          <div className="px-4 sm:px-6 text-center mb-16">
            <div className="max-w-3xl mx-auto">
              <div className="fu d1 ff-mono text-[10px] sm:text-xs uppercase tracking-[0.35em] text-red-500 mb-4 font-bold">
                Choose Your Weapon
              </div>
              <h1 className="fu d2 ff-syne font-black leading-tight mb-6">
                <span className="shimmer-name" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
                  RANBHOOMI
                </span>
                <br />
                <span className="text-zinc-100 text-3xl sm:text-4xl font-bold">
                  Premium Plans
                </span>
              </h1>
              <p className="fu d3 ff-inter text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Whether you're starting out or gunning for FAANG, we have the toolkit to get you there. Hover over the cards to see full details.
              </p>

              {userData && (
                <div className="fu d4 mt-8 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-lg ff-mono text-xs sm:text-sm text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Currently on: <span className="text-zinc-200 font-bold ml-1 uppercase">{userData.subscriptionPlan || 'Scout'}</span>
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════
              FLIP CARDS
          ════════════════════════════════════════ */}
          <div ref={sectionRef} className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {PLANS.map((plan, i) => (
                <PricingFlipCard
                  key={plan.key}
                  plan={plan}
                  userPlan={userData?.subscriptionPlan || 'Scout'}
                  onBuy={handlePayment}
                  animDelay={`d${i + 2}`}
                />
              ))}
            </div>

            {/* Trust badges */}
            <div className={`mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 ${sectionVis ? 'fu d5' : 'opacity-0'}`}>
              {[
                { icon: <FaShieldAlt size={16} />, text: 'Secure via Razorpay' },
                { icon: <FaStar size={16} />,      text: 'Cancel anytime' },
                { icon: <FaBolt size={16} />,      text: 'Instant activation' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2.5 ff-mono text-xs sm:text-sm text-zinc-500 font-medium bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800/50">
                  <span className="text-zinc-600">{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════
              COMPARISON TABLE
          ════════════════════════════════════════ */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
            <ComparisonTable vis={sectionVis} />
          </div>

          {/* ════════════════════════════════════════
              FAQs
          ════════════════════════════════════════ */}
          <div className={`max-w-3xl mx-auto px-4 sm:px-6 pb-32 ${sectionVis ? 'fu d4' : 'opacity-0'}`}>
            <div className="ff-mono text-[10px] uppercase tracking-[0.35em] text-red-600 mb-3 text-center">FAQs</div>
            <h3 className="ff-syne text-3xl sm:text-4xl font-black text-zinc-100 text-center mb-10">Common Questions</h3>
            <div className="space-y-4">
              {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}
            </div>
          </div>

          {/* ════════════════════════════════════════
              BOTTOM CTA STRIP
          ════════════════════════════════════════ */}
          <div className="border-t border-zinc-800/50 bg-gradient-to-b from-zinc-900/30 to-zinc-950 py-16 px-4 sm:px-6 mt-10">
            <div className="max-w-2xl mx-auto text-center">
              <div className="ff-syne text-3xl font-black text-zinc-100 mb-4">
                Still on the fence?
              </div>
              <p className="ff-inter text-base text-zinc-400 mb-8 max-w-md mx-auto">
                Start with the free Scout plan — no credit card required. Upgrade whenever you're ready to dominate.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/practice')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white ff-mono text-sm font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                  Start Practicing <FaArrowRight size={12} />
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 ff-mono text-sm font-semibold rounded-xl transition-all"
                >
                  <FaArrowLeft size={12} /> Go Back
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}