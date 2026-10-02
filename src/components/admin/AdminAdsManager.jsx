// src/components/admin/AdminAdsManager.jsx
import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, Trash2 } from 'lucide-react';

export default function AdminAdsManager() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use Vite environment variable matching your Vercel configuration
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://dodixclub-backend.onrender.com';

  const fetchAdminAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladies`);
      const data = await response.json();
      if (data.success) {
        setAds(data.ladies);
      }
    } catch (error) {
      console.error('Failed to sync admin ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAds();
  }, []);

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAdminAds();
      }
    } catch (error) {
      console.error('Failed to approve ad:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchAdminAds();
      }
    } catch (error) {
      console.error('Failed to delete ad:', error);
    }
  };

  if (loading) return <div className="text-slate-400 p-4">Syncing database records...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Advertisement Moderation Panel</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <div key={ad._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                ad.approved 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {ad.approved ? <CheckCircle size={12} /> : <Clock size={12} />}
                {ad.approved ? 'Approved' : 'Pending'}
              </span>
              <span className="text-xs font-bold text-slate-300">ZMW {ad.price}</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white">{ad.name}, {ad.age}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={12} /> {ad.location}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {!ad.approved && (
                <button 
                  onClick={() => handleApprove(ad._id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-lg transition"
                >
                  Approve
                </button>
              )}
              <button 
                onClick={() => handleDelete(ad._id)}
                className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-lg transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}