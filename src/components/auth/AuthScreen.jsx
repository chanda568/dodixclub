// src/components/auth/AuthScreen.jsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LOGO_URL, ZAMBIAN_LOCATIONS } from '../../data/constants';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AuthScreen({ setCurrentUser, isLoading, loadingText, triggerLoadingAction }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState('Female');
  const [location, setLocation] = useState('Lusaka');
  const [phone, setPhone] = useState(''); // <-- Added phone state
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    if (isRegistering && !phone.trim()) {
      setErrorMsg('Please provide your WhatsApp number for verification.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (isRegistering) {
      triggerLoadingAction('Creating account...', async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: cleanUsername,
              password: password.trim(),
              gender,
              location,
              phone: phone.trim(), // <-- Send phone to backend
              role: gender === 'Female' ? 'companion' : 'client'
            })
          });

          const data = await response.json();
          if (data.success) {
            setCurrentUser(data.user);
          } else {
            setErrorMsg(data.error || 'Registration failed.');
          }
        } catch (err) {
          console.error("Registration error:", err);
          setErrorMsg('Failed to connect to server. Please try again.');
        }
      });
    } else {
      // Admin backdoor check
      if (cleanUsername === 'admin' && password.trim() === 'admin123') {
        triggerLoadingAction('Authenticating Admin...', () => {
          setCurrentUser({ username: 'admin', role: 'admin', activated: true });
        });
        return;
      }

      // Regular user login via backend API
      triggerLoadingAction('Authenticating...', async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: cleanUsername,
              password: password.trim()
            })
          });

          const data = await response.json();
          if (data.success) {
            setCurrentUser(data.user);
          } else {
            setErrorMsg(data.error || 'Invalid username or password.');
          }
        } catch (err) {
          console.error("Login error:", err);
          setErrorMsg('Failed to connect to server. Please try again.');
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <img src={LOGO_URL} alt="Logo" className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-pink-500 shadow-lg shadow-pink-500/20" />
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">DODIXCLUB</h1>
          <p className="text-xs text-slate-400">Zambia's Premier Elite Companion Directory</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-2xl text-xs text-rose-300 text-center font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-400 mb-1">Telegram Username</label>
            <input 
              type="text" 
              required
              placeholder="e.g. @username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500" 
            />
          </div>

          <div>
            <label className="block font-bold text-slate-400 mb-1">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="Enter password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-white transition focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <>
              <div>
                <label className="block font-bold text-slate-400 mb-1">WhatsApp Number (for verification)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 260970000000" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-pink-400 font-semibold focus:outline-none focus:border-pink-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Location Area</label>
                  <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-pink-400 font-semibold focus:outline-none focus:border-pink-500"
                  >
                    {ZAMBIAN_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (loadingText || 'Processing...') : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }} 
            className="text-xs text-slate-400 hover:text-pink-400 transition font-medium cursor-pointer"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
          </button>
        </div>
      </div>
    </div>
  );
}