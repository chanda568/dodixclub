// src/components/admin/ReportsTab.jsx
import React from 'react';
import { Flag, ShieldAlert, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ReportsTab({
  reportsDb = [],
  loadBackendData,
  handleResolveReport,
  handleDeleteReport
}) {
  return (
    <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white">System Reports & Flagged Accounts</h2>
          <p className="text-xs text-slate-400">Review user-submitted reports, platform security alerts, and dispute logs</p>
        </div>
        <button
          onClick={loadBackendData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
        >
          <Download size={13} /> Export Logs
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/40">
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Reports</span>
            <span className="text-lg font-black text-white">{reportsDb.filter(r => !r.resolved).length}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/40">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Cases</span>
            <span className="text-lg font-black text-white">{reportsDb.filter(r => r.resolved).length}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-purple-950/60 text-purple-400 rounded-xl border border-purple-800/40">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Log Items</span>
            <span className="text-lg font-black text-white">{reportsDb.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Flagged Incidents & User Reports</h3>
        {reportsDb.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/20 border border-slate-800/60 rounded-2xl">
            No active reports or security flags found in the database.
          </div>
        ) : (
          <div className="space-y-3">
            {reportsDb.map((report, idx) => (
              <div key={report._id || idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Reported by: <span className="text-pink-400">@{report.reporter || 'Anonymous'}</span></span>
                    <span className="text-xs text-slate-400">➔ Target: <span className="text-purple-400 font-bold">@{report.targetUser || 'System'}</span></span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${report.resolved ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 'bg-amber-950 text-amber-400 border border-amber-900/40'}`}>
                      {report.resolved ? 'Resolved' : 'Pending Review'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mt-1">
                    {report.reason || report.content || 'No description provided.'}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString('en-GB') : 'Recently logged'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {!report.resolved && (
                    <button
                      onClick={() => handleResolveReport(report._id || report.id)}
                      className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} /> Resolve
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReport(report._id || report.id)}
                    className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-xl transition cursor-pointer"
                    title="Delete Log"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}