import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaPlus, FaEdit, FaTrash, FaChevronRight, FaChevronDown,
  FaMap, FaFolderOpen, FaFileAlt, FaCode, FaTimes,
  FaBars, FaExternalLinkAlt, FaLayerGroup, FaArrowLeft
} from 'react-icons/fa';
import API from '../../api/axios.js';

const API_PUBLIC = '/roadmap';
const API_ADMIN  = '/admin/roadmap';

const DIFF_STYLES = {
  Basic:  'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
  Easy:   'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  Medium: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
  Hard:   'text-red-400 border-red-500/20 bg-red-500/10',
};

/* ─── tiny reusable icon button ─────────────────────────────────────── */
function IconBtn({ onClick, children, danger, blue, className = '' }) {
  const color = danger
    ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
    : blue
    ? 'text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10'
    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800';
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${color} ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── labelled form input ────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 ' +
  'focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 ' +
  'placeholder:text-zinc-600 transition-colors';

/* ══════════════════════════════════════════════════════════════════════ */
export default function RoadmapAdminPage() {
  const navigate = useNavigate();

  const [roadmaps,         setRoadmaps]         = useState([]);
  const [selectedId,       setSelectedId]       = useState(null);
  const [roadmapData,      setRoadmapData]      = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [sidebarOpen,      setSidebarOpen]      = useState(false); // mobile drawer
  const [expandedTopics,   setExpandedTopics]   = useState({});
  const [expandedSubs,     setExpandedSubs]     = useState({});
  const [modal,            setModal]            = useState({ isOpen: false, mode: 'add', type: '', parentId: null, data: {} });

  /* ── fetch list ── */
  useEffect(() => { loadRoadmaps(); }, []);

  const loadRoadmaps = async () => {
    try {
      setLoading(true);
      const res = await API.get(API_PUBLIC);
      setRoadmaps(res.data.data || []);
    } catch { toast.error('Failed to fetch roadmaps.'); }
    finally  { setLoading(false); }
  };

  /* ── fetch detail ── */
  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try {
        const res = await API.get(`${API_PUBLIC}/${selectedId}`);
        setRoadmapData(res.data.data.template);
      } catch { toast.error('Failed to fetch roadmap details.'); }
    })();
  }, [selectedId]);

  const refreshDetail = async () => {
    if (!selectedId) return;
    const res = await API.get(`${API_PUBLIC}/${selectedId}`);
    setRoadmapData(res.data.data.template);
  };

  /* ── modal helpers ── */
  const openModal  = (mode, type, parentId = null, data = {}) =>
    setModal({ isOpen: true, mode, type, parentId, data });
  const closeModal = () =>
    setModal({ isOpen: false, mode: 'add', type: '', parentId: null, data: {} });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { mode, type, parentId, data } = modal;
    try {
      if (type === 'roadmap') {
        await API.post(API_ADMIN, { roadmapId: data.roadmapId, title: data.title });
        toast.success('Roadmap created!');
        loadRoadmaps();
      } else if (mode === 'add') {
        await API.post(`${API_ADMIN}/${selectedId}/items`, {
          type, parentId, title: data.title, link: data.link, difficulty: data.difficulty,
        });
        toast.success(`${type} added!`);
        await refreshDetail();
      } else {
        await API.patch(`${API_ADMIN}/${selectedId}/items/${data.id}`, {
          type, title: data.title, link: data.link, difficulty: data.difficulty,
        });
        toast.success(`${type} updated!`);
        await refreshDetail();
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (type, itemId, parentId) => {
    if (!window.confirm(`Delete this ${type}? This cannot be undone.`)) return;
    try {
      await API.delete(`${API_ADMIN}/${selectedId}/items/${itemId}`, { data: { type, parentId } });
      toast.success('Deleted.');
      await refreshDetail();
    } catch { toast.error('Delete failed.'); }
  };

  const selectRoadmap = (id) => {
    setSelectedId(id);
    setSidebarOpen(false); // close drawer on mobile after selecting
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:5px;height:5px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#27272a;border-radius:99px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#3f3f46}
        .slide-in{animation:slideIn .2s ease-out}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .15s ease-out}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      <div className="flex h-screen bg-zinc-950 text-zinc-300 font-sans overflow-hidden">

        {/* ══ MOBILE SIDEBAR OVERLAY ══════════════════════════════════════ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-zinc-950/80 backdrop-blur-sm lg:hidden fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ══ SIDEBAR ═════════════════════════════════════════════════════ */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-40 w-72 flex flex-col
          bg-zinc-950 border-r border-zinc-800
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Sidebar header */}
          <div className="shrink-0 h-14 px-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-red-600 rounded-full" />
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">Roadmap CMS</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openModal('add', 'roadmap')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-400 bg-red-600/10 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
              >
                <FaPlus size={9} /> New
              </button>
              <button
                className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>

          {/* Roadmap list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {loading ? (
              <div className="flex flex-col gap-2 mt-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-zinc-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : roadmaps.length === 0 ? (
              <div className="text-center pt-10">
                <FaMap size={24} className="mx-auto mb-2 text-zinc-800" />
                <p className="text-xs text-zinc-600">No roadmaps yet.</p>
                <p className="text-xs text-zinc-700">Click New to create one.</p>
              </div>
            ) : roadmaps.map((rm) => {
              const isActive = selectedId === rm.roadmapId;
              return (
                <div
                  key={rm.roadmapId}
                  onClick={() => selectRoadmap(rm.roadmapId)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-zinc-800 border border-zinc-700'
                      : 'hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-red-600/20 text-red-400' : 'bg-zinc-800 text-zinc-600 group-hover:text-zinc-400'
                  }`}>
                    <FaMap size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate leading-tight ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}>
                      {rm.title}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-mono truncate">{rm.roadmapId}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar footer */}
          <div className="shrink-0 px-4 py-3 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-700 font-mono">{roadmaps.length} roadmap{roadmaps.length !== 1 ? 's' : ''}</p>
          </div>
        </aside>

        {/* ══ MAIN CONTENT ════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar */}
          <div className="shrink-0 h-14 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-4 z-20">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <FaBars size={14} />
              </button>

              {/* Back button */}
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                title="Go back"
              >
                <FaArrowLeft size={13} />
              </button>

              <div className="w-px h-5 bg-zinc-800 shrink-0" />

              {roadmapData ? (
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-zinc-100 truncate">{roadmapData.sheet.title}</h1>
                  <p className="text-[10px] text-zinc-600 font-mono hidden sm:block">{roadmapData.sheet.id}</p>
                </div>
              ) : (
                <h1 className="text-sm font-bold text-zinc-500">Select a roadmap</h1>
              )}
            </div>

            {roadmapData && (
              <button
                onClick={() => openModal('add', 'topic')}
                className="shrink-0 flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 text-xs font-bold text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <FaPlus size={9} />
                <span className="hidden sm:inline">Add Topic</span>
                <span className="sm:hidden">Topic</span>
              </button>
            )}
          </div>

          {/* Editor area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!selectedId || !roadmapData ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-700 px-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <FaLayerGroup size={24} className="text-zinc-700" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-500">No roadmap selected</p>
                  <p className="text-xs text-zinc-700 mt-1">
                    <span className="lg:hidden">Tap ☰ to open the menu and </span>
                    <span className="hidden lg:inline">Use the sidebar to </span>
                    select or create a roadmap
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-3 pb-20">

                {roadmapData.sheet.topicOrder?.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                    <FaFolderOpen size={28} className="mx-auto mb-3 text-zinc-800" />
                    <p className="text-sm text-zinc-600">No topics yet</p>
                    <button
                      onClick={() => openModal('add', 'topic')}
                      className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                    >
                      + Add your first topic
                    </button>
                  </div>
                )}

                {roadmapData.sheet.topicOrder?.map((topicId) => {
                  const topic = roadmapData.topics[topicId];
                  if (!topic) return null;
                  const isTopicOpen = expandedTopics[topicId];

                  return (
                    <div key={topicId} className="border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">

                      {/* ── Topic header ── */}
                      <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-zinc-900/60">
                        <button
                          onClick={() => setExpandedTopics(p => ({ ...p, [topicId]: !p[topicId] }))}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                        >
                          <div className="w-6 h-6 flex items-center justify-center shrink-0 text-zinc-500">
                            {isTopicOpen ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                          </div>
                          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                            <FaFolderOpen size={11} className="text-zinc-400" />
                          </div>
                          <span className="text-sm font-bold text-zinc-200 truncate">{topic.title}</span>
                          <span className="shrink-0 text-[10px] font-mono text-zinc-600 hidden sm:inline">
                            {topic.subTopicOrder?.length || 0} subs
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => openModal('add', 'subTopic', topicId)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                          >
                            <FaPlus size={8} />
                            <span className="hidden sm:inline">Subtopic</span>
                          </button>
                          <div className="w-px h-4 bg-zinc-800 mx-0.5" />
                          <IconBtn blue onClick={() => openModal('edit', 'topic', null, topic)}>
                            <FaEdit size={11} />
                          </IconBtn>
                          <IconBtn danger onClick={() => handleDelete('topic', topicId, null)}>
                            <FaTrash size={11} />
                          </IconBtn>
                        </div>
                      </div>

                      {/* ── SubTopics ── */}
                      {isTopicOpen && (
                        <div className="p-2 sm:p-3 space-y-2 border-t border-zinc-800/60 slide-in">

                          {topic.subTopicOrder?.length === 0 && (
                            <p className="text-xs text-zinc-700 italic px-2 py-1">No subtopics yet.</p>
                          )}

                          {topic.subTopicOrder?.map(subId => {
                            const sub = roadmapData.subTopics[subId];
                            if (!sub) return null;
                            const isSubOpen = expandedSubs[subId];

                            return (
                              <div key={subId} className="ml-3 sm:ml-6 border border-zinc-800/50 rounded-lg overflow-hidden bg-zinc-950/60">

                                {/* Sub header */}
                                <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-900/30">
                                  <button
                                    onClick={() => setExpandedSubs(p => ({ ...p, [subId]: !p[subId] }))}
                                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                  >
                                    <span className="text-zinc-600 shrink-0">
                                      {isSubOpen ? <FaChevronDown size={9} /> : <FaChevronRight size={9} />}
                                    </span>
                                    <FaFileAlt size={10} className="text-zinc-600 shrink-0" />
                                    <span className="text-sm font-semibold text-zinc-300 truncate">{sub.title}</span>
                                    <span className="shrink-0 text-[10px] font-mono text-zinc-700 hidden sm:inline">
                                      {sub.questionOrder?.length || 0}q
                                    </span>
                                  </button>

                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      onClick={() => openModal('add', 'question', subId)}
                                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-md transition-colors"
                                    >
                                      <FaPlus size={8} />
                                      <span className="hidden sm:inline">Question</span>
                                    </button>
                                    <div className="w-px h-3 bg-zinc-800 mx-0.5" />
                                    <IconBtn blue onClick={() => openModal('edit', 'subTopic', topicId, sub)}>
                                      <FaEdit size={10} />
                                    </IconBtn>
                                    <IconBtn danger onClick={() => handleDelete('subTopic', subId, topicId)}>
                                      <FaTrash size={10} />
                                    </IconBtn>
                                  </div>
                                </div>

                                {/* Questions */}
                                {isSubOpen && (
                                  <div className="border-t border-zinc-800/40 divide-y divide-zinc-800/30 slide-in">
                                    {sub.questionOrder?.length === 0 && (
                                      <p className="text-xs text-zinc-700 italic px-4 py-3">No questions yet.</p>
                                    )}
                                    {sub.questionOrder?.map(qId => {
                                      const q = roadmapData.questions[qId];
                                      if (!q) return null;
                                      return (
                                        <div
                                          key={qId}
                                          className="flex items-center justify-between px-3 sm:px-4 py-2.5 hover:bg-zinc-900/40 transition-colors group"
                                        >
                                          {/* Left */}
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <FaCode size={11} className="text-zinc-700 shrink-0" />
                                            <span className="text-sm text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">
                                              {q.title}
                                            </span>
                                            <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-widest font-bold hidden sm:inline ${DIFF_STYLES[q.difficulty] || DIFF_STYLES.Medium}`}>
                                              {q.difficulty || 'Medium'}
                                            </span>
                                          </div>

                                          {/* Right — always visible on mobile, hover on desktop */}
                                          <div className="flex items-center gap-1 shrink-0 ml-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            {q.link && (
                                              <a
                                                href={q.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                              >
                                                <FaExternalLinkAlt size={10} />
                                              </a>
                                            )}
                                            <IconBtn blue onClick={() => openModal('edit', 'question', subId, q)}>
                                              <FaEdit size={10} />
                                            </IconBtn>
                                            <IconBtn danger onClick={() => handleDelete('question', qId, subId)}>
                                              <FaTrash size={10} />
                                            </IconBtn>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODAL ════════════════════════════════════════════════════════ */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in"
          style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(4px)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* Sheet on mobile, centered card on sm+ */}
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl slide-in">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-zinc-100 capitalize">
                  {modal.mode === 'add' ? 'Add' : 'Edit'} {modal.type}
                </h2>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {modal.mode === 'add' ? 'Create a new entry' : 'Update existing entry'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSubmit}>
              <div className="px-5 py-5 space-y-4">

                {modal.type === 'roadmap' && modal.mode === 'add' && (
                  <Field label="Roadmap ID (unique slug)">
                    <input
                      required
                      type="text"
                      placeholder="e.g. blind-75"
                      className={inputCls}
                      value={modal.data.roadmapId || ''}
                      onChange={e => setModal(m => ({ ...m, data: { ...m.data, roadmapId: e.target.value } }))}
                    />
                  </Field>
                )}

                <Field label="Title">
                  <input
                    required
                    type="text"
                    placeholder={`Enter ${modal.type} title…`}
                    className={inputCls}
                    value={modal.data.title || ''}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))}
                  />
                </Field>

                {modal.type === 'question' && (
                  <>
                    <Field label="Practice Link">
                      <input
                        type="url"
                        placeholder="https://leetcode.com/problems/…"
                        className={inputCls}
                        value={modal.data.link || ''}
                        onChange={e => setModal(m => ({ ...m, data: { ...m.data, link: e.target.value } }))}
                      />
                    </Field>

                    <Field label="Difficulty">
                      <div className="grid grid-cols-4 gap-2">
                        {['Basic', 'Easy', 'Medium', 'Hard'].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setModal(m => ({ ...m, data: { ...m.data, difficulty: d } }))}
                            className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                              (modal.data.difficulty || 'Medium') === d
                                ? DIFF_STYLES[d]
                                : 'text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-5 pb-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  {modal.mode === 'add' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}