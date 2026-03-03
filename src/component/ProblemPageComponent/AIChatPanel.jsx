import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast"; // 🔥 Updated to hot-toast
import {
  FaPaperPlane,
  FaRobot,
  FaTimes,
  FaBolt,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";

import API from "../../api/axios.js";

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
      text: `**System Online.** I am **Bhoomi AI**.\n\nI have analyzed the problem parameters for *"${problem.title}"*. \n\nHow can I assist you with your implementation?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(null); 
  const messagesEndRef = useRef(null);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Fetch Credits on Mount
  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const { data } = await API.get(`/user/getcurrentuser`);
        
        // Handle ApiResponse wrapper
        const user = data?.data?.user || data?.data || data?.user;

        if (user) {
          const plan = user.subscriptionPlan || "Free";
          const limit = PLAN_LIMITS[plan] || 3;
          const used = user.aiUsage?.count || 0;
          
          const lastUsed = new Date(user.aiUsage?.lastUsed || Date.now()).toDateString();
          const today = new Date().toDateString();
          
          if (lastUsed !== today) {
             setCredits(limit); 
          } else {
             setCredits(Math.max(0, limit - used));
          }
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
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
      const { data } = await API.post(`/ai/ask`, {
        problemTitle: problem.title,
        problemDescription: problem.description,
        userCode: userCode,
        userQuestion: userMsg,
      });

      // Handle ApiResponse wrapper
      const responseData = data?.data || data;

      setMessages((prev) => [...prev, { role: "ai", text: responseData.reply }]);
      
      if (responseData.remaining !== undefined) setCredits(responseData.remaining);

    } catch (err) {
      const errorData = err.response?.data?.data || err.response?.data;

      if (err.response?.status === 403 && errorData?.limitReached) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "🛑 **Daily Limit Reached.**\n\nYou have exhausted your AI queries for today. Upgrade to Premium for unlimited guidance.",
          },
        ]);
        setCredits(0);
      } else {
        toast.error("AI connection failed.");
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "Connection disrupted. Please try again later." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 font-sans">
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-3.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 text-zinc-100 font-bold text-sm">
          <div className="p-1.5 bg-red-500/10 text-red-500 rounded-md border border-red-500/20">
            <FaRobot size={14}/>
          </div>
          <span className="tracking-wide">Bhoomi AI</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Credit Counter */}
          <div
            className={`flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
              credits !== null && credits > 0
                ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                : "text-red-400 border-red-500/20 bg-red-500/10"
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
            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
          >
            <FaTimes size={14}/>
          </button>
        </div>
      </div>

      {/* --- Messages Area --- */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5 custom-scrollbar bg-zinc-950">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 text-xs leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-zinc-800 text-zinc-100 rounded-xl rounded-tr-sm border border-zinc-700"
                  : "bg-zinc-900 text-zinc-300 rounded-xl rounded-tl-sm border border-zinc-800"
              }`}
            >
              {msg.role === "ai" ? (
                <div className="prose prose-invert prose-xs max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
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
            <div className="bg-zinc-900 p-3 rounded-xl rounded-tl-sm border border-zinc-800 flex items-center gap-2 shadow-sm">
              <FaRobot className="text-red-500 animate-pulse" size={14}/>
              <span className="text-zinc-400 text-xs font-medium italic tracking-wide">
                Thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <form onSubmit={handleSend} className="p-3 bg-zinc-900 border-t border-zinc-800 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a hint or logic check..."
            className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-md py-2.5 pl-3 pr-10 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-zinc-600 shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || (credits !== null && credits <= 0)}
            className="absolute right-1 top-1 bottom-1 px-3 flex items-center justify-center bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:bg-transparent disabled:text-zinc-600 transition-colors"
          >
            <FaPaperPlane size={12} />
          </button>
        </div>
        <div className="text-[9px] font-medium text-zinc-500 mt-2 text-center uppercase tracking-widest">
          AI can make mistakes. Verify before submitting.
        </div>
      </form>
    </div>
  );
};

export default AIChatPanel;