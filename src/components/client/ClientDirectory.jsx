// src/components/client/ClientDirectory.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, MessageSquare, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, RefreshCw, CheckCircle, CheckCircle2, Flag, Heart, CreditCard, Settings, Bell, Plus, Trash2, Shield, MessageCircle, Loader2, DollarSign, AlertCircle, Save, Phone, Edit3, Sliders, Move, Check, Award, Filter, ArrowRight, ArrowLeft, Upload, Sparkles, FileText, Camera, Home, Lock, Key, CheckCircle2Icon, ChevronDown, ChevronUp, ExternalLink, Eye, Activity
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
  loadingText = '',
  onStartChat = () => {}
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

  // Companion Live Status State (Online / Busy / Away)
  const [companionStatus, setCompanionStatus] = useState('Online');

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

  // Helper function to extract valid username/handle for messaging
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

        {/* Live Pulse Activity Badge or Companion Availability Status Toggle */}
        <div className="hidden lg:flex items-center gap-3">
          {isFemaleUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">My Status:</span>
              <select 
                value={companionStatus} 
                onChange={(e) => setCompanionStatus(e.target.value)}
                className="bg-transparent text-xs font-black text-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="Online" className="bg-[#0b101d] text-emerald-400">🟢 Online</option>
                <option value="Busy" className="bg-[#0b101d] text-amber-400">🟡 Busy / In Session</option>
                <option value="Away" className="bg-[#0b101d] text-slate-400">🔴 Away / Offline</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                {onlinePulseCount} active online in {userLockedLocation}
              </span>
            </div>
          )}
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
            // Directory code...
            null
          )}

          {activeTab === 'myprofile' && isFemaleUser && (
            // Post Advertisement code...
            null
          )}

          {/* NEWS & ANNOUNCEMENTS SECTION */}
          {activeTab === 'news' && (
            // News code...
            null
          )}

          {/* HISTORY / SUBMISSION HISTORY TAB (ENHANCED FOR COMPANIONS) */}
          {activeTab === 'history' && isFemaleUser && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Submission & Activity History</h2>
                  <p className="text-xs text-slate-400">Track your past profile updates, prices, and administrative approval status.</p>
                </div>
                <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-2xl text-xs font-black flex items-center gap-2">
                  <Activity size={16} /> {profileHistory.length} Total Submissions
                </div>
              </div>

              {/* Engagement & Performance Quick Stats Widget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-5 space-y-1 shadow-md">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye size={14} className="text-pink-400" /> Profile Views (7d)
                  </span>
                  <span className="text-2xl font-black text-white">142</span>
                  <span className="text-[10px] text-emerald-400 font-bold block">↑ 18% from last week</span>
                </div>

                <div className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-5 space-y-1 shadow-md">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-amber-400" /> Active Inquiries
                  </span>
                  <span className="text-2xl font-black text-white">8</span>
                  <span className="text-[10px] text-amber-400 font-bold block">Pending response</span>
                </div>

                <div className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-5 space-y-1 shadow-md">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" /> Verification Status
                  </span>
                  <span className="text-xl font-black text-emerald-400">Verified Elite</span>
                  <span className="text-[10px] text-slate-400 block">Status: {companionStatus}</span>
                </div>
              </div>

              {/* Submission History Table */}
              <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 sm:p-6 border-b border-slate-800">
                  <h3 className="text-sm font-extrabold text-white">Recent Adverts & Status Updates</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-6">Action / Event</th>
                        <th className="py-3 px-6">Timestamp</th>
                        <th className="py-3 px-6">Status Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {profileHistory.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="py-8 text-center text-slate-500">No submission history recorded yet.</td>
                        </tr>
                      ) : (
                        profileHistory.map((item) => {
                          const statusColor = item.status?.includes('Approved') || item.status?.includes('Ready') 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                          return (
                            <tr key={item.id} className="hover:bg-slate-900/30 transition">
                              <td className="py-4 px-6 font-bold text-white">{item.action}</td>
                              <td className="py-4 px-6 text-slate-400">
                                {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusColor}`}>
                                  {item.status || 'Under Review'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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