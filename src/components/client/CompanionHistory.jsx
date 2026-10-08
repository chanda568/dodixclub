// CompanionHistory.jsx
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Trash2, Eye, X, MapPin, Tag, DollarSign, Calendar, ArrowLeft, ShieldCheck, Home } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');

export default function CompanionHistory({ currentUser }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null); // State for viewing the full dedicated detail page

  const fetchMyAds = async () => {
    if (!currentUser?.username) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/ladies/my-ads/${currentUser.username}`);
      const data = await res.json();
      if (data.success) {
        setAds(data.ads);
      }
    } catch (err) {
      console.error("Failed to fetch ad history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAds();
  }, [currentUser?.username]);

  const handleDeleteAd = async (id, e) => {
    e.stopPropagation(); // Prevent triggering card click
    if (!window.confirm("Are you sure you want to delete this ad?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/ladies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAds(prev => prev.filter(ad => ad._id !== id));
        if (selectedAd?._id === id) setSelectedAd(null);
      } else {
        alert(data.error || "Failed to delete ad.");
      }
    } catch (err) {
      console.error("Error deleting ad:", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading your advertisement history...</div>;
  }

  // --- DEDICATED FULL PAGE VIEW FOR SELECTED AD ---
  if (selectedAd) {
    const status = (selectedAd.status || 'pending').toLowerCase();
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-fadeIn">
        {/* Top Bar with Back Button */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedAd(null)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0b101d] hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to History
          </button>

          {/* Status Badge */}
          <div>
            {(status === 'accepted' || status === 'approved') && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 text-xs font-semibold rounded-full">
                <CheckCircle size={14} /> {status === 'approved' ? 'Approved' : 'Accepted'}
              </span>
            )}
            {status === 'rejected' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/40 text-rose-400 border border-rose-900/50 text-xs font-semibold rounded-full">
                <XCircle size={14} /> Rejected
              </span>
            )}
            {status === 'pending' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 text-amber-400 border border-amber-900/50 text-xs font-semibold rounded-full">
                <Clock size={14} /> Pending Admin Approval
              </span>
            )}
          </div>
        </div>

        {/* Main Details Container */}
        <div className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
          
          {/* Header Info */}
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Submission Details</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">{selectedAd.name}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Submitted on: {selectedAd.createdAt ? new Date(selectedAd.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Rate / Price</span>
              <span className="text-emerald-400 font-bold text-lg">ZMW {selectedAd.price}</span>
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-purple-400" /> Uploaded Photographs (Masked & Unmasked Captured)
            </h3>
            {selectedAd.images && selectedAd.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedAd.images.map((imgUrl, idx) => (
                  <a 
                    key={idx} 
                    href={imgUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block group relative rounded-2xl overflow-hidden border border-slate-800 aspect-[3/4] bg-slate-950"
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Ad photo ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
                      <span className="text-xs text-white font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                        Click to view full size
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                No photographs attached to this submission.
              </div>
            )}
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-semibold flex items-center gap-1.5">
                <Tag size={13} className="text-purple-400" /> Category
              </span>
              <p className="text-white font-medium text-sm">{selectedAd.category || 'Standard'}</p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-semibold flex items-center gap-1.5">
                <MapPin size={13} className="text-rose-400" /> Location / Neighborhood
              </span>
              <p className="text-white font-medium text-sm">
                {selectedAd.location} {selectedAd.specificLocation ? `(${selectedAd.specificLocation})` : ''}
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-semibold flex items-center gap-1.5">
                <Home size={13} className="text-blue-400" /> Hosting
              </span>
              <p className="text-white font-medium text-sm">{selectedAd.hosting || 'No'}</p>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Description / Details</h3>
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedAd.description || selectedAd.bio || "No description provided for this ad."}
            </div>
          </div>

          {/* Bottom Back Button */}
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setSelectedAd(null)}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition cursor-pointer"
            >
              Back to History
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- DEFAULT LIST VIEW ---
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Advertisement History</h2>
        <p className="text-xs sm:text-sm text-slate-400">Review your complete ad submissions, photos, and live moderation status.</p>
      </div>

      {ads.length === 0 ? (
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <AlertCircle className="mx-auto text-slate-600" size={32} />
          <p className="text-sm">You haven't posted any advertisements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => {
            const status = (ad.status || 'pending').toLowerCase();
            return (
              <div 
                key={ad._id}
                onClick={() => setSelectedAd(ad)}
                className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:border-slate-700 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail Preview */}
                  {ad.images && ad.images.length > 0 ? (
                    <img 
                      src={ad.images[0]} 
                      alt={ad.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-800 flex-shrink-0 group-hover:opacity-90 transition" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                      No Img
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-white font-bold text-base group-hover:text-purple-400 transition">{ad.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-md font-medium">
                        {ad.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {ad.location} {ad.specificLocation ? `• ${ad.specificLocation}` : ''} • <strong className="text-slate-200">ZMW {ad.price}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Submitted on: {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Status Badge */}
                  {(status === 'accepted' || status === 'approved') && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 text-xs font-semibold rounded-full">
                      <CheckCircle size={14} /> {status === 'approved' ? 'Approved' : 'Accepted'}
                    </span>
                  )}
                  {status === 'rejected' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/40 text-rose-400 border border-rose-900/50 text-xs font-semibold rounded-full">
                      <XCircle size={14} /> Rejected
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 text-amber-400 border border-amber-900/50 text-xs font-semibold rounded-full">
                      <Clock size={14} /> Pending
                    </span>
                  )}

                  {/* View Full Details Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAd(ad);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition flex items-center gap-1 text-xs px-3 cursor-pointer"
                    title="View Full Post"
                  >
                    <Eye size={15} /> <span className="hidden md:inline">View Post</span>
                  </button>

                  <button 
                    onClick={(e) => handleDeleteAd(ad._id, e)}
                    className="p-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 rounded-xl transition cursor-pointer"
                    title="Delete Ad"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}