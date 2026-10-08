// src/components/admin/CompanionModal.jsx
import React, { useState } from 'react';
import { X, Eye, EyeOff, Check, User, CheckCircle2, XCircle, Maximize2, ZoomIn, ZoomOut, RotateCcw, Tag } from 'lucide-react';

export default function CompanionModal({ companion, onClose, onSavePrice, onApprove, onReject, onSaveCategory }) {
  const [isFaceRevealed, setIsFaceRevealed] = useState(false);
  const [price, setPrice] = useState(companion?.price || '');
  const [category, setCategory] = useState(companion?.category || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Fullscreen Image Viewer State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imgPosition, setImgPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!companion) return null;

  const companionId = companion._id || companion.id;

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    if (onSavePrice) {
      onSavePrice(companionId, price);
    }
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (onSaveCategory) {
      onSaveCategory(companionId, category);
    }
  };

  const handleAction = async (actionFn) => {
    if (!actionFn) return;
    try {
      setIsLoading(true);
      await actionFn(companionId);
    } catch (error) {
      console.error("Error executing moderation action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const rawPhoto = isFaceRevealed 
    ? (companion.originalPhoto || companion.unmaskedPhoto || companion.photo)
    : (companion.maskedPhoto || companion.photo || companion.originalPhoto);

  const displayName = (!companion.name || companion.name.toLowerCase() === 'female') 
    ? (companion.username ? `@${companion.username}` : 'Companion Profile') 
    : companion.name;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Zoom & Pan Handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setImgPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imgPosition.x, y: e.clientY - imgPosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setImgPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-3 truncate pr-4">
              <h3 className="text-sm font-bold text-white truncate">
                {displayName}
              </h3>
              <span className={`inline-flex items-center gap-1 border text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                companion.status === 'active' || companion.status === 'accepted'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : companion.status === 'rejected'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                Status: {companion.status || 'pending'}
              </span>
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

              <div className="relative aspect-square w-48 mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center group">
                {rawPhoto ? (
                  <>
                    <img 
                      key={isFaceRevealed ? 'unmasked' : 'masked'}
                      src={rawPhoto} 
                      alt={displayName}
                      className="w-full h-full object-contain object-center absolute inset-0 transition-opacity duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleResetZoom();
                        setIsImageViewerOpen(true);
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
                    >
                      <Maximize2 className="w-5 h-5" /> View Fullscreen & Zoom
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600">
                    <User size={48} className="opacity-40 mb-1" />
                    <span className="text-[10px]">No Photo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Comprehensive Submission Details */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Full Submission Details</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Name / Alias</span>
                  <strong className="text-white">{companion.name || companion.alias || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Category / Tier</span>
                  <strong className="text-purple-300">{companion.category || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Age</span>
                  <strong className="text-white">{companion.age || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">City / Location</span>
                  <strong className="text-white">{companion.location || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Neighborhood</span>
                  <strong className="text-white">{companion.specificLocation || companion.neighborhood || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Hosting Status</span>
                  <strong className="text-white">{companion.hosting || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">WhatsApp / Phone</span>
                  <strong className="text-emerald-400">{companion.phone || companion.whatsapp || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Owner Username</span>
                  <strong className="text-white">@{companion.username || 'N/A'}</strong>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Submitted Date</span>
                  <strong className="text-white">{formatDate(companion.createdAt)}</strong>
                </div>
              </div>

              <div className="mt-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">Description / Bio & Services</span>
                <p className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                  {companion.description || companion.bio || companion.extraServices || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Category & Price Management Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Category Management */}
              <form onSubmit={handleCategorySubmit} className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">Edit Category / Tier</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400" />
                    <input 
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Standard, VIP..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </form>

              {/* Price Management */}
              <form onSubmit={handlePriceSubmit} className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">Edit Price (ZMW)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">ZMW</span>
                    <input 
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-3 py-2 text-white text-xs focus:outline-none focus:border-pink-500"
                      placeholder="Enter price..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </form>

            </div>

            {/* Post Moderation Actions */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">Admin Post Moderation</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleAction(onApprove)}
                  className="flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {isLoading ? 'Processing...' : 'Approve Post'}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleAction(onReject)}
                  className="flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> {isLoading ? 'Processing...' : 'Reject Post'}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* FULLSCREEN ZOOMABLE IMAGE VIEWER MODAL */}
      {isImageViewerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 select-none">
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-md z-10 border-b border-white/10">
            <div className="text-white text-xs font-bold flex items-center gap-2">
              <span>{displayName}</span>
              <span className="text-slate-400 font-normal">({isFaceRevealed ? 'Unmasked' : 'Masked'})</span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-2xl">
              <button 
                onClick={handleZoomOut}
                className="text-white hover:text-indigo-400 p-1 cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-300 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={handleZoomIn}
                className="text-white hover:text-indigo-400 p-1 cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
              <button 
                onClick={handleResetZoom}
                className="text-white hover:text-indigo-400 p-1 cursor-pointer transition-colors"
                title="Reset Zoom & Position"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setIsImageViewerOpen(false)}
              className="text-slate-300 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className={`relative w-full h-full flex items-center justify-center overflow-hidden ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {rawPhoto && (
              <img 
                src={rawPhoto} 
                alt="Fullscreen View"
                style={{
                  transform: `translate(${imgPosition.x}px, ${imgPosition.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
                className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-none"
              />
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-slate-400 bg-black/70 px-4 py-1.5 rounded-full border border-white/10 pointer-events-none">
            {zoomLevel > 1 ? 'Drag image around to pan' : 'Use zoom controls above to inspect details'}
          </div>
        </div>
      )}
    </>
  );
}