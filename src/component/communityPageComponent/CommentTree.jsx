// CommentTree.jsx — recursive comment thread with lazy reply loading
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Updated to react-hot-toast
import { FaReply, FaChevronDown, FaChevronRight, FaPaperPlane, FaTrashAlt } from 'react-icons/fa';
import { Avatar, VoteWidget, PlanBadge } from './CommunityAtoms.jsx';
import { timeAgo } from './communityUtils.js';
import { serverUrl } from '../../App';
import API from '../../api/axios.js';

/* ── Single comment + its children ─────────────────────────── */
function CommentNode({ comment, postId, depth, currentUser, onVote, onDelete }) {
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(depth >= 3); // Auto-collapse deep nesting
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [children, setChildren] = useState(comment.children || []);
  const [loadingMore, setLoadingMore] = useState(false);

  const canReply = depth < 9 && currentUser;

  const submitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await API.post(
        `/community/comment`,
        { postId, parentCommentId: comment._id, content: replyText.trim() }
      );
      
      const newComment = data.data || data;
      newComment.children = [];
      newComment.author = newComment.author || { username: currentUser.username };
      
      setChildren(prev => [...prev, newComment]);
      setCollapsed(false);
      setReplyText('');
      setShowReply(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const loadSubtree = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await API.get(
        `/community/comments/${comment._id}/replies`
      );
      const replies = data.data || data;
      setChildren(replies);
      setCollapsed(false);
    } catch {
      toast.error('Failed to load replies');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this comment?')) return;
    onDelete?.(comment._id);
  };

  const isOwn = currentUser?._id === comment.author?._id;
  const isDeleted = comment.isDeleted;
  const score = (comment.upvotes || 0) - (comment.downvotes || 0);

  return (
    <div className={`transition-all duration-300 ${depth > 0 ? 'ml-3 md:ml-6 pl-3 md:pl-4 border-l border-zinc-800' : 'mb-6'}`}>
      <div className="flex gap-3 pt-2">
        {/* Avatar */}
        <Avatar name={comment.author?.username || '?'} size={6} className="shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          {/* Author + Meta Row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold ${isDeleted ? 'text-zinc-500' : 'text-zinc-200'}`}>
              {comment.author?.username || '[deleted]'}
            </span>
            {!isDeleted && <PlanBadge plan={comment.author?.subscriptionPlan} />}
            <span className="font-mono text-[10px] text-zinc-500">
              {timeAgo(comment.createdAt)}
            </span>
            {isOwn && !isDeleted && (
               <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded-sm">You</span>
            )}
          </div>

          {/* Comment Body */}
          <p className={`text-sm leading-relaxed mb-2 break-words ${isDeleted ? 'text-zinc-500 italic font-mono text-xs' : 'text-zinc-300'}`}>
            {comment.content}
          </p>

          {/* Action Row */}
          {!isDeleted && (
            <div className="flex items-center gap-4 flex-wrap mt-2">
              <VoteWidget
                score={score}
                userVote={comment.userVote || 0}
                onUp={() => onVote(comment._id, 'CommunityComment', 1)}
                onDown={() => onVote(comment._id, 'CommunityComment', -1)}
                vertical={false}
              />

              {canReply && (
                <button
                  onClick={() => setShowReply(r => !r)}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <FaReply size={10} /> Reply
                </button>
              )}

              {children.length > 0 && (
                <button
                  onClick={() => setCollapsed(c => !c)}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {collapsed ? <FaChevronRight size={10} /> : <FaChevronDown size={10} />}
                  {collapsed ? `Show ${children.length}` : `Hide`} {children.length === 1 ? 'reply' : 'replies'}
                </button>
              )}

              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-red-500 transition-colors ml-auto"
                >
                  <FaTrashAlt size={10} /> Delete
                </button>
              )}
            </div>
          )}

          {/* Reply Composer UI */}
          {showReply && !isDeleted && (
            <div className="mt-4 mb-2">
              <textarea
                autoFocus
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write your response..."
                rows={2}
                maxLength={2000}
                className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-zinc-600 transition-colors duration-200 resize-y"
              />
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => { setShowReply(false); setReplyText(''); }}
                  className="font-mono text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReply}
                  disabled={!replyText.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-md transition-colors"
                >
                  <FaPaperPlane size={10} /> {submitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Children (Recursive Rendering) ── */}
      {!collapsed && children.length > 0 && (
        <div className="mt-2">
          {children.map(child => (
            <CommentNode
              key={child._id}
              comment={child}
              postId={postId}
              depth={depth + 1}
              currentUser={currentUser}
              onVote={onVote}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Lazy-load Subtree Trigger */}
      {!collapsed && comment.hasMoreReplies && (
        <button
          onClick={loadSubtree}
          disabled={loadingMore}
          className="mt-3 ml-2 font-mono text-xs font-bold text-red-500 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loadingMore ? 'Loading data...' : `↳ Load ${comment.replyCount || 'more'} replies`}
        </button>
      )}
    </div>
  );
}

/* ── Exported Comment Tree (Root Level) ─────────────────────── */
export default function CommentTree({ comments, postId, currentUser, onVote, onCommentDeleted }) {
  const [localComments, setLocalComments] = useState(comments);

  const handleDelete = async (commentId) => {
    try {
      await API.delete(`/community/comments/${commentId}`);
      
      // Soft-delete UI: Mark the specific node as deleted recursively
      const softDelete = (list) => list.map(c =>
        c._id === commentId
          ? { ...c, isDeleted: true, content: '[This comment was deleted by the user]' }
          : { ...c, children: softDelete(c.children || []) }
      );
      
      setLocalComments(prev => softDelete(prev));
      toast.success('Comment deleted successfully');
      onCommentDeleted?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete comment');
    }
  };

  useEffect(() => { 
    setLocalComments(comments); 
  }, [comments]);

  if (!localComments || localComments.length === 0) {
    return (
      <div className="py-10 text-center border border-zinc-800 border-dashed rounded-lg bg-zinc-900/30">
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest font-bold">No replies yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {localComments.map(c => (
        <CommentNode
          key={c._id}
          comment={c}
          postId={postId}
          depth={0}
          currentUser={currentUser}
          onVote={onVote}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}