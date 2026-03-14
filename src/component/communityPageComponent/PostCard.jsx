// PostCard.jsx — single post row in the feed
import React from 'react';
import { FaHashtag, FaRegComment, FaTrashAlt } from 'react-icons/fa';
import { Avatar, VoteWidget, PlanBadge } from './CommunityAtoms.jsx';
import { timeAgo } from './communityUtils.js';

export default function PostCard({ post, onOpen, onVote, onDelete, currentUser }) {
  const score = (post.upvotes || 0) - (post.downvotes || 0);
  const isOwn = currentUser?._id === post.author?._id;

  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-lg transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800/30 cursor-pointer group"
      onClick={() => onOpen(post)}
    >
      <div className="flex gap-4 p-4 md:p-5">

        {/* --- Left Column: Vote Widget --- */}
        {/* Stop propagation so clicking upvote doesn't open the post modal */}
        <div className="shrink-0 pt-1" onClick={e => e.stopPropagation()}>
          <VoteWidget
            score={score}
            userVote={post.userVote || 0}
            onUp={() => onVote(post._id, 'CommunityPost', 1)}
            onDown={() => onVote(post._id, 'CommunityPost', -1)}
            vertical={true}
          />
        </div>

        {/* --- Right Column: Content --- */}
        <div className="flex-1 min-w-0">
          
          {/* Meta/Author Row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Avatar name={post.author?.username || '?'} size={5} />
            <span className="font-mono text-xs font-bold text-zinc-300">
              {post.author?.username || 'Unknown'}
            </span>
            <PlanBadge plan={post.author?.subscriptionPlan} />
            <span className="font-mono text-[10px] text-zinc-500">
              {timeAgo(post.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base md:text-lg font-bold text-zinc-100 leading-tight mb-2 line-clamp-2 group-hover:text-red-400 transition-colors duration-200 tracking-tight">
            {post.title}
          </h3>

          {/* Content Preview (Stripping HTML tags from sanitized markdown) */}
          <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4">
            {post.content?.replace(/<[^>]+>/g, '')}
          </p>

          {/* Footer (Tags & Actions) */}
          <div className="flex items-center justify-between gap-3 flex-wrap mt-auto">
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {post.tags?.slice(0, 4).map(t => (
                <span 
                  key={t} 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-widest font-bold border border-zinc-800 bg-zinc-950 text-zinc-500"
                >
                  <FaHashtag size={8} className="opacity-70" /> {t}
                </span>
              ))}
              {post.tags?.length > 4 && (
                <span className="inline-flex items-center px-1 py-0.5 font-mono text-[10px] font-bold text-zinc-600">
                  +{post.tags.length - 4}
                </span>
              )}
            </div>

            {/* Actions (Comments & Delete) */}
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                <FaRegComment size={12} />
                <span>{post.commentCount || 0}</span>
              </div>
              
              {isOwn && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(post._id); }}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-600 hover:text-red-500 transition-colors"
                  title="Delete Post"
                >
                  <FaTrashAlt size={10} /> Delete
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}