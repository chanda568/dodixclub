// src/components/admin/CompanionModal.jsx
import React, { useState } from 'react';
import { X, Eye, EyeOff, DollarSign, Video, Check, User } from 'lucide-react';

export default function CompanionModal({ companion, onClose, onSavePrice }) {
  const [isFaceRevealed, setIsFaceRevealed] = useState(false);
  const [price, setPrice] = useState(companion?.price || '');
  const [selectedVideo, setSelectedVideo] = useState(null);

  if (!companion) return null;

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    onSavePrice(companion._id || companion.id, price);
  };

  // Determine valid photo source with fallback
  const rawPhoto = isFaceRevealed 
    ? (companion.realPhoto || companion.photo || companion.imageUrl || companion.image)
    : (companion.maskedPhoto || companion.photo || companion.imageUrl || companion.image);

  // Clean name display (prevent literal "female" or empty names)
  const displayName = (!companion.name || companion.name.toLowerCase() === 'female') 
    ? (companion.username ? `@${companion.username}` : 'Companion Profile') 
    : companion.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <h3 className="text-sm font-bold text-white truncate pr-4">
            Companion Inspection: {displayName}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Photo & Privacy Mode Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Profile Photo & Privacy Mode</label>
              <button
                type="button"
                onClick={() => setIsFaceRevealed(!isFaceRevealed)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isFaceRevealed 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isFaceRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isFaceRevealed ? 'Showing Unmasked Face' : 'Masked (Privacy Stickers)'}
              </button>
            </div>

            <div className="relative aspect-square w-48 mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center">
              {rawPhoto ? (
                <img 
                  src={rawPhoto} 
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600">
                  <User size={48} className="opacity-40 mb-1" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Management */}
          <form onSubmit={handlePriceSubmit} className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">Edit Companion Rate / Price (ZMW)</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-pink-500"
                  placeholder="Enter price..."
                />
              </div>
              <button 
                type="submit"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg"
              >
                <Check className="w-4 h-4" /> Save Price
              </button>
            </div>
          </form>

          {/* Videos Section */}
          {companion.videos && companion.videos.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Verification / Showcase Videos</label>
              <div className="grid grid-cols-2 gap-3">
                {companion.videos.map((vid, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedVideo(vid)}
                    className="flex items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Video className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-xs text-slate-200 truncate">Video #{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Video Modal Sub-View */}
        {selectedVideo && (
          <div className="absolute inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <video 
              src={selectedVideo} 
              controls 
              autoPlay 
              className="max-h-[80vh] max-w-full rounded-xl shadow-2xl"
            />
          </div>
        )}

      </div>
    </div>
  );
}