// src/components/admin/AdminAdsManager.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Trash2, Calendar, MessageCircle, Plus, X, Upload, Save, Loader2, Edit3 } from 'lucide-react';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://dodixclub-backend.onrender.com').replace(/\/+$/, '');

export default function AdminAdsManager() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [adData, setAdData] = useState({
    name: '',
    category: 'VIP',
    location: 'Lusaka',
    specificLocation: '',
    phone: '',
    price: '',
    photo: '',
    extraServices: '',
    username: 'admin'
  });

  const fetchAdminAds = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies`);
      const data = await response.json();
      if (data.success && Array.isArray(data.ladies)) {
        setAds(data.ladies);
      }
    } catch (error) {
      console.error('Failed to sync admin ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAds();
    const interval = setInterval(fetchAdminAds, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle Photo Upload & Base64 Conversion
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be under 5MB.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdData(prev => ({
        ...prev,
        photo: reader.result // Base64 string assigned to photo property
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setAdData({
      name: '',
      category: 'VIP',
      location: 'Lusaka',
      specificLocation: '',
      phone: '',
      price: '',
      photo: '',
      extraServices: '',
      username: 'admin'
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ad) => {
    setEditingId(ad._id || ad.id);
    setAdData({
      name: ad.name || '',
      category: ad.category || 'VIP',
      location: ad.location || 'Lusaka',
      specificLocation: ad.specificLocation || '',
      phone: ad.phone || '',
      price: ad.price || '',
      photo: ad.photo || '',
      extraServices: ad.extraServices || ad.bio || '',
      username: ad.username || 'admin'
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!adData.photo) {
      setErrorMessage('An advertisement photo is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const endpoint = editingId 
        ? `${BACKEND_URL}/api/ladies/${editingId}` 
        : `${BACKEND_URL}/api/ladies`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...adData,
          approved: true
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save advertisement.');
      }

      setSuccessMessage(editingId ? 'Advertisement updated successfully!' : 'Advertisement created successfully!');
      fetchAdminAds();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently remove this live advertisement?")) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladies/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchAdminAds();
      }
    } catch (error) {
      console.error('Failed to delete ad:', error);
    }
  };

  const handleWhatsAppContact = (phone, name) => {
    if (!phone || phone === 'Not Provided') {
      const manualPhone = prompt(`Enter WhatsApp number for @${name || 'companion'} (with country code):`);
      if (!manualPhone) return;
      phone = manualPhone.trim();
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent(`Hello @${name || 'Companion'}, regarding your live Dodix advertisement:`);
    window.open(`https://wa.me/${cleanPhone}?text=${defaultMsg}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) return <div className="text-slate-400 p-4 text-xs">Syncing direct-posted records from MongoDB...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Live Advertisements Management</h2>
          <p className="text-xs text-slate-400">Manage companion listings, rates, and media below.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
        >
          <Plus size={16} /> Create New Ad
        </button>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">
                {editingId ? 'Edit Advertisement' : 'Create New Advertisement'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmitAd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Companion Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Jessica"
                    value={adData.name}
                    onChange={(e) => setAdData({ ...adData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category / Tier</label>
                  <select 
                    value={adData.category}
                    onChange={(e) => setAdData({ ...adData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Elite">Elite</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">City / Location</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lusaka"
                    value={adData.location}
                    onChange={(e) => setAdData({ ...adData, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Specific Area (e.g. Chalala)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Woodlands"
                    value={adData.specificLocation}
                    onChange={(e) => setAdData({ ...adData, specificLocation: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">WhatsApp Phone</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. +260970000000"
                    value={adData.phone}
                    onChange={(e) => setAdData({ ...adData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Rate / Price (ZMW)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 500"
                    value={adData.price}
                    onChange={(e) => setAdData({ ...adData, price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Services & Bio</label>
                <textarea 
                  rows="3"
                  placeholder="Describe services, availability, preferences..."
                  value={adData.extraServices}
                  onChange={(e) => setAdData({ ...adData, extraServices: e.target.value })}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              {/* Photo Upload & Base64 preview */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Advertisement Photo (Max 5MB)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition">
                    <Upload size={14} /> Choose Image File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                  {adData.photo && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle size={14} /> Photo Attached
                    </span>
                  )}
                </div>

                {adData.photo && (
                  <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-800">
                    <img src={adData.photo} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSubmitting ? 'Saving...' : 'Save Advertisement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ads.length === 0 ? (
        <p className="text-slate-400 text-xs py-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          No advertisements found in the database.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div key={ad._id || ad.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between p-4 space-y-4">
              {ad.photo && (
                <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-950 relative">
                  <img src={ad.photo} alt={ad.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs font-black px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 shadow">
                  <CheckCircle size={12} /> {ad.category || 'LIVE DIRECT'}
                </span>
                <span className="text-xs font-bold text-emerald-400">ZMW {ad.price || '0'}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">{ad.name || ad.username}, {ad.age || '23'}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={12} className="text-pink-500" /> {ad.specificLocation || ad.location || 'Lusaka'}
                </p>
                <p className="text-xs text-slate-500">Owner: @{ad.username}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                  <Calendar size={11} className="text-slate-400" /> Posted: {formatDate(ad.createdAt)}
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button 
                  onClick={() => handleOpenEditModal(ad)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center justify-center"
                  title="Edit Ad"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => handleWhatsAppContact(ad.phone, ad.username)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 shadow"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button 
                  onClick={() => handleDelete(ad._id || ad.id)}
                  className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-900/50 px-3 py-2 rounded-xl transition flex items-center justify-center"
                  title="Remove Ad"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}