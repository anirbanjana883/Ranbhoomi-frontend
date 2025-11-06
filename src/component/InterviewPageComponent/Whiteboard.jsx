import React from 'react';
import { FaPencilRuler } from 'react-icons/fa';


function Whiteboard() {
  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-8">
      <FaPencilRuler className="text-8xl text-orange-700/50 mb-6" />
      <h2 className="text-3xl font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
        System Design Whiteboard
      </h2>
      <p className="text-lg text-gray-400 mt-2">
        (Coming Soon)
      </p>
    </div>
  );
}

export default Whiteboard;