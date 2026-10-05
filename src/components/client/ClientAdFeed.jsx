// src/components/client/ClientAdFeed.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Search, User, ShieldCheck } from 'lucide-react';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://dodixclub-backend.onrender.com').replace(/\/+$/, '');

export default function ClientAdFeed() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchClientAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladies?approved=true`);
      const data = await response.json();
      if (data.success) {
        setAds(data.ladies || []);
      }
    } catch (error) {
      console.error('Failed to load active ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientAds();
    const interval = setInterval(fetchClientAds, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredAds = ads.filter(ad => {
    const matchesSearch = 
      (ad.name && ad.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ad.location && ad.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ad.specificLocation && ad.specificLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || ad.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleWhatsAppContact = (phone, name) => {
    if (!phone) {
      alert('WhatsApp contact number not provided for this profile.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent(`Hello ${name || 'Companion'}, I saw your live listing on Dodix Club and would like to connect.`);
    window.open(`https://wa.me/${cleanPhone}?text=${defaultMsg}`, '_blank');
  };

  if (loading) return <div className="text-slate-400 p-8 text-center text-sm">Loading active directory...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white">Explore Companions</h2>
          <p className="text-xs text-slate-400">Browse verified active listings in your area.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search area or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
            />
          </div>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Standard">Standard</option>
            <option value="VIP">VIP</option>
            <option value="Elite">Elite</option>
          </select>
        </div>
      </div>

      {filteredAds.length === 0 ? (
        <p className="text-slate-400 text-xs text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          No active companion profiles available right now. Check back soon!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAds.map((ad) => {
            // Robust photo fallback check (photo -> imageUrl -> image)
            const profilePhoto = ad.photo || ad.imageUrl || ad.image;

            return (
              <div key={ad._id || ad.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl transition hover:border-slate-700">
                <div>
                  {profilePhoto ? (
                    <div className="w-full h-52 overflow-hidden bg-slate-950 relative">
                      <img 
                        src={profilePhoto} 
                        alt={ad.name || 'Companion'} 
                        className="w-full h-full object-cover transition duration-300 hover:scale-105" 
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur text-pink-400 border border-pink-500/30 shadow">
                          {ad.category || 'VIP'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-52 bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                      <User size={36} className="mb-1 opacity-40" />
                      <span className="text-[11px] opacity-60">No Photo Available</span>
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur text-pink-400 border border-pink-500/30 shadow">
                          {ad.category || 'VIP'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                        {ad.name || ad.username}, {ad.age || '23'}
                        <ShieldCheck size={14} className="text-emerald-400" title="Verified Listing" />
                      </h3>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        ZMW {ad.price || '0'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} className="text-pink-500 shrink-0" /> 
                      {ad.specificLocation ? `${ad.specificLocation}, ` : ''}{ad.location || 'Lusaka'}
                    </p>

                    {ad.extraServices && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-800/80">
                        {ad.extraServices}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button 
                    onClick={() => handleWhatsAppContact(ad.phone, ad.name)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <MessageCircle size={16} /> WhatsApp Chat
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