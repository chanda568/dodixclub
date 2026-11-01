import React from 'react';
import { Crown, CheckCircle2, MessageCircle } from 'lucide-react';

export default function UserSubscriptionView({
  currentUser,
  timeLeft,
  expiryTime,
  handleContactSupportWhatsApp
}) {
  return (
    <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Subscription Status & Access</h2>
          <p className="text-xs text-slate-400">Review your active tier privileges and live pass expiration countdown.</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Pass
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-pink-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-pink-400">Current Access Package</span>
          <h3 className="text-2xl font-black text-white">{currentUser?.plan || '7 Days Elite Pass'}</h3>
        </div>

        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-white">{timeLeft.days}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Days</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-white">{timeLeft.hours}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Hours</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-white">{timeLeft.minutes}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Mins</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-pink-400 animate-pulse">{timeLeft.seconds}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Secs</span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Pass expires on <span className="text-slate-200 font-semibold">{expiryTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Crown size={16} className="text-pink-500" /> Included Privileges
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Full access to verified companion directory</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Direct WhatsApp booking connections</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Priority live pulse location filtering</li>
          </ul>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Need to Extend or Upgrade?</h4>
            <p className="text-xs text-slate-400">Contact platform administration via WhatsApp to renew your pass instantly.</p>
          </div>
          <button 
            onClick={handleContactSupportWhatsApp}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <MessageCircle size={16} /> Contact Support for Renewal
          </button>
        </div>
      </div>
    </div>
  );
}