import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../../App";
import {
  FaPaperPlane,
  FaRobot,
  FaTimes,
  FaBolt,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";

// Plan Limits (Must match Backend)
const PLAN_LIMITS = {
  Free: 3,
  Warrior: 1000,
  Gladiator: 10000,
};

const AIChatPanel = ({ onClose, problem, userCode }) => {
  // 1. Setup State
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `**System Online.** I am **Bhoomi**, your Technical Commander. \n\nI have analyzed the problem parameters for *"${problem.title}"*. \n\nWhat is your implementation strategy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(null); // Starts null, but we fetch it immediately
  const messagesEndRef = useRef(null);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. NEW: Fetch Credits on Mount (Fixes the "Hidden Badge" issue)
  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/user/getcurrentuser`, {
          withCredentials: true,
        });

        if (data && data.user) {
          const user = data.user;
          // Calculate remaining credits locally based on user data
          const plan = user.subscriptionPlan || "Free";
          const limit = PLAN_LIMITS[plan] || 3;
          const used = user.aiUsage?.count || 0;
          
          // Check if usage needs reset (Frontend estimation to prevent ugly numbers)
          const lastUsed = new Date(user.aiUsage?.lastUsed || Date.now()).toDateString();
          const today = new Date().toDateString();
          
          if (lastUsed !== today) {
             setCredits(limit); // It will reset on next backend call anyway
          } else {
             setCredits(Math.max(0, limit - used));
          }
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
        // Fallback: don't show badge or show 0
      }
    };

    fetchUserCredits();
  }, []);

  // 4. Handle Sending Messages
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/ai/ask`,
        {
          problemTitle: problem.title,
          problemDescription: problem.description,
          userCode: userCode,
          userQuestion: userMsg,
        },
        { withCredentials: true }
      );

      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      
      // Update credits from the accurate backend response
      if (data.remaining !== undefined) setCredits(data.remaining);

    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.limitReached) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "🛑 **Daily Limit Reached.**\n\nYou have exhausted your spiritual energy for today. Upgrade to Premium for unlimited guidance.",
          },
        ]);
        setCredits(0);
      } else {
        toast.error("AI connection failed.");
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "Connection disrupted. The oracle is silent." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 h-[550px] bg-black/90 border border-orange-600/50 rounded-xl shadow-[0_0_40px_rgba(255,69,0,0.3)] flex flex-col z-50 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-900/40 to-black border-b border-orange-800/30">
        <div className="flex items-center gap-2 text-orange-400 font-bold">
          <div className="p-1.5 bg-orange-600/20 rounded-lg border border-orange-500/30">
            <FaRobot />
          </div>
          <span>Bhoomi AI</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Credit Counter - Now shows "..." if loading, then the number */}
          <div
            className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full border ${
              credits !== null && credits > 0
                ? "text-green-400 border-green-900 bg-green-900/20"
                : "text-red-400 border-red-900 bg-red-900/20"
            }`}
          >
            <FaBolt size={10} />
            {credits === null ? (
              <span className="animate-pulse">...</span>
            ) : (
              <span>{credits} left</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* --- Messages Area --- */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-orange-900/30 scrollbar-track-black/20">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-orange-700 text-white rounded-br-none border border-orange-600"
                  : "bg-gray-900 text-gray-200 rounded-bl-none border border-gray-700/60"
              }`}
            >
              {msg.role === "ai" ? (
                <div className="prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 p-3 rounded-xl rounded-bl-none border border-gray-700/60 flex items-center gap-2">
              <FaRobot className="text-orange-500 animate-pulse" />
              <span className="text-gray-400 text-xs italic">
                Analyzing tactics...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-black/40 border-t border-orange-900/30"
      >
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a hint or logic check..."
            className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg py-3 pl-4 pr-12 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder-gray-600"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || (credits !== null && credits <= 0)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 text-white rounded-md hover:bg-orange-500 disabled:opacity-50 disabled:bg-gray-700 transition-colors"
          >
            <FaPaperPlane size={12} />
          </button>
        </div>
        <div className="text-[10px] text-gray-600 mt-2 text-center">
          Bhoomi AI can make mistakes. Use your own judgment, warrior.
        </div>
      </form>
    </div>
  );
};

export default AIChatPanel;