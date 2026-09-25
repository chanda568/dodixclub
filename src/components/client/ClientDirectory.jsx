// src/components/client/ClientDirectory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, MessageSquare, Sparkles, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, RefreshCw, CheckCircle, Flag, Heart, CreditCard, Settings, Upload, Image as ImageIcon, Video, History as HistoryIcon, Bell, Plus, Trash2, Shield, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_URL } from '../../data/constants';
import LogoLoader from '../common/LogoLoader';
import { encryptStorageData, decryptStorageData } from '../../utils/storageEncryption';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ClientDirectory({ 
  currentUser, setCurrentUser, ladies, setLadies, isLoading, loadingText 
}) {
  const isFemaleUser = currentUser?.gender?.toLowerCase() === 'female' || currentUser?.gender?.toLowerCase() === 'lady';
  const isAdminUser = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';
  
  const [activeTab, setActiveTab] = useState(isAdminUser ? 'news' : (isFemaleUser ? 'myprofile' : 'directory'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedUsername, setReportedUsername] = useState('');
  const [reportReason, setReportReason] = useState('');
  
  const userLockedLocation = currentUser?.location || 'Lusaka';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVisibility, setNewVisibility] = useState('all');

  useEffect(() => {
    try {
      const savedAnnouncements = localStorage.getItem('dodix_announcements_db');
      if (savedAnnouncements) {
        setAnnouncements(decryptStorageData(savedAnnouncements) || []);
      }
    } catch (err) {
      console.error("Error loading announcements:", err);
    }
  }, []);

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Please provide both a title and content.");
      return;
    }
    const newAnnouncement = {
      id: Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      visibility: newVisibility,
      timestamp: new Date().toLocaleString()
    };
    const updated = [newAnnouncement, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('dodix_announcements_db', encryptStorageData(updated));
    setNewTitle('');
    setNewContent('');
    alert("Announcement successfully published!");
  };

  const handleDeleteAnnouncement = (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    const updated = announcements.filter(item => item.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('dodix_announcements_db', encryptStorageData(updated));
  };

  const myExistingLadyProfile = ladies.find(
    l => l.name?.toLowerCase() === currentUser?.username?.toLowerCase() || l.username?.toLowerCase() === currentUser?.username?.toLowerCase()
  );

  const [formName, setFormName] = useState(myExistingLadyProfile?.name || currentUser?.username || '');
  const [formCategory, setFormCategory] = useState(myExistingLadyProfile?.category || 'VIP');
  const [formPrice, setFormPrice] = useState(myExistingLadyProfile?.price || '');
  const [formLocation, setFormLocation] = useState(myExistingLadyProfile?.location || userLockedLocation);
  const [formSpecific, setFormSpecific] = useState(myExistingLadyProfile?.specificLocation || '');
  const [formPhone, setFormPhone] = useState(myExistingLadyProfile?.phone || '');
  const [formPhoto, setFormPhoto] = useState(myExistingLadyProfile?.photo || '');
  const [formAge, setFormAge] = useState(myExistingLadyProfile?.age || '23');
  const [formHosting, setFormHosting] = useState(myExistingLadyProfile?.hosting || 'Yes');
  const [formServices, setFormServices] = useState(myExistingLadyProfile?.extraServices || '');

  const [rawImageForSticker, setRawImageForSticker] = useState(null);
  const [stickerPosition, setStickerPosition] = useState({ x: 50, y: 30, size: 65 });
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const stickerContainerRef = useRef(null);

  const [verificationVideoUrl, setVerificationVideoUrl] = useState(myExistingLadyProfile?.verificationVideoUrl || '');
  const [verificationVideoName, setVerificationVideoName] = useState(myExistingLadyProfile?.verificationVideoName || '');

  const [profileHistory, setProfileHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`dodix_history_${currentUser?.username}`);
      return saved ? (decryptStorageData(saved) || []) : [
        { id: 1, action: 'Profile Initialized', timestamp: new Date().toLocaleString(), status: 'Pending Review' }
      ];
    } catch {
      return [];
    }
  });

  const handleLocalImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageForSticker(reader.result);
      setStickerPosition({ x: 50, y: 30, size: 65 });
    };
    reader.readAsDataURL(file);
  };

  const handleApplyStickerAndSave = () => {
    if (!rawImageForSticker) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const stickerImg = new Image();
      stickerImg.crossOrigin = "anonymous";
      stickerImg.onload = () => {
        const sX = (stickerPosition.x / 100) * canvas.width;
        const sY = (stickerPosition.y / 100) * canvas.height;
        const sRadius = (stickerPosition.size / 200) * Math.min(canvas.width, canvas.height);

        ctx.save();
        ctx.beginPath();
        ctx.arc(sX, sY, sRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(stickerImg, sX - sRadius, sY - sRadius, sRadius * 2, sRadius * 2);
        ctx.restore();

        setFormPhoto(canvas.toDataURL('image/jpeg', 0.9));
        setRawImageForSticker(null);
      };
      stickerImg.src = LOGO_URL;
    };
    img.src = rawImageForSticker;
  };

  const handlePointerMoveOnStickerArea = (e) => {
    if (!isDraggingSticker || !stickerContainerRef.current) return;
    const rect = stickerContainerRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
    setStickerPosition(prev => ({ ...prev, x, y }));
  };

  const handleVideoUploadSimulation = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVerificationVideoUrl(URL.createObjectURL(file));
      setVerificationVideoName(file.name);
    }
  };

  const handleSaveLadyProfile = async (e) => {
    e.preventDefault();
    if (!formPhone || !formPrice) {
      alert("Please fill in your phone number and rate/price.");
      return;
    }
    if (!verificationVideoUrl) {
      alert("Mandatory requirement: Please upload a promotional advertisement video clip.");
      return;
    }

    const updatedProfile = {
      username: currentUser.username,
      name: formName || currentUser.username,
      category: formCategory,
      price: formPrice,
      location: formLocation,
      specificLocation: formSpecific,
      phone: formPhone,
      photo: formPhoto || myExistingLadyProfile?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      age: formAge,
      hosting: formHosting,
      extraServices: formServices,
      verificationVideoUrl,
      verificationVideoName: verificationVideoName || 'Promotional_Clip.mp4',
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      const data = await response.json();
      if (data.success) {
        alert("Your companion listing details have been saved successfully!");
      } else {
        alert(data.error || "Failed to submit profile.");
      }
    } catch (err) {
      console.error("Error submitting profile:", err);
      alert("Network error connecting to server.");
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportedUsername.trim() || !reportReason.trim()) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporter: currentUser.username, targetUser: reportedUsername.trim(), reason: reportReason.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setReportedUsername('');
        setReportReason('');
        setReportModalOpen(false);
        alert("Report submitted successfully.");
      }
    } catch (err) {
      console.error("Error submitting report:", err);
    }
  };

  const handleOpenWhatsApp = (lady) => {
    const phoneNum = lady.phone ? lady.phone.replace(/[^0-9]/g, '') : '260970000000';
    const message = `Hello ${lady.name}, I found your listing on DodixClub and would like to connect regarding booking availability in ${lady.location}.`;
    window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!currentUser) return null;

  const approvedLadies = ladies.filter(l => l.approved !== false);
  const filteredLadies = approvedLadies.filter(l => {
    const matchesLoc = l.location === userLockedLocation;
    const matchesCat = selectedCategory === 'All' || l.category === selectedCategory;
    const matchesSearch = l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.specificLocation && l.specificLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLoc && matchesCat && matchesSearch;
  });

  const visibleAnnouncements = announcements.filter(item => {
    if (isAdminUser) return true;
    if (item.targetUsername) return item.targetUsername === currentUser.username?.toLowerCase();
    if (item.visibility === 'all') return true;
    if (item.visibility === 'female' && isFemaleUser) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative font-sans selection:bg-pink-500 selection:text-white">
      {isLoading && <LogoLoader text={loadingText} />}

      {/* Privacy Sticker Editor Modal */}
      <AnimatePresence>
        {rawImageForSticker && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-xl w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-500" />
                  <h3 className="text-sm font-bold text-white">Privacy Sticker Editor</h3>
                </div>
                <button onClick={() => setRawImageForSticker(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X size={18} /></button>
              </div>
              <div 
                ref={stickerContainerRef}
                onPointerDown={() => setIsDraggingSticker(true)}
                onPointerUp={() => setIsDraggingSticker(false)}
                onPointerMove={handlePointerMoveOnStickerArea}
                className="relative w-full h-80 bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none cursor-crosshair touch-none"
              >
                <img src={rawImageForSticker} alt="Raw" className="max-h-full max-w-full object-contain pointer-events-none" />
                <div style={{ left: `${stickerPosition.x}%`, top: `${stickerPosition.y}%`, width: `${stickerPosition.size}px`, height: `${stickerPosition.size}px`, transform: 'translate(-50%, -50%)' }} className="absolute rounded-full overflow-hidden border-2 border-pink-500 shadow-2xl bg-slate-950/80 pointer-events-none flex items-center justify-center">
                  <img src={LOGO_URL} alt="Mask" className="w-full h-full object-cover scale-110 pointer-events-none" />
                </div>
              </div>
              <input type="range" min="40" max="90" value={stickerPosition.size} onChange={(e) => setStickerPosition(prev => ({ ...prev, size: Number(e.target.value) }))} className="w-full accent-pink-500 cursor-pointer" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setRawImageForSticker(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
                <button onClick={handleApplyStickerAndSave} className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"><Check size={16} /> Apply & Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && !isFemaleUser && !isAdminUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-lg w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
              <button onClick={() => setSelectedProfile(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition"><X size={20} /></button>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-lg shrink-0 bg-slate-950">
                  <img src={selectedProfile.photo} alt={selectedProfile.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-white">{selectedProfile.name}, {selectedProfile.age || '23'}</h3>
                  <p className="text-xs text-pink-400 font-semibold uppercase">{selectedProfile.category || 'VIP'} Companion</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={14} className="text-pink-500" /> {selectedProfile.specificLocation || selectedProfile.location}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedProfile(null); handleOpenWhatsApp(selectedProfile); }} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg">
                <MessageSquare size={16} /> Contact via WhatsApp
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Report Time Waster</h3>
                <button onClick={() => setReportModalOpen(false)} className="p-2 text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <input type="text" placeholder="Client username" value={reportedUsername} onChange={(e) => setReportedUsername(e.target.value)} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200" required />
                <textarea rows="3" placeholder="Describe what happened..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 resize-none" required />
                <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs">Submit Report</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition"><Menu size={20} /></button>
          <div>
            <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-pink-500 to-purple-400 bg-clip-text text-transparent">DODIXCLUB</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              {isAdminUser ? 'Platform Administration Portal' : (isFemaleUser ? 'Companion Management Portal' : 'Verified Elite Portal')}
            </p>
          </div>
        </div>
        <button onClick={() => { sessionStorage.removeItem('dodix_current_user'); setCurrentUser(null); }} className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
          <LogOut size={16} /> Logout
        </button>
      </nav>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="w-72 bg-[#0b101d] border-r border-slate-800 p-6 flex flex-col justify-between h-full shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="font-black text-sm text-white">DODIXCLUB</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
                </div>
                <div className="space-y-2">
                  {!isFemaleUser && !isAdminUser && (
                    <button onClick={() => { setActiveTab('directory'); setSidebarOpen(false); }} className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 ${activeTab === 'directory' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-slate-400'}`}><Compass size={16} /> Elite Directory</button>
                  )}
                  {isFemaleUser && (
                    <>
                      <button onClick={() => { setActiveTab('myprofile'); setSidebarOpen(false); }} className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-slate-400'}`}><User size={16} /> My Companion Profile</button>
                    </>
                  )}
                  <button onClick={() => { setActiveTab('news'); setSidebarOpen(false); }} className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 ${activeTab === 'news' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-slate-400'}`}><Bell size={16} /> {isAdminUser ? 'Manage Announcements' : 'News & Announcements'}</button>
                  {!isFemaleUser && !isAdminUser && (
                    <button onClick={() => { setActiveTab('favorites'); setSidebarOpen(false); }} className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 ${activeTab === 'favorites' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-slate-400'}`}><Heart size={16} /> Favorites</button>
                  )}
                  {!isAdminUser && (
                    <button onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }} className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 ${activeTab === 'settings' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-slate-400'}`}><Settings size={16} /> Account Details</button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">
        <main className="flex-1 overflow-hidden">
          {activeTab === 'news' ? (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-black text-white">{isAdminUser ? 'Admin Announcement Management' : 'News & Announcements'}</h2>
                <p className="text-xs text-slate-400 mt-1">Platform updates and announcements.</p>
              </div>
              {isAdminUser && (
                <form onSubmit={handleCreateAnnouncement} className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <input type="text" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200" required />
                  <select value={newVisibility} onChange={(e) => setNewVisibility(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200">
                    <option value="all">Visible to All</option>
                    <option value="female">Visible Only to Females</option>
                  </select>
                  <textarea rows="3" placeholder="Content..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 resize-none" required />
                  <button type="submit" className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl text-xs">Publish</button>
                </form>
              )}
              <div className="space-y-4">
                {visibleAnnouncements.map((item) => (
                  <div key={item.id} className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-pink-400">{item.timestamp}</span>
                      {isAdminUser && <button onClick={() => handleDeleteAnnouncement(item.id)} className="p-1 bg-red-950 text-red-400 rounded-lg"><Trash2 size={14} /></button>}
                    </div>
                    <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-300">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : isFemaleUser && activeTab === 'myprofile' ? (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-black text-white">Companion Listing Management</h2>
                <p className="text-xs text-slate-400 mt-1">Configure your directory listing details and upload privacy sticker-masked photos.</p>
              </div>
              <form onSubmit={handleSaveLadyProfile} className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Display Name" className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
                  <input type="text" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="Rate (ZMW)" className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
                  <input type="text" value={formAge} onChange={(e) => setFormAge(e.target.value)} placeholder="Age" className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
                  <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="WhatsApp Number" className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" required />
                </div>
                <textarea rows="3" value={formServices} onChange={(e) => setFormServices(e.target.value)} placeholder="Services & Bio..." className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white resize-none" />
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><ImageIcon size={14} className="text-pink-500" /> Choose & Mask Advertisement Photo</label>
                  <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Video size={14} className="text-pink-500" /> Upload Promotional Video Clip</label>
                  <input type="file" accept="video/*" onChange={handleVideoUploadSimulation} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer" />
                </div>
                <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl text-xs shadow-lg">Save & Submit Listing</button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 bg-[#0b101d] border border-slate-800 p-5 rounded-3xl shadow-xl">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input type="text" placeholder="Search by name or area..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLadies.map((lady) => (
                  <div key={lady.id || lady._id} className="bg-[#0b101d] border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col group">
                    <div className="relative h-72 overflow-hidden bg-slate-950">
                      <img src={lady.photo} alt={lady.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-3 right-3">
                        <span className="bg-emerald-500/90 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <ShieldCheck size={12} /> VERIFIED FEMALE
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                      <h3 className="text-white font-black text-lg">{lady.name}, {lady.age || '23'}</h3>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button onClick={() => setSelectedProfile(lady)} className="py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs border border-slate-800">View Profile</button>
                        <button onClick={() => handleOpenWhatsApp(lady)} className="py-2.5 bg-emerald-600 text-white font-black rounded-xl text-xs shadow-lg">WhatsApp</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}