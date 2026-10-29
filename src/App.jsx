// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_LADIES_DB, DEFAULT_MESSAGES_DB } from './data/constants';
import { decryptStorageData, encryptStorageData } from './utils/storageEncryption';
import { Clock, RefreshCw, LogOut, MessageCircle, MessageSquare } from 'lucide-react';

import AgeGate from './components/common/AgeGate';
import AuthScreen from './components/auth/AuthScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import ClientDirectory from './components/client/ClientDirectory';
import PageTransition from './components/common/PageTransition';
import Inbox from './Inbox';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

export default function App() {
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    return sessionStorage.getItem('dodix_age_verified') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('dodix_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState('directory'); // 'directory' or 'inbox'
  const [inboxRecipient, setInboxRecipient] = useState('admin');
  
  const [usersDb, setUsersDb] = useState([]);
  const [ladies, setLadies] = useState(() => {
    const saved = localStorage.getItem('dodix_ladies_db');
    if (saved) {
      try {
        const decrypted = decryptStorageData(saved);
        if (Array.isArray(decrypted)) return decrypted;
      } catch (e) {}
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_LADIES_DB;
  });

  const [messages, setMessages] = useState(DEFAULT_MESSAGES_DB);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [isSubmittedWhatsApp, setIsSubmittedWhatsApp] = useState(false);

  const socketRef = useRef(null);

  const handleLogout = () => {
    sessionStorage.removeItem('dodix_current_user');
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setCurrentUser(null);
  };

  const handleAgeVerification = (verified) => {
    if (verified) {
      sessionStorage.setItem('dodix_age_verified', 'true');
      setIsAgeVerified(true);
    }
  };

  const handleOpenSupportWhatsApp = () => {
    const adminPhone = "260965039645";
    const username = currentUser?.username || 'Member';
    const msg = encodeURIComponent(`Hello Dodix Support, my account (@${username}) is pending activation. Please assist with reviewing and activating my account.`);
    window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank');
  };

  const fetchUsersFromBackend = async () => {
    if (!currentUser || !currentUser.username) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users`);
      const data = await res.json();
      
      const currentStored = sessionStorage.getItem('dodix_current_user');
      if (!currentStored) return;

      if (data.success && Array.isArray(data.users)) {
        setUsersDb(data.users);
        
        const latest = data.users.find(u => u.username?.toLowerCase() === currentUser?.username?.toLowerCase());
        if (latest) {
          const wasEverActivated = currentUser.wasActivatedBefore || latest.wasActivatedBefore || latest.activated === true;
          const merged = { ...currentUser, ...latest, wasActivatedBefore: wasEverActivated };
          setCurrentUser(merged);
          sessionStorage.setItem('dodix_current_user', JSON.stringify(merged));
        }
      }
    } catch (e) {
      console.error("Error fetching users from backend:", e);
    }
  };

  const fetchLadiesFromBackend = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ladies`);
      const data = await res.json();
      if (data.success && Array.isArray(data.ladies)) {
        setLadies(data.ladies);
        localStorage.setItem('dodix_ladies_db', encryptStorageData(data.ladies));
      }
    } catch (e) {
      console.error("Error fetching ladies from backend:", e);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchUsersFromBackend();
    fetchLadiesFromBackend();
    const interval = setInterval(() => {
      const activeCheck = sessionStorage.getItem('dodix_current_user');
      if (activeCheck) {
        fetchUsersFromBackend();
        fetchLadiesFromBackend();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser?.username]);

  const handleSaveWhatsappForVerification = async (e) => {
    e.preventDefault();
    if (!whatsappInput.trim()) {
      alert("Please enter a valid WhatsApp number.");
      return;
    }

    try {
      const updatedCurrent = { ...currentUser, phone: whatsappInput.trim(), whatsappNumber: whatsappInput.trim() };
      setCurrentUser(updatedCurrent);
      sessionStorage.setItem('dodix_current_user', JSON.stringify(updatedCurrent));

      setIsSubmittedWhatsApp(true);
      alert("WhatsApp number saved successfully! An admin will review and activate your account shortly.");
    } catch (err) {
      console.error("Error saving WhatsApp verification number:", err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.username) {
      sessionStorage.setItem('dodix_current_user', JSON.stringify(currentUser));

      fetch(`${BACKEND_URL}/api/messages`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.messages.length > 0) {
            setMessages(data.messages);
          }
        })
        .catch(err => console.error("Failed to fetch messages from server:", err));
    } else {
      sessionStorage.removeItem('dodix_current_user');
    }
  }, [currentUser?.username]);

  useEffect(() => {
    localStorage.setItem('dodix_messages_db', encryptStorageData(messages));
  }, [messages]);

  const triggerLoadingAction = (text, callback) => {
    setLoadingText(text || 'Processing...');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (callback) callback();
    }, 800);
  };

  const sendChatMessage = (recipient, text) => {
    // Legacy support wrapper
  };

  if (!isAgeVerified) {
    return (
      <PageTransition>
        <AgeGate onVerify={handleAgeVerification} />
      </PageTransition>
    );
  }

  if (!currentUser) {
    return (
      <PageTransition>
        <AuthScreen 
          setCurrentUser={setCurrentUser} 
          isLoading={isLoading} 
          loadingText={loadingText} 
          triggerLoadingAction={triggerLoadingAction}
        />
      </PageTransition>
    );
  }

  if (currentUser.role === 'admin' || currentUser.username?.toLowerCase() === 'admin') {
    return (
      <PageTransition>
        <AdminDashboard 
          currentUser={currentUser}
          setCurrentUser={handleLogout}
          usersDb={usersDb}
          setUsersDb={setUsersDb}
          ladies={ladies}
          setLadies={setLadies}
          messages={messages}
          setMessages={setMessages}
          sendChatMessage={sendChatMessage}
          isLoading={isLoading}
          loadingText={loadingText}
          triggerLoadingAction={triggerLoadingAction}
        />
      </PageTransition>
    );
  }

  const isUserActive = currentUser.activated === true || currentUser.role === 'admin';
  
  if (!isUserActive) {
    const wasEverActivated = currentUser.wasActivatedBefore === true;

    return (
      <PageTransition>
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-pink-500 selection:text-white">
          <div className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative">
            <div className="w-12 h-12 bg-red-950/60 border border-red-800/40 text-red-400 rounded-2xl mx-auto flex items-center justify-center">
              <Clock size={24} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-white">
                {wasEverActivated ? 'Account Suspended' : 'Account Pending Activation'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {wasEverActivated ? (
                  <>Your account (<span className="text-pink-400 font-semibold">@{currentUser?.username}</span>) has been suspended by administration.</>
                ) : (
                  <>Your account (<span className="text-pink-400 font-semibold">@{currentUser?.username}</span>) is awaiting admin activation.</>
                )}
              </p>
            </div>

            {currentUser?.gender?.toLowerCase() === 'female' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-emerald-400" /> Companion Verification Required
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Please provide your WhatsApp number below for profile review and activation.
                  </p>
                </div>

                {isSubmittedWhatsApp || currentUser?.phone ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-xs text-emerald-300 font-medium text-center">
                    ✓ WhatsApp Number Registered: <span className="font-bold">{currentUser?.phone || whatsappInput}</span>
                  </div>
                ) : (
                  <form onSubmit={handleSaveWhatsappForVerification} className="space-y-2.5">
                    <input 
                      type="text"
                      value={whatsappInput}
                      onChange={(e) => setWhatsappInput(e.target.value)}
                      placeholder="e.g. +260970000000"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition"
                      required
                    />
                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition"
                    >
                      Submit WhatsApp for Verification
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button 
                onClick={handleOpenSupportWhatsApp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle size={15} /> Support Center (WhatsApp Activation Query)
              </button>

              <button 
                onClick={() => {
                  fetchUsersFromBackend();
                  fetchLadiesFromBackend();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} /> Sync & Check Status
              </button>

              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Clean Top Bar with ONLY "Dashboard / Directory" and "Secure Inbox"
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
          <div className="text-xs font-bold text-amber-400/90 tracking-wide">
            DODIX CLUB
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentView === 'directory'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Dashboard / Directory
            </button>
            <button
              onClick={() => setCurrentView('inbox')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentView === 'inbox'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Secure Inbox</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          {currentView === 'inbox' ? (
            <div className="p-6 max-w-5xl mx-auto">
              <Inbox currentUser={currentUser} API_URL={BACKEND_URL} initialRecipient={inboxRecipient} />
            </div>
          ) : (
            <ClientDirectory 
              currentUser={currentUser}
              setCurrentUser={handleLogout}
              ladies={ladies}
              setLadies={setLadies}
              messages={messages}
              setMessages={setMessages}
              sendChatMessage={sendChatMessage}
              isLoading={isLoading}
              loadingText={loadingText}
              triggerLoadingAction={triggerLoadingAction}
              backendUrl={BACKEND_URL}
              onStartChat={(targetUser) => {
                setInboxRecipient(targetUser);
                setCurrentView('inbox');
              }}
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
}