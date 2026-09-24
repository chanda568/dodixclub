// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Flag, Video, CheckCircle, XCircle, Trash2, 
  LogOut, AlertTriangle, RefreshCw, Eye, X, MessageSquare, Send, ShieldAlert, MessageCircle, Bell, Plus, Shield, PhoneCall, MapPin, Edit3 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_URL } from '../../data/constants';
import { encryptStorageData, decryptStorageData } from '../../utils/storageEncryption';

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
  const [activeSubTab, setActiveSubTab] = useState('companions'); 
  
  // State for reports
  const [reports, setReports] = useState([]);

  // State for announcements management
  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVisibility, setNewVisibility] = useState('all');

  // Local state for support inbox reply
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');

  // State for inspecting/managing a clicked user from reports or user list
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  
  // State for editing location inside modal
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');

  const loadDatabases = () => {
    try {
      let currentUsers = usersDb;
      const rawUsers = localStorage.getItem('dodix_users_db');
      if (rawUsers) {
        const decrypted = decryptStorageData(rawUsers);
        if (Array.isArray(decrypted)) {
          currentUsers = decrypted;
          setUsersDb(decrypted);
        }
      }

      const rawLadies = localStorage.getItem('dodix_ladies_db');
      if (rawLadies) {
        const decrypted = decryptStorageData(rawLadies);
        if (Array.isArray(decrypted)) {
          let mergedLadies = [...decrypted];
          currentUsers.forEach(u => {
            if (u.gender?.toLowerCase() === 'female' && (u.whatsappNumber || u.phone)) {
              const exists = mergedLadies.find(l => l.username?.toLowerCase() === u.username?.toLowerCase());
              if (!exists) {
                mergedLadies.unshift({
                  id: Date.now() + Math.random(),
                  name: u.username,
                  username: u.username,
                  age: '23',
                  category: 'Companion',
                  price: '500',
                  location: u.location || 'Lusaka',
                  phone: u.whatsappNumber || u.phone,
                  whatsappNumber: u.whatsappNumber || u.phone,
                  photo: u.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
                  approved: u.approved || false
                });
              } else {
                exists.phone = u.whatsappNumber || u.phone || exists.phone;
                exists.whatsappNumber = u.whatsappNumber || u.phone || exists.whatsappNumber;
              }
            }
          });
          setLadies(mergedLadies);
        }
      }

      const rawReports = localStorage.getItem('dodix_reports_db');
      if (rawReports) {
        const decrypted = decryptStorageData(rawReports);
        if (Array.isArray(decrypted)) setReports(decrypted);
      }

      const rawAnnouncements = localStorage.getItem('dodix_announcements_db');
      if (rawAnnouncements) {
        const decrypted = decryptStorageData(rawAnnouncements);
        if (Array.isArray(decrypted)) setAnnouncements(decrypted);
      }

      const rawMessages = localStorage.getItem('dodix_messages_db');
      if (rawMessages) {
        const decrypted = decryptStorageData(rawMessages);
        if (Array.isArray(decrypted)) {
          const allMessages = [];
          decrypted.forEach(item => {
            if (item.messages && Array.isArray(item.messages)) {
              allMessages.push(...item.messages);
            } else {
              allMessages.push(item);
            }
          });

          const groupedMap = {};
          allMessages.forEach((msg) => {
            if (!msg) return;
            const chatUser = (msg.sender === 'admin' ? msg.recipient : msg.sender) || 'unknown';
            if (!groupedMap[chatUser]) {
              groupedMap[chatUser] = {
                id: chatUser,
                username: chatUser,
                messages: []
              };
            }
            const exists = groupedMap[chatUser].messages.some(m => 
              (m.id && m.id === msg.id) || (m.timestamp === msg.timestamp && m.text === msg.text)
            );
            if (!exists) {
              groupedMap[chatUser].messages.push(msg);
            }
          });
          setMessages(Object.values(groupedMap));
        }
      }
    } catch (err) {
      console.error("Error loading admin databases:", err);
    }
  };

  useEffect(() => {
    loadDatabases();
    window.addEventListener('storage', loadDatabases);
    const interval = setInterval(loadDatabases, 1500);
    return () => {
      window.removeEventListener('storage', loadDatabases);
      clearInterval(interval);
    };
  }, []);

  const handleWhatsAppContact = (phone, name) => {
    if (!phone) {
      const manualPhone = prompt(`Please enter WhatsApp number for @${name || 'user'} (with country code, e.g., 260...):`);
      if (!manualPhone) return;
      phone = manualPhone.trim();
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent(`Hello @${name || 'Member'}, this is Dodix Admin regarding your account location update.`);
    window.open(`https://wa.me/${cleanPhone}?text=${defaultMsg}`, '_blank');
  };

  const handleToggleUserActivation = (username) => {
    const updated = usersDb.map(u => {
      if (u.username.toLowerCase() === username.toLowerCase()) {
        const nextStatus = u.activated === false ? true : false;
        return { ...u, activated: nextStatus };
      }
      return u;
    });
    setUsersDb(updated);
    localStorage.setItem('dodix_users_db', encryptStorageData(updated));
    window.dispatchEvent(new Event('storage'));

    const target = updated.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (target) {
      const reportCount = reports.filter(r => r.reportedUser?.toLowerCase().replace('@', '') === target.username?.toLowerCase()).length;
      setSelectedReportUser({ ...target, reportCount });
    }
  };

  const handleDeleteUser = (username) => {
    if (!window.confirm(`Are you sure you want to delete user @${username}?`)) return;
    const updated = usersDb.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    setUsersDb(updated);
    localStorage.setItem('dodix_users_db', encryptStorageData(updated));
    window.dispatchEvent(new Event('storage'));
    setSelectedReportUser(null);
  };

  const handleOpenUserInspect = (reportedUsername) => {
    const cleanUsername = reportedUsername.replace('@', '').trim();
    const foundUser = usersDb.find(u => u.username?.toLowerCase() === cleanUsername.toLowerCase());
    const reportCount = reports.filter(r => r.reportedUser?.toLowerCase().replace('@', '') === cleanUsername.toLowerCase()).length;

    if (foundUser) {
      setSelectedReportUser({ ...foundUser, reportCount });
      setNewLocationInput(foundUser.location || 'Lusaka');
    } else {
      setSelectedReportUser({
        username: cleanUsername,
        gender: 'Client / Member',
        activated: true,
        location: 'Lusaka',
        reportCount,
      });
      setNewLocationInput('Lusaka');
    }
    setIsEditingLocation(false);
  };

  // Save updated user location
  const handleSaveUserLocation = (username) => {
    if (!newLocationInput.trim()) {
      alert("Location cannot be empty.");
      return;
    }

    // Update in usersDb
    const updatedUsers = usersDb.map(u => {
      if (u.username?.toLowerCase() === username.toLowerCase()) {
        return { ...u, location: newLocationInput.trim() };
      }
      return u;
    });
    setUsersDb(updatedUsers);
    localStorage.setItem('dodix_users_db', encryptStorageData(updatedUsers));

    // Also update in ladiesDb if companion exists there
    const updatedLadies = ladies.map(l => {
      if (l.username?.toLowerCase() === username.toLowerCase()) {
        return { ...l, location: newLocationInput.trim() };
      }
      return l;
    });
    setLadies(updatedLadies);
    localStorage.setItem('dodix_ladies_db', encryptStorageData(updatedLadies));

    window.dispatchEvent(new Event('storage'));

    setSelectedReportUser(prev => prev ? { ...prev, location: newLocationInput.trim() } : null);
    setIsEditingLocation(false);
    alert(`Location for @${username} successfully updated to "${newLocationInput.trim()}"!`);
  };

  const handleToggleLadyApproval = (id) => {
    let targetUsername = null;
    const updatedLadies = ladies.map(l => {
      if (l.id === id) {
        const nextApproval = l.approved === false ? true : false;
        targetUsername = l.username;
        return { ...l, approved: nextApproval };
      }
      return l;
    });
    
    setLadies(updatedLadies);
    localStorage.setItem('dodix_ladies_db', encryptStorageData(updatedLadies));

    if (targetUsername) {
      const ladyRef = updatedLadies.find(l => l.id === id);
      const isNowApproved = ladyRef ? ladyRef.approved : true;

      const updatedUsers = usersDb.map(u => {
        if (u.username?.toLowerCase() === targetUsername.toLowerCase()) {
          return { ...u, approved: isNowApproved, activated: true };
        }
        return u;
      });
      setUsersDb(updatedUsers);
      localStorage.setItem('dodix_users_db', encryptStorageData(updatedUsers));
    }

    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteLady = (id) => {
    if (!window.confirm("Are you sure you want to delete this companion profile?")) return;
    const updated = ladies.filter(l => l.id !== id);
    setLadies(updated);
    localStorage.setItem('dodix_ladies_db', encryptStorageData(updated));
    window.dispatchEvent(new Event('storage'));
  };

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
      timestamp: new Date().toLocaleString()
    };

    const updated = [newAnnouncement, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('dodix_announcements_db', encryptStorageData(updated));
    window.dispatchEvent(new Event('storage'));

    setNewTitle('');
    setNewContent('');
    setNewVisibility('all');
    alert("Announcement successfully published to user panels!");
  };

  const handleDeleteAnnouncement = (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    const updated = announcements.filter(item => item.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('dodix_announcements_db', encryptStorageData(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleSendAdminReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConversation) return;

    const targetUser = selectedConversation.username;
    
    if (typeof sendChatMessage === 'function') {
      sendChatMessage(targetUser, replyText.trim());
    }

    const newMsg = {
      id: Date.now(),
      sender: 'admin',
      recipient: targetUser,
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      let existingFlatMessages = [];
      const raw = localStorage.getItem('dodix_messages_db');
      if (raw) {
        const decrypted = decryptStorageData(raw);
        if (Array.isArray(decrypted)) {
          decrypted.forEach(item => {
            if (item.messages && Array.isArray(item.messages)) {
              existingFlatMessages.push(...item.messages);
            } else {
              existingFlatMessages.push(item);
            }
          });
        }
      }

      const updatedDatabaseMessages = [...existingFlatMessages, newMsg];
      localStorage.setItem('dodix_messages_db', encryptStorageData(updatedDatabaseMessages));
      window.dispatchEvent(new Event('storage'));

      const updatedConvs = messages.map(conv => {
        if (conv.username === targetUser) {
          return {
            ...conv,
            messages: [...(conv.messages || []), newMsg]
          };
        }
        return conv;
      });

      setMessages(updatedConvs);
      const updatedActiveConv = updatedConvs.find(c => c.username === targetUser);
      if (updatedActiveConv) setSelectedConversation(updatedActiveConv);

      setReplyText('');
    } catch (err) {
      console.error("Error sending admin reply:", err);
    }
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
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-950/60 border border-pink-800/40 text-pink-400 rounded-2xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">User Control & Location</h3>
                  <p className="text-xs text-slate-400">Inspect account details and manage relocation</p>
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
                
                {/* Location Display & Inline Editor */}
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
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-pink-400 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition"
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
                        placeholder="Enter new location (e.g. Ndola, Kitwe)"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSaveUserLocation(selectedReportUser.username)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                        >
                          Save Location
                        </button>
                        <button 
                          onClick={() => setIsEditingLocation(false)}
                          className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
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
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${selectedReportUser.activated !== false ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'}`}
                >
                  {selectedReportUser.activated !== false ? (
                    <>
                      <XCircle size={16} /> Suspend User Account
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Restore / Activate Account
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteUser(selectedReportUser.username)}
                  className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold rounded-xl text-xs transition border border-red-900/40 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Permanently Delete User
                </button>

                <button
                  onClick={() => setSelectedReportUser(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700"
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
          onClick={() => {
            sessionStorage.removeItem('dodix_current_user');
            setCurrentUser(null);
          }}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition flex items-center gap-2 text-xs font-bold"
        >
          <LogOut size={16} /> Log Out
        </button>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#0b101d] border border-slate-800 p-2 rounded-2xl shadow-xl">
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeSubTab === 'users' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={16} /> Users ({usersDb.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('companions')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeSubTab === 'companions' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Video size={16} /> Companions ({ladies.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('announcements')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeSubTab === 'announcements' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Bell size={16} /> News ({announcements.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('inbox')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeSubTab === 'inbox' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare size={16} /> Inbox ({messages.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('reports')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeSubTab === 'reports' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}
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
                <p className="text-xs text-slate-400">Inspect accounts, edit locations, or suspend status</p>
              </div>
              <button onClick={loadDatabases} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Username</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {usersDb.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500">No registered users found.</td>
                    </tr>
                  ) : (
                    usersDb.map((u, i) => {
                      const isActivated = u.activated !== false;
                      return (
                        <tr key={i} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">@{u.username}</td>
                          <td className="p-3.5 text-slate-300 capitalize">{u.gender || 'N/A'}</td>
                          <td className="p-3.5 text-pink-400 font-semibold flex items-center gap-1">
                            <MapPin size={12} /> {u.location || 'Lusaka'}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${isActivated ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
                              {isActivated ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button 
                              onClick={() => handleOpenUserInspect(u.username)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition inline-flex items-center gap-1"
                            >
                              <Edit3 size={13} /> Edit / Inspect
                            </button>
                            <button 
                              onClick={() => handleToggleUserActivation(u.username)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${isActivated ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 hover:bg-amber-900/60' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60'}`}
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

        {/* Tab 2: Companion Approvals & Location Management */}
        {activeSubTab === 'companions' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Companion Directory & Relocation Management</h2>
                <p className="text-xs text-slate-400">Review companion locations, verify profiles, and update details</p>
              </div>
              <button onClick={loadDatabases} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ladies.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">No companion profiles found.</div>
              ) : (
                ladies.map((lady) => {
                  const isApproved = lady.approved !== false;
                  const ladyPhone = lady.whatsappNumber || lady.phone;
                  return (
                    <div key={lady.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <img src={lady.photo} alt={lady.name} className="w-16 h-16 rounded-xl object-cover border border-pink-500/30" />
                        <div>
                          <h3 className="text-sm font-bold text-white">@{lady.username}</h3>
                          <p className="text-xs text-pink-400 font-semibold">{lady.category} • <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5"><MapPin size={11} /> {lady.location || 'Lusaka'}</span></p>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">
                            WhatsApp: {ladyPhone || 'Not Provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                        <button 
                          onClick={() => handleOpenUserInspect(lady.username)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                        >
                          <Edit3 size={14} /> Edit Location
                        </button>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleLadyApproval(lady.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${isApproved ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-400 border border-amber-800/40 hover:bg-amber-900/60'}`}
                          >
                            {isApproved ? 'Verified & Active' : 'Approve Profile'}
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

        {/* Tab 3: News & Announcements Management */}
        {activeSubTab === 'announcements' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">News & Announcements Management</h2>
                <p className="text-xs text-slate-400">Publish targeted announcements visible to All Users, Females Only, or Males Only.</p>
              </div>
              <button onClick={loadDatabases} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition">
                <RefreshCw size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shield size={16} className="text-pink-500" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Broadcast New Announcement</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Announcement Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Relocation Notice & Guidelines" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition" 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Audience Visibility</label>
                  <select 
                    value={newVisibility} 
                    onChange={(e) => setNewVisibility(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
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
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition resize-none" 
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

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 px-1">Active Broadcasts ({announcements.length})</h3>

              {announcements.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
                  <Bell size={24} className="mx-auto text-slate-500" />
                  <h3 className="text-sm font-bold text-white">No announcements published yet</h3>
                </div>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400">{item.timestamp}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          item.visibility === 'all' ? 'bg-purple-950 text-purple-400 border border-purple-800/40' :
                          item.visibility === 'female' ? 'bg-pink-950 text-pink-400 border border-pink-800/40' :
                          'bg-blue-950 text-blue-400 border border-blue-800/40'
                        }`}>
                          {item.visibility === 'all' ? 'All Users' : item.visibility === 'female' ? 'Females Only' : 'Males Only'}
                        </span>
                        
                        <button 
                          onClick={() => handleDeleteAnnouncement(item.id)}
                          className="p-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-lg transition"
                          title="Delete Announcement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-extrabold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Admin Support Inbox */}
        {activeSubTab === 'inbox' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Admin Support Inbox</h2>
                <p className="text-xs text-slate-400">Communicate directly with platform users & clients</p>
              </div>
              <button onClick={loadDatabases} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 space-y-2 overflow-y-auto max-h-[500px]">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No messages in inbox.</p>
                ) : (
                  messages.map((conv) => (
                    <div 
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 rounded-xl cursor-pointer border transition ${selectedConversation?.id === conv.id ? 'bg-pink-950/30 border-pink-500/40' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">@{conv.username}</span>
                        <span className="text-[10px] text-slate-500">{conv.messages?.length || 0} msgs</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        {conv.messages?.[conv.messages.length - 1]?.text || 'No messages yet'}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                {selectedConversation ? (
                  <>
                    <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400">Chat with @{selectedConversation.username}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 py-4 max-h-[350px]">
                      {selectedConversation.messages?.map((msg, idx) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${isAdmin ? 'bg-pink-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                              {msg.text}
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSendAdminReply} className="pt-3 border-t border-slate-800 flex gap-2">
                      <input 
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your admin reply..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                      <button 
                        type="submit"
                        className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Send size={14} /> Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Select a conversation from the left to read and reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Time Waster Reports */}
        {activeSubTab === 'reports' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white">Time Waster & Client Reports</h2>
                <p className="text-xs text-slate-400">Complaints submitted by verified female companions</p>
              </div>
              <button onClick={loadDatabases} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <ReportsList 
                reports={reports} 
                setReports={setReports} 
                onInspectUser={handleOpenUserInspect} 
                onWhatsAppContact={handleWhatsAppContact} 
              />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function ReportsList({ reports, setReports, onInspectUser, onWhatsAppContact }) {
  const handleDeleteReport = (id) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem('dodix_reports_db', encryptStorageData(updated));
    window.dispatchEvent(new Event('storage'));
  };

  if (reports.length === 0) {
    return <div className="text-center py-12 text-slate-500">No reports submitted.</div>;
  }

  return reports.map((rep) => {
    const targetUsername = rep.reportedUser || rep.reported || 'unknown';
    const reporterUsername = rep.reporter || 'unknown';

    return (
      <div key={rep.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onInspectUser(targetUsername)}
              className="text-xs font-extrabold text-red-400 bg-red-950/60 border border-red-900/40 px-3 py-1 rounded-xl hover:bg-red-900/60 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <AlertTriangle size={13} /> Reported: @{targetUsername.replace('@', '')}
            </button>
          </div>
          <p className="text-xs text-slate-300 pl-1">{rep.reason}</p>
          <span className="text-[10px] text-slate-500 pl-1 block">{new Date(rep.timestamp).toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button 
            onClick={() => onWhatsAppContact(rep.phone || rep.whatsappNumber, reporterUsername)}
            className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-800/40 transition flex items-center gap-1.5"
          >
            <MessageCircle size={14} /> WhatsApp
          </button>

          <button 
            onClick={() => onInspectUser(targetUsername)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Inspect & Edit Location
          </button>
          
          <button 
            onClick={() => handleDeleteReport(rep.id)}
            className="p-2 bg-red-950/40 text-red-400 border border-red-800/40 rounded-xl hover:bg-red-900/40 transition"
            title="Dismiss Report"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  });
}