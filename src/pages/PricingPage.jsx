import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaRobot, FaTrophy, FaUserNinja, FaCrown } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const PricingCard = ({ title, price, features, icon, isRecommended, onClick, userPlan }) => {
  const isCurrent = userPlan === title;
  
  return (
    <div className={`relative p-8 rounded-3xl border flex flex-col items-center transition-all duration-300 hover:-translate-y-2 ${
        isRecommended 
        ? 'border-red-600/50 bg-gradient-to-b from-red-900/20 to-zinc-950 shadow-[0_0_40px_rgba(220,38,38,0.15)]' 
        : 'border-zinc-800 bg-zinc-900/40'
    }`}>
      {isRecommended && (
        <div className="absolute -top-4 bg-red-600 text-white font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(220,38,38,0.5)]">
          Most Popular
        </div>
      )}
      
      <div className={`text-5xl mb-6 ${isRecommended ? 'text-red-500' : 'text-zinc-600'}`}>
        {icon}
      </div>

      <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide ff-syne">{title}</h3>
      <div className="mb-6 flex items-baseline ff-syne">
        {price === 0 ? (
          <span className="text-4xl font-black text-white">Free</span>
        ) : (
          <>
            <span className="text-2xl text-zinc-400 mr-1">₹</span>
            <span className="text-5xl font-black text-white">{price}</span>
            <span className="text-zinc-500 ml-1 ff-mono text-sm">/mo</span>
          </>
        )}
      </div>

      <ul className="space-y-4 mb-8 w-full ff-inter">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            {f.included ? (
              <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5"><FaCheck size={10}/></div>
            ) : (
              <div className="p-1 rounded-full bg-zinc-800 text-zinc-600 mt-0.5"><FaTimes size={10}/></div>
            )}
            <span className={!f.included ? 'text-zinc-600' : 'text-zinc-300'}>{f.text}</span>
          </li>
        ))}
      </ul>

      <button 
        onClick={onClick}
        className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all ff-mono text-sm mt-auto ${
            isCurrent 
            ? 'bg-zinc-800 text-zinc-500 cursor-default border border-zinc-700'
            : isRecommended 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]' 
                : 'bg-zinc-100 text-zinc-900 hover:bg-white'
        }`}
      >
        {isCurrent ? "Current Plan" : "View Full Details"}
      </button>
    </div>
  );
};

export default function PricingPreviewSection() {
  const { userData } = useSelector(state => state.user);
  const navigate = useNavigate();

  return (
    <div className="bg-zinc-950 text-white py-24 px-4 flex flex-col items-center border-t border-zinc-900">
      <div className="text-center mb-16 max-w-2xl">
        <div className="ff-mono text-[10px] uppercase tracking-[0.35em] text-red-500 mb-4 font-bold">
          Level Up
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight ff-syne">
          CHOOSE YOUR <span className="text-red-600 shimmer-text">WEAPON</span>
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg ff-inter">
          Whether you are a scout or a gladiator, we have the right tools to prepare you for the battleground of coding interviews.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 max-w-6xl w-full px-4">
        <PricingCard 
          title="Scout" 
          price={0} 
          icon={<FaUserNinja />}
          userPlan={userData?.subscriptionPlan || 'Scout'}
          onClick={() => navigate('/premium')}
          features={[
            { text: "3 AI Hints / Day", included: true },
            { text: "Participate in Public Contests", included: true },
            { text: "Standard Problem Set", included: true },
            { text: "Company Tags", included: false },
            { text: "Mock Interviews", included: false },
          ]}
        />
        <PricingCard 
          title="Warrior" 
          price={499} 
          icon={<FaRobot />}
          isRecommended={true}
          userPlan={userData?.subscriptionPlan || 'Scout'}
          onClick={() => navigate('/premium')}
          features={[
            { text: "Unlimited AI Assistant", included: true },
            { text: "Company Tags (Amazon/Google)", included: true },
            { text: "Premium Problem Archive", included: true },
            { text: "5 Peer Mock Interviews / Mo", included: true },
            { text: "Host Private Contests", included: false },
          ]}
        />
        <PricingCard 
          title="Gladiator" 
          price={999} 
          icon={<FaCrown />}
          userPlan={userData?.subscriptionPlan || 'Scout'}
          onClick={() => navigate('/premium')}
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
  );
}