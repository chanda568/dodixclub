import React from 'react';
import { Bell, Clock, ChevronDown, ChevronUp, ArrowRight, CreditCard } from 'lucide-react';

export default function NewsAnnouncementsTab({
  visibleAnnouncements = [],
  expandedAnnouncements = {},
  toggleAnnouncementExpand = () => {},
  isFemaleUser = false,
  setActiveTab = () => {}
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-2 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Bell className="text-pink-500" size={22} /> Platform News & Announcements
        </h2>
        <p className="text-xs text-slate-400">Important notices, security directives, and system feature releases from platform administration.</p>
      </div>

      <div className="space-y-4">
        {visibleAnnouncements.length === 0 ? (
          <div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 text-xs space-y-2">
            <Bell size={28} className="mx-auto text-slate-600" />
            <p className="font-bold text-slate-400">No announcements available right now.</p>
          </div>
        ) : (
          visibleAnnouncements.map(item => {
            const itemId = item._id || item.id;
            const itemDate = new Date(item.createdAt || item.date || Date.now());
            const isNew = (Date.now() - itemDate.getTime()) < (48 * 60 * 60 * 1000);

            let categoryBadge = "PLATFORM NOTICE";
            let badgeStyles = "bg-purple-500/10 text-purple-400 border-purple-500/30";

            const titleLower = (item.title || '').toLowerCase();
            const textLower = (item.text || item.content || '').toLowerCase();

            if (titleLower.includes('privacy') || titleLower.includes('watermark') || titleLower.includes('security')) {
              categoryBadge = "SECURITY UPDATE";
              badgeStyles = "bg-pink-500/10 text-pink-400 border-pink-500/30";
            } else if (titleLower.includes('maintenance') || titleLower.includes('system') || titleLower.includes('server')) {
              categoryBadge = "SYSTEM NOTICE";
              badgeStyles = "bg-amber-500/10 text-amber-400 border-amber-500/30";
            } else if (titleLower.includes('feature') || titleLower.includes('new') || titleLower.includes('tool')) {
              categoryBadge = "FEATURE RELEASE";
              badgeStyles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
            }

            const fullContent = item.text || item.content || '';
            const isLongText = fullContent.length > 180;
            const isExpanded = !!expandedAnnouncements[itemId];

            return (
              <div 
                key={itemId} 
                className="bg-[#0b101d] border border-slate-800/90 hover:border-pink-500/40 hover:bg-slate-900/60 transition-all duration-300 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 group relative overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${badgeStyles}`}>
                      {categoryBadge}
                    </span>

                    {isNew && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black rounded-full flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> NEW
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <Clock size={12} /> {item.date || itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-white group-hover:text-pink-300 transition-colors">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                    <p>
                      {isLongText && !isExpanded 
                        ? `${fullContent.substring(0, 180)}...` 
                        : fullContent}
                    </p>

                    {isLongText && (
                      <button 
                        onClick={() => toggleAnnouncementExpand(itemId)}
                        className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition pt-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>Show Less <ChevronUp size={14} /></>
                        ) : (
                          <>Read Full Update <ChevronDown size={14} /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {(textLower.includes('directory') || textLower.includes('subscription') || textLower.includes('profile')) && (
                  <div className="pt-2 flex items-center gap-3">
                    {textLower.includes('directory') && !isFemaleUser && (
                      <button 
                        onClick={() => setActiveTab('directory')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-pink-400 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        Open Elite Directory <ArrowRight size={12} />
                      </button>
                    )}
                    {textLower.includes('subscription') && !isFemaleUser && (
                      <button 
                        onClick={() => setActiveTab('subscription')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-400 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        View Subscription Pass <CreditCard size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}