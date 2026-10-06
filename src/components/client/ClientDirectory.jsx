// src/components/client/ClientDirectory.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, MessageSquare, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, RefreshCw, CheckCircle, Flag, Heart, CreditCard, Settings, Bell, Plus, Trash2, Shield, MessageCircle, Loader2, DollarSign, AlertCircle, Save, Phone, Edit3, Sliders, Move, Check, Award, Filter, ArrowRight, ArrowLeft, Upload, Sparkles, FileText, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '../common/LogoLoader';
import { encryptStorageData, decryptStorageData } from '../../utils/storageEncryption';

// Reference brand logo directly from the public folder
const brandLogo = '/logo.jpg';

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

  // Multi-step Companion Form Wizard State ('photo_step' | 'details_step' | 'success_step')
  const [profileStep, setProfileStep] = useState('photo_step');

  // Advertisement Form State & Privacy Mask Studio States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Privacy Mask Customization States
  const [stickerType, setStickerType] = useState('logo'); // 'emoji' | 'logo'
  const [selectedEmoji, setSelectedEmoji] = useState('🕶️');
  const [customLogo, setCustomLogo] = useState(brandLogo);
  
  // Draggable Sticker Interaction States inside Photo Editor
  const [stickerPos, setStickerPos] = useState({ x: 120, y: 120 });
  const [stickerSize, setStickerSize] = useState(80);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

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
    originalPhoto: currentUser.originalPhoto || currentUser.photo || currentUser.photoUrl || '',
    unmaskedPhoto: currentUser.unmaskedPhoto || currentUser.photo || currentUser.photoUrl || '',
    bio: currentUser.bio || '',
    department: currentUser.department || '',
    title: currentUser.title || 'Elite Companion'
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

  // 1. Sync Live Listings from Backend
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

  // 4. Handle Clean Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be under 10MB.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      setNewAdData(prev => ({
        ...prev,
        originalPhoto: result,
        unmaskedPhoto: result,
        photo: result
      }));
      setStickerPos({ x: 100, y: 100 });
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom Logo upload for sticker
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomLogo(event.target.result);
        setStickerType('logo');
      };
      reader.readAsDataURL(file);
    }
  };

  // Mouse Drag Handlers for Sticker
  const handleStickerMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSticker(true);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) - stickerPos.x,
      y: (e.clientY - rect.top) - stickerPos.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDraggingSticker || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let newX = (e.clientX - rect.left) - dragOffset.x;
    let newY = (e.clientY - rect.top) - dragOffset.y;

    const maxX = rect.width - stickerSize;
    const maxY = rect.height - stickerSize;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setStickerPos({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDraggingSticker(false);
  };

  useEffect(() => {
    if (isDraggingSticker) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSticker, dragOffset, stickerSize]);

  // Flatten Sticker to Canvas (Bake Privacy Mask)
  const flattenStickerToImage = () => {
    return new Promise((resolve) => {
      const currentPhoto = newAdData.originalPhoto || newAdData.photo;
      if (!currentPhoto || !containerRef.current) {
        resolve(currentPhoto);
        return;
      }

      const containerBox = containerRef.current.getBoundingClientRect();
      const baseImage = new Image();
      baseImage.crossOrigin = 'anonymous';
      baseImage.src = currentPhoto;

      baseImage.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = baseImage.naturalWidth;
        canvas.height = baseImage.naturalHeight;

        ctx.drawImage(baseImage, 0, 0);

        const scaleX = baseImage.naturalWidth / containerBox.width;
        const scaleY = baseImage.naturalHeight / containerBox.height;

        const renderX = stickerPos.x * scaleX;
        const renderY = stickerPos.y * scaleY;
        const renderSize = stickerSize * Math.max(scaleX, scaleY);

        if (stickerType === 'emoji') {
          ctx.font = `${renderSize}px sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(selectedEmoji, renderX, renderY);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } else if (stickerType === 'logo' && customLogo) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = customLogo;
          logoImg.onload = () => {
            ctx.drawImage(logoImg, renderX, renderY, renderSize, renderSize);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          };
          logoImg.onerror = () => resolve(currentPhoto);
        } else {
          resolve(currentPhoto);
        }
      };

      baseImage.onerror = () => resolve(currentPhoto);
    });
  };

  // Proceed to Profile Details Step
  const handleProceedToDetails = async () => {
    const currentPhoto = newAdData.originalPhoto || newAdData.photo;
    if (!currentPhoto) {
      setErrorMessage('Please upload a source photograph first.');
      return;
    }

    setLoading(true);
    const finalMasked = await flattenStickerToImage();
    setNewAdData(prev => ({
      ...prev,
      photo: finalMasked,
      photoUrl: finalMasked,
      unmaskedPhoto: prev.originalPhoto || prev.photo
    }));
    setLoading(false);
    setProfileStep('details_step');
  };

  // Form Field Updates
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdData(prev => ({ ...prev, [name]: value }));
  };

  // 5. Save and Publish Ad to Backend
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newAdData.name.trim() || !newAdData.rate) {
      alert("Please fill in your name and rate.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        ...newAdData,
        username: currentUser.username,
        price: newAdData.rate,
        extraServices: newAdData.bio,
        originalPhoto: newAdData.originalPhoto,
        unmaskedPhoto: newAdData.unmaskedPhoto || newAdData.originalPhoto,
        photo: newAdData.photo
      };

      const response = await fetch(`${BACKEND_URL}/api/ladies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

      if (data.companion) {
        setLadies([data.companion, ...ladies.filter(l => l._id !== data.companion._id && l.id !== data.companion.id)]);
      } else {
        fetchBackendLadies();
      }

      setSuccessMessage('Profile saved and published successfully!');
      setProfileStep('success_step');

      const newHistoryItem = {
        id: Date.now(),
        action: `Submitted Advertisement (Masked & Unmasked Captured)`,
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

  const resetDirectoryForm = () => {
    setProfileStep('photo_step');
    setNewAdData(prev => ({
      ...prev,
      photo: '',
      originalPhoto: '',
      unmaskedPhoto: ''
    }));
  };

  // 6. Submit Report to Backend API
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
      <canvas ref={canvasRef} className="hidden" />
      {isLoading && <LogoLoader text={loadingText} />}

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
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition mt-2 cursor-pointer"
              >
                <Flag size={16} /> Report Time Waster
              </button>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 space-y-6">
          {/* TAB 1: DIRECTORY (FOR MALE / CLIENT USERS) */}
          {activeTab === 'directory' && !isFemaleUser && !isAdminUser && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-white">Verified Companion Directory</h2>
                  <p className="text-xs text-slate-400">Showing elite verified listings in <span className="text-pink-400 font-semibold">{userLockedLocation}</span></p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search name or location..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['All', 'VIP', 'Elite', 'Standard'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedCategory === cat ? 'bg-pink-600 text-white shadow-lg' : 'bg-[#0b101d] text-slate-400 border border-slate-800 hover:border-slate-700'}`}
                  >
                    {cat} Companions
                  </button>
                ))}
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLadies.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-[#0b101d] border border-slate-800/80 rounded-3xl space-y-3">
                    <AlertCircle size={32} className="mx-auto text-slate-500" />
                    <p className="text-sm font-bold text-slate-300">No active companions found in {userLockedLocation}.</p>
                    <p className="text-xs text-slate-500">Try checking back later or refreshing the catalog.</p>
                  </div>
                ) : (
                  filteredLadies.map((lady) => (
                    <div 
                      key={lady._id || lady.id}
                      onClick={() => setSelectedProfile(lady)}
                      className="bg-[#0b101d] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-pink-500/50 transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="relative h-56 bg-slate-950 overflow-hidden">
                        <img 
                          src={lady.photo || lady.photoUrl} 
                          alt={lady.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-pink-400 uppercase tracking-wider border border-white/10">
                          {lady.category || 'VIP'}
                        </div>
                        <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-slate-950 px-2.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow">
                          <ShieldCheck size={11} /> VERIFIED
                        </div>
                      </div>

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-white">{lady.name}, {lady.age || '23'}</h3>
                            <span className="text-sm font-black text-emerald-400">ZMW {lady.price || lady.rate}</span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={13} className="text-pink-500" /> {lady.specificLocation || lady.location}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Click for details</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsApp(lady);
                            }}
                            className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl border border-emerald-500/30 transition cursor-pointer"
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: POST ADVERTISEMENT & PRIVACY MASK STUDIO (FOR FEMALE USERS) */}
          {activeTab === 'myprofile' && isFemaleUser && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn">
              {/* Wizard Progress Header */}
              <div className="border-b border-slate-800 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-pink-600/20 text-pink-400 rounded-2xl border border-pink-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">Companion Profile & Privacy Studio</h2>
                      <p className="text-xs text-slate-400">Publish your verified listing with built-in privacy watermarking.</p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-3 py-1.5 bg-slate-900 rounded-full text-pink-300 border border-slate-800">
                    {profileStep === 'photo_step' && 'Step 1: Photo & Privacy Mask'}
                    {profileStep === 'details_step' && 'Step 2: Profile Details'}
                    {profileStep === 'success_step' && 'Step 3: Verification Complete'}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-500 ease-out"
                    style={{ 
                      width: profileStep === 'photo_step' ? '33%' : profileStep === 'details_step' ? '66%' : '100%' 
                    }}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-950/50 border border-red-800/50 rounded-2xl text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-800/50 rounded-2xl text-xs text-emerald-300">
                  {successMessage}
                </div>
              )}

              {/* STEP 1: PHOTO & PRIVACY MASK */}
              {profileStep === 'photo_step' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Left: Upload & Controls */}
                    <div className="space-y-6">
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Upload Source Photograph</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-800 hover:border-pink-500 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                              <Upload className="w-8 h-8 mb-2 text-pink-400" />
                              <p className="text-xs text-slate-300 font-medium">Click to upload photo</p>
                              <p className="text-[10px] text-slate-500 mt-1">PNG, JPG or WEBP (Max 10MB)</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                          </label>
                        </div>
                      </div>

                      {newAdData.originalPhoto && (
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                          <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Privacy Mask Configuration
                          </h3>
                          
                          {/* Sticker Type Toggle */}
                          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setStickerType('logo')}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${stickerType === 'logo' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                              Brand Logo Watermark
                            </button>
                            <button
                              type="button"
                              onClick={() => setStickerType('emoji')}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${stickerType === 'emoji' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                              Emoji Mask
                            </button>
                          </div>

                          {stickerType === 'emoji' ? (
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Select Mask Emoji</label>
                              <div className="flex gap-2">
                                {['🕶️', '🐱', '🦊', '⭐', '🔒', '👻'].map(emoji => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setSelectedEmoji(emoji)}
                                    className={`p-2.5 text-xl rounded-xl border transition-all cursor-pointer ${selectedEmoji === emoji ? 'bg-pink-600/30 border-pink-500 scale-105' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Custom Watermark Logo</label>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-600 file:text-white hover:file:bg-pink-700 cursor-pointer" />
                            </div>
                          )}

                          {/* Size slider */}
                          <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
                              <span>Mask Scale</span>
                              <span>{stickerSize}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="40" 
                              max="180" 
                              value={stickerSize} 
                              onChange={(e) => setStickerSize(Number(e.target.value))}
                              className="w-full accent-pink-500 bg-slate-950 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Interactive Preview Area */}
                    <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[380px]">
                      {newAdData.originalPhoto ? (
                        <div className="space-y-3 w-full flex flex-col items-center">
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                            <Move className="w-3.5 h-3.5 text-pink-400" /> Drag watermark over sensitive face regions
                          </p>
                          
                          {/* Container for photo + movable sticker */}
                          <div 
                            id="photo-container"
                            ref={containerRef}
                            className="relative inline-block overflow-hidden rounded-2xl border border-slate-800 shadow-xl select-none max-w-full"
                            style={{ maxHeight: '350px' }}
                          >
                            <img 
                              src={newAdData.originalPhoto} 
                              alt="Source Preview" 
                              className="block max-h-[350px] w-auto object-contain pointer-events-none" 
                            />
                            
                            {/* Draggable Sticker Element */}
                            <div
                              id="privacy-sticker"
                              onMouseDown={handleStickerMouseDown}
                              className="absolute cursor-move flex items-center justify-center transition-shadow hover:ring-2 hover:ring-pink-400 rounded-xl"
                              style={{
                                left: `${stickerPos.x}px`,
                                top: `${stickerPos.y}px`,
                                width: `${stickerSize}px`,
                                height: `${stickerSize}px`,
                                fontSize: `${stickerSize * 0.75}px`
                              }}
                            >
                              {stickerType === 'emoji' ? (
                                <span className="drop-shadow-md">{selectedEmoji}</span>
                              ) : customLogo ? (
                                <img src={customLogo} alt="Logo Watermark" className="w-full h-full object-contain drop-shadow-md rounded-lg" />
                              ) : (
                                <span className="drop-shadow-md">🕶️</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-3 text-slate-500">
                          <Camera className="w-12 h-12 mx-auto opacity-40 text-pink-500" />
                          <p className="text-xs font-bold">Upload a photograph to activate privacy masking studio.</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Step 1 Footer Action */}
                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={!newAdData.originalPhoto || loading}
                      onClick={handleProceedToDetails}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-lg ${newAdData.originalPhoto && !loading ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer' : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'}`}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <>Next: Profile Details <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROFILE DETAILS */}
              {profileStep === 'details_step' && (
                <form onSubmit={handleFormSubmit} className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Thumbnail Preview Card */}
                    <div className="md:col-span-1 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-4">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Masked Photo Preview</span>
                      <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-lg bg-slate-950">
                        {newAdData.photo && <img src={newAdData.photo} alt="Masked profile" className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-[11px] text-slate-400">This masked version will be published publicly on your elite directory card.</p>
                      
                      <button
                        type="button"
                        onClick={() => setProfileStep('photo_step')}
                        className="text-xs text-pink-400 hover:text-pink-300 underline font-bold cursor-pointer"
                      >
                        Adjust Mask Positioning
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="md:col-span-2 space-y-4 bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                      <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">Personnel Metadata</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Full Name / Alias *</label>
                          <input 
                            type="text" 
                            name="name"
                            value={newAdData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Jessica" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Category *</label>
                          <select 
                            name="category"
                            value={newAdData.category}
                            onChange={handleInputChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-medium cursor-pointer"
                          >
                            <option value="VIP">VIP</option>
                            <option value="Elite">Elite</option>
                            <option value="Standard">Standard</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Location / City *</label>
                          <input 
                            type="text" 
                            name="location"
                            value={newAdData.location}
                            onChange={handleInputChange}
                            placeholder="e.g. Lusaka" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Specific Area / Neighborhood</label>
                          <input 
                            type="text" 
                            name="specificLocation"
                            value={newAdData.specificLocation || ''}
                            onChange={handleInputChange}
                            placeholder="e.g. Kabulonga" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">WhatsApp Phone Number *</label>
                          <input 
                            type="text" 
                            name="phone"
                            value={newAdData.phone}
                            onChange={handleInputChange}
                            placeholder="e.g. 260970000000" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Rate (ZMW) *</label>
                          <input 
                            type="text" 
                            name="rate"
                            value={newAdData.rate}
                            onChange={handleInputChange}
                            placeholder="e.g. 500" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Services / Bio / Preferences</label>
                        <textarea 
                          name="bio"
                          rows="3"
                          value={newAdData.bio}
                          onChange={handleInputChange}
                          placeholder="Brief overview of availability, services, and preferences..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 resize-none font-medium"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Step 2 Footer Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setProfileStep('photo_step')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-800 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Photo Masking
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <>Complete Registration <CheckCircle2 className="w-4 h-4" /></>}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SUCCESS & COMPLETED RECORD */}
              {profileStep === 'success_step' && (
                <div className="space-y-6 text-center py-6 animate-fadeIn">
                  <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">Profile Verified & Published Successfully</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Your privacy mask has been securely baked into the companion record, and metadata has been submitted to the elite catalog ledger.
                    </p>
                  </div>

                  {/* Preview Card Result */}
                  <div className="max-w-xs mx-auto bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl text-left">
                    <div className="h-28 bg-gradient-to-r from-pink-900 via-purple-900 to-slate-900 relative">
                      <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl border-2 border-slate-900 overflow-hidden bg-slate-950 shadow-md">
                        {newAdData.photo && <img src={newAdData.photo} alt="Avatar" className="w-full h-full object-cover" />}
                      </div>
                    </div>
                    
                    <div className="pt-10 p-5 space-y-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{newAdData.name}</h4>
                        <p className="text-[11px] text-pink-400 font-bold">{newAdData.category} Companion</p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{newAdData.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{newAdData.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={resetDirectoryForm}
                      className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer"
                    >
                      Update Profile or Photo Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEWS & ANNOUNCEMENTS */}
          {activeTab === 'news' && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Platform News & Announcements</h2>
                  <p className="text-xs text-slate-400">Important notices and updates from administration</p>
                </div>
              </div>

              {isAdminUser && (
                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider">Publish New Announcement</h3>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Announcement Title" 
                      value={newTitle} 
                      onChange={(e) => setNewTitle(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-medium"
                      required
                    />
                    <textarea 
                      rows="3" 
                      placeholder="Announcement content..." 
                      value={newContent} 
                      onChange={(e) => setNewContent(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 resize-none font-medium"
                      required
                    />
                    <div className="flex items-center justify-between gap-4">
                      <select 
                        value={newVisibility} 
                        onChange={(e) => setNewVisibility(e.target.value)} 
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-medium cursor-pointer"
                      >
                        <option value="all">Visible to All Users</option>
                        <option value="female">Female Companions Only</option>
                        <option value="male">Male Clients Only</option>
                      </select>
                      <button type="submit" className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer">
                        Publish Announcement
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {visibleAnnouncements.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No announcements available at this time.</p>
                ) : (
                  visibleAnnouncements.map(item => (
                    <div key={item.id} className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FAVORITES (FOR MALE USERS) */}
          {activeTab === 'favorites' && !isFemaleUser && !isAdminUser && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
              <h2 className="text-xl font-extrabold text-white">Your Favorite Companions</h2>
              <p className="text-xs text-slate-400">Quick access to your saved elite profiles.</p>
              <div className="py-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl space-y-2">
                <Heart size={32} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400 font-bold">No favorite companions saved yet.</p>
              </div>
            </div>
          )}

          {/* TAB 5: SUBSCRIPTION STATUS (FOR MALE USERS) */}
          {activeTab === 'subscription' && !isFemaleUser && !isAdminUser && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
              <h2 className="text-xl font-extrabold text-white">Subscription & Account Status</h2>
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Account Status</span>
                  <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full text-[10px] font-black">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Location Locked</span>
                  <span className="text-xs font-extrabold text-white">{userLockedLocation}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNT SETTINGS & HISTORY */}
          {(activeTab === 'settings' || activeTab === 'history') && !isAdminUser && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
              <h2 className="text-xl font-extrabold text-white">Account Details & Activity History</h2>
              <div className="space-y-3">
                {profileHistory.map(h => (
                  <div key={h.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{h.action}</p>
                      <span className="text-[10px] text-slate-500">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold">{h.status}</span>
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