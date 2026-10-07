import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Layers } from 'lucide-react';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

export default function CompanionPostsPanel({ currentUser }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPosts = async () => {
    if (!currentUser?.username) return;
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/ladies?username=${encodeURIComponent(currentUser.username)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.ladies)) {
        setPosts(data.ladies);
      }
    } catch (err) {
      console.error('Error fetching companion posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [currentUser?.username]);

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'approved') return post.status === 'active' || post.approved === true;
    return post.status === filter;
  });

  return (
    <div className="bg-[#12141c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="text-purple-500 w-6 h-6" /> Posts You've Made
          </h2>
          <p className="text-gray-400 text-sm">Monitor the review status of your advertisement listings.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
                filter === tab 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading your posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No {filter !== 'all' ? filter : ''} posts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => {
            const isApproved = post.status === 'active' || post.approved === true;
            const isPending = post.status === 'pending';
            const isRejected = post.status === 'rejected';

            return (
              <div key={post._id || post.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-gray-400">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                    
                    {isPending && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3 mr-1" /> Rejected
                      </span>
                    )}
                  </div>

                  <div className="h-32 bg-gray-800 rounded-lg mb-3 overflow-hidden relative">
                    {post.photo ? (
                      <img src={post.photo} alt="Listing preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600 text-xs">No image</div>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm truncate mb-1">{post.name || 'Advertisement Listing'}</h3>
                  <p className="text-gray-400 text-xs mb-1">Location: <span className="text-gray-200">{post.location}</span></p>
                  <p className="text-gray-400 text-xs">Price: <span className="text-purple-400 font-semibold">{post.price}</span></p>
                </div>

                {isRejected && post.rejectionReason && (
                  <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                    <span className="font-semibold">Reason:</span> {post.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}