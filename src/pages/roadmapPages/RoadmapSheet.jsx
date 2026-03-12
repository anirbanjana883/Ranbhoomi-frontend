import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import API from "../../api/axios.js";

import { SEARCH_TYPE } from "../../component/roadmapComponents/constants.js";
import SheetHeader from "../../component/roadmapComponents/SheetHeader.jsx";
import FilterBar from "../../component/roadmapComponents/FilterBar.jsx";
import TopicCard from "../../component/roadmapComponents/TopicCard.jsx";

/* ─── global styles injected once ─────────────────────────────────────── */
const GLOBAL_STYLES = `
  .highlight-row { animation: highlightPulse 2s ease-out; }
  @keyframes highlightPulse {
    0%,20% { background-color: rgba(234,88,12,0.15); }
    100%   { background-color: transparent; }
  }
  .topic-enter { animation: topicSlide 0.18s ease-out; }
  @keyframes topicSlide {
    from { opacity:0; transform:translateY(-4px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .custom-scrollbar::-webkit-scrollbar        { width:5px; height:5px; }
  .custom-scrollbar::-webkit-scrollbar-track  { background:transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb  { background:#27272a; border-radius:99px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background:#3f3f46; }
`;

export default function RoadmapSheet() {
  const { roadmapId } = useParams();
  const navigate = useNavigate();

  /* ── data ── */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── tree state ── */
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});

  /* ── filter state ── */
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ── fetch ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(`/roadmap/${roadmapId}`);
        setData(res.data.data);
        const first = res.data.data.template?.sheet?.topicOrder?.[0];
        if (first) setExpandedTopics({ [first]: true });
      } catch {
        toast.error("Failed to load roadmap data.");
        navigate("/roadmaps");
      } finally {
        setLoading(false);
      }
    })();
  }, [roadmapId, navigate]);

  /* ── toggles ── */
  const toggleTopic = (id) =>
    setExpandedTopics((p) => ({ ...p, [id]: !p[id] }));
  const toggleSubtopic = (id) =>
    setExpandedSubtopics((p) => ({ ...p, [id]: !p[id] }));

  const toggleSolve = async (qId, difficulty) => {
    const newSolved = { ...data.progress.solved };
    const wasSolved = !!newSolved[qId];
    if (wasSolved) delete newSolved[qId];
    else newSolved[qId] = true;
    const prevProgress = { ...data.progress };
    setData((p) => ({ ...p, progress: { ...p.progress, solved: newSolved } }));
    try {
      const res = await API.patch(`/roadmap/${roadmapId}/progress/status`, {
        questionId: qId,
        difficulty,
      });
      setData((p) => ({
        ...p,
        progress: { ...p.progress, stats: res.data.data.stats },
      }));
    } catch {
      toast.error("Failed to save progress.");
      setData((p) => ({ ...p, progress: prevProgress }));
    }
  };

  const togglePin = async (qId) => {
    const newBookmarked = { ...data.progress.bookmarked };
    if (newBookmarked[qId]) delete newBookmarked[qId];
    else newBookmarked[qId] = true;
    const prevProgress = { ...data.progress };
    setData((p) => ({
      ...p,
      progress: { ...p.progress, bookmarked: newBookmarked },
    }));
    try {
      await API.patch(`/roadmap/${roadmapId}/progress/bookmark`, {
        questionId: qId,
      });
    } catch {
      toast.error("Failed to save bookmark.");
      setData((p) => ({ ...p, progress: prevProgress }));
    }
  };

  /* ── derived stats ── */
  const progressStats = useMemo(() => {
    if (!data) return null;
    let totalE = 0,
      totalM = 0,
      totalH = 0;
    Object.values(data.template.questions).forEach((q) => {
      const d = q.difficulty || "Medium";
      if (d === "Easy" || d === "Basic") totalE++;
      else if (d === "Medium") totalM++;
      else totalH++;
    });
    const totalQuestions = Object.keys(data.template.questions).length;
    const totalSolved = data.progress.stats.totalSolved || 0;
    const percent =
      totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;
    return { totalE, totalM, totalH, totalQuestions, totalSolved, percent };
  }, [data]);

  /* ── unified search ── */
  const searchResults = useMemo(() => {
    if (!data || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase();
    const results = [];

    data.template.sheet.topicOrder?.forEach((topicId) => {
      const topic = data.template.topics[topicId];
      if (!topic) return;

      if (topic.title.toLowerCase().includes(q))
        results.push({
          type: SEARCH_TYPE.TOPIC,
          id: topicId,
          title: topic.title,
          topicId,
        });

      topic.subTopicOrder?.forEach((subId) => {
        const sub = data.template.subTopics[subId];
        if (!sub) return;

        if (sub.title.toLowerCase().includes(q))
          results.push({
            type: SEARCH_TYPE.SUBTOPIC,
            id: subId,
            title: sub.title,
            subtitle: topic.title,
            topicId,
            subId,
          });

        sub.questionOrder?.forEach((qId) => {
          const question = data.template.questions[qId];
          if (!question) return;
          if (question.title.toLowerCase().includes(q))
            results.push({
              type: SEARCH_TYPE.QUESTION,
              id: qId,
              title: question.title,
              subtitle: `${topic.title} › ${sub.title}`,
              difficulty: question.difficulty,
              topicId,
              subId,
              isSolved: !!data.progress.solved[qId],
            });
        });
      });
    });

    return results.slice(0, 14);
  }, [data, searchQuery]);

  const handleSearchSelect = (result) => {
    setSearchFocused(false);
    setSearchQuery("");

    if (result.type === SEARCH_TYPE.TOPIC) {
      setExpandedTopics((p) => ({ ...p, [result.topicId]: true }));
    } else if (result.type === SEARCH_TYPE.SUBTOPIC) {
      setExpandedTopics((p) => ({ ...p, [result.topicId]: true }));
      setExpandedSubtopics((p) => ({ ...p, [result.subId]: true }));
    } else {
      setExpandedTopics((p) => ({ ...p, [result.topicId]: true }));
      setExpandedSubtopics((p) => ({ ...p, [result.subId]: true }));
      setTimeout(() => {
        const el = document.getElementById(`q-${result.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("highlight-row");
          setTimeout(() => el.classList.remove("highlight-row"), 2000);
        }
      }, 160);
    }
  };

  /* ── loading ── */
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 border-2 border-zinc-800 rounded-full absolute" />
          <div className="w-12 h-12 border-2 border-t-red-600 rounded-full animate-spin absolute" />
        </div>
        <p className="text-zinc-600 text-xs tracking-widest uppercase font-mono animate-pulse">
          Loading matrix…
        </p>
      </div>
    );
  }

  const { template, progress } = data;

  /* ── filter helper ── */
  const isFiltering =
    activeTab !== "all" ||
    searchQuery ||
    difficultyFilter !== "All" ||
    statusFilter !== "All";

  const buildSubTopics = (topic) =>
    topic.subTopicOrder
      .map((subId) => {
        const subTopic = template.subTopics[subId];
        if (!subTopic) return null;
        const visibleQuestions = subTopic.questionOrder.filter((qId) => {
          const q = template.questions[qId];
          if (!q) return false;
          if (activeTab === "revision" && !progress.bookmarked[qId])
            return false;
          if (difficultyFilter !== "All" && q.difficulty !== difficultyFilter)
            return false;
          if (statusFilter === "Solved" && !progress.solved[qId]) return false;
          if (statusFilter === "Unsolved" && progress.solved[qId]) return false;
          if (
            searchQuery &&
            !q.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
            return false;
          return true;
        });
        return { subId, subTopic, visibleQuestions };
      })
      .filter(Boolean);

  /* ── render ── */
  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
        <SheetHeader
          title={template.sheet.title}
          totalSolved={progressStats.totalSolved}
          totalQuestions={progressStats.totalQuestions}
        />

        <FilterBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searchFocused={searchFocused}
          setSearchFocused={setSearchFocused}
          onSearchSelect={handleSearchSelect}
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          progressStats={progressStats}
          stats={progress.stats}
        />

        {/* ── scrollable content ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4">
          <div className="max-w-[1400px] mx-auto space-y-2.5 pb-24">
            {template.sheet.topicOrder?.map((topicId, idx) => {
              const topic = template.topics[topicId];
              if (!topic) return null;

              const subTopicsToRender = buildSubTopics(topic);
              const hasVisible = subTopicsToRender.some(
                (s) => s.visibleQuestions.length > 0,
              );
              if (!hasVisible && isFiltering) return null;

              return (
                <TopicCard
                  key={topicId}
                  topicId={topicId}
                  topicIndex={idx}
                  topic={topic}
                  isExpanded={!!expandedTopics[topicId]}
                  onToggle={() => toggleTopic(topicId)}
                  expandedSubtopics={expandedSubtopics}
                  onToggleSubtopic={toggleSubtopic}
                  subTopicsToRender={subTopicsToRender}
                  template={template}
                  progress={progress}
                  onToggleSolve={toggleSolve}
                  onTogglePin={togglePin}
                  roadmapId={roadmapId}
                  // onNoteSaved={handleNoteSaved}
                />
              );
            })}

            {/* Empty state */}
            {isFiltering &&
              template.sheet.topicOrder?.every((topicId) => {
                const topic = template.topics[topicId];
                if (!topic) return true;
                return !buildSubTopics(topic).some(
                  (s) => s.visibleQuestions.length > 0,
                );
              }) && (
                <div className="text-center py-20">
                  <FaSearch size={28} className="mx-auto mb-4 text-zinc-800" />
                  <p className="text-base font-semibold text-zinc-600">
                    No problems match your filters
                  </p>
                  <p className="text-sm text-zinc-700 mt-1.5">
                    Try adjusting your search or clearing filters
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
