import React from "react";
import { FaLock, FaCrown, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PremiumLock = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8 bg-black relative overflow-hidden rounded-xl border border-gray-800">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-600/20 blur-[100px] rounded-full"></div>

      <div className="relative z-10 bg-gray-900/60 backdrop-blur-xl p-10 rounded-2xl border border-orange-500/30 shadow-[0_0_40px_rgba(234,88,12,0.15)] max-w-md">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-600/40">
          <FaLock className="text-white text-3xl" />
        </div>

        {/* Text */}
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
          PREMIUM <span className="text-orange-500">CONTENT</span>
        </h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          This challenge is reserved for our <strong>Warrior</strong> and <strong>Gladiator</strong> tiers. Unlock it to master advanced concepts.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => navigate("/premium")}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <FaCrown className="text-yellow-300" /> Unlock Access
          </button>
          
          <button 
            onClick={() => navigate("/practice")}
            className="w-full py-3 bg-transparent border border-gray-700 text-gray-400 font-medium rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
          >
            Back to Practice
          </button>
        </div>

      </div>
    </div>
  );
};

export default PremiumLock;