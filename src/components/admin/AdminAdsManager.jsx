// src/components/admin/AdminAdsManager.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Trash2, Calendar, MessageCircle, Video } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://dodixclub-backend.onrender.com';

export default function AdminAdsManager() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladies`);
      const data = await response.json();
      if (data.success && Array.isArray(data.ladies)) {
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
    const interval = setInterval(fetchAdminAds, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently remove this live advertisement?")) return;
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

  const handleWhatsAppContact = (phone, name) => {
    if (!phone || phone === 'Not Provided') {
      const manualPhone = prompt(`Enter WhatsApp number for @${name || 'companion'} (with country code):`);
      if (!manualPhone) return;
      phone = manualPhone.trim();
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent(`Hello @${name || 'Companion'}, regarding your live Dodix advertisement:`);
    window.open(`https://wa.me/${cleanPhone}?text=${defaultMsg}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) return <div className="text-slate-400 p-4 text-xs">Syncing direct-posted records from MongoDB...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Live Advertisements Management</h2>
          <p className="text-xs text-slate-400">All companion listings post directly. Manage active ads, rates, and media below.</p>
        </div>
      </div>

      {ads.length === 0 ? (
        <p className="text-slate-400 text-xs py-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          No advertisements found in the database.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div key={ad._id || ad.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 shadow">
                  <CheckCircle size={12} /> LIVE DIRECT
                </span>
                <span className="text-xs font-bold text-emerald-400">ZMW {ad.price || '0'}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">{ad.name || ad.username}, {ad.age || '23'}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={12} className="text-pink-500" /> {ad.specificLocation || ad.location || 'Lusaka'}
                </p>
                <p className="text-xs text-slate-500">Owner: @{ad.username}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                  <Calendar size={11} className="text-slate-400" /> Posted: {formatDate(ad.createdAt)}
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button 
                  onClick={() => handleWhatsAppContact(ad.phone, ad.username)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 shadow"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button 
                  onClick={() => handleDelete(ad._id || ad.id)}
                  className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-900/50 px-3 py-2 rounded-xl transition flex items-center justify-center"
                  title="Remove Ad"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}