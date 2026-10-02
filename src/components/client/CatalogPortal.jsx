import React, { useState } from 'react';
import { 
  RefreshCw, 
  Search, 
  MapPin, 
  ChevronRight, 
  SlidersHorizontal, 
  LogOut, 
  LayoutDashboard, 
  Package 
} from 'lucide-react';

export default function CatalogPortal({ currentUser, setCurrentUser, ladies, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise(r => setTimeout(r, 800));
    }
    setIsRefreshing(false);
  };

  const filteredItems = (Array.isArray(ladies) ? ladies : []).filter(item => {
    const name = item.name || item.username || '';
    const location = item.location || item.city || 'Lusaka';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || location.toLowerCase() === selectedLocation.toLowerCase();
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation Header */}
      <nav className="h-16 bg-[#0b101d] border-b border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-pink-600 p-2 rounded-xl text-white font-bold tracking-wider text-sm shadow-inner">
            CP
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200">Dodix Catalog Portal</h1>
            <p className="text-xs text-slate-400 hidden sm:block">Welcome, @{currentUser?.username}</p>
          </div>
        </div>

        {/* Header Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
            />
          </div>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh Catalog Listings"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-pink-500" : ""} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button 
            onClick={setCurrentUser}
            className="p-2.5 bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-900/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Log Out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-[#0b101d] border-r border-slate-800 hidden lg:flex flex-col p-4 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Menu</p>
            <a href="#dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-pink-600/10 text-pink-400 text-xs font-semibold border border-pink-500/20">
              <LayoutDashboard size={16} />
              <span>Directory</span>
            </a>
            <a href="#catalog" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-medium transition">
              <Package size={16} />
              <span>Listings</span>
            </a>
          </div>

          <div className="mt-auto p-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            <p className="text-xs font-bold text-slate-300">System Status</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-400">Connected to Server</span>
            </div>
          </div>
        </aside>

        {/* Main Content Sections */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0b101d] border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-pink-500" />
              <span className="text-xs font-bold text-slate-300">Location Filter:</span>
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              >
                <option value="All">All Locations</option>
                <option value="Lusaka">Lusaka</option>
                <option value="Ndola">Ndola</option>
                <option value="Kitwe">Kitwe</option>
              </select>
            </div>
            
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-slate-200">{filteredItems.length}</span> active listings
            </div>
          </div>

          {/* Grid Cards Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item, idx) => (
              <div 
                key={item.id || idx} 
                className="bg-[#0b101d] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      {item.category || 'Standard'}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                      {item.status || 'Active'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-pink-400 transition">
                      {item.name || item.username || 'Unnamed Listing'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin size={13} className="text-slate-500" />
                      <span>{item.location || item.city || 'Lusaka'}, Zambia</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">ID: #{item.id || idx + 100}</span>
                  <button className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition cursor-pointer">
                    <span>View Profile</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No catalog listings found matching your search or location filter.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}