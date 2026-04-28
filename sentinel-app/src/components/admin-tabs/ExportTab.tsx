import React, { useState, useEffect } from 'react';
import { Download, FileText, Database, Clock, Trash2 } from 'lucide-react';
import { TabProps } from './types';

interface ExportRecord {
  id: string;
  type: string;
  date: string;
  rows: number;
}

export const ExportTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const [history, setHistory] = useState<ExportRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('sentinel-export-history');
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const addHistory = (record: ExportRecord, content: string) => {
    const updated = [record, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('sentinel-export-history', JSON.stringify(updated));
    try {
      localStorage.setItem(`sentinel-export-content-${record.id}`, content);
    } catch (_) {}
  };

  const handleCSV = () => {
    const rows = [
      ['Name', 'Roll No', 'Engagement', 'Status', 'Emotion', 'Action', 'Attendance', 'Alerts'],
      ...filteredStudents.map(s => [s.name, s.rollNo || s.id, s.engagementScore, s.engagementStatus, s.emotion, s.action, s.attendanceStatus, s.sessionAlertCount]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const recordId = Date.now().toString();
    download(`session-${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv');
    addHistory({ id: recordId, type: 'CSV', date: new Date().toLocaleString(), rows: filteredStudents.length }, csv);
  };

  const handleJSON = () => {
    const data = JSON.stringify({ exportedAt: new Date().toISOString(), students: filteredStudents }, null, 2);
    const recordId = Date.now().toString();
    download(`session-${new Date().toISOString().slice(0,10)}.json`, data, 'application/json');
    addHistory({ id: recordId, type: 'JSON', date: new Date().toLocaleString(), rows: filteredStudents.length }, data);
  };

  const handleDownloadFromHistory = (h: ExportRecord) => {
    const content = localStorage.getItem(`sentinel-export-content-${h.id}`);
    if (!content) return;
    const ext = h.type === 'CSV' ? 'csv' : 'json';
    const mime = h.type === 'CSV' ? 'text/csv' : 'application/json';
    download(`export-${h.date.replace(/[/:]/g, '-')}.${ext}`, content, mime);
  };

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const clearHistory = () => {
    history.forEach(h => localStorage.removeItem(`sentinel-export-content-${h.id}`));
    setHistory([]);
    localStorage.removeItem('sentinel-export-history');
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Export options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><FileText size={20}/></div>
            <div>
              <div className="text-white font-bold">CSV Export</div>
              <div className="text-xs text-gray-400">Spreadsheet format</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Exports all student engagement data, emotions, actions, and alerts as a CSV file.</p>
          <button onClick={handleCSV}
            className="w-full py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded text-xs font-mono hover:bg-green-500/20 transition-all flex items-center justify-center gap-2">
            <Download size={14}/> Download CSV ({filteredStudents.length} rows)
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Database size={20}/></div>
            <div>
              <div className="text-white font-bold">JSON Export</div>
              <div className="text-xs text-gray-400">Full data format</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Exports complete session data including full history arrays and all metadata.</p>
          <button onClick={handleJSON}
            className="w-full py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded text-xs font-mono hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
            <Download size={14}/> Download JSON
          </button>
        </div>
      </div>

      {/* Export history */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-gray-400 font-mono text-xs uppercase flex items-center gap-2"><Clock size={13}/> Export History</h3>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              <Trash2 size={11}/> Clear
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">No exports yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                {['Type', 'Date', 'Rows', 'Download'].map(col => (
                  <th key={col} className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => {
                const hasContent = !!localStorage.getItem(`sentinel-export-content-${h.id}`);
                return (
                  <tr key={h.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${h.type === 'CSV' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{h.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{h.date}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{h.rows} records</td>
                    <td className="px-4 py-3">
                      {hasContent ? (
                        <button onClick={() => handleDownloadFromHistory(h)} className="text-xs text-hud-cyan hover:underline flex items-center gap-1">
                          <Download size={11}/> {h.type}
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
