// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Flag, Video, CheckCircle, XCircle, Trash2, 
  LogOut, RefreshCw, X, MessageSquare, MapPin, Edit3, MessageCircle, Clock, Eye, Sparkles, Maximize2, KeyRound, Bell, Plus, Activity, Lock, Unlock, ExternalLink, AlertTriangle, Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_URL } from '../../data/constants';
import { encryptStorageData, decryptStorageData } from '../../utils/storageEncryption';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function AdminUserTimer({ createdAt, plan }) {
  const [timeLeft, setTimeLeft] = useState({ expired: false, text: '' });

  useEffect(() => {
    const calculateTime = () => {
      const registrationDate = new Date(createdAt || Date.now());
      const daysAllowed = plan === '30 Days' ? 30 : 7;
      const expiryDate = new Date(registrationDate.getTime() + daysAllowed * 24 * 60 * 60 * 1000);
      const now = new Date();
      const difference = expiryDate - now;

      if (difference <= 0) {
        setTimeLeft({ expired: true, text: 'Plan Expired' });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) {
        setTimeLeft({ expired: false, text: `${days}d ${hours}h left` });
      } else {
        setTimeLeft({ expired: false, text: `${hours}h ${minutes}m left` });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [createdAt, plan]);

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '18 Sept 2026';

  return (
    <div className="flex flex-col text-[11px] space-y-0.5">
      <span className="text-slate-400 font-medium">Joined: {formattedDate}</span>
      <span className={`font-bold flex items-center gap-1 ${timeLeft.expired ? 'text-rose-400' : 'text-emerald-400'}`}>
        <Clock size={11} /> {timeLeft.text}
      </span>
    </div>
  );
}

export default function AdminDashboard({ 
  currentUser, 
  setCurrentUser, 
  usersDb, 
  setUsersDb, 
  ladies, 
  setLadies, 
  messages, 
  setMessages,
  sendChatMessage,
  isLoading,
  loadingText,
  triggerLoadingAction
}) {
  const [activeSubTab, setActiveSubTab] = useState('users'); 
  const [userGenderFilter, setUserGenderFilter] = useState('all'); // 'all' | 'male' | 'female'
  const [searchQuery, setSearchQuery] = useState(''); // Added search state
  const [reports, setReports] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVisibility, setNewVisibility] = useState('all');

  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [selectedCompanionModal, setSelectedCompanionModal] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [fullScreenVideo, setFullScreenVideo] = useState(null);
  
  const [isFaceRevealed, setIsFaceRevealed] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');

  // Companion Price Editing States
  const [isEditingCompanionPrice, setIsEditingCompanionPrice] = useState(false);
  const [companionPriceInput, setCompanionPriceInput] = useState('');

  const formatLastSeenDetail = (isoString) => {
    if (!isoString) return { isOnline: false, text: 'Offline' };
    const lastSeenDate = new Date(isoString);
    const diffMs = Date.now() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 5) {
      return { isOnline: true, text: 'Online (Active now)' };
    }

    const timeFormatted = lastSeenDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = lastSeenDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    if (diffHours < 24) {
      return { isOnline: false, text: `Last seen today at ${timeFormatted}` };
    }
    return { isOnline: false, text: `Last seen ${dateFormatted}, ${timeFormatted}` };
  };

  const loadBackendData = async () => {
    try {
      const resUsers = await fetch(`${BACKEND_URL}/api/users`);
      const dataUsers = await resUsers.json();
      if (dataUsers.success && Array.isArray(dataUsers.users)) {
        const localSaved = localStorage.getItem('dodix_users_db');
        let localUsersMap = {};
        if (localSaved) {
          try {
            const decryptedLocal = decryptStorageData(localSaved) || [];
            decryptedLocal.forEach(u => {
              if (u.username && u.lastSeen) {
                localUsersMap[u.username.toLowerCase()] = u.lastSeen;
              }
            });
          } catch (e) {
            console.error("Error decrypting local users db:", e);
          }
        }

        const mergedUsers = dataUsers.users.map(u => ({
          ...u,
          lastSeen: localUsersMap[u.username?.toLowerCase()] || u.lastSeen || new Date().toISOString()
        }));

        setUsersDb(mergedUsers);
      }

      const resLadies = await fetch(`${BACKEND_URL}/api/ladies`);
      const dataLadies = await resLadies.json();
      if (dataLadies.success && Array.isArray(dataLadies.ladies)) {
        const processedLadies = dataLadies.ladies.map(lady => {
          const rawOriginal = lady.originalPhoto || lady.unmaskedPhoto || lady.photo;
          return {
            ...lady,
            originalPhoto: rawOriginal,
            unmaskedPhoto: rawOriginal,
            photo: lady.photo || rawOriginal
          };
        });
        setLadies(processedLadies);
      }

      const resReports = await fetch(`${BACKEND_URL}/api/reports`);
      const dataReports = await resReports.json();
      if (dataReports.success && Array.isArray(dataReports.reports)) {
        setReports(dataReports.reports);
      }
    } catch (err) {
      console.error("Error fetching live backend data:", err);
    }
  };

  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 5000);

    try {
      const savedAnnouncements = localStorage.getItem('dodix_announcements_db');
      if (savedAnnouncements) {
        setAnnouncements(decryptStorageData(savedAnnouncements) || []);
      }
    } catch (err) {
      console.error("Error loading announcements:", err);
    }

    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppContact = (phone, name) => {
    if (!phone || phone === 'Not Provided') {
      const manualPhone = prompt(`Please enter WhatsApp number for @${name || 'user'} (with country code, e.g., 260...):`);
      if (!manualPhone) return;
      phone = manualPhone.trim();
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent(`Hello @${name || 'Member'}, this is Dodix Admin reaching out regarding your video verification clip. Please ensure your video upload is re-submitted or sent directly via WhatsApp.`);
    window.open(`https://wa.me/${cleanPhone}?text=${defaultMsg}`, '_blank');
  };

  const handleWhatsAppReporter = (reporterUsername) => {
    const cleanReporterName = reporterUsername.replace('@', '').trim();
    const foundUser = usersDb.find(u => u.username?.toLowerCase() === cleanReporterName.toLowerCase());
    
    let phone = foundUser?.phone;
    if (!phone || phone === 'Not Provided') {
      const manualPhone = prompt(`Please enter WhatsApp number for reporter @${cleanReporterName} (with country code, e.g., 260...):`);
      if (!manualPhone) return;
      phone = manualPhone.trim();
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent(`Hello @${cleanReporterName}, this is Dodix Admin regarding the report you submitted.`);
    window.open(`https://wa.me/${cleanPhone}?text=${defaultMsg}`, '_blank');
  };

  const handleToggleUserActivation = async (username) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      if (data.success) {
        loadBackendData();
        if (selectedReportUser && selectedReportUser.username.toLowerCase() === username.toLowerCase()) {
          setSelectedReportUser({ ...selectedReportUser, activated: data.user.activated });
        }
      }
    } catch (err) {
      console.error("Error toggling user activation:", err);
    }
  };

  const handleAdminPasswordReset = async (username) => {
    const newPassword = prompt(`Enter a new temporary password for @${username}:`);
    if (!newPassword || newPassword.trim().length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword: newPassword.trim() })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Password for @${username} has been successfully reset!`);
      } else {
        alert(data.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Network error connecting to server.");
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user @${username}?`)) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${username}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        loadBackendData();
        setSelectedReportUser(null);
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${reportId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadBackendData();
      }
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  const handleApproveCompanion = async (username) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      if (data.success) {
        setLadies(prev => prev.map(l => 
          (l.username?.toLowerCase() === username.toLowerCase() || l.name?.toLowerCase() === username.toLowerCase())
            ? { ...l, approved: true }
            : l
        ));
        setSelectedCompanionModal(prev => prev ? { ...prev, approved: true } : null);

        loadBackendData();

        try {
          const savedAnnouncements = localStorage.getItem('dodix_announcements_db');
          let currentAnnouncements = savedAnnouncements ? (decryptStorageData(savedAnnouncements) || []) : [];
          
          const approvalNotification = {
            id: Date.now(),
            title: 'Advertisement Approved!',
            content: `Great news @${username}! Your advertisement listing has been reviewed and approved by administration. It is now live in the Elite Directory.`,
            visibility: 'female',
            targetUsername: username.toLowerCase(),
            timestamp: new Date().toISOString()
          };

          const updatedAnnouncements = [approvalNotification, ...currentAnnouncements];
          localStorage.setItem('dodix_announcements_db', encryptStorageData(updatedAnnouncements));
        } catch (notifErr) {
          console.error("Error creating approval notification storage item:", notifErr);
        }

        alert(`Advertisement for @${username} has been successfully approved, and the companion has been notified!`);
        setSelectedCompanionModal(null);
      } else {
        alert(data.error || "Failed to approve companion.");
      }
    } catch (err) {
      console.error("Error approving companion:", err);
    }
  };

  const handleSaveCompanionPrice = async (companionIdOrUsername) => {
    if (!companionPriceInput.trim()) {
      alert("Price cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${companionIdOrUsername}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: companionPriceInput.trim() })
      });
      const data = await response.json();
      if (data.success) {
        loadBackendData();
        setSelectedCompanionModal(prev => prev ? { ...prev, price: companionPriceInput.trim() } : null);
        setIsEditingCompanionPrice(false);
        alert("Advertisement price updated successfully!");
      } else {
        alert(data.error || "Failed to update price.");
      }
    } catch (err) {
      console.error("Error updating price:", err);
      alert("Network error updating price.");
    }
  };

  const handleRejectCompanion = async (companionId, username) => {
    const targetId = companionId || username;
    if (!targetId) {
      alert("Error: Missing advertisement identifier.");
      return;
    }

    if (!window.confirm(`Are you sure you want to reject/remove the advertisement for @${username || companionId}?`)) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${targetId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success || response.ok) {
        setLadies(prev => prev.filter(l => l._id !== targetId && l.id !== targetId && l.username !== username));
        loadBackendData();
        alert(`Advertisement has been successfully rejected and removed.`);
        setSelectedCompanionModal(null);
      } else {
        alert(data.error || "Failed to reject advertisement.");
      }
    } catch (err) {
      console.error("Error rejecting companion:", err);
      setLadies(prev => prev.filter(l => l._id !== targetId && l.id !== targetId && l.username !== username));
      setSelectedCompanionModal(null);
      alert("Advertisement removed from view.");
    }
  };

  const handleOpenUserInspect = (reportedUsername) => {
    const cleanUsername = reportedUsername.replace('@', '').trim();
    const foundUser = usersDb.find(u => u.username?.toLowerCase() === cleanUsername.toLowerCase());

    if (foundUser) {
      setSelectedReportUser(foundUser);
      setNewLocationInput(foundUser.location || 'Lusaka');
    } else {
      setSelectedReportUser({
        username: cleanUsername,
        gender: 'Client / Member',
        activated: true,
        location: 'Lusaka',
      });
      setNewLocationInput('Lusaka');
    }
    setIsEditingLocation(false);
  };

  const handleSaveUserLocation = async (username) => {
    if (!newLocationInput.trim()) {
      alert("Location cannot be empty.");
      return;
    }
    const updated = usersDb.map(u => {
      if (u.username?.toLowerCase() === username.toLowerCase()) {
        return { ...u, location: newLocationInput.trim() };
      }
      return u;
    });
    setUsersDb(updated);
    setSelectedReportUser(prev => prev ? { ...prev, location: newLocationInput.trim() } : null);
    setIsEditingLocation(false);
    alert(`Location for @${username} successfully updated to "${newLocationInput.trim()}"!`);
  };

  const filteredUsers = usersDb.filter(u => {
    const g = u.gender?.toLowerCase() || '';
    const matchesGender = 
      userGenderFilter === 'male' ? g === 'male' :
      userGenderFilter === 'female' ? g === 'female' : true;

    const matchesSearch = u.username?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGender && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* FULL SCREEN IMAGE MODAL */}
      <AnimatePresence>
        {fullScreenImage && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <button 
                onClick={() => setFullScreenImage(null)}
                className="absolute top-4 right-4 p-3 text-white bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-700 transition cursor-pointer z-10 shadow-xl"
              >
                <X size={24} />
              </button>
              <div className="relative max-w-full max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-slate-800 bg-black flex items-center justify-center">
                <img 
                  src={fullScreenImage} 
                  alt="Full Size Advertisement" 
                  className="max-w-full max-h-[85vh] object-contain block"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN VIDEO MODAL */}
      <AnimatePresence>
        {fullScreenVideo && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <button 
                onClick={() => setFullScreenVideo(null)}
                className="absolute top-4 right-4 p-3 text-white bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-700 transition cursor-pointer z-10 shadow-xl"
              >
                <X size={24} />
              </button>
              <div className="relative max-w-full max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-slate-800 bg-black flex flex-col items-center justify-center p-4 space-y-4">
                <video 
                  src={fullScreenVideo} 
                  controls 
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[70vh] object-contain block mx-auto rounded-xl"
                />
                <a 
                  href={fullScreenVideo} 
                  download="Verification_Clip.mp4"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-pink-400 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition"
                >
                  <ExternalLink size={14} /> Download Verification Video
                </a>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPANION INSPECTION MODAL */}
      <AnimatePresence>
        {selectedCompanionModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedCompanionModal(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer z-10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div 
                  onClick={() => setFullScreenImage(isFaceRevealed ? (selectedCompanionModal.originalPhoto || selectedCompanionModal.unmaskedPhoto || selectedCompanionModal.photo) : selectedCompanionModal.photo)}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-lg shrink-0 bg-slate-950 cursor-pointer group hover:border-pink-400 transition"
                  title="Click to view full-size image"
                >
                  <img 
                    src={isFaceRevealed ? (selectedCompanionModal.originalPhoto || selectedCompanionModal.unmaskedPhoto || selectedCompanionModal.photo) : selectedCompanionModal.photo} 
                    alt={selectedCompanionModal.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Maximize2 size={18} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white">{selectedCompanionModal.name || selectedCompanionModal.username}, {selectedCompanionModal.age || '23'}</h3>
                    <span className={`font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm ${selectedCompanionModal.approved !== false ? 'bg-emerald-500/90 text-slate-950' : 'bg-amber-500/90 text-slate-950'}`}>
                      <ShieldCheck size={11} /> {selectedCompanionModal.approved !== false ? 'APPROVED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider">{selectedCompanionModal.category || 'VIP'} Companion</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={14} className="text-pink-500" /> {selectedCompanionModal.specificLocation || selectedCompanionModal.location}
                  </p>
                </div>
              </div>

              {/* ADMIN PRIVACY TOGGLE */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    {isFaceRevealed ? <Unlock size={15} className="text-amber-400" /> : <Lock size={15} className="text-pink-500" />}
                    Admin Privacy View Mode
                  </span>
                  <button 
                    onClick={() => setIsFaceRevealed(!isFaceRevealed)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md ${isFaceRevealed ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-pink-600 hover:bg-pink-500 text-white'}`}
                  >
                    {isFaceRevealed ? 'Face Revealed (Original)' : 'Face Hidden (Sticker On)'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  {isFaceRevealed ? 'Showing original unmasked face photo for admin review.' : 'Showing public version with privacy sticker.'}
                </p>

                <div 
                  onClick={() => setFullScreenImage(isFaceRevealed ? (selectedCompanionModal.originalPhoto || selectedCompanionModal.unmaskedPhoto || selectedCompanionModal.photo) : selectedCompanionModal.photo)}
                  className="relative w-full h-48 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-pointer group"
                  title="Click to expand image"
                >
                  <img 
                    src={isFaceRevealed ? (selectedCompanionModal.originalPhoto || selectedCompanionModal.unmaskedPhoto || selectedCompanionModal.photo) : selectedCompanionModal.photo} 
                    alt="Review Photo" 
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Maximize2 size={20} /> Click to Expand
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                {/* EDITABLE RATE / PRICE BLOCK */}
                <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rate / Price</span>
                    {!isEditingCompanionPrice ? (
                      <button 
                        onClick={() => {
                          setIsEditingCompanionPrice(true);
                          setCompanionPriceInput(selectedCompanionModal.price || '');
                        }}
                        className="text-[11px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 size={11} /> Edit Price
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-400 font-bold">Editing Mode</span>
                    )}
                  </div>

                  {!isEditingCompanionPrice ? (
                    <span className="text-base font-extrabold text-emerald-400 block">ZMW {selectedCompanionModal.price || 'N/A'}</span>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <input 
                        type="text"
                        value={companionPriceInput}
                        onChange={(e) => setCompanionPriceInput(e.target.value)}
                        placeholder="Enter new price..."
                        className="w-full px-3 py-2 bg-slate-950 border border-pink-500/60 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSaveCompanionPrice(selectedCompanionModal._id || selectedCompanionModal.id || selectedCompanionModal.username)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Save Price
                        </button>
                        <button 
                          onClick={() => setIsEditingCompanionPrice(false)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Hosting Available</span>
                  <span className="text-sm font-extrabold text-slate-200">{selectedCompanionModal.hosting || 'Yes'}</span>
                </div>
              </div>

              {selectedCompanionModal.extraServices && (
                <div className="space-y-1.5 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-300">Services & Preferences Bio</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedCompanionModal.extraServices}</p>
                </div>
              )}

              {/* VERIFICATION VIDEO SECTION */}
              <div className="space-y-2 p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Video size={15} className="text-pink-400" /> Promotional Verification Video
                  </span>
                  {selectedCompanionModal.verificationVideoUrl && (
                    <button
                      onClick={() => setFullScreenVideo(selectedCompanionModal.verificationVideoUrl)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow"
                    >
                      <Maximize2 size={12} /> Watch Fullscreen
                    </button>
                  )}
                </div>

                {selectedCompanionModal.verificationVideoUrl ? (
                  <div className="space-y-2">
                    <div className="w-full bg-black rounded-xl overflow-hidden border border-purple-900/50 flex items-center justify-center p-1">
                      <video 
                        src={selectedCompanionModal.verificationVideoUrl} 
                        controls 
                        playsInline
                        preload="metadata"
                        className="max-h-60 w-auto object-contain mx-auto rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>File: <span className="text-white font-medium">{selectedCompanionModal.verificationVideoName || 'Verification_Clip.mp4'}</span></span>
                      <a 
                        href={selectedCompanionModal.verificationVideoUrl} 
                        download="Verification_Clip.mp4"
                        className="text-pink-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        Download Video <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400 font-medium">No verification video clip uploaded yet by this companion.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <button 
                  onClick={() => handleApproveCompanion(selectedCompanionModal.username || selectedCompanionModal.name)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <CheckCircle size={15} /> Approve Ad & Notify
                </button>
                <button 
                  onClick={() => handleRejectCompanion(selectedCompanionModal._id || selectedCompanionModal.id, selectedCompanionModal.username || selectedCompanionModal.name)}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <XCircle size={15} /> Reject Ad
                </button>
              </div>

              <div className="grid grid-cols-1 pt-1">
                <button 
                  onClick={() => {
                    handleWhatsAppContact(selectedCompanionModal.phone, selectedCompanionModal.username || selectedCompanionModal.name);
                  }}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageCircle size={14} /> Contact via WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReportUser && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative"
            >
              <button 
                onClick={() => setSelectedReportUser(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-950/60 border border-pink-800/40 text-pink-400 rounded-2xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">User Control & Activation</h3>
                  <p className="text-xs text-slate-400">Inspect account plan and manage activation</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-900 border border-slate-800/80 rounded-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Username</span>
                  <span className="text-white font-extrabold">@{selectedReportUser.username}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Gender / Role</span>
                  <span className="text-pink-400 font-semibold capitalize">{selectedReportUser.gender || 'Client'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Selected Plan</span>
                  <span className="text-purple-400 font-bold">{selectedReportUser.plan || '7 Days'}</span>
                </div>
                
                {selectedReportUser.gender?.toLowerCase() === 'female' && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleWhatsAppContact(selectedReportUser.phone, selectedReportUser.username)}
                      className="w-full py-2.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 font-bold rounded-xl text-xs border border-emerald-800/50 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                    >
                      <MessageCircle size={15} /> Contact on WhatsApp for Verification
                    </button>
                  </div>
                )}
                
                <div className="flex flex-col space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={12} className="text-pink-400" /> Current Location
                    </span>
                    {!isEditingLocation && (
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">{selectedReportUser.location || 'Lusaka'}</span>
                        <button 
                          onClick={() => {
                            setIsEditingLocation(true);
                            setNewLocationInput(selectedReportUser.location || 'Lusaka');
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-pink-400 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditingLocation && (
                    <div className="space-y-2 pt-1">
                      <input 
                        type="text"
                        value={newLocationInput}
                        onChange={(e) => setNewLocationInput(e.target.value)}
                        placeholder="Enter new location..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSaveUserLocation(selectedReportUser.username)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Save Location
                        </button>
                        <button 
                          onClick={() => setIsEditingLocation(false)}
                          className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleAdminPasswordReset(selectedReportUser.username)}
                    className="w-full py-2.5 bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 font-bold rounded-xl text-xs border border-purple-800/50 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <KeyRound size={15} /> Reset User Password
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Account Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${selectedReportUser.activated !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
                    {selectedReportUser.activated !== false ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleToggleUserActivation(selectedReportUser.username)}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${selectedReportUser.activated !== false ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  {selectedReportUser.activated !== false ? (
                    <>
                      <XCircle size={16} /> Suspend User Account
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Activate Account
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteUser(selectedReportUser.username)}
                  className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold rounded-xl text-xs transition border border-red-900/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} /> Permanently Delete User
                </button>

                <button
                  onClick={() => setSelectedReportUser(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700 cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Dodix Logo" className="w-10 h-10 rounded-2xl object-cover shadow-lg border border-pink-500/30" />
          <div>
            <h1 className="text-base font-black tracking-wider text-white">DODIX<span className="text-pink-500">ADMIN</span></h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-400" /> Secure Command Center
            </p>
          </div>
        </div>

        <button 
          onClick={() => setCurrentUser(null)}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition flex items-center gap-2 text-xs font-bold cursor-pointer"
        >
          <LogOut size={16} /> Log Out
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b101d] border border-slate-800 p-2 rounded-2xl shadow-xl">
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'users' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={16} /> Users ({usersDb.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('companions')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'companions' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Video size={16} /> Companions ({ladies.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('inbox')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'inbox' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare size={16} /> Inbox ({messages.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('reports')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'reports' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Flag size={16} /> Reports ({reports.length})
          </button>
        </div>

        {activeSubTab === 'users' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Registered Users & Client Database</h2>
                <p className="text-xs text-slate-400">Inspect accounts, view real-time online status / exact last seen, registration & expiry countdown</p>
              </div>

              {/* FILTERS & SEARCH BAR CONTROLS */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setUserGenderFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${userGenderFilter === 'all' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    All ({usersDb.length})
                  </button>
                  <button
                    onClick={() => setUserGenderFilter('male')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${userGenderFilter === 'male' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Male Clients ({usersDb.filter(u => u.gender?.toLowerCase() === 'male').length})
                  </button>
                  <button
                    onClick={() => setUserGenderFilter('female')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${userGenderFilter === 'female' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Female Companions ({usersDb.filter(u => u.gender?.toLowerCase() === 'female').length})
                  </button>
                  <button onClick={loadBackendData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer ml-1" title="Refresh">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Username</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Registration & Expiry</th>
                    <th className="p-3.5">Online / Last Seen</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-500">No users found matching your search or filter.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, i) => {
                      const isActivated = u.activated !== false;
                      const isFemale = u.gender?.toLowerCase() === 'female';
                      const lastSeenInfo = formatLastSeenDetail(u.lastSeen);

                      return (
                        <tr key={u._id || i} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">
                            @{u.username}
                          </td>
                          <td className="p-3.5">
                            <span className={`font-semibold capitalize text-xs px-2.5 py-0.5 rounded-full ${u.gender?.toLowerCase() === 'female' ? 'bg-pink-950 text-pink-400 border border-pink-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'}`}>
                              {u.gender || 'Client'}
                            </span>
                          </td>
                          <td className="p-3.5 text-purple-400 font-bold">
                            {u.plan || '7 Days'}
                          </td>
                          <td className="p-3.5 text-pink-400 font-semibold flex items-center gap-1 mt-1">
                            <MapPin size={12} className="shrink-0" /> <span>{u.location || 'Lusaka'}</span>
                          </td>
                          <td className="p-3.5">
                            <AdminUserTimer createdAt={u.createdAt} plan={u.plan} />
                          </td>
                          <td className="p-3.5">
                            {lastSeenInfo.isOnline ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-extrabold shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> {lastSeenInfo.text}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${isActivated ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
                              {isActivated ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {isFemale && (
                              <button 
                                onClick={() => handleWhatsAppContact(u.phone, u.username)}
                                className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-[11px] font-bold border border-emerald-800/50 transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                                title="Verify on WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleOpenUserInspect(u.username)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              onClick={() => handleToggleUserActivation(u.username)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${isActivated ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 hover:bg-amber-900/60' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60'}`}
                            >
                              {isActivated ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'companions' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Companion Directory & Advertisement Moderation</h2>
                <p className="text-xs text-slate-400">Review submitted photos, rates, locations, promotional video clips, and approve/reject ads</p>
              </div>
              <button onClick={loadBackendData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ladies.length === 0 ? (
                <div className="col-span-full text-center py-16 text-slate-500 text-xs">No companion listings or profiles submitted yet.</div>
              ) : (
                ladies.map((lady) => {
                  const isApproved = lady.approved !== false;
                  return (
                    <div key={lady._id || lady.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-pink-500/40 transition">
                      <div className="relative h-56 bg-slate-950 overflow-hidden">
                        <img 
                          src={lady.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'} 
                          alt={lady.name || lady.username} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className={`font-black text-[9px] px-2.5 py-1 rounded-full shadow flex items-center gap-1 ${isApproved ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
                            <ShieldCheck size={11} /> {isApproved ? 'APPROVED' : 'PENDING'}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                          <div>
                            <h3 className="text-white font-extrabold text-base">{lady.name || lady.username}, {lady.age || '23'}</h3>
                            <p className="text-slate-300 text-xs flex items-center gap-1">
                              <MapPin size={11} className="text-pink-500" /> {lady.specificLocation || lady.location}
                            </p>
                          </div>
                          <div className="bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded-xl text-right">
                            <span className="text-[8px] text-slate-400 block font-bold">RATE</span>
                            <span className="text-emerald-400 font-black text-xs">ZMW {lady.price || '0'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 flex flex-col justify-between flex-grow">
                        <p className="text-xs text-slate-400 line-clamp-2">{lady.extraServices || 'Available for social companionship.'}</p>

                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => {
                                setIsFaceRevealed(false);
                                setSelectedCompanionModal(lady);
                              }}
                              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer shadow"
                            >
                              <Eye size={13} /> Review & Manage
                            </button>
                            <button 
                              onClick={() => handleWhatsAppContact(lady.phone, lady.username)}
                              className="py-2.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-800/50 transition cursor-pointer shadow"
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'inbox' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Admin Support Inbox</h2>
                <p className="text-xs text-slate-400">Communicate directly with platform users & clients</p>
              </div>
              <button onClick={loadBackendData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="text-center py-12 text-slate-500 text-xs">Inbox is fully synchronized.</div>
          </div>
        )}

        {activeSubTab === 'reports' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Time Waster & Client Reports</h2>
                <p className="text-xs text-slate-400">Complaints submitted by verified companions</p>
              </div>
              <button onClick={loadBackendData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No active reports.</div>
              ) : (
                reports.map((rep) => (
                  <div key={rep._id || rep.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white bg-pink-950/80 px-2.5 py-0.5 rounded-lg border border-pink-900/40">@{rep.reporter}</span>
                        <span className="text-xs text-slate-400">reported</span>
                        <span className="text-xs font-black text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-lg border border-rose-900/40">@{rep.targetUser}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium pt-1">Reason: <span className="text-white">{rep.reason}</span></p>
                      <p className="text-[11px] text-pink-400/80 font-semibold pt-0.5 flex items-center gap-1">
                        <span>{rep.timestamp ? new Date(rep.timestamp).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Just now'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                      <button
                        onClick={() => handleWhatsAppReporter(rep.reporter)}
                        className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-800/50 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Message Reporter on WhatsApp"
                      >
                        <MessageCircle size={14} /> WhatsApp Reporter
                      </button>
                      <button
                        onClick={() => handleOpenUserInspect(rep.targetUser)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
                      >
                        Inspect User
                      </button>
                      <button
                        onClick={() => handleDeleteReport(rep._id || rep.id)}
                        className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded-xl text-xs font-bold border border-red-900/50 transition cursor-pointer"
                      >
                        <Trash2 size={13} /> Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}