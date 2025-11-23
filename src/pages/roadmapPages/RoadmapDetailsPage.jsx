import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../../App';
import { roadmaps } from '../../../utils/roadmapData';
import { FaArrowLeft, FaCheckCircle, FaCircle, FaTrophy, FaLock } from 'react-icons/fa';

// --- Helper: Loading Spinner ---
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-4">
    <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
    <p className="text-white text-lg">Loading Roadmap...</p>
  </div>
);

// --- Helper: Difficulty Badge ---
const DifficultyBadge = ({ difficulty, isDisabled }) => {
  let colorClasses = '';
  if (isDisabled) {
     colorClasses = 'text-gray-600 border-gray-800 bg-transparent';
  } else if (difficulty === 'Easy') {
     colorClasses = 'text-green-400 bg-green-900/20 border-green-800/50';
  } else if (difficulty === 'Medium') {
     colorClasses = 'text-yellow-400 bg-yellow-900/20 border-yellow-800/50';
  } else if (difficulty === 'Hard') {
     colorClasses = 'text-red-400 bg-red-900/20 border-red-800/50';
  }
  
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${colorClasses}`}>
      {difficulty}
    </span>
  );
};

function RoadmapDetailsPage() {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [solvedSlugs, setSolvedSlugs] = useState(new Set());
  const [availableSlugs, setAvailableSlugs] = useState(new Set()); // <-- NEW: Track what exists in DB

  // 1. Find the roadmap data from our static file
  const roadmap = useMemo(() => {
    return roadmaps.find(r => r.id === roadmapId);
  }, [roadmapId]);

  // 2. Fetch User Progress & Available Problems
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: solvedIds } = await axios.get(`${serverUrl}/api/user/solved`, {
          withCredentials: true,
        });

        // Fetch ALL problems to know: 
        // 1. Which ones are solved (mapping ID -> Slug)
        // 2. Which ones actually EXIST in the database
        const { data: allProblems } = await axios.get(`${serverUrl}/api/problems`, {
          withCredentials: true
        });

        const solvedSet = new Set();
        const availableSet = new Set(); // <-- NEW
        const solvedIdSet = new Set(solvedIds);

        allProblems.forEach(p => {
          availableSet.add(p.slug); // Mark this slug as "real"
          if (solvedIdSet.has(p._id)) {
            solvedSet.add(p.slug);
          }
        });

        setSolvedSlugs(solvedSet);
        setAvailableSlugs(availableSet); // <-- NEW
      } catch (err) {
        console.error("Error fetching progress:", err);
      } finally {
        setLoading(false);
      }
    };

    if (roadmap) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [roadmap]);

  // 3. Calculate Stats (Based on TOTAL roadmap, not just available)
  const { total, solved, percentage } = useMemo(() => {
    if (!roadmap) return { total: 0, solved: 0, percentage: 0 };
    
    let t = 0;
    let s = 0;
    roadmap.topics.forEach(topic => {
      topic.problems.forEach(p => {
        t++;
        if (solvedSlugs.has(p.slug)) s++;
      });
    });
    
    return { total: t, solved: s, percentage: Math.round((s / t) * 100) || 0 };
  }, [roadmap, solvedSlugs]);


  if (loading) return <LoadingSpinner />;

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Roadmap Not Found</h1>
        <button onClick={() => navigate('/roadmaps')} className="text-orange-500 underline">
          Return to Roadmaps
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 sm:px-6 lg:px-8 pb-20 godfather-bg">
      <div className="max-w-5xl mx-auto">
        
        {/* --- Header & Progress --- */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/roadmaps')}
            className="flex items-center gap-2 text-orange-500 font-bold text-sm mb-6 hover:text-orange-400 transition-colors"
          >
            <FaArrowLeft /> Back to Roadmaps
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 [text-shadow:0_0_20px_rgba(255,69,0,0.5)]">
                {roadmap.title}
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                {roadmap.description}
              </p>
            </div>
            
            {/* Progress Card */}
            <div className="bg-gray-900/60 border border-orange-900/50 p-4 rounded-xl min-w-[200px] text-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="text-3xl font-black text-white mb-1">
                {percentage}%
              </div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Completed ({solved} / {total})
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-600 to-red-600 transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- Topic List --- */}
        <div className="space-y-8">
          {roadmap.topics.map((topic, index) => (
            <div key={index} className="bg-black/40 border border-orange-900/30 rounded-xl overflow-hidden">
              
              {/* Topic Header */}
              <div className="bg-gradient-to-r from-gray-900 to-black p-4 border-b border-orange-900/30 flex items-center gap-3">
                <div className="p-2 bg-orange-900/20 rounded-lg text-orange-500">
                  <FaTrophy size={16} />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {topic.title}
                </h2>
              </div>

              {/* Problems Table */}
              <div className="divide-y divide-gray-800/50">
                {topic.problems.map((problem) => {
                  const isSolved = solvedSlugs.has(problem.slug);
                  const isAvailable = availableSlugs.has(problem.slug); // Check if exists in DB
                  
                  return (
                    <div 
                      key={problem.slug} 
                      className={`flex items-center justify-between p-4 transition-colors duration-200 group
                        ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}
                        ${isSolved ? 'bg-green-900/5' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Icon */}
                        <div className="flex-shrink-0 w-6 text-center">
                          {isSolved ? (
                            <FaCheckCircle className="text-green-500 text-xl" />
                          ) : !isAvailable ? (
                            <FaLock className="text-gray-700 text-sm" /> 
                          ) : (
                            <FaCircle className="text-gray-800 text-xl group-hover:text-gray-700 transition-colors" />
                          )}
                        </div>
                        
                        {/* Title Logic: Link if available, Span if not */}
                        {isAvailable ? (
                          <Link 
                            to={`/problem/${problem.slug}`}
                            className={`font-medium text-lg transition-colors ${isSolved ? 'text-gray-400 line-through decoration-gray-600' : 'text-gray-200 hover:text-orange-400'}`}
                          >
                            {problem.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-lg text-gray-600 cursor-not-allowed">
                            {problem.title} 
                            <span className="ml-2 text-xs text-gray-700 border border-gray-800 px-1.5 py-0.5 rounded">Coming Soon</span>
                          </span>
                        )}
                      </div>

                      {/* Difficulty */}
                      <div className="flex-shrink-0 ml-4">
                        <DifficultyBadge difficulty={problem.difficulty} isDisabled={!isAvailable} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default RoadmapDetailsPage;