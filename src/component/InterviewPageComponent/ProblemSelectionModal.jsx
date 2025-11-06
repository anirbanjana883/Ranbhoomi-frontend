import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

function ProblemSelectionModal({ isOpen, onClose, onProblemSelect }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch all problems (like in your admin panel)
  useEffect(() => {
    if (isOpen) {
      const fetchProblems = async () => {
        setLoading(true);
        try {
          // You might want to use your admin route if it's more complete
          const { data } = await axios.get(`${serverUrl}/api/problems`, {
            withCredentials: true,
          });
          setProblems(data);
        } catch (err) {
          toast.error("Failed to fetch problems.");
        } finally {
          setLoading(false);
        }
      };
      fetchProblems();
    }
  }, [isOpen]);

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle = "p-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-orange-600/50 cursor-pointer transition-all";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-black border border-orange-700/50 rounded-2xl shadow-[0_0_40px_rgba(255,69,0,0.3)] w-full max-w-2xl m-4 h-[80vh] flex flex-col">
        
        <div className="flex justify-between items-center p-4 border-b border-orange-700/50">
          <h2 className="text-2xl font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.3)]">
            Select a Problem
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-orange-400 transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-gray-400">Loading problems...</p>
          ) : (
            filteredProblems.map(problem => (
              <div 
                key={problem._id} 
                className={cardStyle}
                onClick={() => onProblemSelect(problem._id)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">{problem.title}</span>
                  <span className={`text-xs font-bold ${
                    problem.difficulty === 'Easy' ? 'text-green-400' :
                    problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{problem.difficulty}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default ProblemSelectionModal;