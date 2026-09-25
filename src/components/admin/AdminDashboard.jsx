// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Flag, Video, CheckCircle, XCircle, Trash2, 
  LogOut, RefreshCw, X, MessageSquare, MapPin, Edit3, MessageCircle, Clock, Eye, Sparkles, Maximize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_URL } from '../../data/constants';

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
  }) : 'N/A';

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
  const [reports, setReports] = useState([]);
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [selectedCompanionModal, setSelectedCompanionModal] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');

  const loadBackendData = async () => {
    try {
      const resUsers = await fetch(`${BACKEND_URL}/api/users`);
      const dataUsers = await resUsers.json();
      if (dataUsers.success && Array.isArray(dataUsers.users)) {
        setUsersDb(dataUsers.users);
      }

      const resLadies = await fetch(`${BACKEND_URL}/api/ladies`);
      const dataLadies = await resLadies.json();
      if (dataLadies.success && Array.isArray(dataLadies.ladies)) {
        setLadies(dataLadies.ladies);
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
    const interval = setInterval(loadBackendData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppContact = (phone, name) => {
    if (!phone || phone === 'Not Provided') {
      const manualPhone = prompt(`Please enter WhatsApp number for @${name || 'user'} (with country code, e.g., 260...):`);
      if (!manualPhone) return;
      phone = manualPhone.trim();
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent(`Hello @${name || 'Member'}, this is Dodix Admin reaching out regarding your account verification.`);
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
        await loadBackendData();
        alert(`Advertisement for @${username} has been successfully approved!`);
        setSelectedCompanionModal(null);
      } else {
        alert(data.error || "Failed to approve companion.");
      }
    } catch (err) {
      console.error("Error approving companion:", err);
      alert("Network error connecting to server.");
    }
  };

  const handleRejectCompanion = async (username) => {
    if (!window.confirm(`Are you sure you want to reject/remove the advertisement for @${username}?`)) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${username}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadBackendData();
        alert(`Advertisement for @${username} has been rejected and removed.`);
        setSelectedCompanionModal(null);
      } else {
        alert(data.error || "Failed to remove advertisement.");
      }
    } catch (err) {
      console.error("Error rejecting companion:", err);
      alert("Network error connecting to server.");
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
    alert(`Location for @${username} successfully updated!`);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Full-Size Image Modal */}
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
                <img src={fullScreenImage} alt="Full Size" className="max-w-full max-h-[85vh] object-contain block" />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Companion Review Modal */}
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
                  onClick={() => setFullScreenImage(selectedCompanionModal.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80')}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-lg shrink-0 bg-slate-950 cursor-pointer group hover:border-pink-400 transition"
                >
                  <img src={selectedCompanionModal.photo} alt={selectedCompanionModal.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
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

              {selectedCompanionModal.verificationVideoUrl && (
                <div className="space-y-2 p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Video size={15} className="text-pink-400" /> Verification Video
                  </span>
                  <div className="w-full bg-black rounded-xl overflow-hidden border border-purple-900/50 flex items-center justify-center">
                    <video src={selectedCompanionModal.verificationVideoUrl} controls className="max-h-60 w-auto object-contain mx-auto" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <button 
                  onClick={() => handleApproveCompanion(selectedCompanionModal.username || selectedCompanionModal.name)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <CheckCircle size={15} /> Approve Ad
                </button>
                <button 
                  onClick={() => handleRejectCompanion(selectedCompanionModal.username || selectedCompanionModal.name)}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <XCircle size={15} /> Reject Ad
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 py-4 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Logo" className="w-10 h-10 rounded-2xl object-cover border border-pink-500/30" />
          <div>
            <h1 className="text-base font-black tracking-wider text-white">DODIX<span className="text-pink-500">ADMIN</span></h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-400" /> Secure Command Center
            </p>
          </div>
        </div>
        <button onClick={() => setCurrentUser(null)} className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition flex items-center gap-2 text-xs font-bold cursor-pointer">
          <LogOut size={16} /> Log Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b101d] border border-slate-800 p-2 rounded-2xl shadow-xl">
          <button onClick={() => setActiveSubTab('users')} className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'users' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Users size={16} /> Users ({usersDb.length})
          </button>
          <button onClick={() => setActiveSubTab('companions')} className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'companions' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Video size={16} /> Companions ({ladies.length})
          </button>
          <button onClick={() => setActiveSubTab('inbox')} className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'inbox' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <MessageSquare size={16} /> Inbox ({messages.length})
          </button>
          <button onClick={() => setActiveSubTab('reports')} className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'reports' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Flag size={16} /> Reports ({reports.length})
          </button>
        </div>

        {activeSubTab === 'users' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Registered Users & Client Database</h2>
                <p className="text-xs text-slate-400">Inspect accounts, view registration timestamp & expiry countdown, or manage activation</p>
              </div>
              <button onClick={loadBackendData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Username</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Registration & Expiry</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {usersDb.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500">No registered users found.</td>
                    </tr>
                  ) : (
                    usersDb.map((u, i) => {
                      const isActivated = u.activated !== false;
                      const isFemale = u.gender?.toLowerCase() === 'female';
                      return (
                        <tr key={u._id || i} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white truncate">
                            <div className="flex flex-col">
                              <span>@{u.username}</span>
                              <span className="text-[10px] text-pink-400 capitalize">{u.gender || 'Client'}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-purple-400 font-bold truncate">{u.plan || '7 Days'}</td>
                          <td className="p-3.5 text-pink-400 font-semibold truncate flex items-center gap-1">
                            <MapPin size={12} className="shrink-0" /> <span className="truncate">{u.location || 'Lusaka'}</span>
                          </td>
                          <td className="p-3.5 truncate"><AdminUserTimer createdAt={u.createdAt} plan={u.plan} /></td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-block ${isActivated ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
                              {isActivated ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {isFemale && (
                              <button onClick={() => handleWhatsAppContact(u.phone, u.username)} className="px-2.5 py-1.5 bg-emerald-950/80 text-emerald-300 rounded-xl text-[11px] font-bold border border-emerald-800/50 inline-flex items-center gap-1 cursor-pointer">
                                <MessageCircle size={13} />
                              </button>
                            )}
                            <button onClick={() => handleOpenUserInspect(u.username)} className="px-2.5 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700 inline-flex items-center gap-1 cursor-pointer">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => handleToggleUserActivation(u.username)} className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${isActivated ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'}`}>
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
                <p className="text-xs text-slate-400">Review submitted photos, rates, locations, and approve or reject ads</p>
              </div>
              <button onClick={loadBackendData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ladies.length === 0 ? (
                <div className="col-span-full text-center py-16 text-slate-500 text-xs">No companion listings submitted yet.</div>
              ) : (
                ladies.map((lady) => {
                  const isApproved = lady.approved !== false;
                  return (
                    <div key={lady._id || lady.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-pink-500/40 transition">
                      <div className="relative h-56 bg-slate-950 overflow-hidden">
                        <img src={lady.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'} alt={lady.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute top-3 right-3">
                          <span className={`font-black text-[9px] px-2.5 py-1 rounded-full shadow flex items-center gap-1 ${isApproved ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
                            <ShieldCheck size={11} /> {isApproved ? 'APPROVED' : 'PENDING'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-extrabold text-base">{lady.name}, {lady.age || '23'}</h3>
                          <span className="text-emerald-400 font-black text-xs">ZMW {lady.price}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                          <button onClick={() => setSelectedCompanionModal(lady)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
                            <Eye size={13} /> Review
                          </button>
                          <button onClick={() => handleWhatsAppContact(lady.phone, lady.username)} className="py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
                            <MessageCircle size={13} /> WhatsApp
                          </button>
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
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDeleteReport(rep._id || rep.id)} className="px-3 py-1.5 bg-red-950/60 text-red-300 rounded-xl text-xs font-bold border border-red-900/50 cursor-pointer">
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