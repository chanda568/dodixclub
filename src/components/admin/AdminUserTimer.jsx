// src/components/admin/AdminUserTimer.jsx
import React, { useState, useEffect } from 'react';

export default function AdminUserTimer({ expiryDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(expiryDate) - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  return (
    <div className="flex items-center gap-1 font-mono text-[11px]">
      <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 rounded">{timeLeft.days}d</span>
      <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 rounded">{timeLeft.hours}h</span>
      <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 rounded">{timeLeft.minutes}m</span>
      <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 rounded">{timeLeft.seconds}s</span>
    </div>
  );
}