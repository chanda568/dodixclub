// src/Inbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, User } from 'lucide-react';
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

  // Synchronize recipient when initialRecipient changes from parent (e.g. clicking Secure Chat on a card)
  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient.toLowerCase().trim());
    }
  }, [initialRecipient]);

  // Helper headers for maintenance mode bypass
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
          const existingIds = new Set(prev.map(m => m._id).filter(Boolean));
          const newItems = data.messages.filter(m => !m._id || !existingIds.has(m._id));
          if (newItems.length === 0 && prev.length > 0) return prev;
          
          const combined = [...prev, ...newItems];
          return combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[Socket] Connecting to server:', cleanApi);
    
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
            (m.sender === msg.sender && 
             m.recipient === msg.recipient &&
             m.content === msg.content && 
             Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 5000)
        );
        if (isDuplicate) return prev;
        return [...prev, msg];
      });
    });

    fetchMessages();

    // Fast polling every 2 seconds to guarantee real-time sync across sessions
    const pollInterval = setInterval(fetchMessages, 2000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(pollInterval);
    };
  }, [cleanApi, currentUser?.username]);

  // Scroll to bottom only when switching recipient
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [recipient]);

  // Dynamically extract unique users you've chatted with, plus system targets
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messagePayload = {
      sender: currentUser.username.toLowerCase().trim(),
      recipient: recipient.toLowerCase().trim(),
      content: newMessage.trim(),
      timestamp: new Date()
    };

    const textToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // 1. Send via REST API POST and append the official server message with its unique _id
    try {
      const res = await fetch(`${cleanApi}/api/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(messagePayload)
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('Failed to post message via REST:', err);
    }

    // 2. Emit via socket for instant broadcast to the recipient
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-message', messagePayload);
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-amber-400">DodixClub Secure Inbox</h2>
            <p className="text-xs text-gray-400">Logged in as @{currentUser?.username}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-gray-300">{onlineCount} Active Online</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Dynamic Conversations Sidebar */}
        <div className="w-1/3 bg-slate-950/50 border-r border-slate-800 p-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversations</label>
          <div className="space-y-1 overflow-y-auto max-h-[58vh]">
            {activeChatTargets.map((target) => (
              <button
                key={target}
                onClick={() => setRecipient(target)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  recipient === target
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-gray-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="capitalize">{target}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex flex-col flex-1 bg-slate-900">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">Loading chat history...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                <Shield className="w-8 h-8 text-slate-700" />
                <p className="text-sm">No messages with {recipient} yet.</p>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isMe = msg.sender?.toLowerCase().trim() === currentUser?.username?.toLowerCase().trim();
                return (
                  <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400 capitalize">{msg.sender}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                          : 'bg-slate-800 text-gray-100 rounded-bl-none border border-slate-700'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Send message to ${recipient}...`}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-2.5 rounded-xl transition font-bold flex items-center justify-center cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}