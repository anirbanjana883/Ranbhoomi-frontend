import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; 
import { FaUsers, FaRobot, FaCode, FaArrowLeft } from 'react-icons/fa';
import InterviewRoleModal from '../../component/InterviewPageComponent/InterviewRoleModal'; 

function InterviewLobby() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // --- Strict TUF Design System Styles ---
    const cardStyle = `
        relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden
        hover:border-zinc-700 transition-colors duration-200
        p-8 flex flex-col items-start cursor-pointer group
    `;

    const primaryButtonStyle = `
        w-full mt-6 bg-red-600 text-white font-semibold rounded-md py-2.5 px-4 
        transition-colors hover:bg-red-500 shadow-sm 
        flex justify-center items-center gap-2
    `;
    
    const disabledButtonStyle = `
        w-full mt-6 bg-zinc-800 border border-zinc-800 text-zinc-500 
        font-semibold rounded-md py-2.5 px-4 cursor-not-allowed
        flex justify-center items-center gap-2
    `;

    return (
        <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans">
            
            {/* ======================= HEADER WITH BACK BUTTON ======================= */}
            <header className="shrink-0 h-14 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 flex items-center shadow-sm">
                <button
                    onClick={() => navigate("/")} 
                    className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
                >
                    <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="uppercase hidden sm:inline">Back</span>
                </button>

                <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block mx-4" />

                <div className="min-w-0 flex flex-col justify-center">
                    <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
                        Ranbhoomi
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-red-500 leading-none mt-1 hidden sm:block">
                        Interview Workspace
                    </p>
                </div>
            </header>

            {/* ======================= MAIN CONTENT ======================= */}
            <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl w-full mx-auto">
                    
                    {/* Header Section */}
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black text-zinc-100 tracking-tight mb-3">
                            Interview <span className="text-red-500">Arena</span>
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base max-w-2xl">
                            Prepare for your next technical round. Choose between a live peer-to-peer coding interview or practice against an AI bot.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* --- Card 1: Remote Interview --- */}
                        <div className={cardStyle} onClick={() => setIsModalOpen(true)}>
                            {/* Flat Accent Top Border */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-red-600 transition-colors duration-200"></div>
                            
                            {/* Structurally Framed Icon */}
                            <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-zinc-700 transition-colors duration-200">
                                <FaUsers className="text-xl text-red-500" />
                            </div>
                            
                            <h2 className="text-xl font-bold text-zinc-100 tracking-tight mb-2">
                                Remote Interview
                            </h2>
                            <p className="text-zinc-400 text-sm leading-relaxed flex-1">
                                Create a real-time collaborative workspace. Invite a candidate, share code, run test cases, and evaluate performance using our FAANG-style IDE.
                            </p>
                            
                            <button className={primaryButtonStyle}>
                                <FaCode /> Create Workspace
                            </button>
                        </div>

                        {/* --- Card 2: AI Mock Interview (Placeholder) --- */}
                        <div className={cardStyle} onClick={() => toast.info("AI Mock Interview is currently in development!")}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-zinc-600 transition-colors duration-200"></div>
                            
                            {/* Structurally Framed Icon */}
                            <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center mb-6 border border-zinc-800">
                                <FaRobot className="text-xl text-zinc-500" />
                            </div>
                            
                            <h2 className="text-xl font-bold text-zinc-100 tracking-tight mb-2">
                                AI Mock Interview
                            </h2>
                            <p className="text-zinc-400 text-sm leading-relaxed flex-1">
                                Practice data structures and algorithms with an AI interviewer. Receive instant feedback on your code, time complexity, and communication skills.
                            </p>
                            
                            <button className={disabledButtonStyle} disabled>
                                Coming Soon
                            </button>
                        </div>

                    </div>
                </div>
            </main>

            {/* --- The Role Modal --- */}
            <InterviewRoleModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
}

export default InterviewLobby;