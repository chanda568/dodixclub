// src/components/client/ClientDirectory.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, MessageSquare, MapPin, Search, User, Compass, Menu, X, ShieldCheck, Clock, Crown, RefreshCw, CheckCircle, CheckCircle2, Flag, Heart, CreditCard, Settings, Bell, Trash2, MessageCircle, Loader2, AlertCircle, ArrowRight, ArrowLeft, Upload, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import LogoLoader from '../common/LogoLoader';
import { encryptStorageData, decryptStorageData } from '../../utils/storageEncryption';
import HomeDashboard from './HomeDashboard';
import AccountSettingsTab from './AccountSettingsTab';
import DeleteAccountPage from './DeleteAccountPage';
import CompanionProfileSetup from './CompanionProfileSetup';
import CompanionDirectoryCatalog from './CompanionDirectoryCatalog';
import UserSubscriptionView from './UserSubscriptionView';

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
  const isFemaleUser = currentUser?.gender?.toLowerCase() === 'female' || currentUser?.gender?.toLowerCase() === 'lady';
  const isAdminUser = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';
  const hasCompletedProfile = currentUser?.hasCompletedProfile || false;

  const [activeTab, setActiveTab] = useState(isFemaleUser && !hasCompletedProfile ? 'myprofile' : 'home'); 
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

  const existingProfile = currentUser?.profile || {};

  const [newAdData, setNewAdData] = useState({
    name: existingProfile.name || currentUser?.name || initialName,
    category: existingProfile.category || currentUser?.category || '', 
    location: existingProfile.location || currentUser?.location || userLockedLocation, 
    neighborhood: existingProfile.neighborhood || currentUser?.neighborhood || '', 
    hosting: existingProfile.hosting || currentUser?.hosting || 'Yes', 
    phone: existingProfile.phone || currentUser?.phone || '',
    age: existingProfile.age || currentUser?.age || '',
    rate: existingProfile.price || currentUser?.rate || '',
    bio: existingProfile.extraServices || currentUser?.bio || '',
    agreedToTerms: existingProfile.agreedToTerms || false
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

  useEffect(() => {
    if (isFemaleUser && !hasCompletedProfile && activeTab !== 'myprofile') {
      setActiveTab('myprofile');
    }
  }, [isFemaleUser, hasCompletedProfile, activeTab]);

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

    return () => {
      socket.disconnect();
    };
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

      const profilePayload = {
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

      const userProfileRes = await fetch(`${BACKEND_URL}/api/users/${currentUser.username}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'client',
          'x-username': currentUser?.username || ''
        },
        body: JSON.stringify({ profileData: profilePayload })
      });

      const userProfileData = await userProfileRes.json();
      if (userProfileData.success && userProfileData.user) {
        setCurrentUser(prev => ({ ...prev, ...userProfileData.user, hasCompletedProfile: true }));
      }

      const response = await fetch(`${BACKEND_URL}/api/ladies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'client',
          'x-username': currentUser?.username || ''
        },
        body: JSON.stringify(profilePayload)
      });

      const data = await response.json();
      if (data.maintenance) {
        throw new Error(data.error);
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save profile configuration.');
      }

      fetchBackendLadies();

      setSuccessMessage('Mandatory Profile setup completed and advert published successfully!');
      setProfileStep('success_step');

      const newHistoryItem = {
        id: Date.now(),
        action: 'Completed Mandatory Profile & Advert',
        details: profilePayload,
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

  const handleOpenWhatsApp = (lady) => {
    const phoneNum = lady.phone ? lady.phone.replace(/[^0-9]/g, '') : '260970000000';
    const message = `Hello ${lady.name}, I found your listing on DodixClub and would like to connect regarding booking availability in ${lady.location}.`;
    
    navigator.clipboard.writeText(message).catch(() => {});
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNum}?text=${encodedMessage}`, '_blank');
  };

  if (!currentUser) return null;

  const approvedLadies = ladies.filter(l => l.approved === true);
  const filteredLadies = approvedLadies.filter(l => {
    const matchesLoc = l.location === userLockedLocation;
    const matchesCat = selectedCategory === 'All' || l.category === selectedCategory;
    const matchesSearch = l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.neighborhood && l.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLoc && matchesCat && matchesSearch;
  });

  const favoriteLadies = approvedLadies.filter(l => favoriteIds.includes(l._id || l.id));

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative selection:bg-pink-500 selection:text-white font-sans">
      <canvas ref={canvasRef} className="hidden" />
      {isLoading && <LogoLoader text={loadingText} />}

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
            onClick={() => setCurrentUser(null)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
          <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-5 space-y-2 shadow-xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3">Navigation</span>
            
            <button 
              onClick={() => {
                if (isFemaleUser && !hasCompletedProfile) return;
                setActiveTab('home');
              }}
              disabled={isFemaleUser && !hasCompletedProfile}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all w-full ${
                activeTab === 'home' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : (isFemaleUser && !hasCompletedProfile ? 'text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer')
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
              <button 
                onClick={() => setActiveTab('myprofile')}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${activeTab === 'myprofile' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <User size={16} /> {hasCompletedProfile ? 'Edit Profile & Advert' : 'Setup Profile (Mandatory)'}
              </button>
            )}
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
            <CompanionDirectoryCatalog
              userLockedLocation={userLockedLocation}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredLadies={filteredLadies}
              favoriteIds={favoriteIds}
              toggleFavorite={toggleFavorite}
              setActivePhotoIdx={setActivePhotoIdx}
              setSelectedProfile={setSelectedProfile}
              resolveTargetUsername={resolveTargetUsername}
              onStartChat={onStartChat}
              handleOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {activeTab === 'myprofile' && isFemaleUser && (
            <CompanionProfileSetup
              hasCompletedProfile={hasCompletedProfile}
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

          {activeTab === 'subscription' && !isFemaleUser && !isAdminUser && (
            <UserSubscriptionView
              currentUser={currentUser}
              timeLeft={timeLeft}
              expiryTime={expiryTime}
              handleContactSupportWhatsApp={handleContactSupportWhatsApp}
            />
          )}

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