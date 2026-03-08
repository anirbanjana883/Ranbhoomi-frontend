import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { serverUrl } from '../../App.jsx';
import {
  FaArrowLeft, FaCheckCircle, FaUserSecret, FaCopy,
  FaEdit, FaLock, FaTimes, FaCalendarAlt, FaClock,
  FaChevronRight, FaFire, FaEyeSlash, FaTrophy, FaCircle
} from 'react-icons/fa';

// ─── Loading Spinner (TUF Minimalist) ──────────────────────────────
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-zinc-950">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
  </div>
);

// ─── Difficulty Badge ──────────────────────────────────────────────
const DifficultyBadge = ({ difficulty }) => {
  const map = {
    Easy:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Medium:      'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Hard:        'text-red-400 bg-red-500/10 border-red-500/20',
    'Super Hard':'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded border text-[10px] uppercase tracking-widest font-bold ${map[difficulty] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
      {difficulty}
    </span>
  );
};

// ─── Status Badge ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
    </span>
  );
  if (status === 'upcoming') return (
    <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20">
      Upcoming
    </span>
  );
  return (
    <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded border text-zinc-400 bg-zinc-800 border-zinc-700">
      Past
    </span>
  );
};

// ─── Join Private Modal ────────────────────────────────────────────
const JoinPrivateModal = ({ isOpen, onClose, onJoin }) => {
  const [code, setCode] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <FaLock className="text-amber-500" size={13} /> Private Arena
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
            <FaTimes size={14} />
          </button>
        </div>
        <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
          This arena is locked. Enter the secure invite code provided by the host to gain entry.
        </p>
        <div className="mb-6">
          <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Invite Code</label>
          <input
            type="text"
            placeholder="ENTER-CODE"
            className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-md p-3 text-sm font-mono tracking-widest focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-zinc-700 uppercase text-center transition-colors"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white font-medium transition-colors text-sm">Cancel</button>
          <button onClick={() => onJoin(code)} disabled={!code.trim()} className="flex-1 py-2.5 rounded-md bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Unlock & Join</button>
        </div>
      </div>
    </div>
  );
};

// ─── Info Tile ─────────────────────────────────────────────────────
const InfoTile = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
    <div className="shrink-0 w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
      {icon}
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-zinc-200">{value}</p>
    </div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────
