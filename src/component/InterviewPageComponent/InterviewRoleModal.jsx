import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 
import { serverUrl } from '../../App';
import { FaUserTie, FaUserGraduate, FaTimes, FaClipboard, FaCheck } from 'react-icons/fa';

function InterviewRoleModal({ isOpen, onClose }) {
  const [view, setView] = useState('select');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/interview/`,
        {},
        { withCredentials: true }
      );
      
      // Extract from the ApiResponse wrapper
      const newRoomID = data?.data?.roomID || data?.roomID;
      setRoomCode(newRoomID);
      setView('interviewer_created');
    } catch (err) {
      console.error("Create room error:", err);
      toast.error(err.response?.data?.message || "Failed to create room.");
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = (code) => {
    let roomCodeToJoin = code.trim();
    if (roomCodeToJoin.includes('/')) {
      const parts = roomCodeToJoin.split('/');
      roomCodeToJoin = parts[parts.length - 1];
    }
    if (!roomCodeToJoin) return toast.error("Please enter a valid room code.");

    handleClose(); // Reset state before navigating
    navigate(`/interview/${roomCodeToJoin}`); // Ensure this matches your Router path
  };

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
    } else {
      const input = document.createElement('input');
      input.value = roomCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    toast.success("Room Code Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setView('select');
    setRoomCode('');
    setIsLoading(false);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  // --- Strict TUF UI Styles ---
  const primaryButton = "w-full py-2.5 px-4 bg-red-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-red-500 shadow-sm flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const secondaryButton = "w-full py-2.5 px-4 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-md transition-colors duration-200 hover:bg-zinc-700 hover:text-white flex justify-center items-center gap-2";

  const renderContent = () => {
    switch (view) {
      case 'select':
        return (
          <div className="space-y-3">
            <button onClick={() => setView('interviewer')} className={primaryButton}>
              <FaUserTie className="text-sm" /> Join as Interviewer
            </button>
            <button onClick={() => setView('candidate')} className={secondaryButton}>
              <FaUserGraduate className="text-sm" /> Join as Candidate
            </button>
          </div>
        );
      case 'interviewer':
        return (
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-4 tracking-tight">Create a New Room</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Generate a unique workspace. You will have full control to select problems, run test cases, and evaluate the candidate.
            </p>
            <button onClick={handleCreateRoom} disabled={isLoading} className={primaryButton}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-zinc-300 border-t-white rounded-full animate-spin"></div>
              ) : "Generate Room Code"}
            </button>
          </div>
        );
      case 'interviewer_created':
        return (
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-2 tracking-tight">Share this Room Code:</h3>
            <div className="flex items-center p-1.5 pl-3 bg-zinc-950 border border-zinc-800 rounded-md mb-6">
              <span className="text-red-400 font-mono text-sm flex-grow truncate">{roomCode}</span>
              <button 
                onClick={copyToClipboard} 
                title="Copy Code"
                className="p-2 bg-zinc-800 rounded-md text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                {copied ? <FaCheck className="text-emerald-500" /> : <FaClipboard />}
              </button>
            </div>
            <button onClick={() => joinRoom(roomCode)} className={primaryButton}>
              Join Room Now
            </button>
          </div>
        );
      case 'candidate':
        return (
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3 tracking-tight">Join an Existing Room</h3>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Paste Room ID or URL here"
              className="w-full p-2.5 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md mb-5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-zinc-600 font-mono"
            />
            <button 
                onClick={() => joinRoom(roomCode)} 
                disabled={!roomCode.trim()} 
                className={primaryButton}
            >
              Enter Workspace
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      {/* Strict Modal Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm m-4 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            Session Setup
          </h2>
          <button 
            onClick={handleClose} 
            className="text-zinc-500 hover:text-zinc-300 transition-colors duration-200 p-1 rounded-md hover:bg-zinc-800"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="p-6">
          {renderContent()}
        </div>

      </div>
    </div>
  );
}

export default InterviewRoleModal;