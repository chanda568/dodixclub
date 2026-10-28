// src/components/client/AccountSettingsTab.jsx
import React, { useState } from 'react';
import { User, Lock, Key, Save, Trash2, MapPin, Crown, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountSettingsTab({
  currentUser,
  isFemaleUser,
  accountPhone,
  setAccountPhone,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  secQuestion,
  setSecQuestion,
  settingsStatus,
  isUpdatingSettings,
  handleUpdateAccountDetails,
  handleDeleteAccount,
  isDeletingAccount
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  return (
    <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn">
      {/* ACCOUNT DELETION STEP WIZARD MODAL */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[#0b101d] border border-red-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative"
            >
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                disabled={isDeletingAccount}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-3 bg-red-950/80 border border-red-800/50 text-red-400 rounded-2xl">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Delete Account Wizard</h3>
                  <p className="text-xs text-slate-400">Step {deleteStep} of 2 — Secure Deletion</p>
                </div>
              </div>

              {deleteStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">⚠️ Irreversible Action</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      You are about to permanently delete your account (<span className="text-white font-semibold">{currentUser.username}</span>). All your bookmarks, history, and active permissions will be unrecoverable.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setDeleteModalOpen(false)} 
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDeleteStep(2)} 
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer"
                    >
                      Continue to Password
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Enter Your Current Password *</label>
                    <input 
                      type="password" 
                      placeholder="Required for security verification" 
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500 transition"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm *</label>
                    <input 
                      type="text" 
                      placeholder="Type DELETE in capital letters" 
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500 transition font-mono uppercase"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      disabled={isDeletingAccount}
                      onClick={() => setDeleteStep(1)} 
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      disabled={isDeletingAccount || !deletePassword || deleteConfirmText !== 'DELETE'}
                      onClick={() => handleDeleteAccount(deletePassword, setDeleteModalOpen)}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isDeletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={14} />}
                      {isDeletingAccount ? 'Deleting...' : 'Confirm Deletion'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Account Details & Settings</h2>
          <p className="text-xs text-slate-400">Manage your profile credentials, account standing, and security parameters.</p>
        </div>
        <div className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full text-[10px] font-black uppercase tracking-wider">
          Verified Member
        </div>
      </div>

      {settingsStatus.message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-2 ${
          settingsStatus.type === 'success' ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300' : 'bg-red-950/50 border-red-800/50 text-red-300'
        }`}>
          {settingsStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {settingsStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Account Standing</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${currentUser?.activated !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-sm font-extrabold text-white">
              {currentUser?.activated !== false ? 'Active & Healthy' : 'Pending Activation'}
            </span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Access Plan / Tier</span>
          <div className="flex items-center gap-2 text-pink-400 font-extrabold text-sm">
            <Crown size={16} />
            {isFemaleUser ? 'Verified Companion' : (currentUser?.plan || '7 Days Pass')}
          </div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Registered Base</span>
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <MapPin size={16} className="text-pink-500" />
            {currentUser?.location || 'Lusaka'}
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateAccountDetails} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User size={18} className="text-pink-500" />
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Profile Information</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Username (Unique ID)</label>
            <div className="relative">
              <input 
                type="text" 
                value={currentUser?.username || ''} 
                disabled 
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-400 cursor-not-allowed font-mono"
              />
              <Lock size={14} className="absolute right-3.5 top-3 text-slate-600" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Account Type & Gender</label>
            <input 
              type="text" 
              value={isFemaleUser ? 'Female Companion Account' : 'Male Client Access'} 
              disabled 
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Locked Base City</label>
            <input 
              type="text" 
              value={currentUser?.location || 'Lusaka'} 
              disabled 
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-300">WhatsApp / Contact Phone</label>
            <input 
              type="text" 
              value={accountPhone} 
              onChange={(e) => setAccountPhone(e.target.value)} 
              placeholder="e.g. +260970000000" 
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-pink-500 transition"
            />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key size={18} className="text-pink-500" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Security Credentials</h3>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-300">New Password</label>
              <input 
                type="password" 
                placeholder="Leave blank to keep current password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-300">Confirm New Password</label>
              <input 
                type="password" 
                placeholder="Confirm new password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] uppercase font-bold text-slate-300">Security Recovery Question</label>
              <select 
                value={secQuestion} 
                onChange={(e) => setSecQuestion(e.target.value)} 
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-pink-500 transition"
              >
                <option value="What was your first pet’s name?">What was your first pet’s name?</option>
                <option value="What is your mother’s maiden name?">What is your mother’s maiden name?</option>
                <option value="What city were you born in?">What city were you born in?</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isUpdatingSettings}
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isUpdatingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isUpdatingSettings ? 'Saving Updates...' : 'Save Account Updates'}
          </button>
        </div>
      </form>

      <div className="bg-red-950/20 border border-red-900/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl mt-6">
        <div className="flex items-center gap-3 border-b border-red-900/40 pb-4">
          <div className="p-2.5 bg-red-900/40 text-red-400 rounded-xl">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Danger Zone</h3>
            <p className="text-xs text-slate-400">Permanently remove your account and erase all associated data.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isFemaleUser 
            ? "Once you delete your account, there is no going back. All your active companion advertisements, uploaded photographs, and platform records will be permanently erased from our servers and local storage."
            : "Once you delete your account, there is no going back. All your active passes, favorites bookmarks, and platform records will be permanently erased from our servers and local storage."
          }
        </p>

        <button 
          onClick={() => {
            setDeleteStep(1);
            setDeletePassword('');
            setDeleteConfirmText('');
            setDeleteModalOpen(true);
          }}
          className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trash2 size={16} /> Permanently Delete My Account & Data
        </button>
      </div>
    </div>
  );
}