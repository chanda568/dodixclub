import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');

export default function CompanionHistory({ currentUser }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <p className="text-xs sm:text-sm text-slate-400">Monitor your active and pending ad submissions.</p>
      </div>

      {ads.length === 0 ? (
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <AlertCircle className="mx-auto text-slate-600" size={32} />
          <p className="text-sm">You haven't posted any advertisements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => {
            const isApproved = ad.approved === true;
            return (
              <div 
                key={ad._id}
                className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:border-slate-700"
              >
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
                    Submitted on: {new Date(ad.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {isApproved ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 text-xs font-semibold rounded-full">
                      <CheckCircle size={14} /> Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 text-amber-400 border border-amber-900/50 text-xs font-semibold rounded-full">
                      <Clock size={14} /> Pending Review
                    </span>
                  )}

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
    </div>
  );
}