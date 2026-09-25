// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Flag, Video, CheckCircle, XCircle, Trash2, 
  LogOut, RefreshCw, X, MessageSquare, MapPin, Edit3, MessageCircle, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_URL } from '../../data/constants';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Helper component to display registration date and live plan expiration countdown
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
    const timer = setInterval(calculateTime, 60000); // Update every minute
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
  const [announcements, setAnnouncements] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');

  const loadBackendData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsersDb(data.users);
        
        const femaleCompanions = data.users
          .filter(u => u.gender?.toLowerCase() === 'female')
          .map(u => ({
            id: u._id || u.username,
            name: u.username,
            username: u.username,
            category: 'Companion',
            location: u.location || 'Lusaka',
            phone: u.phone || 'Not Provided',
            whatsappNumber: u.phone || 'Not Provided',
            approved: u.activated !== false
          }));
        setLadies(femaleCompanions);
      }
    } catch (err) {
      console.error("Error fetching live backend users:", err);
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
    const defaultMsg = encodeURIComponent(`Hello @${name || 'Member'}, this is Dodix Admin reaching out for gender verification regarding your account registration.`);
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

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* User Inspection & Location Edit Modal */}
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

                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Account Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${selectedReportUser.activated !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                    {selectedReportUser.activated !== false ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleToggleUserActivation(selectedReportUser.username)}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${selectedReportUser.activated !== false ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'}`}
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

      {/* Admin Header */}
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

      {/* Main Admin Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b101d] border border-slate-800 p-2 rounded-2xl shadow-xl">
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'users' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={16} /> Users ({usersDb.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('companions')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'companions' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Video size={16} /> Companions ({ladies.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('inbox')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'inbox' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare size={16} /> Inbox ({messages.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('reports')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'reports' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Flag size={16} /> Reports ({reports.length})
          </button>
        </div>

        {/* Tab 1: Users Management */}
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
                <colgroup>
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/5" />
                  <col className="w-1/4" />
                  <col className="w-1/6" />
                  <col className="w-1/4" />
                </colgroup>
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
                          <td className="p-3.5 text-purple-400 font-bold truncate">
                            {u.plan || '7 Days'}
                          </td>
                          <td className="p-3.5 text-pink-400 font-semibold truncate flex items-center gap-1">
                            <MapPin size={12} className="shrink-0" /> <span className="truncate">{u.location || 'Lusaka'}</span>
                          </td>
                          <td className="p-3.5 truncate">
                            <AdminUserTimer createdAt={u.createdAt} plan={u.plan} />
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-block ${isActivated ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
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

        {/* Tab 2: Companions */}
        {activeSubTab === 'companions' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Companion Directory & Verification</h2>
                <p className="text-xs text-slate-400">Review companion locations, verify on WhatsApp, or remove profiles</p>
              </div>
              <button onClick={loadBackendData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ladies.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">No companion profiles found.</div>
              ) : (
                ladies.map((lady) => (
                  <div key={lady.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-pink-950 border border-pink-500/30 flex items-center justify-center text-pink-400 font-black text-lg">
                        {lady.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">@{lady.username}</h3>
                        <p className="text-xs text-pink-400 font-semibold">{lady.category} • <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5"><MapPin size={11} /> {lady.location || 'Lusaka'}</span></p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                      <button 
                        onClick={() => handleWhatsAppContact(lady.phone, lady.username)}
                        className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-800/50 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenUserInspect(lady.username)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 size={14} /> Edit
                        </button>

                        <button 
                          onClick={() => handleDeleteUser(lady.username)}
                          className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded-xl text-xs font-bold border border-red-900/50 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Permanently Delete Profile"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Inbox */}
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

        {/* Tab 4: Reports */}
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
            <div className="text-center py-12 text-slate-500 text-xs">No active reports.</div>
          </div>
        )}

      </main>
    </div>
  );
}