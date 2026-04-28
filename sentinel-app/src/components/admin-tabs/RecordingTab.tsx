import React from 'react';
import { Video, Download, Clock } from 'lucide-react';
import { TabProps } from './types';

export const RecordingTab: React.FC<TabProps> = ({ studentList, sessionHistory = [] }) => {
  const handleExportPastSession = (sessionId: string, date: string) => {
    const csv = localStorage.getItem(`sentinel_session_export_${sessionId}`);
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safeDate = date.replace(/[/:,\s]/g, '-');
    a.download = `session-${safeDate}.csv`;
    a.click();
  };

  const handleExportCurrentCSV = () => {
    const rows = [
      ['Name', 'Engagement', 'Status', 'Emotion', 'Action', 'Alerts'],
      ...studentList.map(s => [s.name, s.engagementScore, s.engagementStatus, s.emotion, s.action, s.sessionAlertCount]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `session-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Current session */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-mono font-bold flex items-center gap-2"><Video size={16}/> CURRENT SESSION</h3>
            <div className="text-xs text-gray-400 mt-1">Live session in progress — no recording saved</div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-3 py-1.5 rounded border border-red-800/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              LIVE — Not Recording
            </div>
            <button onClick={handleExportCurrentCSV}
              className="flex items-center gap-2 px-4 py-2 bg-hud-cyan/10 border border-hud-cyan/30 text-hud-cyan rounded text-xs font-mono hover:bg-hud-cyan/20 transition-all">
              <Download size={14}/> Export Current Session CSV
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-mono text-sm flex items-center gap-2"><Clock size={14}/> SESSION HISTORY (by teacher)</h3>
          <span className="text-xs text-gray-500">{sessionHistory.length} sessions</span>
        </div>
        {sessionHistory.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 text-sm">No sessions yet. Complete a session to see history here.</div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900">
              {['Date & Time', 'Subject', 'Duration', 'Present', 'Engagement', 'Phone Incidents', 'CSV'].map(h => (
                <th key={h} className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessionHistory.map(s => {
              const hasStoredCSV = !!localStorage.getItem(`sentinel_session_export_${s.id}`);
              return (
                <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                  <td className="px-4 py-3 text-gray-300 text-xs font-mono">{s.date}</td>
                  <td className="px-4 py-3 text-white text-xs font-medium">{s.subject}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{s.duration}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{s.presentCount}/{s.totalStudents}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{s.avgEngagement}%</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{s.phoneIncidents}</td>
                  <td className="px-4 py-3">
                    {hasStoredCSV ? (
                      <button onClick={() => handleExportPastSession(s.id, s.date)} className="text-xs text-hud-cyan hover:underline flex items-center gap-1">
                        <Download size={11}/> CSV
                      </button>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};
