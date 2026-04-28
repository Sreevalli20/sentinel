import React, { useState, useEffect } from 'react';
import { Database, Download, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { TabProps } from './types';

interface BackupRecord {
  id: string;
  date: string;
  size: string;
  type: 'auto' | 'manual';
  status: 'success' | 'partial' | 'failed';
}

export const BackupTab: React.FC<TabProps> = ({ students }) => {
  const [lastBackup, setLastBackup] = useState<string>(
    () => localStorage.getItem('sentinel-last-backup') || 'Never'
  );
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>(() => {
    try {
      const s = localStorage.getItem('sentinel-backup-history');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('sentinel-backup-history', JSON.stringify(backupHistory));
  }, [backupHistory]);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    await new Promise(r => setTimeout(r, 1500));

    const data = JSON.stringify({
      backupType: 'manual',
      timestamp: new Date().toISOString(),
      studentCount: students.length,
      students,
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sentinel-backup-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
    a.click();

    const now = new Date().toLocaleString();
    setLastBackup(now);
    localStorage.setItem('sentinel-last-backup', now);

    setBackupHistory(prev => [{
      id: `bk-new-${Date.now()}`,
      date: new Date().toLocaleString(),
      size: `${(JSON.stringify(students).length / 1024).toFixed(1)} KB`,
      type: 'manual',
      status: 'success',
    }, ...prev]);

    setIsBackingUp(false);
  };

  const statusColors = { success: 'text-green-400', partial: 'text-yellow-400', failed: 'text-red-400' };
  const statusIcons = {
    success: <CheckCircle size={13} className="text-green-400"/>,
    partial: <RefreshCw size={13} className="text-yellow-400"/>,
    failed: <span className="text-red-400 text-xs">✕</span>,
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Why Backup: client requirement for data export, compliance, archival */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-xs text-gray-500">
        <strong className="text-gray-400">Purpose:</strong> Manual backup exports session data (students, engagement, attendance) for compliance, archival, or offline analysis. Auto-backup would require a backend service.
      </div>
      {/* Status card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold font-mono flex items-center gap-2"><Database size={16}/> BACKUP STATUS</h3>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle size={14} className="text-green-400"/>
              <span className="text-green-400 text-sm">Manual backup available</span>
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock size={11}/> Last backup: <span className="text-white font-mono ml-1">{lastBackup}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleManualBackup} disabled={isBackingUp}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-mono text-sm transition-all ${isBackingUp ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-wait' : 'bg-hud-cyan/10 border-hud-cyan/30 text-hud-cyan hover:bg-hud-cyan/20'}`}>
              {isBackingUp ? (
                <><RefreshCw size={14} className="animate-spin"/> Backing up...</>
              ) : (
                <><Download size={14}/> Manual Backup</>
              )}
            </button>
          </div>
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {[
            { label: 'Manual Backup', value: 'Available', color: 'text-hud-cyan' },
            { label: 'Backups This Session', value: backupHistory.length, color: 'text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
              <div className={`font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup history */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h3 className="text-gray-400 font-mono text-xs uppercase">Backup History</h3>
        </div>
        {backupHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-sm">No backups yet. Use Manual Backup above to export data.</div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              {['Date & Time', 'Type', 'Size', 'Status'].map(h => (
                <th key={h} className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backupHistory.map(b => (
              <tr key={b.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-300 font-mono">{b.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${b.type === 'manual' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                    {b.type.charAt(0).toUpperCase() + b.type.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{b.size}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs ${statusColors[b.status]}`}>
                    {statusIcons[b.status]}
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};
