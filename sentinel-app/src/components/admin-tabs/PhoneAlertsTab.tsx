import React from 'react';
import { Smartphone, AlertTriangle } from 'lucide-react';
import { TabProps } from './types';

export const PhoneAlertsTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const allViolators = filteredStudents.filter(s => (s.sessionAlertCount ?? 0) > 0)
    .sort((a, b) => (b.sessionAlertCount ?? 0) - (a.sessionAlertCount ?? 0));

  const getSeverity = (count: number) => {
    if (count >= 4) return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/40', dot: 'bg-red-500' };
    if (count === 3) return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/40', dot: 'bg-orange-500' };
    if (count === 2) return { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40', dot: 'bg-yellow-500' };
    return { label: 'LOW', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/40', dot: 'bg-blue-500' };
  };

  const critical = allViolators.filter(s => (s.sessionAlertCount ?? 0) >= 4).length;
  const high = allViolators.filter(s => (s.sessionAlertCount ?? 0) === 3).length;
  const medium = allViolators.filter(s => (s.sessionAlertCount ?? 0) === 2).length;
  const low = allViolators.filter(s => (s.sessionAlertCount ?? 0) === 1).length;
  const activeNow = filteredStudents.filter(s => s.phoneDetected).length;

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Summary Counters */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Critical (4+)', count: critical, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
          { label: 'High (3)', count: high, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
          { label: 'Medium (2)', count: medium, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
          { label: 'Low (1)', count: low, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
          { label: 'Active Now', count: activeNow, color: 'text-white', bg: 'bg-gray-700 border-gray-600' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl p-4 text-center`}>
            <div className={`text-3xl font-bold ${color}`}>{count}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase">{label}</div>
          </div>
        ))}
      </div>

      {/* Active Violations */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-white font-mono mb-4 flex items-center gap-2">
          <Smartphone size={16}/> VIOLATION LOG — SESSION TOTAL
        </h3>
        {allViolators.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No phone violations this session.</div>
        ) : (
          <div className="space-y-2">
            {allViolators.map(s => {
              const sev = getSeverity(s.sessionAlertCount ?? 0);
              return (
                <div key={s.id} className={`${sev.bg} border rounded-lg p-4 flex items-center gap-4`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm bg-gray-700`}>
                    {s.name?.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{s.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{s.rollNo}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${sev.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sev.dot}`}></span>
                        {sev.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Alerts: <span className="text-white font-bold">{s.sessionAlertCount}</span></span>
                      <span>Current: <span className={s.phoneDetected ? 'text-red-400 font-bold' : 'text-gray-500'}>{s.phoneDetected ? 'PHONE IN HAND' : 'Clear'}</span></span>
                      <span>Engagement: <span className={`font-bold ${(s.engagementScore ?? 0) > 50 ? 'text-green-400' : 'text-red-400'}`}>{s.engagementScore}%</span></span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-2xl font-bold ${sev.color}`}>
                    {s.sessionAlertCount}
                  </div>
                  {s.phoneDetected && <Smartphone size={20} className="text-red-500 animate-pulse"/>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Duration info */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-white font-mono mb-4 flex items-center gap-2"><AlertTriangle size={16}/> CURRENT ACTIVE DETECTIONS</h3>
        {activeNow === 0 ? (
          <div className="text-center text-gray-500 py-6 text-sm">No phones currently detected in frame.</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredStudents.filter(s => s.phoneDetected).map(s => (
              <div key={s.id} className="bg-red-900/20 border border-red-700/40 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                  {s.name?.slice(0, 1)}
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{s.name}</div>
                  <div className="text-xs text-red-400">Currently using phone</div>
                  <div className="text-xs text-gray-400">Session total: {s.sessionAlertCount} alert(s)</div>
                </div>
                <Smartphone size={20} className="ml-auto text-red-500 animate-pulse"/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
