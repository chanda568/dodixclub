// src/components/admin/AdminUserTimer.jsx
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function AdminUserTimer({ createdAt, activatedAt, plan, activated }) {
  const [timeLeft, setTimeLeft] = useState({ expired: false, text: '' });

  useEffect(() => {
    // CRITICAL: If the account is pending/not activated, do NOT start any countdown.
    if (!activated || activated === 'pending' || activated === false) {
      setTimeLeft({ expired: false, text: 'Not Activated' });
      return;
    }

    const calculateTime = () => {
      // Countdown starts strictly from the activation date (activatedAt)
      // If activatedAt is somehow missing for an active user, fall back to now or createdAt, but never start early if pending.
      const startDate = new Date(activatedAt || createdAt || Date.now());
      const daysAllowed = plan === '30 Days' ? 30 : 7;
      const expiryDate = new Date(startDate.getTime() + daysAllowed * 24 * 60 * 60 * 1000);
      const now = new Date();
      const difference = expiryDate - now;

      if (difference <= 0) {
        setTimeLeft({ expired: true, text: 'Plan Expired' });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) {
        setTimeLeft({ expired: false, text: `${days}d ${hours}h left` });
      } else {
        setTimeLeft({ expired: false, text: `${hours}h ${minutes}m left` });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [createdAt, activatedAt, plan, activated]);

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';

  const isPending = !activated || activated === 'pending' || activated === false;

  return (
    <div className="flex flex-col text-[11px] space-y-0.5">
      <span className="text-slate-400 font-medium">Joined: {formattedDate}</span>
      <span className={`font-bold flex items-center gap-1 ${timeLeft.expired ? 'text-rose-400' : (isPending ? 'text-slate-500' : 'text-emerald-400')}`}>
        <Clock size={11} /> {timeLeft.text}
      </span>
    </div>
  );
}