import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App';
import { FaUserTie, FaUserGraduate, FaTimes, FaClipboard } from 'react-icons/fa';

function InterviewRoleModal({ isOpen, onClose }) {
    const [view, setView] = useState('select'); // 'select', 'interviewer', 'candidate'
    const [roomCode, setRoomCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // --- API Call to Create Room ---
    const handleCreateRoom = async () => {
        setIsLoading(true);
        try {
            const { data: session } = await axios.post(
                `${serverUrl}/api/interview/create`,
                {},
                { withCredentials: true }
            );
            setRoomCode(session.roomID);
            setView('interviewer_created'); // Show the created code
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create room.");
        } finally {
            setIsLoading(false);
        }
    };

// --- Navigation Logic ---
    const joinRoom = (code) => {
        let roomCodeToJoin = code.trim();

        // --- ADD THIS LOGIC ---
        // Check if the user pasted the full URL
        if (roomCodeToJoin.includes('/')) {
            // Split the string by '/' and get the last part
            const parts = roomCodeToJoin.split('/');
            roomCodeToJoin = parts[parts.length - 1];
        }
        // --- END OF FIX ---

        if (!roomCodeToJoin) {
            return toast.error("Please enter a valid room code.");
        }
        
        onClose(); // Close the modal
        navigate(`/interview/room/${roomCodeToJoin}`);
    };

    // --- Copy to Clipboard ---
    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomCode);
        toast.success("Room Code Copied!");
    };

    // --- Reset State on Close ---
    const handleClose = () => {
        setView('select');
        setRoomCode('');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    // --- Styles ---
    const buttonStyle = "w-full py-3 px-5 text-white font-bold rounded-lg transition-all duration-300 transform";
    const primaryButton = `${buttonStyle} bg-orange-600 hover:bg-orange-700 shadow-[0_0_20px_rgba(255,69,0,0.5)] hover:scale-105`;
    const secondaryButton = `${buttonStyle} bg-gray-600 hover:bg-gray-700 hover:scale-105`;

    // --- Render Logic ---
    const renderContent = () => {
        if (view === 'select') {
            return (
                <div className="space-y-4">
                    <button onClick={() => setView('interviewer')} className={primaryButton}>
                        <FaUserTie className="inline mr-2" /> Join as Interviewer
                    </button>
                    <button onClick={() => setView('candidate')} className={secondaryButton}>
                        <FaUserGraduate className="inline mr-2" /> Join as Candidate
                    </button>
                </div>
            );
        }

        if (view === 'interviewer') {
            return (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Create a New Room</h3>
                    <button onClick={handleCreateRoom} disabled={isLoading} className={primaryButton}>
                        {isLoading ? "Creating..." : "Generate Room Code"}
                    </button>
                </div>
            );
        }

        if (view === 'interviewer_created') {
            return (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Share this Room Code:</h3>
                    <div className="flex items-center p-3 bg-gray-900 border border-orange-700/50 rounded-lg">
                        <span className="text-orange-300 font-mono text-lg flex-grow">{roomCode}</span>
                        <button onClick={copyToClipboard} className="p-2 bg-orange-600 rounded-lg text-white hover:bg-orange-700">
                            <FaClipboard />
                        </button>
                    </div>
                    <button onClick={() => joinRoom(roomCode)} className={`${primaryButton} mt-4`}>
                        Join Room Now
                    </button>
                </div>
            );
        }

        if (view === 'candidate') {
            return (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Join an Existing Room</h3>
                    <input 
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Paste Room Code"
                        className="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-lg mb-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <button onClick={() => joinRoom(roomCode)} className={primaryButton}>
                        Join Room
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-black border border-orange-700/50 rounded-2xl shadow-[0_0_40px_rgba(255,69,0,0.3)] w-full max-w-md m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                            Join Session
                        </h2>
                        <button onClick={handleClose} className="text-gray-500 hover:text-orange-400 transition-colors">
                            <FaTimes size={24} />
                        </button>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default InterviewRoleModal;