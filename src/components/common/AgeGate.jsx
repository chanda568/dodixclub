// src/components/common/AgeGate.jsx
import React from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { LOGO_URL } from '../../data/constants';

export default function AgeGate({ onVerify }) {
  const handleUnderAge = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
        
        {/* Logo */}
        <div className="flex justify-center">
          <img src={LOGO_URL} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-pink-500 shadow-lg" />
        </div>

        {/* Heading & Information */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-800/40 text-pink-400 text-[10px] font-black uppercase tracking-wider">
            <ShieldAlert size={12} /> 18+ Restriction
          </div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">DODIXCLUB</h2>
          <p className="text-sm font-semibold text-white">Age Verification Required</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            You must be 18 years or older to enter Dodix Club. Please confirm your age.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button 
            onClick={handleUnderAge}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <XCircle size={16} className="text-red-400" /> I am Under 18
          </button>
          
          <button 
            onClick={() => onVerify(true)}
            className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition"
          >
            <CheckCircle size={16} /> Yes, I am 18+
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          By entering, you certify that you are legally authorized to view adult content in your jurisdiction.
        </p>
      </div>
    </div>
  );
}