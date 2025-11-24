import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../../App";
import {
  FaPaperPlane,
  FaRobot,
  FaTimes,
  FaEraser,
  FaBolt,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";

const AIChatPanel = ({ onClose, problem, userCode }) => {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Greetings, Warrior. I am **Bhoomi**. I have analyzed the battlefield ("${problem.title}"). \n\nWhat is your strategy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(3);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          {/* Credit Counter */}
          <div
            className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full border ${
              credits > 0
                ? "text-green-400 border-green-900 bg-green-900/20"
                : "text-red-400 border-red-900 bg-red-900/20"
            }`}
          >
            <FaBolt size={10} />
            <span>{credits} left</span>
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
            disabled={loading || !input.trim() || credits <= 0}
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
