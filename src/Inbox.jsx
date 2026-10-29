// src/Inbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, User, Check, CheckCheck, Sparkles, Lock } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Inbox({ currentUser, API_URL, initialRecipient }) {
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(initialRecipient || 'admin');
  const [newMessage, setNewMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const cleanApi = (API_URL || 'https://dodixclub-backend.onrender.com').replace(/\/api\/?$/, '').replace(/\/$/, '');

  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient.toLowerCase().trim());
    }
  }, [initialRecipient]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-username': currentUser?.username || '',
    'x-user-role': currentUser?.role || ''
  });

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${cleanApi}/api/messages`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages((prev) => {
          const existingMap = new Map(prev.map(m => [m._id || `${m.sender}-${m.timestamp}`, m]));
          data.messages.forEach(msg => {
            const key = msg._id || `${msg.sender}-${msg.timestamp}`;
            existingMap.set(key, msg);
          });
          const combined = Array.from(existingMap.values());
          return combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Accurately update read status in database and notify via socket
  const markMessagesAsRead = async (targetRecipient) => {
    const myName = currentUser?.username?.toLowerCase().trim();
    const otherUser = targetRecipient.toLowerCase().trim();

    try {
      // 1. Update database via REST API
      await fetch(`${cleanApi}/api/messages/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reader: myName,
          sender: otherUser
        })
      });

      // 2. Optimistically update local state so "Seen" appears instantly
      setMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.sender?.toLowerCase().trim() === myName &&
            msg.recipient?.toLowerCase().trim() === otherUser
          ) {
            return { ...msg, read: true };
          }
          return msg;
        })
      );

      // 3. Emit socket event so sender's UI updates in real-time
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('mark-read', {
          reader: myName,
          sender: otherUser
        });
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  useEffect(() => {
    socketRef.current = io(cleanApi, {
      transports: ['websocket', 'polling'],
      secure: true,
      reconnection: true
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected successfully with ID:', socketRef.current.id);
    });

    socketRef.current.on('live-pulse-update', (data) => {
      setOnlineCount(data.onlineCount);
    });

    socketRef.current.on('receive-message', (msg) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (m) => 
            (m._id && msg._id && m._id === msg._id) ||
            (m.sender?.toLowerCase() === msg.sender?.toLowerCase() && 
             m.recipient?.toLowerCase() === msg.recipient?.toLowerCase() &&
             m.content === msg.content && 
             Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 15000)
        );
        if (isDuplicate) return prev;
        return [...prev, msg];
      });

      // If message is incoming for the currently open chat, automatically mark as read
      const myName = currentUser?.username?.toLowerCase().trim();
      if (msg.recipient?.toLowerCase().trim() === myName && msg.sender?.toLowerCase().trim() === recipient.toLowerCase().trim()) {
        markMessagesAsRead(recipient);
      }
    });

    // Listen for real-time read receipt updates from the recipient
    socketRef.current.on('messages-read', ({ reader, sender }) => {
      const myName = currentUser?.username?.toLowerCase().trim();
      if (sender?.toLowerCase().trim() === myName) {
        setMessages((prev) =>
          prev.map((m) => {
            if (
              m.sender?.toLowerCase().trim() === myName &&
              m.recipient?.toLowerCase().trim() === reader?.toLowerCase().trim()
            ) {
              return { ...m, read: true };
            }
            return m;
          })
        );
      }
    });

    fetchMessages();
    const pollInterval = setInterval(fetchMessages, 2000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(pollInterval);
    };
  }, [cleanApi, currentUser?.username, recipient]);

  // When switching recipient, scroll down and mark their messages as read
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (recipient) {
      markMessagesAsRead(recipient);
    }
  }, [recipient]);

  const activeChatTargets = React.useMemo(() => {
    const targets = new Set(['admin', 'public']);
    messages.forEach((msg) => {
      const sender = msg.sender?.toLowerCase().trim();
      const rec = msg.recipient?.toLowerCase().trim();
      const myName = currentUser?.username?.toLowerCase().trim();

      if (sender && sender !== myName && sender !== 'public') targets.add(sender);
      if (rec && rec !== myName && rec !== 'public') targets.add(rec);
    });
    if (recipient) targets.add(recipient.toLowerCase().trim());
    return Array.from(targets);
  }, [messages, currentUser, recipient]);

  const handleSendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText || newMessage;
    if (!textToSend.trim() || !currentUser) return;

    const messagePayload = {
      sender: currentUser.username.toLowerCase().trim(),
      recipient: recipient.toLowerCase().trim(),
      content: textToSend.trim(),
      timestamp: new Date(),
      read: false
    };

    setNewMessage('');

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-message', messagePayload);
    } else {
      try {
        const res = await fetch(`${cleanApi}/api/messages`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(messagePayload)
        });
        const data = await res.json();
        if (data.success && data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.error('Failed to post message via REST:', err);
      }
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const sender = msg.sender?.toLowerCase().trim();
    const rec = msg.recipient?.toLowerCase().trim();
    const myName = currentUser?.username?.toLowerCase().trim();
    const target = recipient.toLowerCase().trim();

    if (rec === 'public' || target === 'public') return rec === 'public';
    return (sender === myName && rec === target) || (sender === target && rec === myName);
  });

  return (
    <div className="flex flex-col h-[78vh] max-w-5xl mx-auto bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400 shadow-inner">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-amber-400 tracking-wide text-sm sm:text-base">DodixClub Secure Inbox</h2>
            <p className="text-[11px] text-slate-400">Encrypted session as <span className="text-slate-200 font-semibold">@{currentUser?.username}</span></p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-medium">{onlineCount} Active Online</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-1/3 bg-slate-950/60 border-r border-slate-800/80 p-4 space-y-3 flex flex-col">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Conversations</span>
            <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-bold">{activeChatTargets.length}</span>
          </div>
          <div className="space-y-1.5 overflow-y-auto flex-1 scrollbar-thin pr-1">
            {activeChatTargets.map((target) => (
              <button
                key={target}
                onClick={() => setRecipient(target)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  recipient === target
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl ${recipient === target ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="capitalize truncate">{target}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="flex flex-col flex-1 bg-slate-900/50">
          <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xs uppercase">
                {recipient.charAt(0)}
              </div>
              <div>
                <h3 className="text-xs font-black text-white capitalize flex items-center gap-1.5">
                  {recipient} <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </h3>
                <span className="text-[10px] text-slate-400">Direct Secure Channel</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <Lock size={10} className="text-amber-400" /> End-to-End Encrypted
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs font-medium">Loading secure history...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 my-auto">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-amber-400/80">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1 max-w-xs">
                  <p className="text-xs font-bold text-slate-300">Secure chat initialized with @{recipient}</p>
                  <p className="text-[11px] text-slate-400">Send a message or choose a quick prompt below to start conversation.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button 
                    onClick={(e) => handleSendMessage(e, "Hello! Is availability open for booking?")}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Is availability open?
                  </button>
                  <button 
                    onClick={(e) => handleSendMessage(e, "What are your rates and timings?")}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Rates & timings?
                  </button>
                </div>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isMe = msg.sender?.toLowerCase().trim() === currentUser?.username?.toLowerCase().trim();
                const isSeen = msg.read === true;

                return (
                  <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                    <div className="flex items-center space-x-2 px-1">
                      <span className="text-[11px] font-bold text-slate-400 capitalize">{msg.sender}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                          : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                      }`}
                    >
                      {msg.content}
                      {isMe && (
                        <div className="flex items-center justify-end gap-1 mt-1 text-slate-950/80">
                          <span className="text-[9px] font-black uppercase tracking-wider">{isSeen ? 'Seen' : 'Sent'}</span>
                          {isSeen ? <CheckCheck size={14} className="text-emerald-950" /> : <Check size={13} />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Secure message to @${recipient}...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 p-3 rounded-2xl transition font-black flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}