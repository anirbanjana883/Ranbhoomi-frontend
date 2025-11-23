import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App';
import { FaPaperPlane, FaTrash } from 'react-icons/fa';
import { useSelector } from 'react-redux'; // To get current user ID

const DiscussionPane = ({ slug }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  const { userData } = useSelector(state => state.user);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/comments/${slug}`, {
          withCredentials: true
        });
        setComments(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load discussions");
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [slug]);

  // Handle Post
  const handlePost = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/comments/${slug}`,
        { text: newComment },
        { withCredentials: true }
      );
      setComments([data, ...comments]); // Add new comment to top
      setNewComment("");
      toast.success("Comment posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (commentId) => {
      if(!window.confirm("Delete this comment?")) return;
      try {
          await axios.delete(`${serverUrl}/api/comments/${commentId}`, { withCredentials: true });
          setComments(comments.filter(c => c._id !== commentId));
          toast.success("Comment deleted");
      } catch(err) {
          toast.error("Failed to delete");
      }
  }

  if (loading) return <div className="p-4 text-gray-500 text-center animate-pulse">Loading discussions...</div>;

  return (
    <div className="flex flex-col h-full bg-black text-gray-300">
      
      {/* Input Area (Fixed at Top) */}
      <form onSubmit={handlePost} className="p-4 border-b border-orange-900/30 bg-gray-900/20">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts, hints, or solution..."
            className="w-full bg-gray-900 text-gray-200 border border-gray-700 rounded-lg p-3 pr-12 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm resize-none transition-all"
            rows="3"
          />
          <button
            type="submit"
            disabled={isPosting || !newComment.trim()}
            className="absolute bottom-3 right-3 text-orange-500 hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95"
            title="Post Comment"
          >
            <FaPaperPlane size={16} />
          </button>
        </div>
      </form>

      {/* Comments List (Scrollable) */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-orange-800/30 scrollbar-track-transparent">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-60">
             <p className="text-sm italic">No discussions yet. Be the first!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 group">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {comment.user?.photoUrl ? (
                   <img src={comment.user.photoUrl} alt={comment.user.name} className="w-8 h-8 rounded-full border border-orange-900/50 object-cover" />
                ) : (
                   <div className="w-8 h-8 rounded-full bg-orange-900/30 border border-orange-700/30 flex items-center justify-center text-orange-400 text-xs font-bold">
                      {comment.user?.name?.charAt(0).toUpperCase() || "?"}
                   </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-200">{comment.user?.name || "Anonymous"}</span>
                    <span className="text-xs text-gray-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 relative hover:border-gray-700 transition-colors">
                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                        {comment.text}
                    </p>
                    
                    {/* Delete Button (Visible on hover for owner) */}
                    {userData && userData._id === comment.user._id && (
                        <button 
                            onClick={() => handleDelete(comment._id)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded"
                            title="Delete Comment"
                        >
                            <FaTrash size={12} />
                        </button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscussionPane;