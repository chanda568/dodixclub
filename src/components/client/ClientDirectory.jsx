// src/components/client/ClientDirectory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, MessageSquare, Sparkles, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, ShieldAlert, RefreshCw, CheckCircle, Flag, ChevronRight, Heart, CreditCard, Settings, Send, Upload, Image as ImageIcon, History as HistoryIcon, Bell, Plus, Trash2, Shield, Check, MessageCircle, Activity, Circle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_URL } from '../../data/constants';
import LogoLoader from '../common/LogoLoader';
import { encryptStorageData, decryptStorageData } from '../../utils/storageEncryption';

// Sanitize BACKEND_URL by removing trailing slashes
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

export default function ClientDirectory({ 
  currentUser, 
  setCurrentUser = () => {}, 
  ladies = [], 
  setLadies = () => {}, 
  isLoading = false, 
  loadingText = '' 
}) {
  const isFemaleUser = currentUser?.gender?.toLowerCase() === 'female' || currentUser?.gender?.toLowerCase() === 'lady';
  const isAdminUser = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';
  
  const [activeTab, setActiveTab] = useState(isAdminUser ? 'news' : (isFemaleUser ? 'myprofile' : 'directory'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedUsername, setReportedUsername] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false);
  const [isStickerProcessing, setIsStickerProcessing] = useState(false);
  
  const userLockedLocation = currentUser?.location || 'Lusaka';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');
  
  // Profile Form States
  const initialName = currentUser?.username && !['female', 'lady', 'client'].includes(currentUser.username.toLowerCase()) 
    ? currentUser.username 
    : (currentUser?.name || '');
    
  const [formName, setFormName] = useState(initialName);
  const [formAge, setFormAge] = useState(currentUser?.age || '');
  const [formCity, setFormCity] = useState(currentUser?.location || 'Lusaka');
  const [formCategory, setFormCategory] = useState(currentUser?.category || 'Independent');
  const [formPhone, setFormPhone] = useState(currentUser?.phone || '');
  const [formWhatsapp, setFormWhatsapp] = useState(currentUser?.whatsapp || '');
  const [formRates, setFormRates] = useState(currentUser?.rates || '');
  const [formPrice, setFormPrice] = useState(currentUser?.price || '');
  const [formDescription, setFormDescription] = useState(currentUser?.description || '');
  const [formServices, setFormServices] = useState(currentUser?.services || []);
  const [formImage, setFormImage] = useState(currentUser?.image || currentUser?.avatar || '');
  const [isSubmittingAd, setIsSubmittingAd] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Sticker Positioning States
  const [stickerPosition, setStickerPosition] = useState({ x: 50, y: 30 });
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const imagePreviewRef = useRef(null);

  // Profile History
  const [profileHistory, setProfileHistory] = useState([
    { id: 1, action: 'Account Created', timestamp: new Date().toISOString(), status: 'Active' }
  ]);

  // Notifications State
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome!', message: 'Welcome to the platform. Explore verified listings around you.', time: 'Just now', read: false },
    { id: 2, title: 'Security Tip', message: 'Never share your banking credentials or passwords with anyone.', time: '1h ago', read: false }
  ]);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  // Calculate today's ads posted by user
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaysUserAds = ladies.filter(l => {
    const isOwner = l.phone === currentUser?.phone || l.name?.toLowerCase() === currentUser?.username?.toLowerCase();
    const adDate = l.createdAt ? new Date(l.createdAt) : new Date(0);
    return isOwner && adDate >= todayStart;
  });

  const adsRemaining = Math.max(0, 5 - todaysUserAds.length);

  // Handle Dragging Sticker
  const handleTouchOrMouseDown = (e) => {
    setIsDraggingSticker(true);
    updateStickerPosition(e);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingSticker) return;
    updateStickerPosition(e);
  };

  const handleMouseUp = () => {
    setIsDraggingSticker(false);
  };

  const updateStickerPosition = (e) => {
    if (!imagePreviewRef.current) return;
    const rect = imagePreviewRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    let y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setStickerPosition(prev => ({ ...prev, x, y }));
  };

  // 4. Save Advertisement to Backend API
  const handleSaveLadyProfileManual = async () => {
    if (adsRemaining <= 0) {
      alert("You have reached your daily limit of 5 advertisements per day. Please try again tomorrow.");
      return;
    }

    if (!formPhone || !formPrice) {
      alert("Please fill in at least your Phone number and Price / Rates.");
      return;
    }

    setIsSubmittingAd(true);
    setFormError('');
    setFormSuccess('');

    try {
      const newAdData = {
        name: formName || currentUser?.username || 'Verified Lady',
        age: formAge || 21,
        city: formCity || userLockedLocation,
        location: formCity || userLockedLocation,
        category: formCategory || 'Independent',
        phone: formPhone,
        whatsapp: formWhatsapp || formPhone,
        rates: formRates || formPrice,
        price: formPrice,
        description: formDescription || 'Verified profile listing.',
        services: formServices,
        image: formImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
        verified: true,
        createdAt: new Date().toISOString()
      };

      const res = await fetch(`${BACKEND_URL}/api/ladies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdData)
      });

      if (!res.ok) {
        throw new Error('Failed to submit advertisement to server.');
      }

      const savedAd = await res.json();
      setLadies(prev => [savedAd, ...prev]);
      setFormSuccess('Advertisement successfully submitted! It will be visible to clients after admin review and approval.');
        
        const newHistoryItem = {
          id: Date.now(),
          action: 'Submitted Advertisement',
          timestamp: new Date().toISOString(),
          status: 'Pending Admin Approval'
        };
        const updatedHistory = [newHistoryItem, ...profileHistory];
        setProfileHistory(updatedHistory);

        // Reset some form fields if desired
        setFormDescription('');
    } catch (err) {
      console.error("Error saving ad:", err);
      setFormError(err.message || 'Error submitting advertisement.');
    } finally {
      setIsSubmittingAd(false);
    }
  };

  // Image Upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0b101d]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="w-9 h-9 object-cover rounded-xl shadow-md border border-pink-500/30" />
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Directory Portal
              </h1>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <MapPin size={10} className="text-pink-500" /> {userLockedLocation} Verified Zone
              </p>
            </div>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem('currentUser');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 hover:bg-rose-900/50 text-xs font-bold transition cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-[#0b101d] border-r border-slate-800/80 p-4 shrink-0">
          <div className="space-y-1.5 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 px-3 pb-1">Menu</p>
            
            {isFemaleUser && (
              <button 
                onClick={() => setActiveTab('myprofile')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <User size={16} /> Post Advertisement
              </button>
            )}

            <button 
              onClick={() => setActiveTab('history')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'history' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <HistoryIcon size={16} /> Activity History
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                {currentUser?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser?.username || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{currentUser?.role || currentUser?.gender || 'Client'}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Modal */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black z-50 md:hidden"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-[#0b101d] border-r border-slate-800 z-50 p-5 flex flex-col justify-between md:hidden shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-xl border border-pink-500/30" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">Menu Navigation</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white cursor-pointer">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-2 mt-6">
                    {isFemaleUser && (
                      <button 
                        onClick={() => { setActiveTab('myprofile'); setSidebarOpen(false); }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                      >
                        <User size={16} /> Post Advertisement
                      </button>
                    )}
                    <button 
                      onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'history' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <HistoryIcon size={16} /> Activity History
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                      {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{currentUser?.username || 'User'}</p>
                      <p className="text-[10px] text-slate-400 truncate capitalize">{currentUser?.role || currentUser?.gender || 'Client'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070913]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <LogoLoader />
              <p className="text-sm font-bold text-slate-300 mt-4 animate-pulse">{loadingText || 'Loading Portal...'}</p>
            </div>
          ) : (
            activeTab === 'myprofile' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-[#0b101d] border border-slate-800/80 p-6 rounded-3xl shadow-xl">
                  <h2 className="text-2xl font-black text-white tracking-tight">Post Advertisement</h2>
                  <p className="text-xs text-slate-400 mt-1">Upload your photo and position the privacy sticker over your face.</p>
                </div>

                <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  {formError && (
                    <div className="bg-rose-950/60 border border-rose-800/60 p-4 rounded-2xl text-xs text-rose-300 font-semibold flex items-center gap-2">
                      <ShieldAlert size={16} /> {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div className="bg-emerald-950/60 border border-emerald-800/60 p-4 rounded-2xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                      <CheckCircle size={16} /> {formSuccess}
                    </div>
                  )}

                  {/* Photo & Privacy Sticker Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Profile Photo & Face Sticker</label>
                      <div 
                        ref={imagePreviewRef}
                        onMouseDown={handleTouchOrMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleTouchOrMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                        className="relative w-full h-72 rounded-3xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-900 flex items-center justify-center cursor-crosshair shadow-inner"
                      >
                        {formImage ? (
                          <img src={formImage} alt="Preview" className="w-full h-full object-cover pointer-events-none select-none" />
                        ) : (
                          <div className="text-center p-6 text-slate-500">
                            <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-medium">Click below to upload photo</p>
                          </div>
                        )}

                        {/* Draggable Privacy Sticker */}
                        {formImage && (
                          <div 
                            style={{ left: `${stickerPosition.x}%`, top: `${stickerPosition.y}%`, transform: 'translate(-50%, -50%)' }}
                            className="absolute w-20 h-20 rounded-full bg-black/80 backdrop-blur-md border-2 border-pink-500/80 flex flex-col items-center justify-center shadow-2xl pointer-events-none select-none z-20 animate-pulse"
                          >
                            <Shield size={22} className="text-pink-400 mb-0.5" />
                            <span className="text-[9px] font-black uppercase tracking-tighter text-white">Privacy Protected</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">💡 Click and drag the privacy sticker anywhere on your face in the preview box above.</p>

                      <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-md">
                        <Upload size={16} className="text-pink-500" /> Upload New Photo
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Display Name / Title</label>
                        <input 
                          type="text" 
                          value={formName} 
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Jessica"
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500 transition shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Age</label>
                          <input 
                            type="number" 
                            value={formAge} 
                            onChange={(e) => setFormAge(e.target.value)}
                            placeholder="21"
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500 transition shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">City / Location</label>
                          <input 
                            type="text" 
                            value={formCity} 
                            onChange={(e) => setFormCity(e.target.value)}
                            placeholder="Lusaka"
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Phone Number *</label>
                          <input 
                            type="text" 
                            value={formPhone} 
                            onChange={(e) => setFormPhone(e.target.value)}
                            placeholder="097xxxxxxx"
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500 transition shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">WhatsApp</label>
                          <input 
                            type="text" 
                            value={formWhatsapp} 
                            onChange={(e) => setFormWhatsapp(e.target.value)}
                            placeholder="097xxxxxxx"
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Price / Rates *</label>
                        <input 
                          type="text" 
                          value={formPrice} 
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder="e.g. K500 / hr"
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500 transition shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">About / Description</label>
                    <textarea 
                      rows={3}
                      value={formDescription} 
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Write a short bio or description..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-pink-500 transition shadow-inner resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleSaveLadyProfileManual}
                      disabled={isSubmittingAd}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmittingAd && <Loader2 size={16} className="animate-spin" />}
                      {isSubmittingAd ? 'Submitting Ad to Server...' : 'Submit Advertisement for Approval'}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}