import React from 'react';
import { Search, AlertCircle, MapPin, Heart, MessageSquare, MessageCircle } from 'lucide-react';

export default function CompanionDirectoryCatalog({
  userLockedLocation,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  filteredLadies,
  favoriteIds,
  toggleFavorite,
  setActivePhotoIdx,
  setSelectedProfile,
  resolveTargetUsername,
  onStartChat,
  handleOpenWhatsApp
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white">Verified Companion Directory</h2>
          <p className="text-xs text-slate-400">Showing elite verified listings in <span className="text-pink-400 font-semibold">{userLockedLocation}</span></p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search name or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'VIP', 'Elite', 'Standard'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedCategory === cat ? 'bg-pink-600 text-white shadow-lg' : 'bg-[#0b101d] text-slate-400 border border-slate-800 hover:border-slate-700'}`}
          >
            {cat} Companions
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLadies.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-[#0b101d] border border-slate-800/80 rounded-3xl space-y-3">
            <AlertCircle size={32} className="mx-auto text-slate-500" />
            <p className="text-sm font-bold text-slate-300">No active companions found in {userLockedLocation}.</p>
          </div>
        ) : (
          filteredLadies.map((lady) => {
            const ladyId = lady._id || lady.id;
            const isFav = favoriteIds.includes(ladyId);

            return (
              <div 
                key={ladyId}
                onClick={() => {
                  setActivePhotoIdx(0);
                  setSelectedProfile(lady);
                }}
                className="bg-[#0b101d] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-pink-500/50 transition cursor-pointer group flex flex-col justify-between relative"
              >
                <div className="relative h-56 bg-slate-950 overflow-hidden">
                  <img 
                    src={lady.photo || lady.photoUrl || (lady.photos && lady.photos[0])} 
                    alt={lady.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-pink-400 uppercase tracking-wider border border-white/10">
                    {lady.category || 'VIP'}
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(e, ladyId)}
                    className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full border border-white/10 transition cursor-pointer z-10"
                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart size={16} className={isFav ? 'fill-pink-500 text-pink-500' : 'text-white'} />
                  </button>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-white">{lady.name} {lady.age ? `, ${lady.age}` : ''}</h3>
                      <span className="text-sm font-black text-emerald-400">ZMW {lady.price || lady.rate}</span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={13} className="text-pink-500" /> {lady.neighborhood ? `${lady.neighborhood}, ` : ''}{lady.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const resolvedUser = resolveTargetUsername(lady);
                        onStartChat(resolvedUser);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
                    >
                      <MessageSquare size={14} /> Secure Chat
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWhatsApp(lady);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}