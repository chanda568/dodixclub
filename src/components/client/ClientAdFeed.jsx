// src/components/client/ClientAdFeed.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, MessageCircle } from 'lucide-react';

export default function ClientAdFeed() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://dodixclub-backend.onrender.com';

  const fetchClientAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladies?approved=true`);
      const data = await response.json();
      if (data.success) {
        setAds(data.ladies);
      }
    } catch (error) {
      console.error('Failed to load active ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientAds();
  }, []);

  if (loading) return <div className="text-slate-400 p-4">Loading active directory...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Explore Companions</h2>

      {ads.length === 0 ? (
        <p className="text-slate-400 text-sm">No active profiles available right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div key={ad._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified
                </span>
                <span className="text-xs font-bold text-slate-300">ZMW {ad.price}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white">{ad.name}, {ad.age}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={12} /> {ad.location}
                </p>
              </div>

              <a 
                href={`https://wa.me/${ad.phone}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}