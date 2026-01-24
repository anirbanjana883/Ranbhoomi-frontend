import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from 'framer-motion';
import { FaCode, FaTrophy, FaBrain, FaChevronDown, FaTwitter, FaGithub, FaLinkedin, FaCheck, FaRobot, FaCrown, FaUserNinja, FaFireAlt, FaDiscord, FaYoutube, FaTerminal,FaTimes } from 'react-icons/fa';

import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { serverUrl } from '../App';

// --- UTILS & ANIMATIONS ---

// 1. Mouse Spotlight Effect for Bento Grids
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  return mousePosition;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// --- COMPONENTS ---

// 2. Bento Grid Item (The "Pro" Feature Card)
const BentoItem = ({ children, className, title, icon }) => {
  const mouse = useMousePosition();
  // Simple spotlight logic would go here, simplified for React performance
  return (
    <motion.div 
      variants={fadeInUp}
      className={`relative group overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 transition-colors duration-500 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 p-8 h-full flex flex-col">
        <div className="mb-4 w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 text-xl group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="text-gray-400 text-sm leading-relaxed flex-grow">
            {children}
        </div>
      </div>
    </motion.div>
  );
};

// 3. Pricing Card (Keep your logic, improve visuals)
const PricingCard = ({ title, price, features, icon, isRecommended, onBuy, userPlan }) => {
  const isCurrent = userPlan === title;
  
  return (
    <div className={`relative p-8 rounded-2xl border flex flex-col items-center transition-all duration-300 hover:scale-105 ${
        isRecommended 
        ? 'border-orange-500 bg-gradient-to-b from-orange-900/20 to-black shadow-[0_0_30px_rgba(255,69,0,0.2)]' 
        : 'border-gray-800 bg-black/40'
    }`}>
      {isRecommended && (
        <div className="absolute -top-4 bg-orange-600 text-white font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider shadow-lg">
          Most Popular
        </div>
      )}
      
      <div className={`text-5xl mb-6 ${isRecommended ? 'text-orange-500' : 'text-gray-600'}`}>
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">{title}</h3>
      <div className="mb-6 flex items-baseline">
        <span className="text-4xl font-black text-white">₹{price}</span>
        <span className="text-gray-500 ml-1">/mo</span>
      </div>

      <ul className="space-y-4 mb-8 w-full">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            {f.included ? (
              <div className="p-1 rounded-full bg-green-500/20 text-green-500"><FaCheck size={10}/></div>
            ) : (
              <div className="p-1 rounded-full bg-gray-800 text-gray-600"><FaTimes size={10}/></div>
            )}
            <span className={!f.included ? 'text-gray-600' : 'text-gray-300'}>{f.text}</span>
          </li>
        ))}
      </ul>

      <button 
        onClick={() => onBuy(title)}
        disabled={isCurrent || price === 0}
        className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
            isCurrent 
            ? 'bg-gray-800 text-gray-500 cursor-default border border-gray-700'
            : isRecommended 
                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' 
                : 'bg-white text-black hover:bg-gray-200'
        }`}
      >
        {isCurrent ? "Active Plan" : price === 0 ? "Get Started" : "Upgrade Now"}
      </button>
    </div>
  );
};

// --- MAIN PAGE ---

