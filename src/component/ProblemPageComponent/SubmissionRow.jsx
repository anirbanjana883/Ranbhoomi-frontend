import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function SubmissionRow({ submission }) {
    // Check status for styling

    if (!submission) {
    return (
      <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-500 italic text-sm">
        No submission data available
      </div>
    );
  }

  // Safely read fields
    // const status = submission.status || "Unknown";
    const isAccepted = submission.status === 'Accepted';
    const statusColor = isAccepted 
        ? 'text-green-400 border-green-700/50 [text-shadow:0_0_8px_rgba(0,255,0,0.4)]'
        : 'text-red-400 border-red-700/50 [text-shadow:0_0_8px_rgba(255,0,0,0.4)]';
    const statusIcon = isAccepted ? <FaCheckCircle /> : <FaTimesCircle />;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 
                       bg-gray-950/50 border border-gray-700/50 rounded-lg mb-2 
                       transition-all hover:bg-gray-900 hover:border-gray-600">
            
            {/* Left Side: Status */}
            <div className={`flex items-center gap-2 text-sm font-semibold ${statusColor}`}>
                {statusIcon}
                <span>{submission.status}</span>
            </div>
            
            {/* Right Side: Language & Time */}
            {/* Stacks on mobile, aligns right on desktop */}
            <div className="flex sm:flex-col sm:items-end text-right gap-x-3 sm:gap-x-0 mt-2 sm:mt-0 ml-auto sm:ml-0">
                <span className="text-gray-400 text-xs sm:text-sm font-medium">{submission.language}</span>
                <span className="text-gray-500 text-xs">
                    {new Date(submission.createdAt).toLocaleString()}
                </span>
            </div>
        </div>
    );
};

export default SubmissionRow;