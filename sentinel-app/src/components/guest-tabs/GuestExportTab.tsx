import React, { useState, useEffect } from 'react';
import { Download, FileText, Database, Clock, Trash2 } from 'lucide-react';
import { GuestTabProps } from './types';

export const GuestExportTab: React.FC<GuestTabProps> = ({ filteredGuests, registeredGuests, unregisteredGuests }) => {
  const filteredReg = filteredGuests.filter(g => !g.name?.startsWith('Guest'));
  const filteredUnreg = filteredGuests.filter(g => g.name?.startsWith('Guest'));
  const [history, setHistory] = useState<{ id: string; type: string; date: string; rows: number }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('sentinel-guest-export-history');
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const addHistory = (rec: { id: string; type: string; date: string; rows: number }) => {
    const updated = [rec, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('sentinel-guest-export-history', JSON.stringify(updated));
  };

  const dl = (filename: string, content: string, mime: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename; a.click();
  };

  const handleCSV = () => {
    const rows = [
      ['Name','Type','Engagement','Status','Emotion','Action','Phone Alerts'],
      ...filteredGuests.map(g => [g.name, g.name?.startsWith('Guest') ? 'Unregistered' : 'Registered', g.engagementScore, g.engagementStatus, g.emotion, g.action, g.sessionAlertCount]),
    ];
    dl(`guests-${new Date().toISOString().slice(0,10)}.csv`, rows.map(r=>r.join(',')).join('\n'), 'text/csv');
    addHistory({ id: Date.now().toString(), type: 'CSV', date: new Date().toLocaleString(), rows: filteredGuests.length });
  };

  const handleJSON = () => {
    dl(`guests-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), registered: filteredReg, unregistered: filteredUnreg }, null, 2), 'application/json');
    addHistory({ id: Date.now().toString(), type: 'JSON', date: new Date().toLocaleString(), rows: filteredGuests.length });
  };

  return (
    <div className="space-y-5 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-hud-cyan/20 rounded-lg text-hud-cyan"><FileText size={18}/></div>
            <div><div className="text-white font-bold">CSV Export</div><div className="text-xs text-gray-400">All guest data</div></div>
          </div>
          <button onClick={handleCSV} className="w-full py-2 bg-hud-cyan/10 border border-hud-cyan/30 text-hud-cyan rounded text-xs font-mono hover:bg-hud-cyan/20 transition-all flex items-center justify-center gap-2">
            <Download size={13}/> Download CSV ({filteredGuests.length} rows)
          </button>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Database size={18}/></div>
            <div><div className="text-white font-bold">JSON Export</div><div className="text-xs text-gray-400">Full data</div></div>
          </div>
          <button onClick={handleJSON} className="w-full py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded text-xs font-mono hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
            <Download size={13}/> Download JSON
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-gray-400 font-mono text-xs uppercase flex items-center gap-2"><Clock size={12}/> Export History</h3>
          {history.length > 0 && <button onClick={() => { setHistory([]); localStorage.removeItem('sentinel-guest-export-history'); }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={10}/> Clear</button>}
        </div>
        {history.length === 0 ? <div className="text-center text-gray-500 py-8 text-sm">No exports yet.</div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-900 border-b border-gray-700">{['Type','Date','Rows'].map(h => <th key={h} className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                  <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded ${h.type === 'CSV' ? 'bg-hud-cyan/10 text-hud-cyan' : 'bg-blue-500/10 text-blue-400'}`}>{h.type}</span></td>
                  <td className="px-4 py-2 text-xs text-gray-400">{h.date}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">{h.rows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
