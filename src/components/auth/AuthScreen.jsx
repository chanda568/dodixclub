// src/components/auth/AuthScreen.jsx
import React, { useState } from 'react';
import { User, Lock, Mail, Phone, Calendar, Heart, ArrowRight, ShieldAlert } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AuthScreen({ 
  setCurrentUser, 
  isLoading, 
  loadingText, 
  triggerLoadingAction 
}) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    // REGISTRATION MODE
    if (isRegistering) {
      if (!age || parseInt(age) < 18) {
        setErrorMsg('You must be at least 18 years old to register.');
        return;
      }

      triggerLoadingAction('Creating account...', async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: cleanUsername,
              password: password.trim(),
              email: email.trim(),
              phone: phone.trim(),
              age: parseInt(age),
              gender: gender,
              activated: gender === 'female' ? false : true, // Females pending verification
              role: 'user'
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
      return;
    }

    // LOGIN MODE
    // Admin backdoor check
    if (cleanUsername === 'admin' && password.trim() === 'admin123') {
      triggerLoadingAction('Authenticating Admin...', () => {
        setCurrentUser({ username: 'admin', role: 'admin', activated: true });
      });
      return;
    }

    // Regular user login via backend API
    triggerLoadingAction('Logging in...', async () => {
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
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-pink-500 selection:text-white">
      <div className="max-w-md w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-pink-600/30 text-white font-black text-2xl tracking-wider">
            DX
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            {isRegistering ? 'Join DodixClub' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegistering 
              ? 'Create your account to access the elite directory.' 
              : 'Sign in to access your secure portal.'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-shake">
            <ShieldAlert size={16} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4 relative">
          
          {/* Username */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <User size={16} />
              </span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Registration Extra Fields */}
          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Age</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <Calendar size={16} />
                    </span>
                    <input 
                      type="number"
                      min="18"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="18+"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Gender</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <Heart size={16} />
                    </span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition appearance-none cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Email (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Phone / WhatsApp</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Phone size={16} />
                  </span>
                  <input 
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+260..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Lock size={16} />
              </span>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>{loadingText || 'Processing...'}</span>
            ) : (
              <>
                <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center pt-2 border-t border-slate-800/80">
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