// src/components/auth/AuthScreen.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { LOGO_URL, ZAMBIAN_LOCATIONS } from '../../data/constants';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AuthScreen({ setCurrentUser, isLoading, loadingText, triggerLoadingAction }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState(1); // 1: Registration details, 2: OTP verification step

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState('Female');
  const [location, setLocation] = useState('Lusaka');
  const [phoneInput, setPhoneInput] = useState('');
  const [plan, setPlan] = useState('7 Days');
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Step A: Request OTP during registration
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in username, email, and password.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (isRegistering && gender === 'Female' && (!phoneInput.trim() || phoneInput.trim().length < 9)) {
      setErrorMsg('Please provide a valid WhatsApp number (e.g., 970000000).');
      return;
    }

    triggerLoadingAction('Sending Verification OTP...', async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/send-email-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        const data = await response.json();

        if (data.success) {
          setStep(2); // Move to OTP verification UI step
        } else {
          setErrorMsg(data.error || 'Failed to send OTP.');
        }
      } catch (err) {
        console.error("OTP send error:", err);
        setErrorMsg('Network error connecting to server.');
      }
    });
  };

  // Step B: Verify OTP and Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpInput.trim() || otpInput.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPhone = `260${phoneInput.trim().replace(/^0+/, '')}`;

    triggerLoadingAction('Verifying & Creating Account...', async () => {
      try {
        // 1. Verify Email OTP first
        const verifyRes = await fetch(`${BACKEND_URL}/api/verify-email-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), otp: otpInput.trim() })
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
          setErrorMsg(verifyData.error || 'Invalid verification code.');
          return;
        }

        // 2. Proceed to full user registration
        const response = await fetch(`${BACKEND_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            email: email.trim(),
            password: password.trim(),
            gender,
            location,
            phone: cleanPhone,
            plan: gender === 'Male' ? plan : 'N/A',
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
  };

  // Standard Login (Non-register)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername === 'admin' && password.trim() === 'admin123') {
      triggerLoadingAction('Authenticating Admin...', () => {
        setCurrentUser({ username: 'admin', role: 'admin', activated: true });
      });
      return;
    }

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
  };

  const handleForgotPasswordWhatsApp = () => {
    const adminPhone = "260965039645"; // Admin Help Center WhatsApp number
    const msg = encodeURIComponent("Hello Dodix Admin, I forgot my account password and need assistance resetting it.");
    window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank');
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

        {/* STEP 2: OTP VERIFICATION UI */}
        {isRegistering && step === 2 ? (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4 text-xs">
            <div className="p-4 bg-purple-950/30 border border-purple-800/50 rounded-2xl text-center space-y-1">
              <Mail className="mx-auto text-pink-400" size={24} />
              <h3 className="font-bold text-white text-sm">Enter Verification Code</h3>
              <p className="text-slate-400 text-[11px]">We have sent a 6-digit code to <span className="text-pink-400 font-semibold">{email}</span></p>
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">6-Digit Email OTP</label>
              <input 
                type="text" 
                required
                maxLength="6"
                placeholder="123456" 
                value={otpInput} 
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} 
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg tracking-widest text-slate-200 focus:outline-none focus:border-pink-500 font-mono" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (loadingText || 'Verifying...') : 'Verify & Complete Registration'}
            </button>

            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-slate-400 hover:text-white transition text-xs mt-2 cursor-pointer"
            >
              Back to registration details
            </button>
          </form>
        ) : (
          /* STEP 1: REGISTRATION / LOGIN FORM */
          <form onSubmit={isRegistering ? handleRequestOtp : handleLoginSubmit} className="space-y-4 text-xs">
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

            {isRegistering && (
              <div>
                <label className="block font-bold text-slate-400 mb-1">Email Address (for OTP)</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. user@gmail.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500" 
                />
              </div>
            )}

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
                  className="absolute right-3 text-slate-400 hover:text-white transition focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <>
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

                {gender === 'Male' && (
                  <div className="space-y-1.5 p-3 bg-slate-800/60 border border-slate-700 rounded-2xl">
                    <label className="block font-bold text-pink-400">Choose Activation Plan</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPlan('7 Days')}
                        className={`py-2 rounded-xl font-bold transition border cursor-pointer ${plan === '7 Days' ? 'bg-pink-600 border-pink-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                      >
                        7 Days Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlan('30 Days')}
                        className={`py-2 rounded-xl font-bold transition border cursor-pointer ${plan === '30 Days' ? 'bg-pink-600 border-pink-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                      >
                        30 Days Plan
                      </button>
                    </div>
                  </div>
                )}

                {gender === 'Female' && (
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">WhatsApp Number (for verification)</label>
                    <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden focus-within:border-pink-500 transition">
                      <span className="px-3 py-2.5 bg-slate-900 text-pink-400 font-bold border-r border-slate-700 select-none">
                        +260
                      </span>
                      <input 
                        type="tel" 
                        required
                        placeholder="970000000" 
                        value={phoneInput} 
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))} 
                        className="w-full px-3 py-2.5 bg-transparent text-slate-200 focus:outline-none" 
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition mt-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (loadingText || 'Processing...') : (isRegistering ? 'Continue & Send OTP' : 'Sign In')}
            </button>
          </form>
        )}

        {!isRegistering && (
          <div className="text-center pt-1">
            <button 
              type="button"
              onClick={handleForgotPasswordWhatsApp}
              className="text-[11px] text-pink-400 hover:text-pink-300 underline transition cursor-pointer"
            >
              Forgot your password? Click here to contact Admin on WhatsApp
            </button>
          </div>
        )}

        <div className="text-center pt-2 border-t border-slate-800">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setStep(1); setErrorMsg(''); }} 
            className="text-xs text-slate-400 hover:text-pink-400 transition font-medium cursor-pointer"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
          </button>
        </div>
      </div>
    </div>
  );
}