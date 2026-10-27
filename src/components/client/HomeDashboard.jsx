// src/components/client/HomeDashboard.jsx
import React from 'react';
import { Sparkles, Megaphone, Compass, ArrowRight, Bell, Calendar, Heart, CreditCard, ShieldCheck, User, Settings, Lock } from 'lucide-react';

export default function HomeDashboard({ user, isFemaleUser, announcements = [], onNavigate }) {
  const defaultAnnouncements = [
    {
      id: 1,
      title: 'New Elite Directory Features & Verified Badges',
      date: 'Oct 8, 2026',
      category: 'System Update',
      content: 'Browse verified companions in your region with enhanced location filtering and direct secure booking options.'
    },
    {
      id: 2,
      title: 'Live Subscription Expiration Tracker Active',
      date: 'Oct 27, 2026',
      category: 'Billing & Access',
      content: 'Check your real-time pass expiration countdown directly in the Subscription Status tab.'
    }
  ];

  const activeAnnouncements = announcements.length > 0 ? announcements : defaultAnnouncements;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-950/40 via-slate-900 to-purple-950/60 border border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to Dodix Club Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.username ? `@${user.username}` : 'Member'}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              {isFemaleUser 
                ? "Manage your verified listings, monitor announcement updates, and keep track of your active companion status securely in one place."
                : "Explore verified elite companions in your area, monitor your active subscription tier countdown, and update your security settings."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {isFemaleUser ? (
              <button
                onClick={() => onNavigate && onNavigate('myprofile')}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                Post / Edit Advertisement <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate && onNavigate('directory')}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                Browse Elite Directory <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Feature Highlights Grid */}
      {isFemaleUser ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => onNavigate && onNavigate('myprofile')}
            className="bg-slate-950/60 border border-slate-800/80 hover:border-pink-500/40 rounded-2xl p-5 space-y-2 cursor-pointer transition"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Privacy Protected</h3>
            <p className="text-xs text-slate-400">Built-in masking filters and watermarking keep your private photos secure until unmasked.</p>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate('news')}
            className="bg-slate-950/60 border border-slate-800/80 hover:border-pink-500/40 rounded-2xl p-5 space-y-2 cursor-pointer transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">News & Directives</h3>
            <p className="text-xs text-slate-400">Stay updated with latest policy changes, verification rules, and administrative updates.</p>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate('settings')}
            className="bg-slate-950/60 border border-slate-800/80 hover:border-pink-500/40 rounded-2xl p-5 space-y-2 cursor-pointer transition"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Account Settings</h3>
            <p className="text-xs text-slate-400">Update your WhatsApp contact info and manage your account security credentials.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => onNavigate && onNavigate('directory')}
            className="bg-slate-950/60 border border-slate-800/80 hover:border-pink-500/40 rounded-2xl p-5 space-y-2 cursor-pointer transition"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Elite Directory</h3>
            <p className="text-xs text-slate-400">Explore verified profiles with active location filters, categories, and direct contact options.</p>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate('subscription')}
            className="bg-slate-950/60 border border-slate-800/80 hover:border-pink-500/40 rounded-2xl p-5 space-y-2 cursor-pointer transition"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Active Subscription</h3>
            <p className="text-xs text-slate-400">View your live pass countdown timer, plan privileges, and extension options.</p>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate('settings')}
            className="bg-slate-950/60 border border-slate-800/80 hover:border-pink-500/40 rounded-2xl p-5 space-y-2 cursor-pointer transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Account Details</h3>
            <p className="text-xs text-slate-400">Manage your password, account security question, and personal contact info.</p>
          </div>
        </div>
      )}

      {/* Important Announcements Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Important Announcements & News</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Live Updates</span>
        </div>

        <div className="space-y-3">
          {activeAnnouncements.map((item) => (
            <div key={item.id || item._id} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-pink-500/40 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  {item.category || 'Announcement'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {item.date || 'Recent'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {item.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.text || item.content}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}