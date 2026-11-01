// src/components/client/ClientDirectory.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, MessageSquare, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, RefreshCw, CheckCircle, CheckCircle2, Flag, Heart, CreditCard, Settings, Bell, Plus, Trash2, Shield, MessageCircle, Loader2, DollarSign, AlertCircle, Save, Phone, Edit3, Sliders, Move, Check, Award, Filter, ArrowRight, ArrowLeft, Upload, Sparkles, FileText, Camera, Home, Lock, Key, CheckCircle2Icon, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import LogoLoader from '../common/LogoLoader';
import { encryptStorageData, decryptStorageData } from '../../utils/storageEncryption';
import HomeDashboard from './HomeDashboard';
import AccountSettingsTab from './AccountSettingsTab';
import DeleteAccountPage from './DeleteAccountPage';
import CompanionProfileSetup from './CompanionProfileSetup';

const brandLogo = '/logo.jpg';
const homeDashboardLogo = '/home dashboard.png';
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

export default function ClientDirectory({ 
  currentUser, 
  setCurrentUser = () => {}, 
  ladies = [], 
  setLadies = () => {}, 
  isLoading = false, 
  loadingText = '',
  onStartChat = () => {}
}) {
  const [activeTab, setActiveTab] = useState('home'); 
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
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [announcements, setAnnouncements] = useState([]);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`dodix_favorites_${currentUser?.username}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [onlinePulseCount, setOnlinePulseCount] = useState(24);
  const [profileStep, setProfileStep] = useState('photos_step');

  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [maskedPhotos, setMaskedPhotos] = useState([]); 
  const [currentMaskIndex, setCurrentMaskIndex] = useState(0); 

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [accountPhone, setAccountPhone] = useState(currentUser?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secQuestion, setSecQuestion] = useState(currentUser?.securityQuestion || 'What was your first pet’s name?');
  const [secAnswer, setSecAnswer] = useState('');
  const [settingsStatus, setSettingsStatus] = useState({ type: '', message: '' });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [stickerType, setStickerType] = useState('logo');
  const [selectedEmoji, setSelectedEmoji] = useState('🕶️');
  const [customLogo, setCustomLogo] = useState(brandLogo);
  
  const [stickerPos, setStickerPos] = useState({ x: 120, y: 120 });
  const [stickerSize, setStickerSize] = useState(80);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const expiryTime = new Date(new Date(currentUser?.createdAt || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState({ days: 6, hours: 12, minutes: 45, seconds: 30 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const initialName = currentUser?.username && !['female', 'lady', 'client'].includes(currentUser.username.toLowerCase()) 
    ? currentUser.username 
    : '';

  const [newAdData, setNewAdData] = useState({
    name: currentUser?.name || initialName,
    category: currentUser?.category || '', 
    location: currentUser?.location || userLockedLocation, 
    neighborhood: currentUser?.neighborhood || '', 
    hosting: currentUser?.hosting || 'Yes', 
    phone: currentUser?.phone || '',
    age: currentUser?.age || '',
    rate: currentUser?.rate || '',
    bio: currentUser?.bio || '',
    agreedToTerms: false
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

  const resolveTargetUsername = (ladyObj) => {
    if (!ladyObj) return 'admin';
    const rawUsername = ladyObj.username?.toLowerCase()?.trim();
    const genericPlaceholders = ['female', 'lady', 'client', 'male', 'user'];
    
    if (rawUsername && !genericPlaceholders.includes(rawUsername)) {
      return rawUsername;
    }
    if (ladyObj.name && ladyObj.name.trim() !== '') {
      return ladyObj.name.replace(/\s+/g, '').toLowerCase();
    }
    return 'companion';
  };

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socket.on('live-pulse-update', (data) => {
      if (data && typeof data.onlineCount === 'number') {
        setOnlinePulseCount(data.onlineCount + 20);
      }
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (currentUser?.username) {
      localStorage.setItem(`dodix_favorites_${currentUser.username}`, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, currentUser?.username]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedProfile) return;
      const allProfilePhotos = [
        selectedProfile.photo,
        selectedProfile.photoUrl,
        ...(Array.isArray(selectedProfile.photos) ? selectedProfile.photos : [])
      ].filter(Boolean).filter((img, idx, arr) => arr.indexOf(img) === idx);

      if (allProfilePhotos.length <= 1) return;

      if (e.key === 'ArrowLeft') {
        setActivePhotoIdx(prev => (prev === 0 ? allProfilePhotos.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIdx(prev => (prev === allProfilePhotos.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        setSelectedProfile(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProfile]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = expiryTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  const toggleFavorite = (e, ladyId) => {
    e.stopPropagation();
    setFavoriteIds(prev => 
      prev.includes(ladyId) ? prev.filter(id => id !== ladyId) : [...prev, ladyId]
    );
  };

  const toggleAnnouncementExpand = (id) => {
    setExpandedAnnouncements(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchBackendLadies = async (isManual = false) => {
    if (isManual) setIsRefreshingCatalog(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies`, {
        headers: { 
          'x-user-role': currentUser?.role || 'client',
          'x-username': currentUser?.username || ''
        }
      });
      const data = await response.json();
      if (data.maintenance) {
        alert(data.error);
        return;
      }
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

  const fetchBackendAnnouncements = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/announcements`, {
        headers: { 
          'x-user-role': currentUser?.role || 'client',
          'x-username': currentUser?.username || ''
        }
      });
      const data = await response.json();
      if (data.maintenance) return;
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error("Error fetching live announcements:", err);
    }
  };

  useEffect(() => {
    fetchBackendLadies();
    fetchBackendAnnouncements();
  }, [setLadies]);

  const handleContactSupportWhatsApp = () => {
    const adminPhone = "260965039645";
    const supportMsg = encodeURIComponent("Hello Dodix Support, I need assistance with my account/subscription.");
    window.open(`https://wa.me/${adminPhone}?text=${supportMsg}`, '_blank');
  };

  const handleMultiPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setErrorMessage('');
    const totalFiles = [...selectedFiles, ...files];

    if (totalFiles.length > 5) {
      setErrorMessage('You can upload a maximum of 5 pictures per profile.');
      return;
    }

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload valid image files.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Each file size must be under 10MB.');
        return;
      }
    }

    setSelectedFiles(totalFiles);
  };

  const removeFileAtIndex = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
    setErrorMessage('');
  };

  const handleStickerStart = (clientX, clientY) => {
    setIsDraggingSticker(true);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: (clientX - rect.left) - stickerPos.x,
      y: (clientY - rect.top) - stickerPos.y
    });
  };

  const handleStickerMouseDown = (e) => {
    e.preventDefault();
    handleStickerStart(e.clientX, e.clientY);
  };

  const handleStickerTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      handleStickerStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMove = (clientX, clientY) => {
    if (!isDraggingSticker || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let newX = (clientX - rect.left) - dragOffset.x;
    let newY = (clientY - rect.top) - dragOffset.y;

    const maxX = rect.width - stickerSize;
    const maxY = rect.height - stickerSize;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setStickerPos({ x: newX, y: newY });
  };

  const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleEnd = () => setIsDraggingSticker(false);

  useEffect(() => {
    if (isDraggingSticker) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingSticker, dragOffset, stickerSize]);

  const flattenStickerForImage = (imageSrc) => {
    return new Promise((resolve) => {
      if (!imageSrc || !containerRef.current) {
        resolve(imageSrc);
        return;
      }

      const containerBox = containerRef.current.getBoundingClientRect();
      const baseImage = new Image();
      baseImage.crossOrigin = 'anonymous';
      baseImage.src = imageSrc;

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
          logoImg.onerror = () => resolve(imageSrc);
        } else {
          resolve(imageSrc);
        }
      };

      baseImage.onerror = () => resolve(imageSrc);
    });
  };

  const handleStartMasking = (e) => {
    e.preventDefault();
    if (selectedFiles.length < 2) {
      setErrorMessage('Please upload a minimum of 2 pictures per profile.');
      return;
    }
    setErrorMessage('');
    setCurrentMaskIndex(0);
    setMaskedPhotos([]);
    setProfileStep('masking_step');
  };

  const handleSaveMaskAndNext = async () => {
    setLoading(true);
    const file = selectedFiles[currentMaskIndex];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const baseSrc = event.target.result;
      const maskedResult = await flattenStickerForImage(baseSrc);
      
      const updatedMasks = [...maskedPhotos];
      updatedMasks[currentMaskIndex] = maskedResult;
      setMaskedPhotos(updatedMasks);

      setLoading(false);

      if (currentMaskIndex + 1 < selectedFiles.length) {
        setCurrentMaskIndex(prev => prev + 1);
        setStickerPos({ x: 100, y: 100 });
      } else {
        setProfileStep('details_step');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAdData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newAdData.name.trim() || !newAdData.category || !newAdData.rate || !newAdData.neighborhood.trim() || !newAdData.age || !newAdData.phone.trim() || !newAdData.hosting) {
      alert("Please fill in all compulsory fields: Name, Category, Rate, Neighborhood, Age, WhatsApp Phone, and Hosting.");
      return;
    }

    if (!newAdData.agreedToTerms) {
      alert("You must agree to the mandatory companion consent rules and 18+ age verification terms before publishing.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const originalPhotosBase64 = await Promise.all(
        selectedFiles.map(file => fileToBase64(file))
      );

      const payload = {
        username: currentUser.username,
        name: newAdData.name,
        category: newAdData.category,
        location: newAdData.location,
        neighborhood: newAdData.neighborhood,
        hosting: newAdData.hosting,
        phone: newAdData.phone,
        age: newAdData.age,
        price: newAdData.rate,
        extraServices: newAdData.bio,
        agreedToTerms: newAdData.agreedToTerms,
        photo: maskedPhotos[0],
        photos: maskedPhotos,
        originalPhoto: originalPhotosBase64[0],
        originalPhotos: originalPhotosBase64,
        unmaskedPhoto: originalPhotosBase64[0],
        unmaskedPhotos: originalPhotosBase64
      };

      const response = await fetch(`${BACKEND_URL}/api/ladies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'client',
          'x-username': currentUser?.username || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.maintenance) throw new Error(data.error);
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save profile configuration.');
      }

      fetchBackendLadies();
      setCurrentUser(prev => ({ ...prev, hasCompletedProfile: true }));

      setSuccessMessage('Permanent profile saved and updated successfully!');
      setProfileStep('success_step');

    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  const resetDirectoryForm = () => {
    setProfileStep('photos_step');
    setSelectedFiles([]);
    setMaskedPhotos([]);
    setCurrentMaskIndex(0);
    setSuccessMessage('');
  };

  const handleOpenWhatsApp = (lady) => {
    const phoneNum = lady.phone ? lady.phone.replace(/[^0-9]/g, '') : '260970000000';
    const message = `Hello ${lady.name}, I found your listing on DodixClub and would like to connect regarding booking availability in ${lady.location}.`;
    navigator.clipboard.writeText(message).catch(() => {});
    window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!currentUser) return null;

  const isFemaleUser = currentUser?.gender?.toLowerCase() === 'female' || currentUser?.gender?.toLowerCase() === 'lady';
  const isAdminUser = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';
  
  const IS_MAINTENANCE_ACTIVE = true; 
  const allowedTestUsers = ['admin', 'testmale', 'testfemale'];
  const isTestAccount = allowedTestUsers.includes(currentUser?.username?.toLowerCase()?.trim());

  if (IS_MAINTENANCE_ACTIVE && !isAdminUser && !isTestAccount) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Clock size={32} className="animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">DODIX CLUB</h2>
            <p className="text-lg font-extrabold text-pink-500 tracking-wider">DODIX CLUB IS UNDER MAINTENANCE</p>
          </div>
          <button onClick={() => setCurrentUser(null)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition cursor-pointer">
            Log Out / Back
          </button>
        </div>
      </div>
    );
  }

  const isMaleUser = !isFemaleUser && !isAdminUser;
  const isPendingActivation = isMaleUser && currentUser?.activated === false;

  if (isPendingActivation) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Clock size={32} className="animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Account Pending Activation</h2>
          <button onClick={handleContactSupportWhatsApp} className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2">
            <MessageCircle size={16} /> Support Center (WhatsApp Activation)
          </button>
        </div>
      </div>
    );
  }

  const approvedLadies = ladies.filter(l => l.approved === true);
  const filteredLadies = approvedLadies.filter(l => {
    const matchesLoc = l.location === userLockedLocation;
    const matchesCat = selectedCategory === 'All' || l.category === selectedCategory;
    const matchesSearch = l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.neighborhood && l.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLoc && matchesCat && matchesSearch;
  });

  const favoriteLadies = approvedLadies.filter(l => favoriteIds.includes(l._id || l.id));
  const visibleAnnouncements = announcements.filter(item => {
    if (isAdminUser) return true;
    if (item.visibility === 'all') return true;
    if (item.visibility === 'female' && isFemaleUser) return true;
    if (item.visibility === 'male' && isMaleUser) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative selection:bg-pink-500 selection:text-white font-sans">
      <canvas ref={canvasRef} className="hidden" />
      {isLoading && <LogoLoader text={loadingText} />}

      {/* Profile & Media Modal Viewer */}
      <AnimatePresence>
        {selectedProfile && !isFemaleUser && !isAdminUser && (() => {
          const allProfilePhotos = [
            selectedProfile.photo,
            selectedProfile.photoUrl,
            ...(Array.isArray(selectedProfile.photos) ? selectedProfile.photos : [])
          ].filter(Boolean).filter((img, idx, arr) => arr.indexOf(img) === idx);

          const currentDisplayPhoto = allProfilePhotos[activePhotoIdx] || allProfilePhotos[0];
          const isFav = favoriteIds.includes(selectedProfile._id || selectedProfile.id);

          return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <motion.div className="max-w-xl w-full bg-[#0b101d] border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative my-auto">
                <button onClick={() => setSelectedProfile(null)} className="absolute top-5 right-5 p-2.5 text-slate-400 hover:text-white rounded-2xl bg-slate-900 border border-slate-800 transition cursor-pointer z-30">
                  <X size={18} />
                </button>

                <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <img src={currentDisplayPhoto} alt={selectedProfile.name} className="w-full h-full object-contain relative z-10" />
                  {allProfilePhotos.length > 1 && (
                    <>
                      <button onClick={() => setActivePhotoIdx(prev => (prev === 0 ? allProfilePhotos.length - 1 : prev - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-xl z-20"><ArrowLeft size={16} /></button>
                      <button onClick={() => setActivePhotoIdx(prev => (prev === allProfilePhotos.length - 1 ? 0 : prev + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-xl z-20"><ArrowRight size={16} /></button>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">{selectedProfile.name}, {selectedProfile.age}</h3>
                  <p className="text-xs text-emerald-400 font-bold">ZMW {selectedProfile.price || selectedProfile.rate}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={(e) => toggleFavorite(e, selectedProfile._id || selectedProfile.id)} className={`py-3 border font-bold rounded-xl text-xs flex items-center justify-center gap-2 ${isFav ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                    <Heart size={16} className={isFav ? 'fill-pink-500 text-pink-500' : ''} /> {isFav ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={() => { const target = resolveTargetUsername(selectedProfile); setSelectedProfile(null); onStartChat(target); }} className="py-3 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> Secure Chat
                  </button>
                </div>
                <button onClick={() => { setSelectedProfile(null); handleOpenWhatsApp(selectedProfile); }} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                  <MessageCircle size={16} /> WhatsApp Booking
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <nav className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"><Menu size={20} /></button>
          <div>
            <h1 className="text-base font-black tracking-wider text-pink-500">DODIXCLUB</h1>
            <p className="text-[10px] uppercase font-bold text-slate-500">Elite Client & Companion Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentUser(null)} className="px-3.5 py-2 bg-slate-900 text-red-400 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex">
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="w-72 bg-[#0b101d] border-r border-slate-800 p-6 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="font-black text-sm text-white">DODIXCLUB</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400"><X size={18} /></button>
                </div>
                <div className="space-y-2">
                  <button onClick={() => { setActiveTab('home'); setSidebarOpen(false); }} className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white">Home Dashboard</button>
                  {!isFemaleUser && !isAdminUser && <button onClick={() => { setActiveTab('directory'); setSidebarOpen(false); }} className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white">Elite Directory</button>}
                  {isFemaleUser && <button onClick={() => { setActiveTab('myprofile'); setSidebarOpen(false); }} className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white">Manage Profile</button>}
                  <button onClick={() => { setActiveTab('news'); setSidebarOpen(false); }} className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white">News & Announcements</button>
                  {!isFemaleUser && !isAdminUser && <button onClick={() => { setActiveTab('favorites'); setSidebarOpen(false); }} className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white">Favorites</button>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3">Navigation</span>
            <button onClick={() => setActiveTab('home')} className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${activeTab === 'home' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Home Dashboard</button>
            {!isFemaleUser && !isAdminUser && <button onClick={() => setActiveTab('directory')} className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${activeTab === 'directory' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Elite Directory</button>}
            {isFemaleUser && <button onClick={() => setActiveTab('myprofile')} className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${activeTab === 'myprofile' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Manage Profile</button>}
            <button onClick={() => setActiveTab('news')} className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${activeTab === 'news' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>News & Announcements</button>
            {!isFemaleUser && !isAdminUser && <button onClick={() => setActiveTab('favorites')} className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${activeTab === 'favorites' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Favorites</button>}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          {activeTab === 'home' && <HomeDashboard user={currentUser} isFemaleUser={isFemaleUser} announcements={announcements} onNavigate={setActiveTab} />}

          {activeTab === 'directory' && !isFemaleUser && !isAdminUser && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Verified Companion Directory</h2>
                  <p className="text-xs text-slate-400">Browse elite profiles available in {userLockedLocation}</p>
                </div>
                <input type="text" placeholder="Search name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLadies.map(lady => (
                  <div key={lady._id || lady.id} onClick={() => setSelectedProfile(lady)} className="bg-[#0b101d] border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-pink-500 cursor-pointer">
                    <div className="relative h-56 bg-slate-950">
                      <img src={lady.photo || lady.photoUrl} alt={lady.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-white">{lady.name}, {lady.age}</h3>
                        <span className="text-sm font-black text-emerald-400">ZMW {lady.price}</span>
                      </div>
                      <p className="text-xs text-slate-400"><MapPin size={13} className="inline text-pink-500" /> {lady.neighborhood}, {lady.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'myprofile' && isFemaleUser && (
            <CompanionProfileSetup 
              hasCompletedProfile={currentUser?.hasCompletedProfile}
              profileStep={profileStep}
              errorMessage={errorMessage}
              selectedFiles={selectedFiles}
              handleMultiPhotoUpload={handleMultiPhotoUpload}
              removeFileAtIndex={removeFileAtIndex}
              handleStartMasking={handleStartMasking}
              currentMaskIndex={currentMaskIndex}
              stickerType={stickerType}
              setStickerType={setStickerType}
              containerRef={containerRef}
              stickerPos={stickerPos}
              stickerSize={stickerSize}
              handleStickerMouseDown={handleStickerMouseDown}
              handleStickerTouchStart={handleStickerTouchStart}
              selectedEmoji={selectedEmoji}
              customLogo={customLogo}
              handleSaveMaskAndNext={handleSaveMaskAndNext}
              newAdData={newAdData}
              handleInputChange={handleInputChange}
              handleFormSubmit={handleFormSubmit}
              loading={loading}
              resetDirectoryForm={resetDirectoryForm}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'news' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-2">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2"><Bell className="text-pink-500" size={22} /> Platform News</h2>
                <p className="text-xs text-slate-400">Announcements from platform administration.</p>
              </div>
              <div className="space-y-4">
                {visibleAnnouncements.map(item => (
                  <div key={item._id || item.id} className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 space-y-2">
                    <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-300">{item.text || item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        DODIXCLUB &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}