// Community.jsx — main page, mirrors ProblemListPage structure
// Header with back button, full-screen layout, sticky filter bar, two-col feed+sidebar
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  FaArrowLeft, FaSearch, FaFire,
  FaPlus, FaTimes, FaEdit,
} from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';

// Removed TAGS import, keeping only the styles
import { COMMUNITY_STYLES } from '../../component/communityPageComponent/communityStyles.js';
import { PostCardSkeleton } from '../../component/communityPageComponent/CommunityAtoms.jsx';
import PostCard from '../../component/communityPageComponent/PostCard.jsx';
import PostDetailModal from '../../component/communityPageComponent/PostDetailModal.jsx';
import CreatePostModal from '../../component/communityPageComponent/CreatePostModal.jsx';
import { serverUrl } from '../../App';
import API from '../../api/axios.js';

/* ── Sort pill config ─────────────────────────────────────── */
const SORTS = [
  { value: 'hot', label: 'Hot', icon: <FaFire size={12} /> },
  { value: 'new', label: 'New', icon: <IoSparkles size={12} /> },
];

/* ── Right sidebar ────────────────────────────────────────── */
function CommunitySidebar({ onNewPost, isLoggedIn }) {
  return (
    <div className="space-y-4">

      {/* About card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-500 mb-1.5 font-bold">Ranbhoomi</p>
        <h3 className="text-lg font-black text-zinc-100 mb-2 tracking-tight">War Room</h3>
        <p className="text-sm text-zinc-300 leading-relaxed mb-5">
          Discuss system design patterns, share detailed interview experiences, ask hard questions, and help others climb the ladder.
        </p>
        <button
          onClick={onNewPost}
          disabled={!isLoggedIn}
          title={!isLoggedIn ? 'Log in to post' : ''}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-sm font-bold rounded-md transition-colors"
        >
          <FaPlus size={12} /> New Discussion
        </button>
        {!isLoggedIn && (
          <p className="font-mono text-[10px] text-zinc-500 text-center mt-3">Login required to post</p>
        )}
      </div>

      {/* Community rules */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4">Rules of Engagement</p>
        <ul className="space-y-3">
          {[
            'No spam or self-promotion.',
            'Be respectful. No personal attacks.',
            'Stay on-topic: DSA, interviews, CS concepts.',
            'Mark spoilers clearly.',
            'Search before posting duplicates.',
          ].map((r, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="font-mono text-[11px] text-red-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
              <span className="text-sm text-zinc-300 leading-snug">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────── */
function EmptyState({ isSearch, query, onClear, onNew, isLoggedIn }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-900/50">
      <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
        <FaSearch className="text-zinc-400" size={20} />
      </div>
      <p className="text-xl font-black text-zinc-200 mb-2 tracking-tight">
        {isSearch ? `No results for "${query}"` : 'The arena is silent.'}
      </p>
      <p className="text-sm text-zinc-400 mb-8 max-w-sm leading-relaxed">
        {isSearch ? 'Try adjusting your search parameters or checking your spelling.' : 'Be the first warrior to initiate contact and share your experience.'}
      </p>
      {isSearch && (
        <button onClick={onClear} className="font-mono text-sm text-red-500 hover:text-red-400 transition-colors font-bold flex items-center gap-1">
          <FaTimes size={12} /> Clear Search
        </button>
      )}
      {!isSearch && isLoggedIn && (
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-mono text-sm font-bold rounded-md transition-colors"
        >
          <FaPlus size={12} /> Create First Post
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMMUNITY PAGE
═══════════════════════════════════════════════════════════ */
export default function Community() {
  const { userData } = useSelector(s => s.user);
  const navigate = useNavigate();

  /* Feed state */
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('hot');

  /* Pagination cursors */
  const [nextCursor, setNextCursor] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  /* Search */
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searching, setSearching] = useState(false);

  /* Modals */
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const isSearchMode = !!appliedSearch;

  /* ── Load posts (hot/new with correct pagination) ── */
  const loadPosts = useCallback(async (append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ sort, limit: 15 });
      if (append) {
        if (sort === 'new' && nextCursor) params.set('cursor', nextCursor);
        if (sort === 'hot' && nextPage) params.set('page', nextPage);
      }

      const { data } = await API.get(
        `/community/posts?${params}`
      );
      const result = data.data || data;
      const incoming = result.posts || [];

      setPosts(prev => append ? [...prev, ...incoming] : incoming);
      setNextCursor(result.nextCursor || null);
      setNextPage(result.nextPage || null);
    } catch {
      toast.error('Failed to load posts');
    }
    setLoading(false);
    setLoadingMore(false);
  }, [sort, nextCursor, nextPage]);

  useEffect(() => {
    if (!isSearchMode) {
      setNextCursor(null);
      setNextPage(null);
      loadPosts(false);
    }
  }, [sort]);

  /* ── Search ── */
  const doSearch = useCallback(async (page = 1) => {
    if (!appliedSearch) return;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setSearching(true);
    try {
      const { data } = await API.get(
        `/community/search?q=${encodeURIComponent(appliedSearch)}&page=${page}&limit=15`
      );
      const result = data.data || data;
      const incoming = result.posts || [];
      setPosts(prev => page === 1 ? incoming : [...prev, ...incoming]);
      setSearchHasMore(result.hasNextPage || false);
      setSearchPage(page);
    } catch {
      toast.error('Search failed');
    }
    setLoading(false);
    setLoadingMore(false);
    setSearching(false);
  }, [appliedSearch]);

  useEffect(() => { if (appliedSearch) doSearch(1); }, [appliedSearch]);

  const handleSearch = e => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) { clearSearch(); return; }
    setAppliedSearch(q);
  };

  const clearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setSearchPage(1);
    setSearchHasMore(false);
    loadPosts(false);
  };

  /* ── Vote (hot re-score applied server-side) ── */
  const handleVote = async (entityId, entityType, voteType) => {
    if (!userData) { toast.error('Log in to vote!'); return; }
    try {
      const { data } = await API.patch(
        `/community/vote`,
        { entityId, entityType, voteType },
      );
      const updated = data.data || data;
      // Optimistic update
      if (entityType === 'CommunityPost') {
        setPosts(prev => prev.map(p =>
          p._id === entityId
            ? { ...p, upvotes: updated.upvotes, downvotes: updated.downvotes, userVote: voteType }
            : p
        ));
        if (selectedPost?._id === entityId) {
          setSelectedPost(prev => ({ ...prev, upvotes: updated.upvotes, downvotes: updated.downvotes }));
        }
      }
    } catch {
      toast.error('Vote failed');
    }
  };

  /* ── Delete post ── */
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await API.delete(`/community/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  /* ── Load more (appends) ── */
  const canLoadMore = isSearchMode
    ? searchHasMore
    : (sort === 'new' ? !!nextCursor : !!nextPage);

  const handleLoadMore = () => {
    if (isSearchMode) doSearch(searchPage + 1);
    else loadPosts(true);
  };

  const openNewPost = () => {
    if (!userData) { toast.error('Log in to post'); return; }
    setShowCreate(true);
  };

  return (
    <>
      <style>{COMMUNITY_STYLES}</style>

      {/* Full-screen layout */}
      <div className="h-screen flex flex-col bg-zinc-950 text-zinc-300 font-sans overflow-hidden selection:bg-red-500/30">

        {/* ── HEADER ── */}
        <header className="shrink-0 h-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-b border-zinc-800 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 transition-colors hover:border-zinc-700 hover:text-zinc-200 shrink-0"
            >
              <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="uppercase hidden sm:inline font-mono font-bold">Home</span>
            </button>
            <div className="w-px h-5 bg-zinc-800 shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
                Ranbhoomi War Room
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-500 leading-none mt-1.5 hidden sm:block font-mono">
                Community · Discussions · Strategies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Inline search */}
            <form onSubmit={handleSearch} className="relative hidden md:block group">
              <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search discussions..."
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-md pl-8 pr-8 py-2 w-56 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-zinc-600"
              />
              {appliedSearch && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <FaTimes size={10} />
                </button>
              )}
            </form>

            <button
              onClick={openNewPost}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-md transition-colors"
            >
              <FaEdit size={12} /> <span className="hidden sm:inline">New Post</span>
            </button>
          </div>
        </header>

        {/* ── FILTER BAR (Sort only, Tags removed) ── */}
        <div className="shrink-0 bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-1 gap-1 shrink-0">
            {SORTS.map(s => (
              <button
                key={s.value}
                onClick={() => { if (!isSearchMode) setSort(s.value); }}
                disabled={isSearchMode}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wide transition-all ${
                  !isSearchMode && sort === s.value
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-zinc-800/50 disabled:opacity-30 disabled:hover:bg-transparent'
                }`}
              >
                {s.icon}{s.label}
              </button>
            ))}
          </div>

          {/* Mobile search toggle */}
          <form onSubmit={handleSearch} className="flex md:hidden relative w-full max-w-[200px] ml-4">
            <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search..."
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-md pl-8 pr-3 py-2 focus:outline-none focus:border-red-500 transition-colors"
            />
          </form>
        </div>

        {/* ── MAIN CONTENT (scrollable area) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

              {/* Posts feed */}
              <div className="min-w-0">
                {isSearchMode && (
                  <div className="mb-4 flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-md px-4 py-3">
                    <span className="font-mono text-xs text-zinc-400">
                      Results for <span className="text-zinc-100 font-bold">"{appliedSearch}"</span>
                    </span>
                    <button
                      onClick={clearSearch}
                      className="font-mono text-[10px] uppercase font-bold text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <FaTimes size={10} /> Clear
                    </button>
                  </div>
                )}

                {!loading && posts.length > 0 && (
                  <div className="mb-4 flex items-center">
                    <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      {posts.length} Documented Signal{posts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <PostCardSkeleton key={i} />)}
                  </div>
                ) : posts.length === 0 ? (
                  <EmptyState
                    isSearch={isSearchMode}
                    query={appliedSearch}
                    onClear={clearSearch}
                    onNew={openNewPost}
                    isLoggedIn={!!userData}
                  />
                ) : (
                  <>
                    <div className="space-y-4">
                      {posts.map((p) => (
                        <PostCard
                          key={p._id}
                          post={p}
                          onOpen={setSelectedPost}
                          onVote={handleVote}
                          onDelete={handleDeletePost}
                          currentUser={userData}
                        />
                      ))}
                    </div>

                    {canLoadMore && (
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="mt-6 w-full py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 rounded-lg font-mono text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all disabled:opacity-50"
                      >
                        {loadingMore ? 'Retrieving records...' : 'Load Older Records ↓'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-6">
                  <CommunitySidebar onNewPost={openNewPost} isLoggedIn={!!userData} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Mobile FAB */}
        <button
          onClick={openNewPost}
          className="sm:hidden fixed bottom-6 right-5 w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 z-30"
        >
          <FaPlus size={20} />
        </button>
      </div>

      {/* ── Modals ── */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentUser={userData}
          onVotePost={(postId, voteType) => handleVote(postId, 'CommunityPost', voteType)}
          onPostDeleted={id => {
            setPosts(prev => prev.filter(p => p._id !== id));
            setSelectedPost(null);
          }}
        />
      )}

      {showCreate && userData && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreate={newPost => {
            if (sort === 'new') setPosts(prev => [newPost, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </>
  );
}