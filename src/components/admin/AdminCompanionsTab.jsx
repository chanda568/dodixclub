// src/components/admin/AdminCompanionsTab.jsx
import React, { useState } from 'react';
import { Video, Search, X, RefreshCw, MapPin, Eye, Edit3, Trash2, ShieldCheck, CheckCircle2, User } from 'lucide-react';

export default function AdminCompanionsTab({
  ladies,
  searchQuery,
  setSearchQuery,
  loadBackendData,
  handleOpenCompanionModal,
  handleDeleteCompanion,
  setFullScreenImage,
  setFullScreenVideo
}) {
  // Track failed image loads per companion ID/index to show fallback smoothly
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (key) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  const filteredLadies = ladies.filter(lady => {
    const name = lady.name || lady.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white">Companions & Profiles Database</h2>
          <p className="text-xs text-slate-400">Manage companion profiles, photos, videos, rates, and verification status</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search companion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleOpenCompanionModal(null)}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              + Add Companion
            </button>
            <button onClick={loadBackendData} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-300 transition cursor-pointer" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLadies.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 text-xs">
            No companions found matching your search.
          </div>
        ) : (
          filteredLadies.map((lady, i) => {
            const companionKey = lady._id || i;
            const displayName = lady.name || lady.username || 'Companion';
            const mediaUrl = lady.photo || lady.imageUrl || lady.image;
            const videoSource = lady.videoUrl || lady.verificationVideoUrl;
            const hasValidImage = mediaUrl && !imageErrors[companionKey];

            return (
              <div key={companionKey} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {hasValidImage ? (
                      <img 
                        src={mediaUrl} 
                        alt={displayName} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                        onClick={() => setFullScreenImage(mediaUrl)}
                        onError={() => handleImageError(companionKey)}
                      />
                    ) : videoSource ? (
                      <video 
                        src={videoSource} 
                        className="w-full h-full object-cover cursor-pointer" 
                        onClick={() => setFullScreenVideo(videoSource)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 text-[9px]">
                        <User size={20} className="opacity-40 mb-0.5" />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white truncate">{displayName}</h3>
                      {lady.verified && <CheckCircle2 size={14} className="text-pink-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="shrink-0 text-pink-400" /> <span className="truncate">{lady.location || 'Lusaka'}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-pink-950/80 text-pink-400 border border-pink-900/40 rounded-full text-[10px] font-bold">
                        {lady.rate || lady.category || 'Standard'}
                      </span>
                      {lady.age && (
                        <span className="text-[11px] text-slate-400 font-medium">Age: {lady.age}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400">
                    Status: <strong className="text-emerald-400">Active</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenCompanionModal(lady)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs transition cursor-pointer"
                      title="Edit Companion"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteCompanion(lady._id || lady.username)}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-900/40 rounded-xl text-xs transition cursor-pointer"
                      title="Delete Companion"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}