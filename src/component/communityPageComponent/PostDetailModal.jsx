// PostDetailModal.jsx — full post view with comments
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Updated to react-hot-toast
import {
  FaTimes, FaHashtag, FaRegComment, FaPaperPlane,
  FaTrashAlt,
} from 'react-icons/fa';
import { Avatar, VoteWidget, PlanBadge, SectionLabel, LoadingSpinner } from './CommunityAtoms.jsx';
import CommentTree from './CommentTree.jsx';
import { timeAgo } from './communityUtils.js';
import { serverUrl } from '../../App';
import API from '../../api/axios.js';

export default function PostDetailModal({ post: initialPost, onClose, currentUser, onVotePost, onPostDeleted }) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalComments, setTotalComments] = useState(initialPost.commentCount || 0);

  // Close on Escape
  useEffect(() => {
    const handleEsc = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const loadComments = useCallback(async (p = 1) => {
    setLoading(p === 1);
    try {
      const { data } = await API.get(
        `/community/posts/${post._id}/comments?page=${p}&limit=15`,
        { withCredentials: true }
      );
      const list = data.data || data || [];
      setComments(prev => p === 1 ? list : [...prev, ...list]);
      setHasMore(list.length === 15);
      setPage(p);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [post._id]);

  useEffect(() => { loadComments(1); }, [loadComments]);

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await API.post(
        `/community/comment`,
        { postId: post._id, content: commentText.trim() },
        { withCredentials: true }
      );
      const newComment = data.data || data;
      newComment.children = [];
      newComment.author = newComment.author || { username: currentUser?.username };
      
      setComments(prev => [newComment, ...prev]);
      setTotalComments(t => t + 1);
      setCommentText('');
      toast.success('Response deployed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteComment = async (commentId, entityType, voteType) => {
    if (!currentUser) { toast.error('Log in to vote'); return; }
    try {
      await API.patch(`/community/vote`,
        { entityId: commentId, entityType, voteType },
        { withCredentials: true }
      );
      // Soft-refresh the comments to show new vote totals
      loadComments(1);
    } catch { 
      toast.error('Vote failed'); 
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await API.delete(`/community/posts/${post._id}`, { withCredentials: true });
      toast.success('Post deleted successfully');
      onPostDeleted?.(post._id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const isOwn = currentUser?._id === post.author?._id;
  const score = (post.upvotes || 0) - (post.downvotes || 0);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* ── Modal Header Bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-red-500 font-mono text-sm font-bold">#</span>
            <SectionLabel>{post.tags?.[0] || 'General'}</SectionLabel>
            <span className="font-mono text-[10px] text-zinc-500 ml-1">{timeAgo(post.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isOwn && (
              <button
                onClick={handleDeletePost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <FaTrashAlt size={10} /> Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body Area ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
          
          {/* ── Original Post Content ── */}
          <div className="px-6 py-6 border-b border-zinc-800 bg-zinc-900/40">
            <div className="flex gap-4 md:gap-5">
              
              {/* Left Vote Column */}
              <div className="shrink-0 pt-1">
                <VoteWidget
                  score={score}
                  userVote={post.userVote || 0}
                  onUp={() => onVotePost(post._id, 1)}
                  onDown={() => onVotePost(post._id, -1)}
                  vertical={true}
                />
              </div>

              {/* Right Content Column */}
              <div className="flex-1 min-w-0">
                
                {/* Author Info */}
                <div className="flex items-center gap-2.5 mb-4">
                  <Avatar name={post.author?.username || '?'} size={7} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-200">{post.author?.username || 'Unknown'}</span>
                      <PlanBadge plan={post.author?.subscriptionPlan} />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-black text-zinc-100 leading-tight mb-4 tracking-tight">
                  {post.title}
                </h2>

                {/* HTML/Markdown Content Rendering */}
                {/* Note: Backend sanitizes this, so dangerouslySetInnerHTML is safe */}
                <div 
                  className="text-sm md:text-base text-zinc-300 leading-relaxed mb-6 whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-widest font-bold border border-zinc-800 bg-zinc-950 text-zinc-500">
                        <FaHashtag size={8} className="opacity-70" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Comment Section Container ── */}
          <div className="px-6 py-5">
            
            {/* Header / Meta */}
            <div className="flex items-center justify-between mb-5">
              <SectionLabel>{totalComments} {totalComments === 1 ? 'Response' : 'Responses'}</SectionLabel>
            </div>

            {/* Comment Composer */}
            {currentUser ? (
              <div className="mb-8 flex gap-3 md:gap-4 items-start">
                <Avatar name={currentUser.username || '?'} size={7} className="mt-1 shrink-0 hidden sm:flex" />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Contribute to the discussion..."
                    rows={3}
                    maxLength={10000}
                    className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-zinc-600 transition-colors duration-200 resize-y"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-[10px] text-zinc-600">{commentText.length} / 10000</span>
                    <button
                      onClick={submitComment}
                      disabled={!commentText.trim() || submitting}
                      className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-md transition-colors"
                    >
                      <FaPaperPlane size={10} /> {submitting ? 'Transmitting...' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8 py-4 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/30 text-center">
                <p className="font-mono text-xs text-zinc-500">
                  <a href="/login" className="text-red-500 hover:text-red-400 font-bold transition-colors">Log in</a>
                  {' '}to join the War Room discussion.
                </p>
              </div>
            )}

            {/* Comments Tree */}
            {loading ? (
              <LoadingSpinner />
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <FaRegComment size={24} className="text-zinc-800 mx-auto mb-3" />
                <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest font-bold">No responses yet</p>
              </div>
            ) : (
              <div className="pb-8">
                <CommentTree
                  comments={comments}
                  postId={post._id}
                  currentUser={currentUser}
                  onVote={handleVoteComment}
                  onCommentDeleted={() => setTotalComments(t => Math.max(0, t - 1))}
                />
                
                {hasMore && (
                  <button
                    onClick={() => loadComments(page + 1)}
                    className="mt-6 w-full py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md font-mono text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Load deeper threads ↓
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}