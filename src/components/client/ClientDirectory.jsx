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

const brandLogo = '/logo.jpg';
const homeDashboardLogo = '/home dashboard.png';
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

export default function ClientDirectory({ 
  currentUser, 
  setCurrentUser = () => {}, 
  ladies = [], 
  setLadies = () => {}, 
  isLoading = false, 
  loadingText = '' 
}) {
  // ==========================================
  // 1. ALL HOOKS MUST BE DECLARED FIRST AT THE TOP
  // ==========================================
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

  // Favorites State with LocalStorage Persistence
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`dodix_favorites_${currentUser?.username}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Live Pulse Count State
  const [onlinePulseCount, setOnlinePulseCount] = useState(24);

  // Multi-step Companion Form Wizard State
  const [profileStep, setProfileStep] = useState('photos_step');

  // Multi-photo state management (Min 2, Max 5 pictures)
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [maskedPhotos, setMaskedPhotos] = useState([]); 
  const [currentMaskIndex, setCurrentMaskIndex] = useState(0); 

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Account Details / Settings Form State
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

  // Subscription Countdown Timer State
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

  // Socket.io Live Pulse Listener
  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on('live-pulse-update', (data) => {
      if (data && typeof data.onlineCount === 'number') {
        setOnlinePulseCount(data.onlineCount + 20);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Save Favorites to LocalStorage
  useEffect(() => {
    if (currentUser?.username) {
      localStorage.setItem(`dodix_favorites_${currentUser.username}`, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, currentUser?.username]);

  // Keyboard navigation for photo gallery modal
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

  // Subscription Countdown Timer Effect
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

  const handleUpdateAccountDetails = async (e) => {
    e.preventDefault();
    setSettingsStatus({ type: '', message: '' });

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsStatus({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    setIsUpdatingSettings(true);
    try {
      const payload = {
        phone: accountPhone,
        securityQuestion: secQuestion
      };

      if (newPassword && newPassword.trim() !== '') {
        payload.newPassword = newPassword.trim();
      }

      const response = await fetch(`${BACKEND_URL}/api/users/${currentUser.username}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'client',
          'x-username': currentUser?.username || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success && data.user) {
        setCurrentUser(prev => ({ ...prev, ...data.user }));
        setSettingsStatus({ type: 'success', message: 'Account details and security credentials updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSecAnswer('');
      } else {
        setSettingsStatus({ type: 'error', message: data.error || 'Failed to update account details.' });
      }
    } catch (err) {
      console.error("Account update error:", err);
      setSettingsStatus({ type: 'error', message: 'Network error. Failed to save account updates.' });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleMultiPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setErrorMessage('');

    const totalFiles = [...selectedFiles, ...files];

    if (totalFiles.length > 5) {
      setErrorMessage('You can upload a maximum of 5 pictures per advert.');
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

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleEnd = () => {
    setIsDraggingSticker(false);
  };

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
      setErrorMessage('Please upload a minimum of 2 pictures per advert.');
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
      if (data.maintenance) {
        throw new Error(data.error);
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save profile configuration.');
      }

      fetchBackendLadies();

      setSuccessMessage('Advert with all masked and verification photos published successfully!');
      setProfileStep('success_step');

      const newHistoryItem = {
        id: Date.now(),
        action: 'Submitted Advertisement (Consent Verified)',
        details: payload,
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
    setProfileStep('photos_step');
    setSelectedFiles([]);
    setMaskedPhotos([]);
    setCurrentMaskIndex(0);
    setSuccessMessage('');
  };

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
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'client',
          'x-username': currentUser?.username || ''
        },
        body: JSON.stringify({
          reporter: currentUser.username,
          targetUser: reportedUsername.trim(),
          reason: reportReason.trim()
        })
      });

      const data = await response.json();
      if (data.maintenance) {
        alert(data.error);
        return;
      }
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

  // ==========================================
  // 2. SAFE CONDITIONAL RETURNS (After Hooks)
  // ==========================================
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
            <p className="text-xs text-slate-400 leading-relaxed">
              We are currently running system updates and improvements. Please check back shortly.
            </p>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition cursor-pointer"
          >
            Log Out / Back
          </button>
        </div>
      </div>
    );
  }

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
              Your account (<span className="text-pink-400 font-semibold">{currentUser.username}</span>) is awaiting activation.
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

      {/* ENHANCED PREMIUM MEDIA VIEWER & PROFILE MODAL */}
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
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="max-w-xl w-full bg-[#0b101d] border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden my-auto"
              >
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-5 right-5 p-2.5 text-slate-400 hover:text-white rounded-2xl bg-slate-900/90 border border-slate-800/80 transition cursor-pointer z-30 shadow-lg"
                >
                  <X size={18} />
                </button>

                {/* Upgraded Modern Media Viewer Stage */}
                <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800/90 bg-gradient-to-b from-slate-950 via-black to-slate-950 shadow-2xl flex items-center justify-center group">
                  <div className="absolute inset-0 bg-pink-500/5 blur-3xl pointer-events-none" />
                  
                  <motion.img 
                    key={activePhotoIdx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    src={currentDisplayPhoto} 
                    alt={selectedProfile.name} 
                    className="w-full h-full object-contain relative z-10" 
                  />
                  
                  {allProfilePhotos.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActivePhotoIdx(prev => (prev === 0 ? allProfilePhotos.length - 1 : prev - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-pink-600 text-white rounded-2xl border border-white/10 transition-all cursor-pointer z-20 shadow-xl opacity-80 group-hover:opacity-100"
                        title="Previous Photo (Left Arrow)"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <button 
                        onClick={() => setActivePhotoIdx(prev => (prev === allProfilePhotos.length - 1 ? 0 : prev + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-pink-600 text-white rounded-2xl border border-white/10 transition-all cursor-pointer z-20 shadow-xl opacity-80 group-hover:opacity-100"
                        title="Next Photo (Right Arrow)"
                      >
                        <ArrowRight size={18} />
                      </button>

                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-wider text-pink-400 border border-white/10 z-20 shadow-md">
                        Photo {activePhotoIdx + 1} of {allProfilePhotos.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Upgraded Thumbnail Selector Strip */}
                {allProfilePhotos.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                    {allProfilePhotos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 bg-slate-950 transition-all cursor-pointer shadow-md ${
                          activePhotoIdx === idx 
                            ? 'border-pink-500 scale-105 shadow-pink-500/20 ring-2 ring-pink-500/30' 
                            : 'border-slate-800 opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Profile Details Header */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl font-black text-white">{selectedProfile.name} {selectedProfile.age ? `, ${selectedProfile.age}` : ''}</h3>
                      <span className="bg-emerald-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <ShieldCheck size={11} /> VERIFIED
                      </span>
                    </div>
                    <span className="text-base font-black text-emerald-400">ZMW {selectedProfile.price || selectedProfile.rate}</span>
                  </div>
                  <p className="text-xs text-pink-400 font-bold uppercase tracking-wider">{selectedProfile.category || 'VIP'} Companion</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin size={14} className="text-pink-500 shrink-0" /> {selectedProfile.neighborhood ? `${selectedProfile.neighborhood}, ` : ''}{selectedProfile.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                  <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold block">Hosting Available</span>
                    <span className="text-sm font-extrabold text-slate-200">{selectedProfile.hosting || 'Yes'}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold block">Total Photos</span>
                    <span className="text-sm font-extrabold text-pink-400">{allProfilePhotos.length} Pictures</span>
                  </div>
                </div>

                {(selectedProfile.extraServices || selectedProfile.bio) && (
                  <div className="space-y-1 p-3.5 bg-slate-900/40 border border-slate-800 rounded-2xl">
                    <span className="text-xs font-bold text-slate-300">Services & Preferences</span>
                    <p className="text-xs text-slate-400 leading-relaxed">{selectedProfile.extraServices || selectedProfile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={(e) => toggleFavorite(e, selectedProfile._id || selectedProfile.id)}
                    className={`py-3.5 border font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      isFav 
                        ? 'bg-pink-600/20 border-pink-500 text-pink-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Heart size={16} className={isFav ? 'fill-pink-500 text-pink-500' : ''} />
                    {isFav ? 'Saved in Favorites' : 'Add to Favorites'}
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedProfile(null);
                      handleOpenWhatsApp(selectedProfile);
                    }}
                    className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <MessageSquare size={16} /> WhatsApp
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
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

        {/* Live Pulse Activity Badge Integration */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-emerald-400">
            {onlinePulseCount} active online in {userLockedLocation}
          </span>
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
                  <button 
                    onClick={() => { setActiveTab('home'); setSidebarOpen(false); }}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'home' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                  >
                    <span className="w-7 h-7 rounded-xl bg-white/95 flex items-center justify-center p-0.5 shadow-md shrink-0 overflow-hidden">
                      <img src={homeDashboardLogo} alt="Home" className="w-full h-full object-contain scale-150" />
                    </span>
                    <span>Home Dashboard</span>
                  </button>

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
                    <Bell size={16} /> News & Announcements
                  </button>

                  {!isFemaleUser && !isAdminUser && (
                    <button 
                      onClick={() => { setActiveTab('favorites'); setSidebarOpen(false); }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'favorites' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Heart size={16} /> Favorites ({favoriteIds.length})
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
            
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer w-full ${
                activeTab === 'home' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="w-7 h-7 rounded-xl bg-white/95 flex items-center justify-center p-0.5 shadow-md shrink-0 overflow-hidden">
                <img src={homeDashboardLogo} alt="Home" className="w-full h-full object-contain scale-150" />
              </span>
              <span>Home Dashboard</span>
            </button>

            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('directory')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'directory' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Compass size={16} /> Elite Directory
              </button>
            )}

            {isFemaleUser && (
              <>
                <button 
                  onClick={() => setActiveTab('myprofile')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <User size={16} /> Post Advertisement
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'history' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Bell size={16} /> History
                </button>
              </>
            )}

            <button 
              onClick={() => setActiveTab('news')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'news' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Bell size={16} /> News & Announcements
            </button>

            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${activeTab === 'favorites' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <Heart size={16} /> Favorites
                </div>
                {favoriteIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500 text-white">
                    {favoriteIds.length}
                  </span>
                )}
              </button>
            )}

            {!isFemaleUser && !isAdminUser && (
              <button 
                onClick={() => setActiveTab('subscription')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'subscription' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <CreditCard size={16} /> Subscription Status
              </button>
            )}

            {!isAdminUser && (
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          {activeTab === 'home' && (
            <HomeDashboard 
              user={currentUser} 
              isFemaleUser={isFemaleUser}
              announcements={announcements} 
              onNavigate={setActiveTab} 
            />
          )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLadies.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-[#0b101d] border border-slate-800/80 rounded-3xl space-y-3">
                    <AlertCircle size={32} className="mx-auto text-slate-500" />
                    <p className="text-sm font-bold text-slate-300">No active companions found in {userLockedLocation}.</p>
                  </div>
                ) : (
                  filteredLadies.map((lady) => {
                    const ladyId = lady._id || lady.id;
                    const isFav = favoriteIds.includes(ladyId);

                    return (
                      <div 
                        key={ladyId}
                        onClick={() => {
                          setActivePhotoIdx(0);
                          setSelectedProfile(lady);
                        }}
                        className="bg-[#0b101d] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-pink-500/50 transition cursor-pointer group flex flex-col justify-between relative"
                      >
                        <div className="relative h-56 bg-slate-950 overflow-hidden">
                          <img 
                            src={lady.photo || lady.photoUrl || (lady.photos && lady.photos[0])} 
                            alt={lady.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                          />
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-pink-400 uppercase tracking-wider border border-white/10">
                            {lady.category || 'VIP'}
                          </div>

                          <button
                            onClick={(e) => toggleFavorite(e, ladyId)}
                            className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full border border-white/10 transition cursor-pointer z-10"
                            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart size={16} className={isFav ? 'fill-pink-500 text-pink-500' : 'text-white'} />
                          </button>
                        </div>

                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-extrabold text-white">{lady.name} {lady.age ? `, ${lady.age}` : ''}</h3>
                              <span className="text-sm font-black text-emerald-400">ZMW {lady.price || lady.rate}</span>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin size={13} className="text-pink-500" /> {lady.neighborhood ? `${lady.neighborhood}, ` : ''}{lady.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'myprofile' && isFemaleUser && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn">
              <div className="border-b border-slate-800 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-pink-600/20 text-pink-400 rounded-2xl border border-pink-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">Multi-Photo Advert & Privacy Studio</h2>
                      <p className="text-xs text-slate-400">Upload 2 to 5 photos, watermark each individually, and publish.</p>
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
                      Upload Advert Photographs <span className="text-pink-500">(Min 2 required, Max 5 allowed)</span>
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

                    {/* Role-Differentiated Companion Consent Rules */}
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
                  <button type="submit" disabled={loading} className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg transition">
                    {loading ? 'Publishing...' : 'Publish Profile & All Photos'}
                  </button>
                </form>
              )}

              {profileStep === 'success_step' && (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Advert Successfully Published!</h3>
                  <button onClick={resetDirectoryForm} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs">
                    Post Another Advert
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NEWS & ANNOUNCEMENTS SECTION */}
          {activeTab === 'news' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-2 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Bell className="text-pink-500" size={22} /> Platform News & Announcements
                </h2>
                <p className="text-xs text-slate-400">Important notices, security directives, and system feature releases from platform administration.</p>
              </div>

              <div className="space-y-4">
                {visibleAnnouncements.length === 0 ? (
                  <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 text-xs space-y-2">
                    <Bell size={28} className="mx-auto text-slate-600" />
                    <p className="font-bold text-slate-400">No announcements available right now.</p>
                  </div>
                ) : (
                  visibleAnnouncements.map(item => {
                    const itemId = item._id || item.id;
                    const itemDate = new Date(item.createdAt || item.date || Date.now());
                    const isNew = (Date.now() - itemDate.getTime()) < (48 * 60 * 60 * 1000);

                    let categoryBadge = "PLATFORM NOTICE";
                    let badgeStyles = "bg-purple-500/10 text-purple-400 border-purple-500/30";

                    const titleLower = (item.title || '').toLowerCase();
                    const textLower = (item.text || item.content || '').toLowerCase();

                    if (titleLower.includes('privacy') || titleLower.includes('watermark') || titleLower.includes('security')) {
                      categoryBadge = "SECURITY UPDATE";
                      badgeStyles = "bg-pink-500/10 text-pink-400 border-pink-500/30";
                    } else if (titleLower.includes('maintenance') || titleLower.includes('system') || titleLower.includes('server')) {
                      categoryBadge = "SYSTEM NOTICE";
                      badgeStyles = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                    } else if (titleLower.includes('feature') || titleLower.includes('new') || titleLower.includes('tool')) {
                      categoryBadge = "FEATURE RELEASE";
                      badgeStyles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                    }

                    const fullContent = item.text || item.content || '';
                    const isLongText = fullContent.length > 180;
                    const isExpanded = !!expandedAnnouncements[itemId];

                    return (
                      <div 
                        key={itemId} 
                        className="bg-[#0b101d] border border-slate-800/90 hover:border-pink-500/40 hover:bg-slate-900/60 transition-all duration-300 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 group relative overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${badgeStyles}`}>
                              {categoryBadge}
                            </span>

                            {isNew && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black rounded-full flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> NEW
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                            <Clock size={12} /> {item.date || itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-base font-extrabold text-white group-hover:text-pink-300 transition-colors">
                            {item.title}
                          </h3>

                          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                            <p>
                              {isLongText && !isExpanded 
                                ? `${fullContent.substring(0, 180)}...` 
                                : fullContent}
                            </p>

                            {isLongText && (
                              <button 
                                onClick={() => toggleAnnouncementExpand(itemId)}
                                className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition pt-1 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>Show Less <ChevronUp size={14} /></>
                                ) : (
                                  <>Read Full Update <ChevronDown size={14} /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {(textLower.includes('directory') || textLower.includes('subscription') || textLower.includes('profile')) && (
                          <div className="pt-2 flex items-center gap-3">
                            {textLower.includes('directory') && !isFemaleUser && (
                              <button 
                                onClick={() => setActiveTab('directory')}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-pink-400 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                              >
                                Open Elite Directory <ArrowRight size={12} />
                              </button>
                            )}
                            {textLower.includes('subscription') && !isFemaleUser && (
                              <button 
                                onClick={() => setActiveTab('subscription')}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-400 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                              >
                                View Subscription Pass <CreditCard size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && !isFemaleUser && !isAdminUser && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Heart size={22} className="text-pink-500 fill-pink-500" /> Favorite Companions
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Your saved bookmarks and preferred companion profiles.</p>
                </div>

                <div className="px-3.5 py-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full text-xs font-black">
                  {favoriteLadies.length} {favoriteLadies.length === 1 ? 'Saved Companion' : 'Saved Companions'}
                </div>
              </div>

              {favoriteLadies.length === 0 ? (
                <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-12 text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Heart size={32} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-white">No Favorite Companions Yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click the heart icon on any companion card in the directory to save them to your favorites for quick access.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('directory')}
                    className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <Compass size={16} /> Explore Directory
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteLadies.map((lady) => {
                    const ladyId = lady._id || lady.id;

                    return (
                      <div 
                        key={ladyId}
                        onClick={() => {
                          setActivePhotoIdx(0);
                          setSelectedProfile(lady);
                        }}
                        className="bg-[#0b101d] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-pink-500/50 transition cursor-pointer group flex flex-col justify-between relative"
                      >
                        <div className="relative h-56 bg-slate-950 overflow-hidden">
                          <img 
                            src={lady.photo || lady.photoUrl || (lady.photos && lady.photos[0])} 
                            alt={lady.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                          />
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-pink-400 uppercase tracking-wider border border-white/10">
                            {lady.category || 'VIP'}
                          </div>

                          <button
                            onClick={(e) => toggleFavorite(e, ladyId)}
                            className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md hover:bg-red-600/80 text-pink-500 hover:text-white rounded-full border border-white/10 transition cursor-pointer z-10"
                            title="Remove from Favorites"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-extrabold text-white">{lady.name} {lady.age ? `, ${lady.age}` : ''}</h3>
                              <span className="text-sm font-black text-emerald-400">ZMW {lady.price || lady.rate}</span>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin size={13} className="text-pink-500" /> {lady.neighborhood ? `${lady.neighborhood}, ` : ''}{lady.location}
                            </p>
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsApp(lady);
                            }}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                          >
                            <MessageSquare size={14} /> WhatsApp Companion
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBSCRIPTION TAB WITH LIVE COUNTDOWN TIMER */}
          {activeTab === 'subscription' && !isFemaleUser && !isAdminUser && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Subscription Status & Access</h2>
                  <p className="text-xs text-slate-400">Review your active tier privileges and live pass expiration countdown.</p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Pass
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-pink-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-pink-400">Current Access Package</span>
                  <h3 className="text-2xl font-black text-white">{currentUser?.plan || '7 Days Elite Pass'}</h3>
                </div>

                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
                    <span className="text-2xl sm:text-3xl font-black text-white">{timeLeft.days}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Days</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
                    <span className="text-2xl sm:text-3xl font-black text-white">{timeLeft.hours}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Hours</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
                    <span className="text-2xl sm:text-3xl font-black text-white">{timeLeft.minutes}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Mins</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
                    <span className="text-2xl sm:text-3xl font-black text-pink-400 animate-pulse">{timeLeft.seconds}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Secs</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Pass expires on <span className="text-slate-200 font-semibold">{expiryTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Crown size={16} className="text-pink-500" /> Included Privileges
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Full access to verified companion directory</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Direct WhatsApp booking connections</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Priority live pulse location filtering</li>
                  </ul>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Need to Extend or Upgrade?</h4>
                    <p className="text-xs text-slate-400">Contact platform administration via WhatsApp to renew your pass instantly.</p>
                  </div>
                  <button 
                    onClick={handleContactSupportWhatsApp}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <MessageCircle size={16} /> Contact Support for Renewal
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && isFemaleUser && (
            <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-white">Submission History</h2>
                <p className="text-xs text-slate-400">Track your past profile updates, prices, and verification status.</p>
              </div>
            </div>
          )}

          {/* ACCOUNT DETAILS & SECURITY TAB */}
          {activeTab === 'settings' && !isAdminUser && (
            <AccountSettingsTab 
              currentUser={currentUser}
              isFemaleUser={isFemaleUser}
              accountPhone={accountPhone}
              setAccountPhone={setAccountPhone}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              secQuestion={secQuestion}
              setSecQuestion={setSecQuestion}
              settingsStatus={settingsStatus}
              isUpdatingSettings={isUpdatingSettings}
              handleUpdateAccountDetails={handleUpdateAccountDetails}
              onOpenDeletePage={() => setActiveTab('delete_account_page')}
            />
          )}

          {/* DEDICATED MULTI-STEP DELETE ACCOUNT PAGE */}
          {activeTab === 'delete_account_page' && !isAdminUser && (
            <DeleteAccountPage
              currentUser={currentUser}
              onBack={() => setActiveTab('settings')}
              isDeletingAccount={isDeletingAccount}
              onConfirmDelete={async (password, setError) => {
                setIsDeletingAccount(true);
                try {
                  const response = await fetch(`${BACKEND_URL}/api/users/${currentUser.username}`, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-user-role': currentUser?.role || 'client',
                      'x-username': currentUser?.username || ''
                    },
                    body: JSON.stringify({ password })
                  });

                  const data = await response.json();
                  if (data.success) {
                    localStorage.removeItem(`dodix_favorites_${currentUser.username}`);
                    localStorage.removeItem(`dodix_history_${currentUser.username}`);
                    alert("Your account and data have been permanently deleted.");
                    setCurrentUser(null);
                  } else {
                    setError(data.error || "Failed to delete account. Please verify your password.");
                  }
                } catch (err) {
                  console.error("Account deletion network error:", err);
                  setError("Network error. Failed to complete account deletion.");
                } finally {
                  setIsDeletingAccount(false);
                }
              }}
            />
          )}
        </main>
      </div>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 mt-auto">
        DODIXCLUB &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}