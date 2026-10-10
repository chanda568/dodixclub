// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Flag, Video, LogOut, MessageSquare, Bell, X, AlertTriangle, Key, Trash2, UserX, CheckCircle2 
} from 'lucide-react';
import { LOGO_URL } from '../../data/constants';
import AdminUsersTab from './AdminUsersTab';
import AdminCompanionsTab from './AdminCompanionsTab';
import CompanionModal from './CompanionModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AdminDashboard({ 
  currentUser, 
  setCurrentUser, 
  usersDb, 
  setUsersDb, 
  ladies, 
  setLadies, 
  messages, 
  setMessages
}) {
  const [activeSubTab, setActiveSubTab] = useState('users'); 
  const [userGenderFilter, setUserGenderFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [reports, setReports] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [selectedCompanionModal, setSelectedCompanionModal] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [fullScreenVideo, setFullScreenVideo] = useState(null);
  
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [userReportData, setUserReportData] = useState({ count: 0, reports: [] });

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
      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        if (dataUsers.success && Array.isArray(dataUsers.users)) {
          setUsersDb(dataUsers.users);
        }
      }

      const resLadies = await fetch(`${BACKEND_URL}/api/ladies`);
      if (resLadies.ok) {
        const dataLadies = await resLadies.json();
        if (dataLadies.success && Array.isArray(dataLadies.ladies)) {
          setLadies(dataLadies.ladies);
        }
      }

      const resReports = await fetch(`${BACKEND_URL}/api/reports`);
      if (resReports.ok) {
        const dataReports = await resReports.json();
        if (dataReports.success && Array.isArray(dataReports.reports)) {
          setReports(dataReports.reports);
        }
      }

      const resAnnouncements = await fetch(`${BACKEND_URL}/api/announcements`);
      if (resAnnouncements.ok) {
        const dataAnnouncements = await resAnnouncements.json();
        if (dataAnnouncements.success && Array.isArray(dataAnnouncements.announcements)) {
          setAnnouncements(dataAnnouncements.announcements);
        }
      }
    } catch (err) {
      console.error("Error fetching live backend data from MongoDB:", err);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  const handleWhatsAppContact = (phone, name) => {
    if (!phone || phone === 'Not Provided') {
      const manualPhone = prompt(`Please enter WhatsApp number for @${name || 'user'}:`);
      if (!manualPhone) return;
      phone = manualPhone.trim();
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
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
        if (selectedReportUser && selectedReportUser.username === username) {
          setSelectedReportUser(data.user);
        }
        loadBackendData();
      }
    } catch (err) {
      console.error("Error toggling user activation:", err);
    }
  };

  const handleOpenUserInspect = async (reportedUsername) => {
    const cleanUsername = reportedUsername.replace('@', '').trim();
    const foundUser = usersDb.find(u => u.username?.toLowerCase() === cleanUsername.toLowerCase());

    if (foundUser) {
      setSelectedReportUser(foundUser);
      setNewLocationInput(foundUser.location || 'Lusaka');
      setNewPhoneInput(foundUser.phone || '');
    } else {
      setSelectedReportUser({
        username: cleanUsername,
        gender: 'Client / Member',
        activated: true,
        location: 'Lusaka',
        phone: ''
      });
      setNewLocationInput('Lusaka');
      setNewPhoneInput('');
    }
    setNewPasswordInput('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${cleanUsername}/reports`);
      const data = await res.json();
      if (data.success) {
        setUserReportData({ count: data.count, reports: data.reports });
      } else {
        setUserReportData({ count: 0, reports: [] });
      }
    } catch (err) {
      setUserReportData({ count: 0, reports: [] });
    }
  };

  const handleSaveUserChanges = async (username) => {
    try {
      const payload = {
        location: newLocationInput,
        phone: newPhoneInput,
      };
      if (newPasswordInput.trim() !== '') {
        payload.newPassword = newPasswordInput.trim();
      }

      const response = await fetch(`${BACKEND_URL}/api/users/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        alert("User details updated successfully!");
        setSelectedReportUser(null);
        loadBackendData();
      } else {
        alert(data.error || "Failed to update user.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Error connecting to server.");
    }
  };

  const handlePermanentDeleteUser = async (username) => {
    if (!confirm(`WARNING: Are you sure you want to permanently delete @${username}? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${username}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert("User permanently deleted from database.");
        setSelectedReportUser(null);
        loadBackendData();
      } else {
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Error connecting to server.");
    }
  };

  const handleDeleteCompanion = async (idOrUsername) => {
    if (!confirm("Are you sure you want to delete this companion?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/ladies/${idOrUsername}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadBackendData();
    } catch (err) {
      console.error("Error deleting companion:", err);
    }
  };

  const handleSaveCompanionPrice = async (companionId, newPrice) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${companionId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      });
      const data = await response.json();
      if (data.success) {
        alert("Companion price updated successfully!");
        setSelectedCompanionModal(null);
        loadBackendData();
      } else {
        alert(data.error || "Failed to update price.");
      }
    } catch (err) {
      console.error("Error updating companion price:", err);
      alert("Error connecting to server.");
    }
  };

  const handleApproveCompanionPost = async (companionId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${companionId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        alert("Companion post approved successfully!");
        setSelectedCompanionModal(null);
        loadBackendData();
      } else {
        alert(data.error || "Failed to approve post.");
      }
    } catch (err) {
      console.error("Error approving companion post:", err);
      alert("Error connecting to server.");
    }
  };

  const handleRejectCompanionPost = async (companionId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${companionId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        alert("Companion post rejected successfully!");
        setSelectedCompanionModal(null);
        loadBackendData();
      } else {
        alert(data.error || "Failed to reject post.");
      }
    } catch (err) {
      console.error("Error rejecting companion post:", err);
      alert("Error connecting to server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <header className="px-6 py-4 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Dodix Logo" className="w-10 h-10 rounded-2xl object-cover shadow-lg border border-pink-500/35" />
          <div>
            <h1 className="text-base font-black tracking-wider text-white">DODIX<span className="text-pink-500">ADMIN</span></h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-400" /> MongoDB Synchronized Center
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#0b101d] border border-slate-800 p-2 rounded-2xl shadow-xl">
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
            onClick={() => setActiveSubTab('announcements')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'announcements' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Bell size={16} /> Announcements ({announcements.length})
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
          <AdminUsersTab 
            usersDb={usersDb}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            userGenderFilter={userGenderFilter}
            setUserGenderFilter={setUserGenderFilter}
            loadBackendData={loadBackendData}
            handleWhatsAppContact={handleWhatsAppContact}
            handleOpenUserInspect={handleOpenUserInspect}
            handleToggleUserActivation={handleToggleUserActivation}
            formatLastSeenDetail={formatLastSeenDetail}
          />
        )}

        {activeSubTab === 'companions' && (
          <AdminCompanionsTab 
            ladies={ladies}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loadBackendData={loadBackendData}
            handleOpenCompanionModal={setSelectedCompanionModal}
            handleDeleteCompanion={handleDeleteCompanion}
            setFullScreenImage={setFullScreenImage}
            setFullScreenVideo={setFullScreenVideo}
          />
        )}

        {activeSubTab === 'announcements' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center py-16 text-slate-400">
            <Bell size={32} className="mx-auto mb-2 text-pink-500 opacity-60" />
            <h3 className="text-sm font-bold text-white">Announcements Management</h3>
            <p className="text-xs text-slate-500 mt-1">Broadcast system alerts and updates to active users.</p>
          </div>
        )}

        {activeSubTab === 'inbox' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center py-16 text-slate-400">
            <MessageSquare size={32} className="mx-auto mb-2 text-pink-500 opacity-60" />
            <h3 className="text-sm font-bold text-white">Admin Inbox</h3>
            <p className="text-xs text-slate-500 mt-1">Review incoming support tickets and user inquiries.</p>
          </div>
        )}

        {activeSubTab === 'reports' && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center py-16 text-slate-400">
            <Flag size={32} className="mx-auto mb-2 text-pink-500 opacity-60" />
            <h3 className="text-sm font-bold text-white">User Reports & Moderation</h3>
            <p className="text-xs text-slate-500 mt-1">Inspect flagged accounts and moderation flags.</p>
          </div>
        )}

        {/* Professional User Inspect & Edit Modal */}
        {selectedReportUser && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 relative my-8">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-600/30 to-purple-600/30 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold">
                    @{selectedReportUser.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Advanced User Management</h3>
                    <p className="text-xs text-pink-400 font-mono">@{selectedReportUser.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReportUser(null)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Report Monitoring Section */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${userReportData.count > 0 ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'}`}>
                    <Flag size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Moderation & Report Status</span>
                    <span className="text-[11px] text-slate-400">Total complaints filed against this account</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${userReportData.count > 0 ? 'bg-rose-950 text-rose-400 border border-rose-800/50' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'}`}>
                  {userReportData.count} {userReportData.count === 1 ? 'Report' : 'Reports'}
                </span>
              </div>

              {/* Editable Fields Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Account Role</label>
                    <input 
                      type="text" 
                      disabled 
                      value={selectedReportUser.gender || 'Client'} 
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 capitalize cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Current Status</label>
                    <input 
                      type="text" 
                      disabled 
                      value={selectedReportUser.activated !== false ? 'Active' : 'Suspended'} 
                      className={`w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold ${selectedReportUser.activated !== false ? 'text-emerald-400' : 'text-amber-400'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Location / City</label>
                  <input 
                    type="text" 
                    value={newLocationInput} 
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    placeholder="e.g. Lusaka, Ndola"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Phone / WhatsApp Number</label>
                  <input 
                    type="text" 
                    value={newPhoneInput} 
                    onChange={(e) => setNewPhoneInput(e.target.value)}
                    placeholder="e.g. +260..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                {/* Secure Password Reset Section */}
                <div className="pt-3 border-t border-slate-800/80">
                  <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 mb-1 uppercase tracking-wider">
                    <Key size={12} /> Reset Account Password
                  </label>
                  <input 
                    type="text" 
                    value={newPasswordInput} 
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password to force-reset..."
                    className="w-full bg-slate-900 border border-amber-900/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Leave blank to keep the user's existing password unchanged.</p>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleToggleUserActivation(selectedReportUser.username)}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center justify-center gap-1.5 ${selectedReportUser.activated !== false ? 'bg-amber-950/60 text-amber-400 border-amber-800/50 hover:bg-amber-900/60' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60'}`}
                  >
                    <UserX size={13} /> {selectedReportUser.activated !== false ? 'Suspend User' : 'Unsuspend'}
                  </button>
                  
                  <button
                    onClick={() => handlePermanentDeleteUser(selectedReportUser.username)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> Delete Account
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSelectedReportUser(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveUserChanges(selectedReportUser.username)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Save Changes
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Companion Inspection & Edit Modal */}
        {selectedCompanionModal && (
          <CompanionModal 
            companion={selectedCompanionModal}
            onClose={() => setSelectedCompanionModal(null)}
            onSavePrice={handleSaveCompanionPrice}
            onApprove={handleApproveCompanionPost}
            onReject={handleRejectCompanionPost}
          />
        )}
      </main>
    </div>
  );
}