export default function ContestDetailsPage() {
  const [contest, setContest]         = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { slug } = useParams();
  const navigate  = useNavigate();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const contestRes = await axios.get(`${serverUrl}/api/contests/${slug}`, { withCredentials: true });
      setContest(contestRes.data.data || contestRes.data);
      try {
        const userRes = await axios.get(`${serverUrl}/api/user/getcurrentuser`, { withCredentials: true });
        setCurrentUser(userRes.data.data || userRes.data);
      } catch { /* not logged in */ }
    } catch {
      toast.error('Failed to fetch contest details.');
      navigate('/contests');
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const onRegisterClick = () => {
    const isPrivate = contest.visibility === 'PRIVATE' || contest.visibility === 'Private';
    if (isPrivate) setShowJoinModal(true);
    else handleRegistrationRequest({});
  };

  const handleRegistrationRequest = async (payload) => {
    setIsRegistering(true);
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/contests/${slug}/register`,
        payload,
        { withCredentials: true }
      );
      toast.success(data.message || 'Successfully registered!');
      setShowJoinModal(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading || !contest) return <LoadingSpinner />;

  // ── Status ──
  const now       = new Date();
  const startTime = new Date(contest.startTime);
  const endTime   = new Date(contest.endTime);
  let contestStatus = 'upcoming';
  if (startTime <= now && endTime > now) contestStatus = 'live';
  else if (endTime <= now)               contestStatus = 'past';

  const hostId          = contest.createdBy?._id?.toString() || contest.createdBy?.toString();
  const userId          = currentUser?._id?.toString();
  const isHost          = userId && hostId && hostId === userId;
  const isPrivateContest = contest.visibility === 'PRIVATE' || contest.visibility === 'Private';

  const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  // ── Privacy / Blur Logic ──
  const needsBlurOverlay = !contest.isRegistered && contestStatus !== 'past';
  const hideDetailsForHype = contest.isRegistered && contestStatus === 'upcoming';

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans selection:bg-red-500/30 overflow-hidden">
      
      <JoinPrivateModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={(code) => handleRegistrationRequest({ inviteCode: code })}
      />

      {/* ── TOP BAR (Fixed) ── */}
      <header className="shrink-0 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/contests')}
            className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
          >
            <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="uppercase hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 leading-none mb-1">Contest Arena</p>
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">{contest.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isPrivateContest && (
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20">
              <FaLock size={9} /> Private
            </span>
          )}
          <StatusBadge status={contestStatus} />
        </div>
      </header>

      {/* ── SCROLLABLE CONTENT AREA ── */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ── Info Card ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-zinc-400 leading-relaxed mb-6 whitespace-pre-wrap">{contest.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <InfoTile icon={<FaCalendarAlt size={14} />} label="Starts At" value={fmtDate(startTime)} />
              <InfoTile icon={<FaClock size={14} />}       label="Ends At"   value={fmtDate(endTime)} />
            </div>

            {/* Host Controls */}
            {isHost && isPrivateContest && (
              <div className="mb-6 bg-zinc-950 border border-zinc-800 rounded-lg p-5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2 mb-4">
                  <FaUserSecret size={12} /> Host Controls
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center justify-between bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-md">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Invite Code</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-zinc-100 font-semibold tracking-widest text-sm">{contest.inviteCode}</span>
                      <button onClick={() => { navigator.clipboard.writeText(contest.inviteCode); toast.success('Copied!'); }} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy Code"><FaCopy size={14} /></button>
                    </div>
                  </div>
                  {contestStatus === 'upcoming' ? (
                    <button onClick={() => navigate(`/contest/edit-private/${contest.slug}`)} className="sm:w-auto w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white font-medium rounded-md transition-colors text-xs shadow-sm">
                      <FaEdit size={12} /> Edit Settings
                    </button>
                  ) : (
                    <div className="sm:w-auto w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-md text-xs font-medium">
                      <FaLock size={10} /> Updates Locked
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🛡️ Dynamic Action Button Logic */}
            <div className="pt-6 border-t border-zinc-800/60 flex flex-wrap gap-3">
              
              {/* Not Registered (Upcoming or Live allows late registration) */}
              {!contest.isRegistered && contestStatus !== 'past' && (
                <button
                  onClick={onRegisterClick}
                  disabled={isRegistering}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isRegistering ? 'Processing…' : (isPrivateContest ? 'Unlock & Join Arena' : 'Register for Arena')}
                  {!isRegistering && <FaChevronRight size={10} />}
                </button>
              )}

              {/* Registered & Upcoming */}
              {contest.isRegistered && contestStatus === 'upcoming' && (
                <>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-md text-sm">
                    <FaCheckCircle size={14} /> Registered Successfully
                  </div>
                  <button
                    onClick={() => navigate(`/contest/${contest.slug}/ranking`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white font-medium rounded-md transition-colors text-sm shadow-sm"
                  >
                    Arena Standings <FaChevronRight size={10} />
                  </button>
                </>
              )}

              {/* Registered & Live */}
              {contest.isRegistered && contestStatus === 'live' && (
                <>
                  <button
                    onClick={() => navigate(`/contest/${contest.slug}/problem/${contest.problems[0]?.problem?.slug}`)}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors text-sm shadow-sm animate-pulse"
                  >
                    <FaFire size={14} /> Enter Arena Now
                  </button>
                  <button
                    onClick={() => navigate(`/contest/${contest.slug}/ranking`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white font-medium rounded-md transition-colors text-sm shadow-sm"
                  >
                    <FaCircle className="text-emerald-500 animate-pulse" size={10} /> Live Standings <FaChevronRight size={10} />
                  </button>
                </>
              )}

              {/* Past Contest */}
              {contestStatus === 'past' && (
                <button
                  onClick={() => navigate(`/contest/${contest.slug}/ranking`)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white font-medium rounded-md transition-colors text-sm shadow-sm"
                >
                  <FaTrophy className="text-amber-400" size={12} /> View Final Rankings <FaChevronRight size={10} />
                </button>
              )}
            </div>
          </div>

          {/* ── Problems Table (Secured) ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between z-20 relative">
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">Contest Problems</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-500">
                {contest.problems?.length || 0} Total
              </span>
            </div>

            {/* 🛡️ Blur Overlay for Non-Registered Users */}
            {needsBlurOverlay && contest.problems?.length > 0 && (
              <div className="absolute inset-x-0 bottom-0 top-[60px] z-10 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-[3px] rounded-b-xl">
                 <FaLock className="text-zinc-500 mb-3" size={28} />
                 <p className="text-zinc-200 font-bold text-sm tracking-tight mb-1">Arena Locked</p>
                 <p className="text-zinc-400 text-xs">Register above to reveal the challenges.</p>
              </div>
            )}

            {contest.problems?.length > 0 ? (
              <div className={`overflow-x-auto ${needsBlurOverlay ? 'opacity-30 pointer-events-none select-none' : ''}`}>
                <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                  <thead className="bg-zinc-950/50 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-12 text-center">#</th>
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Problem Title</th>
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-32">Difficulty</th>
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-right">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {contest.problems.map(({ problem }, i) => (
                      <tr key={problem._id} className="hover:bg-zinc-800/30 transition-colors group">
                        
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-[11px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          {hideDetailsForHype ? (
                            <span className="flex items-center gap-2 text-zinc-500 text-sm font-medium italic">
                              <FaEyeSlash size={12} className="text-zinc-600" /> Hidden until start time
                            </span>
                          ) : contestStatus === 'live' || contestStatus === 'past' ? (
                            <Link 
                              to={`/contest/${contest.slug}/problem/${problem.slug}`} 
                              className="text-sm font-semibold text-zinc-200 hover:text-red-400 transition-colors"
                            >
                              {problem.title}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-zinc-400">{problem.title}</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          {hideDetailsForHype ? (
                            <span className="text-zinc-700 text-xs font-bold">???</span>
                          ) : (
                            <DifficultyBadge difficulty={problem.difficulty} />
                          )}
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          {hideDetailsForHype ? (
                             <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-700 italic">
                               Classified
                             </span>
                          ) : (
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              {problem.tags?.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 capitalize">
                                  {tag}
                                </span>
                              ))}
                              {(problem.tags?.length ?? 0) > 2 && (
                                <span className="font-mono text-zinc-500 text-[10px] font-medium px-1">
                                  +{problem.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-zinc-500">
                <p className="text-sm font-medium">No problems have been added to this arena yet.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}