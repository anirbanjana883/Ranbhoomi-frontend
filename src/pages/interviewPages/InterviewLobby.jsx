import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUsers, FaRobot } from 'react-icons/fa';
import InterviewRoleModal from '../../component/InterviewPageComponent/InterviewRoleModal'; // We will create this

function InterviewLobby() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // --- Ranbhoomi Styles ---
    const cardStyle = `
        bg-black border border-orange-700/40 rounded-xl 
        shadow-[0_0_20px_rgba(255,69,0,0.2)] 
        hover:border-orange-600/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.3)] 
        transition-all duration-300 transform hover:-translate-y-1
        p-6 flex flex-col items-center text-center cursor-pointer
    `;

    const buttonStyle = `
        w-full py-2.5 px-5 mt-4 bg-orange-600 text-white font-bold rounded-lg
        shadow-[0_0_20px_rgba(255,69,0,0.5)] 
        transition-all duration-300 transform 
        hover:bg-orange-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.7)] hover:scale-105
    `;
    
    const comingSoonButtonStyle = `
        w-full py-2.5 px-5 mt-4 bg-gray-700 text-gray-300 font-bold rounded-lg
        shadow-none transition-all duration-300 transform 
        hover:bg-gray-600 hover:scale-105
    `;

    return (
        <>
            <div className="min-h-screen bg-black text-gray-300 pt-32 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-black text-white mb-8 text-center
                                   [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]">
                        Interview Arena
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* --- Card 1: Remote Interview --- */}
                        <div className={cardStyle} onClick={() => setIsModalOpen(true)}>
                            <FaUsers className="text-5xl text-orange-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                Remote Interview
                            </h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Join a 1-on-1 session as an Interviewer or Candidate.
                            </p>
                            <button className={buttonStyle}>
                                Start Session
                            </button>
                        </div>

                        {/* --- Card 2: AI Mock Interview (Placeholder) --- */}
                        <div className={cardStyle} onClick={() => toast.info("AI Mock Interview is coming soon!")}>
                            <FaRobot className="text-5xl text-orange-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2 [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
                                AI Mock Interview
                            </h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Practice your skills against an advanced AI interviewer.
                            </p>
                            <button className={buttonStyle}>
                                Coming Soon ...
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- The New Modal --- */}
            <InterviewRoleModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
}

export default InterviewLobby;