import React from 'react';
import { Activity, Users, AlertTriangle, Smartphone, LayoutGrid, Mic, TrendingUp, CheckCircle, Wifi, Cpu, Clock } from 'lucide-react';
import { TabProps } from './types';

export const OverviewTab: React.FC<TabProps> = ({ filteredStudents, teacherList, heatmap, audioState, sessionStartTime }) => {
  const allPeople = [...filteredStudents, ...teacherList];
  const avgEngagement = allPeople.length > 0
    ? Math.round(allPeople.reduce((a, b) => a + (b.engagementScore || 0), 0) / allPeople.length) : 0;
  const distractedCount = allPeople.filter(s => s.engagementStatus === 'LOW').length;
  const activePhoneCount = allPeople.filter(s => s.phoneDetected).length;
  const totalSessionAlerts = allPeople.reduce((a, s) => a + (s.sessionAlertCount || 0), 0);

  const criticalAlerts = allPeople.filter(s => (s.sessionAlertCount ?? 0) >= 3).length;
  const highAlerts = allPeople.filter(s => (s.sessionAlertCount ?? 0) === 2).length;
  const medAlerts = allPeople.filter(s => (s.sessionAlertCount ?? 0) === 1).length;

  return (
    <div className="space-y-6 animate-fadeIn h-full overflow-y-auto pb-20 custom-scrollbar">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Total Students</div>
              <div className="text-3xl font-bold text-white mt-1">{filteredStudents.length}</div>
            </div>
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Users size={20}/></div>
          </div>
          <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12}/> Live detection</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Engagement Rate</div>
              <div className="text-3xl font-bold text-hud-cyan mt-1">{avgEngagement}%</div>
            </div>
            <div className="p-2 bg-cyan-500/20 rounded-lg text-hud-cyan"><Activity size={20}/></div>
          </div>
          <div className="mt-2 text-xs text-gray-400">Target: 80%</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Distraction Rate</div>
              <div className="text-3xl font-bold text-red-500 mt-1">
                {filteredStudents.length ? Math.round((distractedCount / filteredStudents.length) * 100) : 0}%
              </div>
            </div>
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500"><AlertTriangle size={20}/></div>
          </div>
          <div className="mt-2 text-xs text-red-400">{distractedCount} students distracted</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Session Alerts</div>
              <div className="text-3xl font-bold text-orange-500 mt-1">{totalSessionAlerts}</div>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><Smartphone size={20}/></div>
          </div>
          <div className="mt-2 text-xs text-orange-400">{activePhoneCount} active now</div>
        </div>
      </div>

      {/* Alert Severity Bar */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <h3 className="text-white font-mono mb-3 text-sm flex items-center gap-2"><AlertTriangle size={14}/> ALERT SEVERITY SUMMARY</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Critical', count: criticalAlerts, color: 'bg-red-500', text: 'text-red-400' },
            { label: 'High', count: highAlerts, color: 'bg-orange-500', text: 'text-orange-400' },
            { label: 'Medium', count: medAlerts, color: 'bg-yellow-500', text: 'text-yellow-400' },
            { label: 'Active Now', count: activePhoneCount, color: 'bg-blue-500', text: 'text-blue-400' },
          ].map(({ label, count, color, text }) => (
            <div key={label} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className={`text-xs font-mono ${text} uppercase mb-1`}>{label}</div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className={`mt-2 h-1.5 ${color} rounded-full`} style={{ width: `${Math.min(count * 20, 100)}%` }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Activity & Heatmap */}
      <div className="grid grid-cols-3 gap-6" style={{ height: '24rem' }}>
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col">
          <h3 className="text-white font-mono mb-4 flex items-center gap-2"><Activity size={16}/> LIVE STUDENT ACTIVITY FEED</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredStudents.length === 0 && <div className="text-gray-500 text-center py-10">No active students detected</div>}
            {filteredStudents.map(s => (
              <div key={s.id} className="bg-gray-900/50 p-3 rounded border border-gray-700 flex justify-between items-center hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white border border-gray-600">
                    {s.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{s.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span className={s.engagementScore! > 50 ? 'text-green-400' : 'text-red-400'}>{s.engagementScore}% Engaged</span>
                      <span>•</span>
                      <span>{s.action}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 mb-1">{s.emotion}</div>
                  <div className={`text-[10px] font-bold ${s.engagementStatus === 'HIGH' ? 'text-green-500' : s.engagementStatus === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {s.engagementStatus?.toUpperCase()}
                  </div>
                  {(s.sessionAlertCount ?? 0) > 0 && (
                    <div className="text-[10px] text-orange-500 font-bold mt-1">⚠ {s.sessionAlertCount} alerts</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col">
          <h3 className="text-white font-mono mb-4 flex items-center gap-2"><LayoutGrid size={16}/> ATTENTION HEATMAP</h3>
          <div className="flex-1 grid grid-cols-3 gap-1 bg-gray-900 p-2 rounded-lg border border-gray-800">
            {heatmap.map(zone => {
              const eng = Math.round(zone.engagement);
              const intensity = Math.min(1, eng / 100);
              const color = zone.count > 0
                ? (intensity > 0.6 ? `rgba(0,255,65,${0.4 + intensity * 0.5})` : `rgba(255,0,60,${0.3 + (1 - intensity) * 0.5})`)
                : '#111';
              return (
                <div key={zone.id} className="relative border border-gray-800 rounded flex items-center justify-center transition-all duration-300 min-h-[4rem]"
                  style={{ backgroundColor: color }}>
                  {zone.count > 0 && (
                    <div className="text-center">
                      <div className="text-sm font-bold text-white drop-shadow-md">{eng}%</div>
                      <div className="text-[9px] text-white/90">{zone.count} {zone.count === 1 ? 'person' : 'people'}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Health + Audio */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-white font-mono mb-4 flex items-center gap-2"><Cpu size={16}/> SYSTEM STATUS</h3>
          <div className="space-y-3">
            {[
              { label: 'Camera Feed', status: 'ACTIVE', icon: <Wifi size={14}/>, ok: true },
              { label: 'AI Face Detection', status: 'RUNNING', icon: <Cpu size={14}/>, ok: true },
              { label: 'Emotion Engine', status: 'ACTIVE', icon: <Activity size={14}/>, ok: true },
              { label: 'Phone Detection', status: 'ACTIVE', icon: <Smartphone size={14}/>, ok: true },
              { label: 'Session Timer', status: sessionStartTime || 'ACTIVE', icon: <Clock size={14}/>, ok: true },
            ].map(({ label, status, icon, ok }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-2">{icon} {label}</span>
                <span className={`flex items-center gap-1 font-bold ${ok ? 'text-green-400' : 'text-red-400'}`}>
                  <CheckCircle size={10}/> {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-white font-mono mb-4 flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2"><Mic size={16}/> ACOUSTIC MONITOR</span>
            <span className={`text-xs font-bold ${audioState.status === 'CHAOS' ? 'text-red-500' : 'text-hud-cyan'}`}>{audioState.status}</span>
          </h3>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-900 rounded overflow-hidden">
              <div className={`h-full transition-all duration-300 ${audioState.status === 'CHAOS' ? 'bg-red-500' : 'bg-hud-cyan'}`}
                style={{ width: `${audioState.level}%` }}></div>
            </div>
            <div className="text-xs text-gray-400">Level: {audioState.level}%</div>
            {['SILENCE', 'WHISPER', 'DISCUSSION', 'CHAOS'].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${audioState.status === s ? 'bg-hud-cyan' : 'bg-gray-700'}`}></div>
                <span className={`text-xs ${audioState.status === s ? 'text-white font-bold' : 'text-gray-600'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
