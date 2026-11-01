// src/components/client/CompanionProfileSetup.jsx
import React from 'react';
import { Upload, X, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function CompanionProfileSetup({
  hasCompletedProfile,
  profileStep,
  errorMessage,
  selectedFiles,
  handleMultiPhotoUpload,
  removeFileAtIndex,
  handleStartMasking,
  currentMaskIndex,
  stickerType,
  setStickerType,
  containerRef,
  stickerPos,
  stickerSize,
  handleStickerMouseDown,
  handleStickerTouchStart,
  selectedEmoji,
  customLogo,
  handleSaveMaskAndNext,
  newAdData,
  handleInputChange,
  handleFormSubmit,
  loading,
  resetDirectoryForm,
  setActiveTab
}) {
  return (
    <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-pink-600/20 text-pink-400 rounded-2xl border border-pink-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {hasCompletedProfile ? 'Manage Permanent Companion Profile' : 'Mandatory Companion Profile Setup'}
              </h2>
              <p className="text-xs text-slate-400">
                {hasCompletedProfile 
                  ? 'Update your permanent profile details visible to male clients for bookings.' 
                  : 'Complete your initial profile & upload photos to publish your listing.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-950/50 border border-red-800/50 rounded-2xl text-xs text-red-300 font-semibold">
          {errorMessage}
        </div>
      )}

      {profileStep === 'photos_step' && (
        <form onSubmit={handleStartMasking} className="space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Upload Profile Photographs <span className="text-pink-500">(Min 2 required, Max 5 allowed)</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-800 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <Upload className="w-8 h-8 mb-2 text-pink-400" />
                <p className="text-xs text-slate-300 font-medium">Click to select photos (Min 2, Max 5)</p>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleMultiPhotoUpload} className="hidden" />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-square shadow-lg">
                  <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFileAtIndex(idx)} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={selectedFiles.length < 2 || selectedFiles.length > 5} className="w-full py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer">
            Proceed to Watermark Studio ({selectedFiles.length}/5 photos)
          </button>
        </form>
      )}

      {profileStep === 'masking_step' && selectedFiles[currentMaskIndex] && (
        <div className="space-y-6">
          <div className="bg-pink-600/10 border border-pink-500/30 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-pink-300 uppercase">Watermarking Image {currentMaskIndex + 1} of {selectedFiles.length}</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-pink-300 uppercase">Watermark Settings</h3>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button type="button" onClick={() => setStickerType('logo')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${stickerType === 'logo' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>Logo</button>
                <button type="button" onClick={() => setStickerType('emoji')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${stickerType === 'emoji' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>Emoji</button>
              </div>
            </div>
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
              <div ref={containerRef} className="relative inline-block overflow-hidden rounded-2xl border border-slate-800 shadow-xl select-none touch-none">
                <img src={URL.createObjectURL(selectedFiles[currentMaskIndex])} alt="Mask" className="max-h-[300px] object-contain pointer-events-none" />
                <div 
                  onMouseDown={handleStickerMouseDown}
                  onTouchStart={handleStickerTouchStart}
                  style={{ position: 'absolute', left: `${stickerPos.x}px`, top: `${stickerPos.y}px`, width: `${stickerSize}px`, height: `${stickerSize}px`, cursor: 'move' }} 
                  className="flex items-center justify-center z-20 touch-none"
                >
                  {stickerType === 'emoji' ? <span className="text-4xl">{selectedEmoji}</span> : <img src={customLogo} alt="Logo" className="w-full h-full object-contain pointer-events-none" />}
                </div>
              </div>
              <button type="button" onClick={handleSaveMaskAndNext} className="w-full mt-4 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer">
                {currentMaskIndex + 1 < selectedFiles.length ? 'Save Watermark & Next Photo' : 'Save & Proceed to Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {profileStep === 'details_step' && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
              <input type="text" name="name" value={newAdData.name} onChange={handleInputChange} placeholder="Enter your name" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category *</label>
              <select name="category" value={newAdData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required>
                <option value="" disabled>-- Select Category --</option>
                <option value="VIP">VIP</option>
                <option value="Elite">Elite</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age *</label>
              <input type="number" name="age" value={newAdData.age} onChange={handleInputChange} placeholder="Enter age" min="18" max="70" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Neighborhood *</label>
              <input type="text" name="neighborhood" value={newAdData.neighborhood} onChange={handleInputChange} placeholder="e.g. Woodlands, Kabulonga" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate (ZMW) *</label>
              <input type="text" name="rate" value={newAdData.rate} onChange={handleInputChange} placeholder="Rate / Price" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Phone (Prefilled) *</label>
              <input type="text" name="phone" value={newAdData.phone} onChange={handleInputChange} placeholder="WhatsApp Phone Number" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hosting Ability *</label>
              <select name="hosting" value={newAdData.hosting} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required>
                <option value="Yes">Yes (Hosting Available)</option>
                <option value="No">No (Outcall Only)</option>
                <option value="Both">Both (Hosting & Outcall)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bio / Services</label>
              <textarea name="bio" rows="3" value={newAdData.bio} onChange={handleInputChange} placeholder="Bio / Services..." className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white resize-none" />
            </div>

            <div className="sm:col-span-2 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Mandatory Companion Consent & Age Verification Rules</h4>
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="agreedToTerms" 
                  checked={newAdData.agreedToTerms} 
                  onChange={handleInputChange} 
                  className="mt-0.5 rounded border-slate-700 text-pink-600 focus:ring-pink-500 bg-slate-950" 
                  required 
                />
                <span className="text-[11px] text-slate-300 leading-relaxed">
                  I confirm that I am 18 years of age or older, that all submitted details and photographs are authentic, and that I consent to DodixClub's companion privacy policies, terms of service, and listing guidelines.
                </span>
              </label>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer">
            {loading ? 'Saving Profile...' : 'Save Permanent Profile & Update Directory'}
          </button>
        </form>
      )}

      {profileStep === 'success_step' && (
        <div className="text-center py-12 space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-xl font-extrabold text-white">Profile Successfully Saved!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your permanent booking profile has been updated and is live for client appointments.
          </p>
          <button onClick={() => setActiveTab('home')} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer">
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}