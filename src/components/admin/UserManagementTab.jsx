// src/components/admin/UserManagementTab.jsx
import React, { useState } from 'react';
import { Users, Search, RefreshCw, MapPin, Clock, MessageCircle, Edit3, ShieldCheck } from 'lucide-react';

function AdminUserTimer({ createdAt, plan }) {
  const [timeLeft, setTimeLeft] = useState({ expired: false, text: '' });

  React.useEffect(() => {
    const calculateTime = () => {
      const registrationDate = new Date(createdAt || Date.now());
      const daysAllowed = plan === '30 Days' ? 30 : 7;
      const expiryDate = new Date(registrationDate.getTime() + daysAllowed * 24 * 60 * 60 * 1000);
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
  }, [createdAt, plan]);

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '18 Sept 2026';

  return (
    <div className="flex flex-col text-[11px] space-y-0.5">
      <span className="text-slate-400 font-medium">Joined: {formattedDate}</span>
      <span className={`font-bold flex items-center gap-1 ${timeLeft.expired ? 'text-rose-400' : 'text-emerald-400'}`}>
        <Clock size={11} /> {timeLeft.text}
      </span>
    </div>
  );
}

export default function UserManagementTab({
  usersDb,
  searchQuery,
  setSearchQuery,
  userGenderFilter,
  setUserGenderFilter,
  loadBackendData,
  handleWhatsAppContact,
  handleOpenUserInspect,
  handleToggleUserActivation,
  formatLastSeenDetail
}) {
  const filteredUsers = usersDb.filter(u => {
    const g = u.gender?.toLowerCase() || '';
    const matchesGender = 
      userGenderFilter === 'male' ? g === 'male' :
      userGenderFilter === 'female' ? g === 'female' : true;

    const matchesSearch = u.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGender && matchesSearch;
  });

  return (
    <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white">Registered Users & Client Database</h2>
          <p className="text-xs text-slate-400">Inspect accounts, view real-time online status / exact last seen, registration & expiry countdown</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setUserGenderFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${userGenderFilter === 'all' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              All ({usersDb.length})
            </button>
            <button
              onClick={() => setUserGenderFilter('male')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${userGenderFilter === 'male' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Male Clients ({usersDb.filter(u => u.gender?.toLowerCase() === 'male').length})
            </button>
            <button
              onClick={() => setUserGenderFilter('female')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${userGenderFilter === 'female' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Female Companions ({usersDb.filter(u => u.gender?.toLowerCase() === 'female').length})
            </button>
            <button onClick={loadBackendData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer ml-1" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-3.5 rounded-l-xl">Username</th>
              <th className="p-3.5">Gender</th>
              <th className="p-3.5">Plan</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5">Registration & Expiry</th>
              <th className="p-3.5">Online / Last Seen</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 rounded-r-xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-slate-500">No users found matching your search or filter.</td>
              </tr>
            ) : (
              filteredUsers.map((u, i) => {
                const isActivated = u.activated !== false;
                const isFemale = u.gender?.toLowerCase() === 'female';
                const lastSeenInfo = formatLastSeenDetail(u.lastSeen);

                return (
                  <tr key={u._id || i} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-bold text-white">
                      @{u.username}
                    </td>
                    <td className="p-3.5">
                      <span className={`font-semibold capitalize text-xs px-2.5 py-0.5 rounded-full ${u.gender?.toLowerCase() === 'female' ? 'bg-pink-950 text-pink-400 border border-pink-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'}`}>
                        {u.gender || 'Client'}
                      </span>
                    </td>
                    <td className="p-3.5 text-purple-400 font-bold">
                      {u.plan || '7 Days'}
                    </td>
                    <td className="p-3.5 text-pink-400 font-semibold flex items-center gap-1 mt-1">
                      <MapPin size={12} className="shrink-0" /> <span>{u.location || 'Lusaka'}</span>
                    </td>
                    <td className="p-3.5">
                      <AdminUserTimer createdAt={u.createdAt} plan={u.plan} />
                    </td>
                    <td className="p-3.5">
                      {lastSeenInfo.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-extrabold shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> {lastSeenInfo.text}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${isActivated ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
                        {isActivated ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {isFemale && (
                        <button 
                          onClick={() => handleWhatsAppContact(u.phone, u.username)}
                          className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-[11px] font-bold border border-emerald-800/50 transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                          title="Verify on WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenUserInspect(u.username)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        onClick={() => handleToggleUserActivation(u.username)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${isActivated ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 hover:bg-amber-900/60' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60'}`}
                      >
                        {isActivated ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}