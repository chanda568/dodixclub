// src/components/client/DeleteAccountPage.jsx
import React, { useState } from 'react';
import { ShieldAlert, Trash2, ArrowLeft, Loader2, Key, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function DeleteAccountPage({ 
  currentUser, 
  onBack, 
  onConfirmDelete, 
  isDeletingAccount 
}) {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (confirmText !== 'DELETE') {
      setError('Please type DELETE in capital letters to confirm.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    onConfirmDelete(password, setError);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-4">
      {/* Header Back Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          disabled={isDeletingAccount}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft size={16} /> Back to Account Settings
        </button>

        <span className="text-xs font-bold text-red-400 bg-red-950/40 border border-red-900/40 px-3 py-1 rounded-full uppercase tracking-wider">
          Step {step} of 2
        </span>
      </div>

      <div className="bg-[#0b101d] border border-red-900/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 blur-3xl pointer-events-none rounded-full" />

        {/* Title Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="p-3.5 bg-red-950/80 border border-red-800/50 text-red-400 rounded-2xl shrink-0 shadow-lg">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Account Deletion Center</h2>
            <p className="text-xs text-slate-400 mt-0.5">Permanently close and remove account data for <span className="text-pink-400 font-bold">{currentUser?.username}</span></p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {/* STEP 1: WARNING & CONFIRMATION */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl space-y-3">
              <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} /> Danger Zone: Action is Final
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                By deleting your account, you will permanently lose access to all associated DodixClub records. This includes:
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pl-2">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-red-400" /> All active subscription passes & access tiers</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-red-400" /> Saved favorite companion profile bookmarks</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-red-400" /> Uploaded advertisement listing media and history</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition cursor-pointer"
              >
                Keep My Account (Cancel)
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed to Security Verification <ArrowLeft size={16} className="rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SECURITY VERIFICATION FORM */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Key size={14} className="text-pink-500" /> Confirm Current Password *
                </label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Type <span className="text-red-400 font-mono font-black">DELETE</span> to Confirm *
                </label>
                <input
                  type="text"
                  placeholder="Type DELETE in capital letters"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 transition font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Back to Warning
              </button>
              <button
                type="submit"
                disabled={isDeletingAccount || !password || confirmText !== 'DELETE'}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {isDeletingAccount ? 'Erasing Account...' : 'Permanently Delete Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}