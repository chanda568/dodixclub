// src/components/client/ClientAdFeed.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, MessageCircle, DollarSign, Search } from 'lucide-react';

export default function ClientAdFeed() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://dodixclub-backend.onrender.com';

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
  }, []);

  const filteredAds = ads.filter(ad => {
    const matchesSearch = 
      (ad.name && ad.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ad.location && ad.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ad.specificLocation && ad.specificLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || ad.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="text-slate-400 p-4">Loading active directory...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h2 className="text-xl font-bold text-white">Explore Companions</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search area or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
            />
          </div>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
          >
            <option value="All">All Categories</option>
            <option value="Standard">Standard</option>
            <option value="VIP">VIP</option>
            <option value="Elite">Elite</option>
          </select>
        </div>
      </div>

      {filteredAds.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
          No active companion profiles available right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredAds.map((ad) => (
            <div key={ad._id || ad.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-lg">
              <div>
                {ad.photo && (
                  <img src={ad.photo} alt={ad.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      {ad.category || 'Standard'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center">
                      <DollarSign size={14} /> ZMW {ad.price}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-lg">{ad.name}, {ad.age}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} className="text-pink-400" /> {ad.specificLocation || 'General'}, {ad.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <a 
                  href={`https://wa.me/${ad.phone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}