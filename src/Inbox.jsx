// src/Inbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, User, Check, CheckCheck, Lock, Search } from 'lucide-react';
import { io } from 'socket.io-client';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export default function Inbox({ currentUser, API_URL, initialRecipient }) {
  const [messages, setMessages] = useState([]);
  // Strictly start with null so no chat is pre-opened on inbox load
  const [recipient, setRecipient] = useState(initialRecipient ? initialRecipient.toLowerCase().trim() : null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [usersPresence, setUsersPresence] = useState({});
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

  const fetchUsersAndPresence = async () => {
    try {
      const res = await fetch(`${cleanApi}/api/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        const presenceMap = {};
        data.users.forEach(u => {
          presenceMap[u.username.toLowerCase().trim()] = {
            isOnline: u.isOnline,
            lastSeen: u.lastSeen ? new Date(u.lastSeen) : null
          };
        });
        setUsersPresence(presenceMap);
      }
    } catch (err) {
      console.error('Failed to fetch user presence:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${cleanApi}/api/messages`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages((prev) => {
          const existingMap = new Map(prev.map(m => [m._id || `${m.sender}-${m.timestamp}`, m]));
          data.messages.forEach(msg => {
            const key = msg._id || `${msg.sender}-${msg.timestamp}`;
            const existing = existingMap.get(key);
            if (existing && existing.read) {
              msg.read = true;
            }
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

  const markMessagesAsRead = async (targetRecipient) => {
    if (!targetRecipient) return;
    const myName = currentUser?.username?.toLowerCase().trim();
    const otherUser = targetRecipient.toLowerCase().trim();

    setMessages((prev) =>
      prev.map((msg) => {
        if (
          msg.sender?.toLowerCase().trim() === otherUser &&
          msg.recipient?.toLowerCase().trim() === myName
        ) {
          return { ...msg, read: true };
        }
        return msg;
      })
    );

    try {
      await fetch(`${cleanApi}/api/messages/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reader: myName, sender: otherUser })
      });

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('mark-read', { reader: myName, sender: otherUser });
      }
    } catch (err) {
      console.error('Failed to update read status on server:', err);
    }
  };

  useEffect(() => {
    socketRef.current = io(cleanApi, {
      transports: ['websocket', 'polling'],
      secure: true,
      reconnection: true
    });

    socketRef.current.on('connect', () => {
      if (currentUser?.username) {
        socketRef.current.emit('register-user', currentUser.username);
      }
    });

    socketRef.current.on('live-pulse-update', (data) => setOnlineCount(data.onlineCount));

    socketRef.current.on('presence-update', ({ username, isOnline, lastSeen }) => {
      setUsersPresence(prev => ({
        ...prev,
        [username.toLowerCase().trim()]: { isOnline, lastSeen: lastSeen ? new Date(lastSeen) : new Date() }
      }));
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

      const myName = currentUser?.username?.toLowerCase().trim();
      if (recipient && msg.recipient?.toLowerCase().trim() === myName && msg.sender?.toLowerCase().trim() === recipient.toLowerCase().trim()) {
        markMessagesAsRead(recipient);
      }
    });

    socketRef.current.on('messages-read', ({ reader, sender }) => {
      const myName = currentUser?.username?.toLowerCase().trim();
      if (sender?.toLowerCase().trim() === myName || reader) {
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
    fetchUsersAndPresence();
    const pollInterval = setInterval(() => {
      fetchMessages();
      fetchUsersAndPresence();
    }, 2000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(pollInterval);
    };
  }, [cleanApi, currentUser?.username]);

  useEffect(() => {
    if (recipient) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      markMessagesAsRead(recipient);
    }
  }, [recipient]);

  const chatPreviews = React.useMemo(() => {
    const targets = new Set(['admin', 'public']);
    messages.forEach((msg) => {
      const sender = msg.sender?.toLowerCase().trim();
      const rec = msg.recipient?.toLowerCase().trim();
      const myName = currentUser?.username?.toLowerCase().trim();

      if (sender && sender !== myName && sender !== 'public') targets.add(sender);
      if (rec && rec !== myName && rec !== 'public') targets.add(rec);
    });

    const myName = currentUser?.username?.toLowerCase().trim();

    return Array.from(targets)
      .map((target) => {
        const chatMsgs = messages.filter((msg) => {
          const s = msg.sender?.toLowerCase().trim();
          const r = msg.recipient?.toLowerCase().trim();
          if (target === 'public') return r === 'public';
          return (s === myName && r === target) || (s === target && r === myName);
        });

        const lastMsg = chatMsgs[chatMsgs.length - 1];
        const unreadCount = chatMsgs.filter(m => m.sender?.toLowerCase().trim() === target && !m.read).length;

        return {
          target,
          lastMessage: lastMsg ? lastMsg.content : 'No messages yet',
          timestamp: lastMsg ? new Date(lastMsg.timestamp) : new Date(0),
          unreadCount
        };
      })
      .filter(chat => chat.target.includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [messages, currentUser, searchTerm]);

  const handleSendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText || newMessage;
    if (!textToSend.trim() || !currentUser || !recipient) return;

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

  const filteredMessages = recipient ? messages.filter((msg) => {
    const sender = msg.sender?.toLowerCase().trim();
    const rec = msg.recipient?.toLowerCase().trim();
    const myName = currentUser?.username?.toLowerCase().trim();
    const target = recipient.toLowerCase().trim();

    if (rec === 'public' || target === 'public') return rec === 'public';
    return (sender === myName && rec === target) || (sender === target && rec === myName);
  }) : [];

  const recipientPresence = recipient ? (usersPresence[recipient.toLowerCase().trim()] || {}) : {};
  const isRecipientOnline = recipient ? (['admin', 'public'].includes(recipient.toLowerCase()) || recipientPresence.isOnline === true) : false;

  const getLastSeenText = () => {
    if (!recipient) return '';
    if (isRecipientOnline) return 'online';
    if (!recipientPresence.lastSeen) return 'offline';
    try {
      return `last seen ${formatDistanceToNow(new Date(recipientPresence.lastSeen), { addSuffix: true })}`;
    } catch {
      return 'offline';
    }
  };

  const formatChatTime = (date) => {
    if (date.getTime() === 0) return '';
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };

  return (
    <div className="flex h-[82vh] max-w-6xl mx-auto bg-[#17212b] border border-[#0e1621] rounded-2xl overflow-hidden shadow-2xl text-[#f5f5f5] font-sans">
      
      {/* ================= TELEGRAM SIDEBAR ================= */}
      <div className="w-80 bg-[#17212b] border-r border-[#0e1621] flex flex-col">
        
        {/* Sidebar Header */}
        <div className="p-3 bg-[#17212b] border-b border-[#0e1621] space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#2b5278] flex items-center justify-center text-xs font-bold uppercase text-white shadow">
                {currentUser?.username?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-200">@{currentUser?.username}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#242f3d] rounded-full text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {onlineCount} online
            </div>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#242f3d] text-xs text-white placeholder-slate-400 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5288c1]"
            />
          </div>
        </div>

        {/* Telegram Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#0e1621]/40 scrollbar-thin">
          {chatPreviews.map(({ target, lastMessage, timestamp, unreadCount }) => {
            const isSelected = recipient === target;
            const targetPresence = usersPresence[target] || {};
            const online = ['admin', 'public'].includes(target) || targetPresence.isOnline;

            return (
              <button
                key={target}
                onClick={() => setRecipient(target)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition cursor-pointer text-left ${
                  isSelected ? 'bg-[#2b5278]' : 'hover:bg-[#202b36]'
                }`}
              >
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-[#5288c1] to-[#2b5278] flex items-center justify-center font-bold text-sm uppercase text-white shadow shrink-0">
                  {target.charAt(0)}
                  {online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#17212b] rounded-full"></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white capitalize truncate">{target}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">{formatChatTime(timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[11px] text-slate-400 truncate pr-2">{lastMessage}</p>
                    {unreadCount > 0 && (
                      <span className="bg-[#5288c1] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TELEGRAM CHAT WINDOW / EMPTY STATE ================= */}
      <div className="flex flex-col flex-1 bg-[#0e1621] relative">
        {!recipient ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <div className="p-4 bg-[#17212b] rounded-full text-[#5288c1] shadow-lg">
              <MessageSquare size={28} />
            </div>
            <p className="text-xs font-medium">Select a chat from the sidebar to start messaging</p>
          </div>
        ) : (
          <>
            {/* Top Chat Header */}
            <div className="px-5 py-3 bg-[#17212b] border-b border-[#0e1621] flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2b5278] flex items-center justify-center font-bold text-xs uppercase text-white">
                  {recipient.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white capitalize">{recipient}</h3>
                  <span className={`text-[10px] ${isRecipientOnline ? 'text-[#5288c1]' : 'text-slate-400'} lowercase font-medium`}>
                    {getLastSeenText()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] bg-[#242f3d] px-2.5 py-1 rounded-lg border border-slate-700/50 text-amber-400">
                  <Lock size={10} /> Encrypted
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin bg-[#0e1621] bg-opacity-95">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">Loading messages...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                  <div className="p-3 bg-[#17212b] rounded-xl text-slate-400">
                    <Shield size={24} />
                  </div>
                  <p className="text-xs font-medium">Secure channel opened with @{recipient}</p>
                </div>
              ) : (
                filteredMessages.map((msg, index) => {
                  const senderName = msg.sender?.toLowerCase().trim();
                  const myName = currentUser?.username?.toLowerCase().trim();
                  const isMe = senderName === myName;
                  const isSeen = msg.read === true;

                  return (
                    <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow ${
                          isMe
                            ? 'bg-[#2b5278] text-white rounded-br-none'
                            : 'bg-[#18222d] text-slate-100 rounded-bl-none border border-slate-800'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-sky-200' : 'text-slate-400'}`}>
                          <span>{format(new Date(msg.timestamp), 'p')}</span>
                          {isMe && (
                            <span className="flex items-center">
                              {isSeen ? <CheckCheck size={14} className="text-sky-300 ml-0.5" /> : <Check size={13} className="ml-0.5 text-slate-300" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#17212b] border-t border-[#0e1621] flex items-center space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-[#242f3d] border border-transparent rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5288c1] transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#5288c1] hover:bg-[#4073a8] disabled:opacity-40 text-white p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}