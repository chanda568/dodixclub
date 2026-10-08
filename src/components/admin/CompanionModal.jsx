// src/components/admin/CompanionModal.jsx
import React, { useState } from 'react';
import { X, Eye, EyeOff, DollarSign, Check, User, CheckCircle2, XCircle, MapPin, Calendar, FileText, Phone } from 'lucide-react';

export default function CompanionModal({ companion, onClose, onSavePrice, onApprove, onReject }) {
  const [isFaceRevealed, setIsFaceRevealed] = useState(false);
  const [price, setPrice] = useState(companion?.price || '');
  const [isLoading, setIsLoading] = useState(false);

  if (!companion) return null;

  const companionId = companion._id || companion.id;

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    onSavePrice(companionId, price);
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

  return (
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

            <div className="relative aspect-square w-48 mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center">
              {rawPhoto ? (
                <img 
                  key={isFaceRevealed ? 'unmasked' : 'masked'}
                  src={rawPhoto} 
                  alt={displayName}
                  className="w-full h-full object-contain object-center absolute inset-0 transition-opacity duration-150"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600">
                  <User size={48} className="opacity-40 mb-1" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* COMPREHENSIVE SUBMISSION DETAILS BREAKDOWN */}
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

            {/* Bio / Description section */}
            <div className="mt-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">Description / Bio & Services</span>
              <p className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                {companion.description || companion.bio || companion.extraServices || 'No description provided.'}
              </p>
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
  );
}