const Home = () => {
  const { userData } = useSelector(state => state.user);

  // Razorpay Handler
  const handlePayment = async (planType, price) => {
    if (price === 0) return toast.info("Free plan active!");
    if (!userData) return toast.error("Log in to upgrade!");

    try {
        const { data: order } = await axios.post(`${serverUrl}/api/payment/create-order`, { planType }, { withCredentials: true });
        const options = {
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "Ranbhoomi",
            description: `Ranbhoomi ${planType}`,
            order_id: order.orderId,
            handler: async (response) => {
                try {
                    const res = await axios.post(`${serverUrl}/api/payment/verify-payment`, {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        planType: planType
                    }, { withCredentials: true });
                    if (res.data.success) {
                        toast.success(`Welcome to ${planType}!`);
                        window.location.reload(); 
                    }
                } catch (err) { toast.error("Verification failed."); }
            },
            theme: { color: "#ea580c" }
        };
        new window.Razorpay(options).open();
    } catch (err) { toast.error("Payment failed."); }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-orange-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* ================= 1. HERO SECTION (Professional & Deep) ================= */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4 border-b border-white/5 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]">
        
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Spotlights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
                    <span className="flex h-2 w-2 rounded-full bg-orange-500"></span>
                    <span className="text-xs font-medium text-gray-300 tracking-wide">V2.0 NOW LIVE</span>
                </div>

                <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
                    RAN<span className="text-orange-600">BHOOMI</span>
                </h1>

                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    The modern battleground for engineering excellence. <br className="hidden md:block"/>
                    Solve, compete, and debug your way to the top.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link to="/signup" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform">
                            Start Coding
                        </button>
                    </Link>
                    <Link to="/premium" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-8 py-4 bg-black border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
                            View Plans
                        </button>
                    </Link>
                </div>
            </motion.div>
        </div>

        {/* Stats Strip */}
        <div className="absolute bottom-0 w-full border-t border-white/5 bg-black/20 backdrop-blur-sm py-6">
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between gap-8 text-center md:text-left">
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">100K+</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Submissions</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">50+</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Partner Companies</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">99.9%</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Uptime</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">24/7</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">AI Support</span>
                </div>
            </div>
        </div>
      </section>

      {/* ================= 2. BENTO GRID FEATURES ================= */}
      <section className="py-32 px-4 bg-[#030303]">
        <div className="max-w-7xl mx-auto">
            <div className="mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Forged for <span className="text-orange-600">Performance</span>.</h2>
                <p className="text-gray-400 text-lg max-w-2xl">
                    We've dismantled the traditional LMS and rebuilt it as a high-performance engine for developers.
                </p>
            </div>

            <motion.div 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }} 
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-4 h-auto md:h-[600px]"
            >
                {/* Large Item (Span 2 cols, full height on mobile) */}
                <BentoItem 
                    className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f]"
                    title="Intelligent AI Sensei"
                    icon={<FaBrain />}
                >
                    <p className="mb-6">Forget static hints. Our AI analyzes your specific code logic, identifies the flaw in your algorithm, and nudges you toward the solution without revealing it.</p>
                    {/* Visual representation of chat */}
                    <div className="w-full h-full bg-[#050505] rounded-xl border border-white/5 p-4 flex flex-col gap-3 opacity-80">
                        <div className="self-end bg-blue-600/20 text-blue-200 px-3 py-2 rounded-lg text-xs max-w-[80%]">Why is my DP failing?</div>
                        <div className="self-start bg-orange-600/10 text-orange-200 px-3 py-2 rounded-lg text-xs max-w-[80%]">You are recalculating subproblems. Try memoizing the `fib(n-2)` call.</div>
                        <div className="self-end bg-blue-600/20 text-blue-200 px-3 py-2 rounded-lg text-xs max-w-[80%]">Fixed it! O(n) now.</div>
                    </div>
                </BentoItem>

                {/* Standard Item */}
                <BentoItem 
                    className="md:col-span-1 md:row-span-1"
                    title="Cloud IDE"
                    icon={<FaTerminal />}
                >
                    A Monaco-based editor supporting 20+ languages. Pre-configured with test runners and linting.
                </BentoItem>

                {/* Standard Item */}
                <BentoItem 
                    className="md:col-span-1 md:row-span-1"
                    title="Ranked Leagues"
                    icon={<FaTrophy />}
                >
                    Weekly contests that affect your global ELO. Climb from Iron to Challenger tier.
                </BentoItem>
            </motion.div>

            {/* Bottom Row of Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                 <BentoItem title="Mock Interviews" icon={<FaUserNinja />} className="h-64">
                    Peer-to-peer live coding sessions with video and shared whiteboard.
                 </BentoItem>
                 <BentoItem title="System Design" icon={<FaCode />} className="h-64">
                    Drag-and-drop architecture labs to prepare for HLD interviews.
                 </BentoItem>
                 <BentoItem title="Company Tags" icon={<FaCrown />} className="h-64">
                    Target specific FAANG companies with curated problem sets.
                 </BentoItem>
            </div>
        </div>
      </section>

      {/* ================= 3. PRICING ================= */}
      <section className="py-32 px-4 border-t border-white/5 bg-[#030303]">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-bold mb-4">Transparent Pricing</h2>
                <p className="text-gray-400">Invest in your career for less than the price of a coffee.</p>
            </div>

      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl w-full px-4">
        {/* SCOUT (Free) */}
        <PricingCard 
          title="Free" 
          price={0} 
          icon={<FaUserNinja />}
          userPlan={userData?.subscriptionPlan}
          onBuy={() => {}}
          features={[
            { text: "3 AI Hints / Day", included: true },
            { text: "Participate in Public Contests", included: true },
            { text: "Standard Problem Set", included: true },
            { text: "Company Tags", included: false },
            { text: "Mock Interviews", included: false },
          ]}
        />

        {/* WARRIOR */}
        <PricingCard 
          title="Warrior" 
          price={499} 
          icon={<FaRobot />}
          isRecommended={true}
          userPlan={userData?.subscriptionPlan}
          onBuy={handlePayment}
          features={[
            { text: "Unlimited AI Assistant", included: true },
            { text: "Company Tags (Amazon/Google)", included: true },
            { text: "Premium Problem Archive", included: true },
            { text: "5 Peer Mock Interviews / Mo", included: true },
            { text: "Host Private Contests", included: false },
          ]}
        />

        {/* GLADIATOR */}
        <PricingCard 
          title="Gladiator" 
          price={999} 
          icon={<FaCrown />}
          userPlan={userData?.subscriptionPlan}
          onBuy={handlePayment}
          features={[
            { text: "Everything in Warrior", included: true },
            { text: "Host Private Contests", included: true },
            { text: "Unlimited Mock Interviews", included: true },
            { text: "Video Solutions", included: true },
            { text: "Legendary Profile Badge", included: true },
          ]}
        />
      </div>
        </div>
      </section>

      {/* ================= 4. PROFESSIONAL CTA ================= */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-orange-900/40 to-black border border-orange-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <FaFireAlt size={300} />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Stop Preparing. Start Fighting.</h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto relative z-10">
                Join 25,000+ developers who have already leveled up their careers with Ranbhoomi.
            </p>
            <Link to="/signup" className="relative z-10">
                <button className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors">
                    Join the Ranks
                </button>
            </Link>
        </div>
      </section>

      {/* ================= 5. FOOTER ================= */}
      <footer className="bg-[#050505] pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                    <FaFireAlt className="text-orange-600 text-2xl" />
                    <span className="font-bold text-xl tracking-tighter">RANBHOOMI</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                    The ultimate platform for competitive programming and technical interview preparation.
                </p>
            </div>
            
            <div>
                <h4 className="font-bold text-white mb-6">Platform</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">Problems</li>
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">Contests</li>
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">Leaderboard</li>
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">Pricing</li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-white mb-6">Company</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">About Us</li>
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">Careers</li>
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">Blog</li>
                    <li className="hover:text-orange-500 cursor-pointer transition-colors">Privacy Policy</li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-white mb-6">Connect</h4>
                <div className="flex gap-4">
                    <SocialIcon icon={<FaTwitter />} />
                    <SocialIcon icon={<FaGithub />} />
                    <SocialIcon icon={<FaDiscord />} />
                    <SocialIcon icon={<FaYoutube />} />
                </div>
            </div>
        </div>
        <div className="text-center text-gray-600 text-sm pt-8 border-t border-white/5">
            &copy; 2026 Ranbhoomi Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const SocialIcon = ({ icon }) => (
    <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition-all">
        {icon}
    </a>
)

export default Home;