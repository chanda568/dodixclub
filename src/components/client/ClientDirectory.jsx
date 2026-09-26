// src/components/client/ClientDirectory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, MessageSquare, Sparkles, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, ShieldAlert, RefreshCw, CheckCircle, Flag, ChevronRight, Heart, CreditCard, Settings, Send, Upload, Image as ImageIcon, Video, History as HistoryIcon, Bell, Plus, Trash2, Shield, Check, MessageCircle
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

  // News and Announcements state
  const [announcements, setAnnouncements] = useState([]);

  // Admin announcement form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVisibility, setNewVisibility] = useState('all');

  useEffect(() => {
    try {
      const savedAnnouncements = localStorage.getItem('dodix_announcements_db');
      if (savedAnnouncements) {
        const parsed = decryptStorageData(savedAnnouncements) || [];
        setAnnouncements(parsed);
      } else {
        const defaultAnnouncements = [
          {
            id: 1,
            title: 'General Platform Update',
            content: 'Welcome to DodixClub! Please ensure your account details and locations are updated for seamless matching.',
            visibility: 'all',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Exclusive Notice for Female Companions',
            content: 'Mandatory verification video clips must be updated regularly. You can post up to 5 advertisements daily.',
            visibility: 'female',
            timestamp: new Date().toISOString()
          }
        ];
        setAnnouncements(defaultAnnouncements);
        localStorage.setItem('dodix_announcements_db', encryptStorageData(defaultAnnouncements));
      }
    } catch (err) {
      console.error("Error loading announcements:", err);
    }
  }, []);

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Please provide both a title and content for the announcement.");
      return;
    }

    const newAnnouncement = {
      id: Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      visibility: newVisibility,
      timestamp: new Date().toISOString()
    };

    const updated = [newAnnouncement, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('dodix_announcements_db', encryptStorageData(updated));

    setNewTitle('');
    setNewContent('');
    setNewVisibility('all');
    alert("Announcement successfully published!");
  };

  const handleDeleteAnnouncement = (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    const updated = announcements.filter(item => item.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('dodix_announcements_db', encryptStorageData(updated));
  };

  const handleContactSupportWhatsApp = () => {
    const adminPhone = "260965039645"; // Admin Help Center Number
    const supportMsg = encodeURIComponent("Hello Dodix Support, I need assistance with my account/subscription.");
    window.open(`https://wa.me/${adminPhone}?text=${supportMsg}`, '_blank');
  };

  // Calculate ads posted today by this user
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaysUserAds = ladies.filter(l => {
    const isOwner = l.username?.toLowerCase() === currentUser?.username?.toLowerCase() || l.name?.toLowerCase() === currentUser?.username?.toLowerCase();
    const adDate = l.createdAt ? new Date(l.createdAt) : new Date(0);
    return isOwner && adDate >= todayStart;
  });

  const adsRemaining = Math.max(0, 5 - todaysUserAds.length);

  const [formName, setFormName] = useState(currentUser?.username || '');
  const [formCategory, setFormCategory] = useState('VIP');
  const [formPrice, setFormPrice] = useState('');
  const [formLocation, setFormLocation] = useState(userLockedLocation);
  const [formSpecific, setFormSpecific] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formAge, setFormAge] = useState('23');
  const [formHosting, setFormHosting] = useState('Yes');
  const [formServices, setFormServices] = useState('');

  // Compact Interactive Sticker Editor states for face privacy masking
  const [rawImageForSticker, setRawImageForSticker] = useState(null);
  const [stickerPosition, setStickerPosition] = useState({ x: 50, y: 30, size: 65 });
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const stickerContainerRef = useRef(null);

  const [verificationVideoUrl, setVerificationVideoUrl] = useState('');
  const [verificationVideoName, setVerificationVideoName] = useState('');

  const [profileHistory, setProfileHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`dodix_history_${currentUser?.username}`);
      return saved ? (decryptStorageData(saved) || []) : [
        { id: 1, action: 'Profile Initialized', timestamp: new Date().toISOString(), status: 'Ready' }
      ];
    } catch {
      return [];
    }
  });

  const handleLocalImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }

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
      const videoUrl = URL.createObjectURL(file);
      setVerificationVideoUrl(videoUrl);
      setVerificationVideoName(file.name);
    }
  };

  const handleSaveLadyProfile = async (e) => {
    e.preventDefault();

    if (adsRemaining <= 0) {
      alert("You have reached your daily limit of 5 advertisements per day. Please try again tomorrow.");
      return;
    }

    if (!formPhone || !formPrice) {
      alert("Please fill in your phone number and rate/price.");
      return;
    }

    if (!verificationVideoUrl) {
      alert("Mandatory requirement: Please upload a promotional advertisement video clip before submitting your ad.");
      return;
    }

    const newAdData = {
      username: currentUser.username,
      name: formName || currentUser.username,
      category: formCategory,
      price: formPrice,
      location: formLocation,
      specificLocation: formSpecific,
      phone: formPhone,
      photo: formPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
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
        body: JSON.stringify(newAdData)
      });
      const data = await response.json();

      if (data.success) {
        setLadies([data.companion, ...ladies]);
        alert(`Advertisement successfully posted! You have ${adsRemaining - 1} ad(s) remaining for today.`);
        
        const newHistoryItem = {
          id: Date.now(),
          action: `Published Advertisement (${6 - adsRemaining}/5)`,
          timestamp: new Date().toISOString(),
          status: 'Active / Published'
        };
        const updatedHistory = [newHistoryItem, ...profileHistory];
        setProfileHistory(updatedHistory);
        localStorage.setItem(`dodix_history_${currentUser?.username}`, encryptStorageData(updatedHistory));
      } else {
        alert(data.error || "Failed to post advertisement.");
      }
    } catch (err) {
      console.error("Error posting ad to backend:", err);
      alert("Network error connecting to server.");
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportedUsername.trim() || !reportReason.trim()) {
      alert("Please fill in the details of the time waster.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter: currentUser.username,
          targetUser: reportedUsername.trim(),
          reason: reportReason.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setReportedUsername('');
        setReportReason('');
        setReportModalOpen(false);
        alert("Your report has been successfully submitted to the platform administration.");
      } else {
        alert(data.error || "Failed to submit report.");
      }
    } catch (err) {
      console.error("Error submitting report to backend:", err);
      alert("Network error. Please try again.");
    }
  };

  const handleOpenWhatsApp = (lady) => {
    const phoneNum = lady.phone ? lady.phone.replace(/[^0-9]/g, '') : '260970000000';
    const message = `Hello ${lady.name}, I found your listing on DodixClub and would like to connect regarding booking availability in ${lady.location}.`;
    
    navigator.clipboard.writeText(message).catch(() => {});

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNum}?text=${encodedMessage}`, '_blank');
  };

  if (!currentUser) return null;

  const isMaleUser = !isFemaleUser && !isAdminUser;
  const isPendingActivation = isMaleUser && currentUser?.activated === false;

  if (isPendingActivation) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Clock size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Account Awaiting Activation</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your account (<span className="text-pink-400 font-semibold">{currentUser.username}</span>) has been successfully created. Male user accounts require package activation and administrative approval before gaining full access.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 transition"
            >
              <RefreshCw size={16} /> Sync & Check Activation Status
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem('dodix_current_user');
                setCurrentUser(null);
                window.location.reload();
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-800 transition"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
    if (item.targetUsername) {
      return item.targetUsername === currentUser.username?.toLowerCase();
    }
    if (item.visibility === 'all') return true;
    if (item.visibility === 'female' && isFemaleUser) return true;
    if (item.visibility === 'male' && isMaleUser) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative selection:bg-pink-500 selection:text-white font-sans">
      {isLoading && <LogoLoader text={loadingText} />}

      {/* Interactive Compact Circular Privacy Sticker Editor Modal */}
      <AnimatePresence>
        {rawImageForSticker && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-xl w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-500" />
                  <h3 className="text-sm font-bold text-white">Privacy Sticker Editor (Position over Face)</h3>
                </div>
                <button onClick={() => setRawImageForSticker(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-400">Drag the circular sticker over your face to ensure complete privacy protection.</p>

              <div 
                ref={stickerContainerRef}
                onPointerDown={() => setIsDraggingSticker(true)}
                onPointerUp={() => setIsDraggingSticker(false)}
                onPointerMove={handlePointerMoveOnStickerArea}
                className="relative w-full h-80 bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none cursor-crosshair touch-none"
              >
                <img src={rawImageForSticker} alt="Raw Upload" className="max-h-full max-w-full object-contain pointer-events-none" />
                
                <div 
                  style={{
                    left: `${stickerPosition.x}%`,
                    top: `${stickerPosition.y}%`,
                    width: `${stickerPosition.size}px`,
                    height: `${stickerPosition.size}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="absolute rounded-full overflow-hidden border-2 border-pink-500 shadow-2xl bg-slate-950/80 backdrop-blur-sm pointer-events-none flex items-center justify-center"
                >
                  <img src={LOGO_URL} alt="Sticker Mask" className="w-full h-full object-cover scale-110 pointer-events-none" />
                  <div className="absolute inset-0 bg-pink-500/10 rounded-full" />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Sticker Size</span>
                  <span>{stickerPosition.size}px</span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="90" 
                  value={stickerPosition.size} 
                  onChange={(e) => setStickerPosition(prev => ({ ...prev, size: Number(e.target.value) }))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setRawImageForSticker(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApplyStickerAndSave}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 transition flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Apply Sticker & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && !isFemaleUser && !isAdminUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedProfile(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition z-10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-lg shrink-0 bg-slate-950">
                  <img 
                    src={selectedProfile.photo} 
                    alt={selectedProfile.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white">{selectedProfile.name}, {selectedProfile.age || '23'}</h3>
                    <span className="bg-emerald-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <ShieldCheck size={11} /> VERIFIED FEMALE
                    </span>
                  </div>
                  <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider">{selectedProfile.category || 'VIP'} Companion</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={14} className="text-pink-500" /> {selectedProfile.specificLocation || selectedProfile.location}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Rate / Price</span>
                  <span className="text-sm font-extrabold text-emerald-400">ZMW {selectedProfile.price}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Hosting Available</span>
                  <span className="text-sm font-extrabold text-slate-200">{selectedProfile.hosting || 'Yes'}</span>
                </div>
              </div>

              {selectedProfile.extraServices && (
                <div className="space-y-1.5 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-300">Services & Preferences</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedProfile.extraServices}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button 
                  onClick={() => {
                    setSelectedProfile(null);
                    handleOpenWhatsApp(selectedProfile);
                  }}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                >
                  <MessageSquare size={16} /> Contact via WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-950/60 border border-red-800/40 text-red-400 rounded-xl">
                    <Flag size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Report Male Time Waster</h3>
                    <p className="text-xs text-slate-400">Submit details directly to administration</p>
                  </div>
                </div>
                <button onClick={() => setReportModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Client / Username</label>
                  <input 
                    type="text" 
                    placeholder="Enter client username or phone" 
                    value={reportedUsername} 
                    onChange={(e) => setReportedUsername(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500 transition" 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Reason / Details</label>
                  <textarea 
                    rows="3" 
                    placeholder="Describe what happened..." 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)} 
                    className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500 transition resize-none" 
                    required 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setReportModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2">
                    <Flag size={14} /> Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-pink-500 to-purple-400 bg-clip-text text-transparent">DODIXCLUB</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              {isAdminUser ? 'Platform Administration Portal' : (isFemaleUser ? 'Companion Management Portal' : 'Verified Elite Portal')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              sessionStorage.removeItem('dodix_current_user');
              setCurrentUser(null);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="w-72 bg-[#0b101d] border-r border-slate-800 p-6 flex flex-col justify-between h-full shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="font-black text-sm text-white">DODIXCLUB</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  {!isFemaleUser && !isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('directory'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'directory' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Compass size={16} /> Elite Directory
                    </button>
                  )}

                  {isFemaleUser && (
                    <>
                      <button 
                        onClick={() => { setActiveTab('myprofile'); setSidebarOpen(false); }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                      >
                        <User size={16} /> Post Advertisement ({adsRemaining}/5 left)
                      </button>
                      <button 
                        onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'history' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                      >
                        <HistoryIcon size={16} /> History
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => { setActiveTab('news'); setSidebarOpen(false); }}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'news' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                  >
                    <Bell size={16} /> {isAdminUser ? 'Manage Announcements' : 'News & Announcements'}
                  </button>

                  {!isFemaleUser && !isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('favorites'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'favorites' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Heart size={16} /> Favorites
                    </button>
                  )}

                  {!isFemaleUser && !isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('subscription'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'subscription' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <CreditCard size={16} /> Subscription Status
                    </button>
                  )}

                  {!isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'settings' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Settings size={16} /> Account Details
                    </button>
                  )}

                  <button 
                    onClick={() => { handleContactSupportWhatsApp(); setSidebarOpen(false); }}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white transition"
                  >
                    <MessageCircle size={16} className="text-pink-500" /> Contact Support
                  </button>

                  {isFemaleUser && (
                    <button 
                      onClick={() => { setReportModalOpen(true); setSidebarOpen(false); }}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition mt-2"
                    >
                      <Flag size={16} /> Report Time Waster
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Signed in as</span>
                  <p className="text-xs font-bold text-white truncate">{currentUser.username}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
          <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-5 space-y-2 shadow-xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3">Navigation</span>
            
            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('directory')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'directory' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <Compass size={16} /> Elite Directory
              </button>
            )}

            {isFemaleUser && (
              <>
                <button 
                  onClick={() => setActiveTab('myprofile')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <User size={16} /> Post Advertisement ({adsRemaining}/5 left)
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'history' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <HistoryIcon size={16} /> History
                </button>
              </>
            )}

            <button 
              onClick={() => setActiveTab('news')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'news' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Bell size={16} /> {isAdminUser ? 'Manage Announcements' : 'News & Announcements'}
            </button>

            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'favorites' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <Heart size={16} /> Favorites
              </button>
            )}

            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('subscription')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'subscription' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <CreditCard size={16} /> Subscription Status
              </button>
            )}

            {!isAdminUser && (
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${activeTab === 'settings' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <Settings size={16} /> Account Details
              </button>
            )}

            <button 
              onClick={handleContactSupportWhatsApp}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white transition"
            >
              <MessageCircle size={16} className="text-pink-500" /> Contact Support
            </button>

            {isFemaleUser && (
              <button 
                onClick={() => setReportModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition mt-4"
              >
                <Flag size={16} /> Report Time Waster
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          {activeTab === 'news' ? (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {isAdminUser ? 'Admin Announcement Management' : 'News & Announcements'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdminUser ? 'Create and manage announcements across visibility tiers (All, Females Only, Males Only).' : 'Important updates and status broadcasts from platform administration.'}
                </p>
              </div>

              {isAdminUser && (
                <form onSubmit={handleCreateAnnouncement} className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Shield size={18} className="text-pink-500" />
                    <h3 className="text-sm font-extrabold text-white">Broadcast New Announcement</h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Announcement Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. System Maintenance Notice" 
                      value={newTitle} 
                      onChange={(e) => setNewTitle(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Target Audience Visibility</label>
                      <select 
                        value={newVisibility} 
                        onChange={(e) => setNewVisibility(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                      >
                        <option value="all">Visible to All Users</option>
                        <option value="female">Visible Only to Females</option>
                        <option value="male">Visible Only to Males</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Announcement Content</label>
                    <textarea 
                      rows="3" 
                      placeholder="Write message details here..." 
                      value={newContent} 
                      onChange={(e) => setNewContent(e.target.value)} 
                      className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition resize-none" 
                      required 
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 transition flex items-center gap-2"
                    >
                      <Plus size={16} /> Publish Announcement
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 px-1">
                  {isAdminUser ? 'All Active Announcements' : 'Your Feed & Status Updates'}
                </h3>

                {visibleAnnouncements.length === 0 ? (
                  <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
                    <Bell size={24} className="mx-auto text-slate-500" />
                    <h3 className="text-sm font-bold text-white">No announcements available</h3>
                    <p className="text-xs text-slate-500">Check back later for news updates.</p>
                  </div>
                ) : (
                  visibleAnnouncements.map((item) => (
                    <div key={item.id} className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Just now'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            item.targetUsername ? 'bg-pink-950 text-pink-400 border border-pink-800/40' :
                            item.visibility === 'all' ? 'bg-purple-950 text-purple-400 border border-purple-800/40' :
                            item.visibility === 'female' ? 'bg-pink-950 text-pink-400 border border-pink-800/40' :
                            'bg-blue-950 text-blue-400 border border-blue-800/40'
                          }`}>
                            {item.targetUsername ? 'Personal Notification' : (item.visibility === 'all' ? 'All Users' : item.visibility === 'female' ? 'Females Only' : 'Males Only')}
                          </span>
                          
                          {isAdminUser && (
                            <button 
                              onClick={() => handleDeleteAnnouncement(item.id)}
                              className="p-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-lg transition"
                              title="Delete Announcement"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : isFemaleUser ? (
            activeTab === 'settings' ? (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Account Details</h2>
                  <p className="text-xs text-slate-400 mt-1">Update your account preferences and credentials.</p>
                </div>
                <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Username</label>
                    <input 
                      type="text" 
                      value={currentUser.username} 
                      disabled 
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Default City / Region</label>
                    <input 
                      type="text" 
                      value={userLockedLocation} 
                      disabled 
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>
            ) : activeTab === 'history' ? (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Companion Activity History</h2>
                  <p className="text-xs text-slate-400 mt-1">Track your daily advertisement submissions and logs.</p>
                </div>

                <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                  {profileHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">No historical logs available yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {profileHistory.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              {item.timestamp ? new Date(item.timestamp).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Just now'}
                            </span>
                            <h4 className="text-xs font-bold text-white">{item.action}</h4>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${item.status === 'Active / Published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950 text-amber-400 border border-amber-800/40'}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Post Advertisement</h2>
                    <p className="text-xs text-slate-400 mt-1">Configure your directory listing details and upload privacy sticker-masked advertisement photos.</p>
                  </div>
                  <div className="bg-pink-950/60 border border-pink-800/50 px-4 py-2 rounded-2xl text-center shadow-md">
                    <span className="text-[10px] text-pink-300 uppercase font-bold block">Ads Remaining Today</span>
                    <span className="text-sm font-extrabold text-white">{adsRemaining} / 5</span>
                  </div>
                </div>

                <form onSubmit={handleSaveLadyProfile} className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Display Name / Pseudonym</label>
                      <input 
                        type="text" 
                        value={formName} 
                        onChange={(e) => setFormName(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                        required 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Category</label>
                      <select 
                        value={formCategory} 
                        onChange={(e) => setFormCategory(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                      >
                        <option value="VIP">VIP</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Rate / Price (ZMW)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 300" 
                        value={formPrice} 
                        onChange={(e) => setFormPrice(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                        required 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Age</label>
                      <input 
                        type="text" 
                        value={formAge} 
                        onChange={(e) => setFormAge(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                        required 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">City / Location</label>
                      <input 
                        type="text" 
                        value={formLocation} 
                        onChange={(e) => setFormLocation(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                        required 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Specific Area (e.g. Chalala)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Chalala" 
                        value={formSpecific} 
                        onChange={(e) => setFormSpecific(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">WhatsApp Phone Number</label>
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-pink-500 transition">
                        <span className="px-3 py-3 bg-slate-950 text-pink-400 font-bold border-r border-slate-800 select-none text-xs">
                          +260
                        </span>
                        <input 
                          type="tel" 
                          required
                          placeholder="970000000" 
                          value={formPhone} 
                          onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ''))} 
                          className="w-full px-3 py-3 bg-transparent text-xs text-slate-200 focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Hosting Available</label>
                      <select 
                        value={formHosting} 
                        onChange={(e) => setFormHosting(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Services & Preferences Bio</label>
                    <textarea 
                      rows="3" 
                      placeholder="Describe what you enjoy doing..." 
                      value={formServices} 
                      onChange={(e) => setFormServices(e.target.value)} 
                      className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition resize-none" 
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-pink-500" /> Advertisement Photo with Privacy Sticker
                    </label>
                    <div className="flex items-center gap-4">
                      {formPhoto && (
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-800 shadow-md shrink-0 bg-slate-950">
                          <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition cursor-pointer flex items-center gap-2">
                        <Upload size={14} /> Choose & Mask Image
                        <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-2xl flex items-start gap-3">
                      <Sparkles size={20} className="text-purple-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Directory Advertisement Video</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Upload a short promotional video clip to showcase your listing and attract elite clients in your directory region.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Video size={14} className="text-pink-500" /> Upload Promotional Video Clip
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <label className="px-5 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 transition cursor-pointer flex items-center gap-2">
                          <Upload size={14} /> Upload Video File (.mp4/.mov)
                          <input type="file" accept="video/*" onChange={handleVideoUploadSimulation} className="hidden" />
                        </label>
                        {verificationVideoUrl && (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                            <CheckCircle size={14} /> {verificationVideoName || 'Video Uploaded'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={adsRemaining <= 0}
                      className="px-8 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 transition disabled:opacity-50"
                    >
                      {adsRemaining > 0 ? 'Post New Advertisement' : 'Daily Limit Reached (5/5)'}
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : (
            activeTab === 'favorites' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Your Favorites</h2>
                  <p className="text-xs text-slate-400 mt-1">Quickly access profiles you have saved.</p>
                </div>
                <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-pink-500">
                    <Heart size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-white">No favorite profiles yet</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">Browse the elite directory and bookmark your preferred companion listings.</p>
                </div>
              </div>
            ) : activeTab === 'subscription' ? (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Subscription Status</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage your active tier and platform access benefits.</p>
                </div>
                <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Current Tier</span>
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <Crown size={16} className="text-amber-400" /> Verified Elite Member
                      </h4>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-full text-xs font-extrabold uppercase">Active</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your account has full privileges to browse listings and connect with verified companions in {userLockedLocation}.
                  </p>
                </div>
              </div>
            ) : activeTab === 'settings' ? (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Account Details</h2>
                  <p className="text-xs text-slate-400 mt-1">Update your account preferences and credentials.</p>
                </div>
                <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Username</label>
                    <input 
                      type="text" 
                      value={currentUser.username} 
                      disabled 
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Default City / Region</label>
                    <input 
                      type="text" 
                      value={userLockedLocation} 
                      disabled 
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0b101d] border border-slate-800/80 p-5 rounded-3xl shadow-xl">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search by name or area (e.g. Chalala)..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    {['All', 'VIP', 'Standard'].map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${selectedCategory === cat ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLadies.length === 0 ? (
                    <div className="col-span-full text-center py-20 space-y-3 bg-[#0b101d] border border-slate-800/80 rounded-3xl">
                      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
                        <Compass size={28} />
                      </div>
                      <h3 className="text-base font-bold text-white">No companion profiles found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">Try adjusting your search query or category filter for {userLockedLocation}.</p>
                    </div>
                  ) : (
                    filteredLadies.map((lady) => (
                      <div 
                        key={lady.id || lady._id} 
                        className="bg-[#0b101d] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-pink-500/40 transition duration-300 flex flex-col group"
                      >
                        <div className="relative h-72 overflow-hidden bg-slate-950">
                          <img 
                            src={lady.photo} 
                            alt={lady.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b101d] via-transparent to-transparent opacity-80" />

                          <div className="absolute top-3 right-3">
                            <span className="bg-emerald-500/90 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                              <ShieldCheck size={12} /> VERIFIED FEMALE
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <div>
                              <h3 className="text-white font-black text-lg drop-shadow-md">
                                {lady.name}, <span className="font-normal text-slate-300">{lady.age || '23'}</span>
                              </h3>
                              <p className="text-slate-300 text-xs flex items-center gap-1 mt-0.5">
                                <MapPin size={12} className="text-pink-500" /> {lady.specificLocation || lady.location}
                              </p>
                            </div>
                            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-right">
                              <span className="text-[9px] text-slate-400 block font-bold">RATE</span>
                              <span className="text-emerald-400 font-black text-xs">ZMW {lady.price}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col gap-3 flex-grow justify-between">
                          <p className="text-slate-400 text-xs line-clamp-2">{lady.extraServices || "Available for social companionship and elite events."}</p>
                          
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                            <button 
                              onClick={() => setSelectedProfile(lady)}
                              className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition"
                            >
                              <User size={14} className="text-slate-400" /> View Profile
                            </button>
                            <button 
                              onClick={() => handleOpenWhatsApp(lady)}
                              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
                            >
                              <MessageSquare size={14} /> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}