// src/components/common/LogoLoader.jsx
import React from 'react';
import { LOGO_URL } from '../../data/constants';

export default function LogoLoader({ text = "Loading..." }) {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl animate-fade-in">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"></div>
          <img 
            src={LOGO_URL} 
            alt="Logo Loading" 
            className="w-10 h-10 rounded-full object-cover border border-pink-500 shadow-md animate-pulse" 
          />
        </div>
        <p className="text-xs font-semibold text-slate-300 tracking-wider">{text}</p>
      </div>
    </div>
  );
}