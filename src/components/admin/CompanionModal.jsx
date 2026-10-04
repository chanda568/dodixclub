// src/components/admin/CompanionModal.jsx
import React, { useState } from 'react';
import { X, Eye, EyeOff, DollarSign, Video, Check } from 'lucide-react';

export default function CompanionModal({ companion, onClose, onSavePrice }) {
  const [isFaceRevealed, setIsFaceRevealed] = useState(false);
  const [price, setPrice] = useState(companion?.price || '');
  const [selectedVideo, setSelectedVideo] = useState(null);

  if (!companion) return null;

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    onSavePrice(companion._id, price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <h3 className="text-lg font-semibold text-white">
            Companion Inspection: {companion.name || 'Profile'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Photo & Privacy Mode Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Profile Photo & Privacy Mode</label>
              <button
                type="button"
                onClick={() => setIsFaceRevealed(!isFaceRevealed)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isFaceRevealed 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isFaceRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isFaceRevealed ? 'Showing Unmasked Face' : 'Masked (Privacy Stickers)'}
              </button>
            </div>

            <div className="relative aspect-square w-48 mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <img 
                src={isFaceRevealed ? (companion.realPhoto || companion.photo) : (companion.maskedPhoto || companion.photo)} 
                alt={companion.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Price Management */}
          <form onSubmit={handlePriceSubmit} className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <label className="block text-sm font-medium text-slate-300">Edit Companion Rate / Price</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Enter price..."
                />
              </div>
              <button 
                type="submit"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" /> Save Price
              </button>
            </div>
          </form>

          {/* Videos Section */}
          {companion.videos && companion.videos.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Verification / Showcase Videos</label>
              <div className="grid grid-cols-2 gap-3">
                {companion.videos.map((vid, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedVideo(vid)}
                    className="flex items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors text-left"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <video 
              src={selectedVideo} 
              controls 
              autoPlay 
              className="max-h-[80vh] max-w-full rounded-lg"
            />
          </div>
        )}

      </div>
    </div>
  );
}