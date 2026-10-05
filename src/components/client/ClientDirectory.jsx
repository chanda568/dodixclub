// src/components/client/ClientDirectory.jsx
import React, { useState, useEffect } from 'react';
import { 
  LogOut, MessageSquare, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, RefreshCw, CheckCircle, Flag, Heart, CreditCard, Settings, Bell, Plus, Trash2, Shield, MessageCircle, Loader2, DollarSign, AlertCircle, Save, Phone, Edit3, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const userLockedLocation = currentUser?.location || 'Lusaka';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVisibility, setNewVisibility] = useState('all');

  // Advertisement Form State & Default Logo Sticker State
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState('/logo.jpg');
  
  // Full-View Photo Editor Modal State
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [tempPhoto, setTempPhoto] = useState('');

  const initialName = currentUser?.username && !['female', 'lady', 'client'].includes(currentUser.username.toLowerCase()) 
    ? currentUser.username 
    : '';

  const [newAdData, setNewAdData] = useState({
    name: currentUser.name || initialName,
    category: currentUser.category || 'VIP',
    location: currentUser.location || userLockedLocation,
    phone: currentUser.phone || '',
    rate: currentUser.rate || '',
    photo: currentUser.photo || currentUser.photoUrl || '',
    bio: currentUser.bio || ''
  });

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

  // 1. Sync Live Listings from Backend safely checking JSON content-type
  const fetchBackendLadies = async (isManual = false) => {
    if (isManual) setIsRefreshingCatalog(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response from /api/ladies");
        return;
      }
      const data = await response.json();
      if (data.success && data.ladies) {
        setLadies(data.ladies);
      }
    } catch (err) {
      console.error("Failed to fetch backend ladies catalog:", err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshingCatalog(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchBackendLadies();
  }, [setLadies]);

  // 2. Heartbeat & Last Seen Tracker
  useEffect(() => {
    if (!currentUser?.username) return;

    const updateLastSeen = () => {
      try {
        const usersDbKey = 'dodix_users_db';
        const savedUsers = localStorage.getItem(usersDbKey);
        let usersList = savedUsers ? (decryptStorageData(usersDbKey) || []) : [];

        const nowIso = new Date().toISOString();
        const userIndex = usersList.findIndex(u => u.username?.toLowerCase() === currentUser.username.toLowerCase());

        if (userIndex !== -1) {
          const lastTime = new Date(usersList[userIndex].lastSeen || 0).getTime();
          if (Date.now() - lastTime > 5000) {
            usersList[userIndex].lastSeen = nowIso;
            localStorage.setItem(usersDbKey, encryptStorageData(usersList));
            setAllUsers(usersList);
          }
        } else {
          usersList.push({
            username: currentUser.username,
            gender: currentUser.gender || 'Client',
            role: currentUser.role || 'client',
            location: currentUser.location || 'Lusaka',
            createdAt: currentUser.createdAt || nowIso,
            activated: currentUser.activated ?? true,
            lastSeen: nowIso
          });
          localStorage.setItem(usersDbKey, encryptStorageData(usersList));
          setAllUsers(usersList);
        }
      } catch (err) {
        console.error("Error updating last seen heartbeat:", err);
      }
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.username]);

  // 3. Load Announcements
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
            content: 'Please ensure your advertisement photos and details are updated regularly.',
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

  const handleContactSupportWhatsApp = () => {
    const adminPhone = "260965039645";
    const supportMsg = encodeURIComponent("Hello Dodix Support, I need assistance with my account/subscription.");
    window.open(`https://wa.me/${adminPhone}?text=${supportMsg}`, '_blank');
  };

  // 4. Handle Clean Photo Upload and Open Full-View Editor Panel
  const handleCleanPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be under 5MB.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempPhoto(reader.result);
      if (!selectedSticker) {
        setSelectedSticker('/logo.jpg');
      }
      setPhotoEditorOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Canvas helper to bake sticker (clipped in a perfect circle for logo.jpg) directly into image
  const bakeStickerToImage = (imageSrc, sticker) => {
    return new Promise((resolve) => {
      if (!sticker || !imageSrc) {
        resolve(imageSrc);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        if (sticker.startsWith('/') || sticker.includes('.')) {
          // It's an image file sticker like logo.jpg
          const stickerImg = new Image();
          stickerImg.crossOrigin = 'anonymous';
          stickerImg.onload = () => {
            const size = canvas.width * 0.28; // 28% width for privacy mask
            const x = (canvas.width - size) / 2;
            const y = canvas.height * 0.25;

            // Clip drawing context to a circle to avoid square bounding boxes
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(stickerImg, x, y, size, size);
            ctx.restore();

            // Optional border ring around the sticker mask
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
            ctx.lineWidth = Math.max(2, canvas.width * 0.005);
            ctx.strokeStyle = '#ec4899'; // pink-500 match
            ctx.stroke();

            resolve(canvas.toDataURL('image/jpeg', 0.9));
          };
          stickerImg.onerror = () => resolve(canvas.toDataURL('image/jpeg', 0.9));
          stickerImg.src = sticker;
        } else {
          // Emoji sticker fallback
          ctx.font = `${Math.floor(canvas.width * 0.22)}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(sticker, canvas.width / 2, canvas.height * 0.35);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  // Confirm and Apply Editing from Full-View Panel
  const handleConfirmPhotoEdit = async () => {
    if (!tempPhoto) return;
    let finalPhoto = tempPhoto;
    if (selectedSticker) {
      finalPhoto = await bakeStickerToImage(tempPhoto, selectedSticker);
    }
    setNewAdData(prev => ({
      ...prev,
      photo: finalPhoto,
      photoUrl: finalPhoto
    }));
    setPhotoEditorOpen(false);
  };

  // 5. Save and Publish Ad using POST
  const handleSaveLadyProfileManual = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let finalPhoto = newAdData.photo;
      if (selectedSticker && finalPhoto && !finalPhoto.includes('data:image')) {
        finalPhoto = await bakeStickerToImage(finalPhoto, selectedSticker);
      }

      const response = await fetch(`${BACKEND_URL}/api/ladies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAdData,
          photo: finalPhoto,
          photoUrl: finalPhoto,
          username: currentUser.username,
          price: newAdData.rate,
          extraServices: newAdData.bio
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 120)}`);
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save profile configuration.');
      }

      setIsSaved(true);
      if (data.companion) {
        setLadies([data.companion, ...ladies.filter(l => l._id !== data.companion._id && l.id !== data.companion.id)]);
      } else {
        fetchBackendLadies();
      }

      setSuccessMessage('Profile saved and published successfully!');

      const newHistoryItem = {
        id: Date.now(),
        action: `Submitted Advertisement`,
        timestamp: new Date().toISOString(),
        status: 'Pending Admin Approval'
      };
      const updatedHistory = [newHistoryItem, ...profileHistory];
      setProfileHistory(updatedHistory);
      localStorage.setItem(`dodix_history_${currentUser?.username}`, encryptStorageData(updatedHistory));

    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Submit Report to Backend API safely
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportedUsername.trim() || !reportReason.trim()) {
      alert("Please fill in the details of the time waster.");
      return;
    }

    setIsSubmittingReport(true);
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

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        alert("Server returned a non-JSON response while submitting report.");
        return;
      }

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
    } finally {
      setIsSubmittingReport(false);
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
  const wasEverActivated = currentUser?.wasActivatedBefore === true;

  if (isPendingActivation) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Clock size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">
              {wasEverActivated ? 'Account Suspended' : 'Account Pending Activation'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your account (<span className="text-pink-400 font-semibold">{currentUser.username}</span>) has been successfully created. {wasEverActivated ? 'Your account has been suspended by administration.' : 'Male user accounts require package activation and administrative approval before gaining full access.'}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContactSupportWhatsApp}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <MessageCircle size={16} /> Support Center (WhatsApp Activation Query)
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={16} /> Sync & Check Activation Status
            </button>

            <button
              onClick={() => setCurrentUser(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const approvedLadies = ladies.filter(l => l.approved === true);
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

      {/* FULL-VIEW PHOTO & MASK EDITING PANEL MODAL */}
      <AnimatePresence>
        {photoEditorOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="text-pink-500" size={20} />
                  <h3 className="text-base font-bold text-white">Full-View Photo & Face Mask Editor</h3>
                </div>
                <button 
                  onClick={() => setPhotoEditorOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Full View Image Workspace */}
              <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-2xl p-4 overflow-hidden border border-slate-800 relative min-h-[320px]">
                {tempPhoto && (
                  <div className="relative inline-block max-h-full">
                    <img src={tempPhoto} alt="Full View Editor Workspace" className="max-h-[50vh] w-auto rounded-xl object-contain shadow-2xl" />
                    
                    {/* Centered Circular Mask Preview */}
                    {selectedSticker && (
                      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">
                        {selectedSticker.startsWith('/') ? (
                          <img src={selectedSticker} alt="Logo Mask" className="w-20 h-20 rounded-full object-cover border-4 border-pink-500 shadow-2xl animate-pulse" />
                        ) : (
                          <span className="text-6xl">{selectedSticker}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticker Selector Toolbar */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Choose Privacy Mask / Sticker:</label>
                <div className="flex gap-3 flex-wrap items-center bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedSticker('/logo.jpg')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-2 ${
                      selectedSticker === '/logo.jpg' 
                        ? 'bg-pink-500/25 border-pink-500 text-white' 
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <img src="/logo.jpg" alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                    Default Logo
                  </button>

                  {['🕶️', '🐱', '⭐', '❤️', '🦊', '🙈'].map((sticker) => (
                    <button
                      type="button"
                      key={sticker}
                      onClick={() => setSelectedSticker(sticker)}
                      className={`px-3 py-2 rounded-xl text-xl transition border cursor-pointer ${
                        selectedSticker === sticker 
                          ? 'bg-pink-500/25 border-pink-500 text-white' 
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setPhotoEditorOpen(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmPhotoEdit}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <CheckCircle size={16} /> Apply Mask & Save Photo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROFILE DETAIL MODAL */}
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
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer z-10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-lg shrink-0 bg-slate-950">
                  <img src={selectedProfile.photo || selectedProfile.photoUrl} alt={selectedProfile.name} className="w-full h-full object-cover" />
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
                  <span className="text-sm font-extrabold text-emerald-400">ZMW {selectedProfile.price || selectedProfile.rate}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Hosting Available</span>
                  <span className="text-sm font-extrabold text-slate-200">{selectedProfile.hosting || 'Yes'}</span>
                </div>
              </div>

              {(selectedProfile.extraServices || selectedProfile.bio) && (
                <div className="space-y-1.5 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-300">Services & Preferences</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedProfile.extraServices || selectedProfile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button 
                  onClick={() => {
                    setSelectedProfile(null);
                    handleOpenWhatsApp(selectedProfile);
                  }}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <MessageSquare size={16} /> Contact via WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT MODAL */}
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
                <button onClick={() => setReportModalOpen(false)} disabled={isSubmittingReport} className="p-2 text-slate-400 hover:text-white rounded-lg transition cursor-pointer">
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
                  <button type="button" disabled={isSubmittingReport} onClick={() => setReportModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingReport} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                    {isSubmittingReport ? <Loader2 size={16} className="animate-spin" /> : <Flag size={14} />} 
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer">
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
            onClick={() => fetchBackendLadies(true)}
            disabled={isRefreshingCatalog}
            title="Refresh Catalog Listings"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshingCatalog ? 'animate-spin text-pink-500' : ''} />
            <span className="hidden sm:inline">{isRefreshingCatalog ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button 
            onClick={() => setCurrentUser(null)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* SIDEBAR DRAWER */}
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
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  {!isFemaleUser && !isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('directory'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'directory' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Compass size={16} /> Elite Directory
                    </button>
                  )}

                  {isFemaleUser && (
                    <>
                      <button 
                        onClick={() => { setActiveTab('myprofile'); setSidebarOpen(false); }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                      >
                        <User size={16} /> Post Advertisement
                      </button>
                      <button 
                        onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'history' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                      >
                        <Bell size={16} /> History
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => { setActiveTab('news'); setSidebarOpen(false); }}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'news' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                  >
                    <Bell size={16} /> {isAdminUser ? 'Manage Announcements' : 'News & Announcements'}
                  </button>

                  {!isFemaleUser && !isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('favorites'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'favorites' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Heart size={16} /> Favorites
                    </button>
                  )}

                  {!isFemaleUser && !isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('subscription'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'subscription' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <CreditCard size={16} /> Subscription Status
                    </button>
                  )}

                  {!isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Settings size={16} /> Account Details
                    </button>
                  )}

                  <button 
                    onClick={() => { handleContactSupportWhatsApp(); setSidebarOpen(false); }}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white transition cursor-pointer"
                  >
                    <MessageCircle size={16} className="text-pink-500" /> Contact Support
                  </button>

                  {isFemaleUser && (
                    <button 
                      onClick={() => { setReportModalOpen(true); setSidebarOpen(false); }}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition mt-2 cursor-pointer"
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

      {/* MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
          <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-5 space-y-2 shadow-xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3">Navigation</span>
            
            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('directory')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'directory' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <Compass size={16} /> Elite Directory
              </button>
            )}

            {isFemaleUser && (
              <>
                <button 
                  onClick={() => setActiveTab('myprofile')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <User size={16} /> Post Advertisement
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'history' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <Bell size={16} /> History
                </button>
              </>
            )}

            <button 
              onClick={() => setActiveTab('news')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'news' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Bell size={16} /> {isAdminUser ? 'Manage Announcements' : 'News & Announcements'}
            </button>

            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'favorites' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <Heart size={16} /> Favorites
              </button>
            )}

            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('subscription')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'subscription' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <CreditCard size={16} /> Subscription Status
              </button>
            )}

            {!isAdminUser && (
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <Settings size={16} /> Account Details
              </button>
            )}

            <button 
              onClick={handleContactSupportWhatsApp}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white transition cursor-pointer"
            >
              <MessageCircle size={16} className="text-pink-500" /> Contact Support
            </button>

            {isFemaleUser && (
              <button 
                onClick={() => setReportModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition mt-4 cursor-pointer"
              >
                <Flag size={16} /> Report Time Waster
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          {isAdminUser && activeTab === 'news' ? (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Admin Command Center & User Activity</h2>
                <p className="text-xs text-slate-400 mt-1">Monitor platform announcements and broadcast updates.</p>
              </div>

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
                    className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} /> Publish Announcement
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'news' ? (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">News & Announcements</h2>
                <p className="text-xs text-slate-400 mt-1">Important updates and status broadcasts from platform administration.</p>
              </div>

              <div className="space-y-4 pt-2">
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
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800/40">
                          Announcement
                        </span>
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
                  <p className="text-xs text-slate-400 mt-1">Track your advertisement submissions and logs.</p>
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
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${item.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950 text-amber-400 border border-amber-800/40'}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
                    <User className="text-pink-400" /> Companion Directory & Profile Management
                  </h1>
                </div>

                {/* Status Banners */}
                {successMessage && (
                  <div className="mb-6 p-4 bg-emerald-900/50 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-4 bg-rose-900/50 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-200 text-xs">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Profile Submission Form */}
                <form onSubmit={handleSaveLadyProfileManual} className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Companion Name</label>
                      <input 
                        type="text" 
                        required
                        value={newAdData.name}
                        onChange={(e) => setNewAdData({ ...newAdData, name: e.target.value })}
                        placeholder="Enter name"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Category / Tier</label>
                      <select 
                        value={newAdData.category}
                        onChange={(e) => setNewAdData({ ...newAdData, category: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                      >
                        <option value="VIP">VIP</option>
                        <option value="Elite">Elite</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text" 
                          required
                          value={newAdData.location}
                          onChange={(e) => setNewAdData({ ...newAdData, location: e.target.value })}
                          placeholder="City / Region"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text" 
                          required
                          value={newAdData.phone}
                          onChange={(e) => setNewAdData({ ...newAdData, phone: e.target.value })}
                          placeholder="+260..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                    </div>

                    {/* Rate */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Hourly/Service Rate (ZMW)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="number" 
                          required
                          value={newAdData.rate}
                          onChange={(e) => setNewAdData({ ...newAdData, rate: e.target.value })}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Bio / Description</label>
                    <textarea 
                      rows="3"
                      value={newAdData.bio}
                      onChange={(e) => setNewAdData({ ...newAdData, bio: e.target.value })}
                      placeholder="Tell clients about preferences and availability..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition resize-none"
                    ></textarea>
                  </div>

                  {/* Photo Upload & Full-View Editor trigger */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">Advertisement Photo (Max 5MB)</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors shadow">
                        Upload Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleCleanPhotoUpload} 
                          className="hidden" 
                        />
                      </label>
                      {newAdData.photo && (
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" /> Photo attached successfully
                        </div>
                      )}
                    </div>

                    {newAdData.photo && (
                      <div className="mt-2 relative inline-block group">
                        <div 
                          onClick={() => {
                            setTempPhoto(newAdData.photo);
                            setPhotoEditorOpen(true);
                          }}
                          className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-pink-500 bg-slate-950 cursor-pointer transition shadow-lg group-hover:scale-[1.02]"
                          title="Click to open full-view photo editor"
                        >
                          <img src={newAdData.photo} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-[2px]">
                            <span className="text-white text-xs font-bold flex items-center gap-1.5 bg-pink-600/90 px-3 py-1.5 rounded-xl shadow">
                              <Edit3 size={14} /> Edit Mask
                            </span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setNewAdData({ ...newAdData, photo: '', photoUrl: '' });
                            setSelectedSticker('/logo.jpg');
                          }}
                          className="absolute -top-2 -right-2 bg-rose-600 p-1.5 rounded-full text-white hover:bg-rose-500 shadow cursor-pointer z-10"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-8 py-3.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {loading ? 'Saving Profile...' : 'Save and Publish Ad'}
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
                    {['All', 'VIP', 'Elite', 'Standard'].map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedCategory === cat ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
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
                            src={lady.photo || lady.photoUrl} 
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
                              <span className="text-emerald-400 font-black text-xs">ZMW {lady.price || lady.rate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col gap-3 flex-grow justify-between">
                          <p className="text-slate-400 text-xs line-clamp-2">{lady.extraServices || lady.bio || "Available for social companionship and elite events."}</p>
                          
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                            <button 
                              onClick={() => setSelectedProfile(lady)}
                              className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition cursor-pointer"
                            >
                              <User size={14} className="text-slate-400" /> View Profile
                            </button>
                            <button 
                              onClick={() => handleOpenWhatsApp(lady)}
                              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
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