import React, { useState } from 'react';
import LogoLoader from '@/components/common/LogoLoader';

export default function CompanionSubmitForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Replace with your actual API endpoint or Supabase insertion call
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* your form data */ }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      // Handle successful submission
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[400px] bg-slate-900 p-6 rounded-2xl border border-slate-800">
      {/* Loading Overlay */}
      {isLoading && <LogoLoader text="Submitting entry..." />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-white">New Submission</h2>
        
        {/* Form fields go here */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Details</label>
          <input 
            type="text" 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500" 
            placeholder="Enter details..."
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-pink-600 hover:bg-pink-500 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          Submit
        </button>
      </form>
    </div>
  );
}