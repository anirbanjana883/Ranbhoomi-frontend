import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../../App";
import CreatePostModal from "../../component/Community/CreatePostModal";
import { FaPlus, FaSearch, FaCommentAlt, FaRegClock, FaUserAstronaut, FaHashtag } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- The "Godfather" Theme Styles ---
    const pageTitleStyle = `
        text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter
        [text-shadow:0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(255,69,0,0.7)]
    `;

    const cardStyle = `
        bg-black border border-orange-700/30 rounded-xl p-6 relative overflow-hidden
        shadow-[0_0_15px_rgba(255,69,0,0.1)] 
        hover:border-orange-500/60 hover:shadow-[0_0_35px_rgba(255,69,0,0.25)] 
        transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group
    `;

    const buttonStyle = `
        flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold rounded-lg
        shadow-[0_0_20px_rgba(255,69,0,0.4)] 
        transition-all duration-300 transform 
        hover:bg-orange-700 hover:shadow-[0_0_30px_rgba(255,69,0,0.6)] hover:scale-105
    `;

    const inputStyle = `
        w-full bg-black border border-orange-900/50 rounded-lg py-3 pl-12 pr-4 text-gray-300 
        focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,69,0,0.3)] 
        focus:outline-none transition-all duration-300
        placeholder-gray-600
    `;

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const query = search ? `?search=${search}` : "";
            const { data } = await axios.get(`${serverUrl}/api/community/feed${query}`);
            setPosts(data.posts);
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPosts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="min-h-screen bg-black text-gray-300 pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
            
            {/* --- Header Section --- */}
            <div className="max-w-5xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-orange-900/30 pb-8">
                    <div>
                        <h1 className={pageTitleStyle}>
                            War Room
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
                            Strategize with fellow warriors. Share code, debug logic, and prepare for the final battle.
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className={buttonStyle}
                    >
                        <FaPlus size={14} /> <span>New Intel</span>
                    </button>
                </div>

                {/* --- Search Bar --- */}
                <div className="mt-8 relative max-w-2xl">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-700 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for strategies, bugs, or tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={inputStyle}
                    />
                </div>
            </div>

            {/* --- Feed Area --- */}
            <div className="max-w-4xl mx-auto space-y-6">
                {loading ? (
                    // Skeleton Loading
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-gray-900/20 border border-gray-800 rounded-xl animate-pulse"></div>
                    ))
                ) : posts.length === 0 ? (
                    // Empty State
                    <div className="text-center py-20 opacity-70">
                        <FaUserAstronaut className="text-6xl text-orange-900 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-500">The arena is silent.</h2>
                        <p className="text-gray-600 mt-2">Be the first to break the silence.</p>
                    </div>
                ) : (
                    // Post Cards
                    posts.map((post) => (
                        <div key={post._id} className={cardStyle}>
                            
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={post.author?.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                            alt="avatar"
                                            className="w-12 h-12 rounded-full border-2 border-orange-900 group-hover:border-orange-500 transition-colors object-cover"
                                        />
                                        <div className="absolute inset-0 rounded-full shadow-[0_0_10px_rgba(255,69,0,0.3)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-100 group-hover:text-orange-400 transition-colors duration-300">
                                            {post.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 font-mono">
                                            <span className="text-orange-600 font-bold">@{post.author?.username}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <FaRegClock size={10} />
                                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Content Preview */}
                            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 line-clamp-3 pl-1 border-l-2 border-orange-900/50 group-hover:border-orange-500/50 transition-colors">
                                {post.content}
                            </p>

                            {/* Card Footer */}
                            <div className="flex justify-between items-center border-t border-orange-900/20 pt-4 mt-2">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.slice(0, 3).map((tag, idx) => (
                                        <span key={idx} className="flex items-center gap-1 text-[11px] font-bold tracking-wide bg-orange-900/10 text-orange-500 px-3 py-1 rounded border border-orange-900/30">
                                            <FaHashtag size={8} /> {tag}
                                        </span>
                                    ))}
                                    {post.tags.length > 3 && (
                                        <span className="text-[10px] text-gray-600 py-1 font-mono">+{post.tags.length - 3} more</span>
                                    )}
                                </div>

                                {/* Reply Count */}
                                <div className="flex items-center gap-2 text-gray-500 text-sm group-hover:text-white transition-colors">
                                    <FaCommentAlt className="text-orange-700 group-hover:text-orange-500 transition-colors" />
                                    <span className="font-mono">{post.commentCount || 0} Replies</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- Create Post Modal --- */}
            {isModalOpen && (
                <CreatePostModal
                    onClose={() => setIsModalOpen(false)}
                    onPostCreated={(newPost) => setPosts([newPost, ...posts])}
                />
            )}
        </div>
    );
};

export default Community;