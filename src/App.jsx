// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  DEFAULT_USERS_DB, 
  DEFAULT_LADIES_DB, 
  DEFAULT_MESSAGES_DB 
} from './data/constants';
import { decryptStorageData, encryptStorageData } from './utils/storageEncryption';
import { Clock, RefreshCw, LogOut, MessageCircle } from 'lucide-react';

import AgeGate from './components/common/AgeGate';
import AuthScreen from './components/auth/AuthScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import ClientDirectory from './components/client/ClientDirectory';

export default function App() {
  // Age Verification State
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    return sessionStorage.getItem('dodix_age_verified') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('dodix_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [usersDb, setUsersDb] = useState(() => {
    const saved = localStorage.getItem('dodix_users_db');
    if (saved) {
      try {
        const decrypted = decryptStorageData(saved);
        if (Array.isArray(decrypted)) return decrypted;
      } catch (e) {}
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_USERS_DB;
  });

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

  // Messages state (synced with server via WebSockets)
  const [messages, setMessages] = useState(DEFAULT_MESSAGES_DB);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  // State for female WhatsApp companion verification input on pending screen
  const [whatsappInput, setWhatsappInput] = useState('');
  const [isSubmittedWhatsApp, setIsSubmittedWhatsApp] = useState(false);

  // WebSocket reference to maintain a persistent connection across re-renders
  const socketRef = useRef(null);

  const handleAgeVerification = (verified) => {
    if (verified) {
      sessionStorage.setItem('dodix_age_verified', 'true');
      setIsAgeVerified(true);
    }
  };

  // Sync latest user status from DB when checking status or refreshing
  const handleSyncUserStatus = () => {
    if (!currentUser) return;
    try {
      const raw = localStorage.getItem('dodix_users_db');
      if (raw) {
        const users = decryptStorageData(raw);
        const latest = users.find(u => u.username?.toLowerCase() === currentUser.username?.toLowerCase());
        if (latest) {
          const merged = { ...currentUser, ...latest };
          setCurrentUser(merged);
          sessionStorage.setItem('dodix_current_user', JSON.stringify(merged));
        }
      }
    } catch (e) {
      console.error("Error syncing status:", e);
    }
  };

  // Automatically sync user status periodically to immediately catch admin suspensions
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem('dodix_users_db');
        if (raw) {
          const users = decryptStorageData(raw);
          const latest = users.find(u => u.username?.toLowerCase() === currentUser.username?.toLowerCase());
          if (latest) {
            // If activation status changed in localStorage by admin, update state immediately
            if (latest.activated !== currentUser.activated || latest.approved !== currentUser.approved) {
              const merged = { ...currentUser, ...latest };
              setCurrentUser(merged);
              sessionStorage.setItem('dodix_current_user', JSON.stringify(merged));
            }
          }
        }
      } catch (e) {
        console.error("Background sync error:", e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSaveWhatsappForVerification = (e) => {
    e.preventDefault();
    if (!whatsappInput.trim()) {
      alert("Please enter a valid WhatsApp number.");
      return;
    }

    try {
      const updatedUsers = usersDb.map(u => {
        if (u.username?.toLowerCase() === currentUser.username?.toLowerCase()) {
          return { ...u, phone: whatsappInput.trim(), whatsappNumber: whatsappInput.trim() };
        }
        return u;
      });
      setUsersDb(updatedUsers);
      localStorage.setItem('dodix_users_db', encryptStorageData(updatedUsers));

      const updatedCurrent = { ...currentUser, phone: whatsappInput.trim(), whatsappNumber: whatsappInput.trim() };
      setCurrentUser(updatedCurrent);
      sessionStorage.setItem('dodix_current_user', JSON.stringify(updatedCurrent));

      setIsSubmittedWhatsApp(true);
      alert("WhatsApp number saved successfully! An admin will review and activate your account shortly.");
    } catch (err) {
      console.error("Error saving WhatsApp verification number:", err);
    }
  };

  // Fetch initial message history from Node.js server and open WebSocket on login
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('dodix_current_user', JSON.stringify(currentUser));

      fetch('http://localhost:5000/api/messages')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.messages.length > 0) {
            setMessages(data.messages);
          }
        })
        .catch(err => console.error("Failed to fetch messages from server:", err));

      const ws = new WebSocket('ws://localhost:5000');
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to server');
        ws.send(JSON.stringify({ type: 'auth', username: currentUser.username }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat_message') {
            setMessages((prevMessages) => {
              const exists = prevMessages.some(m => m.id === data.message.id);
              if (exists) return prevMessages;
              return [...prevMessages, data.message];
            });
          }
        } catch (err) {
          console.error('[WS] Error parsing incoming message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected from server');
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    } else {
      sessionStorage.removeItem('dodix_current_user');
      if (socketRef.current) {
        socketRef.current.close();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('dodix_users_db', encryptStorageData(usersDb));
  }, [usersDb]);

  useEffect(() => {
    localStorage.setItem('dodix_ladies_db', encryptStorageData(ladies));
  }, [ladies]);

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
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat_message',
        sender: currentUser.username,
        recipient: recipient,
        text: text
      }));
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  // 1. Enforce Age Verification First
  if (!isAgeVerified) {
    return <AgeGate onVerify={handleAgeVerification} />;
  }

  // 2. Enforce Authentication Screen if no user logged in
  if (!currentUser) {
    return (
      <AuthScreen 
        usersDb={usersDb} 
        setUsersDb={setUsersDb} 
        setCurrentUser={setCurrentUser} 
        isLoading={isLoading} 
        loadingText={loadingText} 
        triggerLoadingAction={triggerLoadingAction}
      />
    );
  }

  // 3. Admin Dashboard Route
  if (currentUser.role === 'admin' || currentUser.username?.toLowerCase() === 'admin') {
    return (
      <AdminDashboard 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
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
    );
  }

  // 4. Check live activation status from database to immediately block suspended users
  let liveActivated = currentUser.activated;
  try {
    const rawUsers = localStorage.getItem('dodix_users_db');
    if (rawUsers) {
      const parsedUsers = decryptStorageData(rawUsers);
      const dbMatch = parsedUsers.find(u => u.username?.toLowerCase() === currentUser.username?.toLowerCase());
      if (dbMatch && dbMatch.activated !== undefined) {
        liveActivated = dbMatch.activated;
      }
    }
  } catch (e) {}

  const isUserActive = liveActivated !== false || currentUser.approved === true;
  
  if (!isUserActive) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-pink-500 selection:text-white">
        <div className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative">
          <div className="w-12 h-12 bg-red-950/60 border border-red-800/40 text-red-400 rounded-2xl mx-auto flex items-center justify-center">
            <Clock size={24} />
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-white">Account Suspended / Pending</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your account (<span className="text-pink-400 font-semibold">@{currentUser?.username}</span>) has been suspended or is awaiting admin activation.
            </p>
          </div>

          {/* Conditional WhatsApp Number Input for Female Users awaiting activation */}
          {currentUser?.gender?.toLowerCase() === 'female' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-emerald-400" /> Companion Verification Required
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Please provide your WhatsApp number below. Our admin team will use this number to verify your profile and activate your account.
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
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    Submit WhatsApp for Verification
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button 
              onClick={() => {
                handleSyncUserStatus();
                window.location.reload();
              }}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Sync & Check Status
            </button>

            <button 
              onClick={() => {
                sessionStorage.removeItem('dodix_current_user');
                setCurrentUser(null);
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700 flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Client / Companion Directory Route (Only accessible when activated)
  return (
    <ClientDirectory 
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      ladies={ladies}
      setLadies={setLadies}
      messages={messages}
      setMessages={setMessages}
      sendChatMessage={sendChatMessage}
      isLoading={isLoading}
      loadingText={loadingText}
      triggerLoadingAction={triggerLoadingAction}
    />
  );
}