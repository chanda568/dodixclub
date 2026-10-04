// src/components/admin/AnnouncementsTab.jsx
import React from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

export default function AnnouncementsTab({
  announcements,
  newTitle,
  setNewTitle,
  newContent,
  setNewContent,
  newVisibility,
  setNewVisibility,
  handleCreateAnnouncement,
  handleDeleteAnnouncement
}) {
  return (
    <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white">Platform Announcements & Broadcasts</h2>
          <p className="text-xs text-slate-400">Post system notifications and updates visible to users</p>
        </div>
      </div>

      <form onSubmit={handleCreateAnnouncement} className="space-y-4 p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <h3 className="text-xs font-extrabold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
          <Plus size={15} /> Create New Broadcast Announcement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Announcement Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. System Maintenance Notice"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Audience</label>
            <select
              value={newVisibility}
              onChange={(e) => setNewVisibility(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Members</option>
              <option value="female">Female Companions Only</option>
              <option value="male">Male Clients Only</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Announcement Message Content</label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows="3"
            placeholder="Enter detailed broadcast message..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500"
          ></textarea>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <Bell size={14} /> Publish Broadcast to MongoDB
          </button>
        </div>
      </form>

      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Active Broadcasts ({announcements.length})</h3>
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No announcements created yet.</div>
        ) : (
          announcements.map((item) => (
            <div key={item._id || item.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <span className="text-[10px] font-black uppercase bg-purple-950 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded-full">
                    {item.visibility}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{item.content}</p>
                <span className="text-[10px] text-slate-500 font-medium block">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </span>
              </div>
              <button
                onClick={() => handleDeleteAnnouncement(item._id || item.id)}
                className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-xl transition cursor-pointer self-end sm:self-center"
                title="Delete Announcement"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}