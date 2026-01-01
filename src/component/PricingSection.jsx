import React from "react";
import { FaCheck, FaTimes, FaBolt, FaCrown, FaUserNinja, FaArrowRight } from "react-icons/fa";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";

const PricingCard = ({ title, price, features, icon, isRecommended, isLegendary, onBuy, currentPlan, user }) => {
  const isCurrent = currentPlan === title;

  // --- THEMES & GRADIENTS ---
  let theme = {
    frontGradient: "from-gray-900 via-gray-800 to-black",
    backBg: "bg-gray-900",
    iconColor: "text-gray-400",
    glow: "shadow-gray-900/50",
    button: "bg-gray-700 hover:bg-gray-600",
    border: "border-gray-700"
  };

  if (isRecommended) { // Warrior (Fire/Orange)
    theme = {
      frontGradient: "from-orange-600 via-red-600 to-red-900",
      backBg: "bg-gray-900",
      iconColor: "text-orange-500",
      glow: "shadow-orange-500/40",
      button: "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500",
      border: "border-orange-500/50"
    };
  }

  if (isLegendary) { // Gladiator (Gold/Yellow)
    theme = {
      frontGradient: "from-yellow-400 via-yellow-600 to-amber-700",
      backBg: "bg-black",
      iconColor: "text-yellow-400",
      glow: "shadow-yellow-500/50",
      button: "bg-gradient-to-r from-yellow-400 to-amber-600 hover:from-yellow-300 hover:to-amber-500 text-black font-bold",
      border: "border-yellow-500/50"
    };
  }

  return (
    // MAIN CONTAINER (PERSPECTIVE)
    <div className="group w-full h-[500px] [perspective:1000px]">
      
      {/* INNER CARD (TRANSFORM WRAPPER) */}
      <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] rounded-3xl shadow-2xl ${theme.glow}`}>
        
        {/* ================= FRONT FACE (THE "IMAGE") ================= */}
        <div className={`absolute inset-0 w-full h-full rounded-3xl [backface-visibility:hidden] overflow-hidden border ${theme.border} flex flex-col items-center justify-center bg-gradient-to-br ${theme.frontGradient}`}>
          
          {/* Animated Background Noise/Texture */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          {/* Huge Icon */}
          <div className="relative z-10 p-6 rounded-full bg-white/10 backdrop-blur-md mb-6 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <span className="text-6xl text-white drop-shadow-lg">{icon}</span>
          </div>

          {/* Title */}
          <h3 className="relative z-10 text-4xl font-black text-white uppercase tracking-widest drop-shadow-md">
            {title}
          </h3>
          
          {/* Price Preview */}
          <p className="relative z-10 text-white/80 mt-2 text-lg font-mono">
             ₹{price}/mo
          </p>

          {/* Hover Hint */}
          <div className="absolute bottom-8 flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest animate-bounce">
            View Details <FaArrowRight />
          </div>
        </div>


        {/* ================= BACK FACE (THE DETAILS) ================= */}
        <div className={`absolute inset-0 w-full h-full rounded-3xl [backface-visibility:hidden] [transform:rotateY(180deg)] border ${theme.border} ${theme.backBg} p-8 flex flex-col items-center`}>
          
          {/* Header */}
          <div className="text-center mb-6">
             <div className={`inline-block p-3 rounded-full bg-white/5 mb-2 ${theme.iconColor}`}>
                {icon}
             </div>
             <h3 className="text-2xl font-bold text-white uppercase">{title}</h3>
             <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-black text-white">₹{price}</span>
                <span className="text-gray-500 text-sm">/mo</span>
             </div>
          </div>

          {/* Features List */}
          <ul className="space-y-3 mb-8 w-full flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
            {features.map((feat, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className={`mt-0.5 p-1 rounded-full ${feat.included ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-600"}`}>
                  {feat.included ? <FaCheck size={9} /> : <FaTimes size={9} />}
                </div>
                <span className={feat.included ? "text-gray-200" : "text-gray-600 line-through"}>
                  {feat.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Action Button */}
          <button
            onClick={() => onBuy(title)}
            disabled={isCurrent || (price === 0 && !user)}
            className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-all transform active:scale-95 shadow-lg ${theme.button} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isCurrent ? "Current Plan" : price === 0 ? "Get Started" : "Upgrade Now"}
          </button>

        </div>

      </div>
    </div>
  );
};

// --- MAIN SECTION COMPONENT ---
const PricingSection = () => {
  const { userData } = useSelector((state) => state.user);

  const handlePayment = async (planType) => {
    if (!userData) return toast.error("Login to upgrade your arsenal!");

    try {
      const { data: order } = await axios.post(
        `${serverUrl}/api/payment/create-order`,
        { planType },
        { withCredentials: true }
      );

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: `Ranbhoomi ${planType}`,
        description: `Upgrade to ${planType}`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const verify = await axios.post(
              `${serverUrl}/api/payment/verify-payment`,
              { ...response, planType },
              { withCredentials: true }
            );
            if (verify.data.success) {
              toast.success(`Welcome to the ${planType} Arena!`);
              window.location.reload();
            }
          } catch (err) {
            toast.error("Verification Failed");
          }
        },
        theme: { color: "#ea580c" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Payment initiation failed");
    }
  };

  return (
    <section id="pricing" className="py-24 px-4 relative z-10 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">
            CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">WEAPON</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Whether you are a scout or a gladiator, we have the tools to prepare you for the coding battlefield.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          
          {/* 1. SCOUT (Stealth/Dark) */}
          <PricingCard
            title="Scout"
            price={0}
            icon={<FaUserNinja />}
            user={userData}
            currentPlan={userData?.subscriptionPlan}
            onBuy={() => {}}
            features={[
              { text: "3 AI Hints / Day", included: true },
              { text: "Public Contests", included: true },
              { text: "Standard Problems", included: true },
              { text: "Company Tags", included: false },
              { text: "Video Solutions", included: false },
            ]}
          />

          {/* 2. WARRIOR (Fire/Magma) */}
          <PricingCard
            title="Warrior"
            price={499}
            isRecommended={true}
            icon={<FaBolt />}
            user={userData}
            currentPlan={userData?.subscriptionPlan}
            onBuy={handlePayment}
            features={[
              { text: "Unlimited AI Assistant", included: true },
              { text: "Company Tags (FAANG)", included: true },
              { text: "Premium Problems", included: true },
              { text: "5 Mock Interviews/mo", included: true },
              { text: "Host Private Contests", included: false },
            ]}
          />

          {/* 3. GLADIATOR (Gold/Legendary) */}
          <PricingCard
            title="Gladiator"
            price={999}
            isLegendary={true}
            icon={<FaCrown />}
            user={userData}
            currentPlan={userData?.subscriptionPlan}
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
  );
};

export default PricingSection;