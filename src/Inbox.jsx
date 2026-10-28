import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, User } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Inbox({ currentUser, API_URL }) {
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('admin');
  const [newMessage, setNewMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const cleanApi = (API_URL || 'https://dodixclub-backend.onrender.com').replace(/\/api\/?$/, '').replace(/\/$/, '');

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
        if (prev.some((m) => m._id && m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    fetchMessages();

    // Poll messages every 4 seconds as a reliable backup sync
    const pollInterval = setInterval(fetchMessages, 4000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(pollInterval);
    };
  }, [cleanApi]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${cleanApi}/api/messages`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messagePayload = {
      sender: currentUser.username,
      recipient: recipient.toLowerCase().trim(),
      content: newMessage.trim(),
      timestamp: new Date()
    };

    // 1. Emit via socket for instant broadcast
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-message', messagePayload);
    }

    // 2. Also send via REST API POST to guarantee database persistence & sync
    try {
      const res = await fetch(`${cleanApi}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    setNewMessage('');
  };

  const filteredMessages = messages.filter((msg) => {
    const sender = msg.sender?.toLowerCase();
    const rec = msg.recipient?.toLowerCase();
    const myName = currentUser?.username?.toLowerCase();
    const target = recipient.toLowerCase();

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
        {/* Recipient Selection */}
        <div className="w-1/3 bg-slate-950/50 border-r border-slate-800 p-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Chat Target</label>
          <div className="space-y-1">
            {['admin', 'testmale', 'testfemale', 'public'].map((target) => (
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
                const isMe = msg.sender?.toLowerCase() === currentUser?.username?.toLowerCase();
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