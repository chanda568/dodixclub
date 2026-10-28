// src/components/client/HomeDashboard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Compass, CreditCard, Settings, Bell, ArrowRight, User, ShieldCheck } from 'lucide-react';

export default function HomeDashboard({ user, isFemaleUser, announcements = [], onNavigate = () => {} }) {
  const userLocation = user?.location || 'Lusaka';

  const quickActionCards = isFemaleUser ? [
    {
      id: 'myprofile',
      title: 'Post Advertisement',
      desc: 'Create and publish your verified multi-photo companion listing.',
      icon: User,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      id: 'history',
      title: 'Submission History',
      desc: 'Review past updates, price edits, and verification statuses.',
      icon: Bell,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'settings',
      title: 'Account Details',
      desc: 'Manage your password, security questions, and phone number.',
      icon: Settings,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ] : [
    {
      id: 'directory',
      title: 'Elite Directory',
      desc: 'Explore verified profiles with active location filters, categories, and direct contact options.',
      icon: Compass,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      id: 'subscription',
      title: 'Active Subscription',
      desc: 'View your live pass countdown timer, plan privileges, and extension options.',
      icon: CreditCard,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'settings',
      title: 'Account Details',
      desc: 'Manage your password, account security question, and personal contact info.',
      icon: Settings,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner with Dynamic Role-Aware Button */}
      <div className="bg-gradient-to-r from-[#0b101d] via-[#111827] to-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck size={12} /> Welcome to Dodix Club Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hello, <span className="text-pink-400">@{user?.username}</span>! 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            {isFemaleUser 
              ? `Manage your active companion listings, review submission history, and update your security settings seamlessly.`
              : `Explore verified elite companions in ${userLocation}, monitor your active subscription tier countdown, and update your security settings.`
            }
          </p>
        </div>

        <button 
          onClick={() => onNavigate(isFemaleUser ? 'myprofile' : 'directory')}
          className="px-6 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs shadow-lg transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer group relative z-10"
        >
          {isFemaleUser ? 'Manage Profile & Adverts' : 'Browse Elite Directory'} 
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Quick Action Cards with Framer Motion Hover Lifts & Border Glow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActionCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <motion.div
              key={card.id}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => onNavigate(card.id)}
              className="bg-[#0b101d] border border-slate-800/80 hover:border-pink-500/50 rounded-3xl p-6 shadow-xl cursor-pointer group flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${card.bg} ${card.color} shadow-inner`}>
                  <IconComponent size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white group-hover:text-pink-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 group-hover:text-pink-300 pt-2 border-t border-slate-800/60 relative z-10">
                <span>Access module</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Important Announcements & News Section with "View All" Button */}
      <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Important Announcements & News</h3>
              <p className="text-[10px] text-slate-400">Latest platform security updates and notices</p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('news')}
            className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
          >
            View All ({announcements.length}) <ArrowRight size={14} />
          </button>
        </div>

        {announcements.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active announcements at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 2).map((item) => {
              const itemId = item._id || item.id;
              const itemDate = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <div 
                  key={itemId} 
                  onClick={() => onNavigate('news')}
                  className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-2xl transition-all duration-200 cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-white group-hover:text-pink-300 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-bold">{itemDate}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.text || item.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}