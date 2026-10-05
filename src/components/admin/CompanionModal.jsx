// src/components/admin/CompanionModal.jsx
import React, { useState } from 'react';
import { X, Eye, EyeOff, DollarSign, Video, Check, User, Upload, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://dodixclub-backend.onrender.com').replace(/\/+$/, '');

export default function CompanionModal({ companion, onClose, onSavePrice, loadBackendData }) {
  const [isFaceRevealed, setIsFaceRevealed] = useState(false);
  const [price, setPrice] = useState(companion?.price || '');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  if (!companion) return null;

  const companionId = companion._id || companion.id;
  const hasVerificationVideo = Boolean(companion?.verificationVideoUrl);

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    onSavePrice(companionId, price);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Video = reader.result;
      setUploadingVideo(true);

      try {
        const response = await fetch(`${BACKEND_URL}/api/ladies/${companionId}/upload-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoBase64: base64Video, videoName: file.name })
        });
        const data = await response.json();
        if (data.success) {
          alert('Verification video uploaded successfully to S3!');
          if (loadBackendData) loadBackendData();
        } else {
          alert(data.error || 'Failed to upload video.');
        }
      } catch (err) {
        console.error('Error uploading video:', err);
        alert('Network error while uploading video.');
      } finally {
        setUploadingVideo(false);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Failed to read video file.');
    };
  };

  const rawPhoto = isFaceRevealed 
    ? (companion.realPhoto || companion.unmaskedPhoto || companion.photo || companion.imageUrl || companion.image)
    : (companion.maskedPhoto || companion.originalPhoto || companion.photo || companion.imageUrl || companion.image);

  const displayName = (!companion.name || companion.name.toLowerCase() === 'female') 
    ? (companion.username ? `@${companion.username}` : 'Companion Profile') 
    : companion.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 truncate pr-4">
            <h3 className="text-sm font-bold text-white truncate">
              {displayName}
            </h3>
            {hasVerificationVideo ? (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                <ShieldCheck size={12} /> Verified Video Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                <AlertCircle size={12} /> Video Pending
              </span>
            )}
          </div>
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
          <form onSubmit={handlePriceSubmit} className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">Edit Companion Rate / Price (ZMW)</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
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

          {/* Existing Videos Section */}
          {(companion.verificationVideoUrl || (companion.videos && companion.videos.length > 0)) && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Verification / Showcase Videos</label>
              <div className="grid grid-cols-2 gap-3">
                {companion.verificationVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(companion.verificationVideoUrl)}
                    className="flex items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Video className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-xs text-slate-200 truncate">Verification Video</span>
                  </button>
                )}
                {companion.videos && companion.videos.map((vid, idx) => (
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

          {/* Upload New Video Section */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">Upload / Update Verification Video</label>
            <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-xl cursor-pointer transition-colors bg-slate-900/50 ${uploadingVideo ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploadingVideo ? (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Loader2 className="w-5 h-5 animate-spin text-pink-500" /> Uploading to S3...
                </div>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-200">Click to select video file</span>
                  <span className="text-[10px] text-slate-500">MP4, WebM supported</span>
                </>
              )}
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleVideoUpload} 
                className="hidden" 
                disabled={uploadingVideo}
              />
            </label>
          </div>

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