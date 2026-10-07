// CompanionHistory.jsx
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Trash2, Eye, X, MapPin, Tag, DollarSign, Calendar } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');

export default function CompanionHistory({ currentUser }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null); // State for opening the preview modal

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

  const handleDeleteAd = async (id) => {
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
                className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail Preview */}
                  {ad.images && ad.images.length > 0 ? (
                    <img 
                      src={ad.images[0]} 
                      alt={ad.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-800 flex-shrink-0" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                      No Img
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-white font-bold text-base">{ad.name}</h3>
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
                    onClick={() => setSelectedAd(ad)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition flex items-center gap-1 text-xs px-3"
                    title="View Full Post"
                  >
                    <Eye size={15} /> <span className="hidden md:inline">View Post</span>
                  </button>

                  <button 
                    onClick={() => handleDeleteAd(ad._id)}
                    className="p-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 rounded-xl transition"
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

      {/* FULL POST PREVIEW MODAL */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Advert Preview</span>
                <h3 className="text-xl font-bold text-white">{selectedAd.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedAd(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Images Grid */}
            {selectedAd.images && selectedAd.images.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Uploaded Photographs</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedAd.images.map((imgUrl, idx) => (
                    <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block group relative rounded-xl overflow-hidden border border-slate-800 aspect-square">
                      <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No photographs uploaded for this post.</p>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Tag size={15} className="text-purple-400 flex-shrink-0" />
                <span><strong>Category:</strong> {selectedAd.category}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <DollarSign size={15} className="text-emerald-400 flex-shrink-0" />
                <span><strong>Rate/Price:</strong> ZMW {selectedAd.price}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={15} className="text-rose-400 flex-shrink-0" />
                <span><strong>Location:</strong> {selectedAd.location} {selectedAd.specificLocation ? `(${selectedAd.specificLocation})` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar size={15} className="text-blue-400 flex-shrink-0" />
                <span><strong>Submitted:</strong> {selectedAd.createdAt ? new Date(selectedAd.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            {/* Description / Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Description / Details</label>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedAd.description || selectedAd.bio || "No description provided."}
              </div>
            </div>

            {/* Modal Footer / Close */}
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedAd(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}