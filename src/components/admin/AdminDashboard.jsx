// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Flag, Video, LogOut, MessageSquare, Bell 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { LOGO_URL } from '../../data/constants';
import AdminUsersTab from './AdminUsersTab';
import AdminCompanionsTab from './AdminCompanionsTab';

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
  
  const [isFaceRevealed, setIsFaceRevealed] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState('');

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
    // Polling interval increased to 45 seconds to prevent 429 rate limit errors
    const interval = setInterval(loadBackendData, 45000);
    return () => clearInterval(interval);
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
        loadBackendData();
      }
    } catch (err) {
      console.error("Error toggling user activation:", err);
    }
  };

  const handleOpenUserInspect = (reportedUsername) => {
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
    setIsEditingLocation(false);
    setIsEditingPhone(false);
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

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <header className="px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Dodix Logo" className="w-10 h-10 rounded-2xl object-cover shadow-lg border border-pink-500/30" />
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
      </main>
    </div>
  );
}