import React from 'react';
import { Activity, Users, AlertTriangle, Smartphone, LayoutGrid, Mic, UserCheck, UserX, CheckCircle, Wifi, Cpu, Clock } from 'lucide-react';
import { GuestTabProps } from './types';

export const GuestOverviewTab: React.FC<GuestTabProps> = ({ filteredGuests, allGuests, registeredGuests, unregisteredGuests, heatmap, audioState }) => {
  const guests = filteredGuests.length > 0 ? filteredGuests : allGuests;
  const avgEngagement = guests.length > 0
    ? Math.round(guests.reduce((a, b) => a + (b.engagementScore || 0), 0) / guests.length) : 0;
  const distractedCount = guests.filter(g => g.engagementStatus === 'LOW').length;
  const phoneCount = guests.filter(g => g.phoneDetected).length;
  const totalAlerts = guests.reduce((a, g) => a + (g.sessionAlertCount || 0), 0);

  const criticalAlerts = guests.filter(g => (g.sessionAlertCount ?? 0) >= 3).length;
  const highAlerts = guests.filter(g => (g.sessionAlertCount ?? 0) === 2).length;
  const medAlerts = guests.filter(g => (g.sessionAlertCount ?? 0) === 1).length;

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Total Guests</div>
              <div className="text-3xl font-bold text-white mt-1">{guests.length}</div>
            </div>
            <div className="p-2 bg-hud-cyan/20 rounded-lg text-hud-cyan"><Users size={20}/></div>
          </div>
          <div className="mt-2 flex gap-3 text-xs">
            <span className="text-green-400 flex items-center gap-1"><UserCheck size={10}/> {registeredGuests.length} registered</span>
            <span className="text-orange-400 flex items-center gap-1"><UserX size={10}/> {unregisteredGuests.length} unknown</span>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Avg Engagement</div>
              <div className="text-3xl font-bold text-hud-cyan mt-1">{avgEngagement}%</div>
            </div>
            <div className="p-2 bg-hud-cyan/20 rounded-lg text-hud-cyan"><Activity size={20}/></div>
          </div>
          <div className="mt-2 text-xs text-gray-400">Target: 70%</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Distraction Rate</div>
              <div className="text-3xl font-bold text-red-500 mt-1">
                {guests.length ? Math.round((distractedCount / guests.length) * 100) : 0}%
              </div>
            </div>
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500"><AlertTriangle size={20}/></div>
          </div>
          <div className="mt-2 text-xs text-red-400">{distractedCount} guests distracted</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Phone Alerts</div>
              <div className="text-3xl font-bold text-orange-500 mt-1">{totalAlerts}</div>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><Smartphone size={20}/></div>
          </div>
          <div className="mt-2 text-xs text-orange-400">{phoneCount} active now</div>
        </div>
      </div>

      {/* Alert Severity Summary */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <h3 className="text-white font-mono mb-3 text-sm flex items-center gap-2"><AlertTriangle size={14}/> ALERT SEVERITY SUMMARY</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Critical', count: criticalAlerts, color: 'bg-red-500', text: 'text-red-400' },
            { label: 'High', count: highAlerts, color: 'bg-orange-500', text: 'text-orange-400' },
            { label: 'Medium', count: medAlerts, color: 'bg-yellow-500', text: 'text-yellow-400' },
            { label: 'Active Now', count: phoneCount, color: 'bg-hud-cyan', text: 'text-hud-cyan' },
          ].map(({ label, count, color, text }) => (
            <div key={label} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className={`text-xs font-mono ${text} uppercase mb-1`}>{label}</div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className={`mt-2 h-1.5 ${color} rounded-full`} style={{ width: `${Math.min(count * 20, 100)}%` }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Unregistered guests alert */}
      {unregisteredGuests.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-orange-400 flex-shrink-0"/>
          <div>
            <div className="text-orange-300 font-bold text-sm">{unregisteredGuests.length} Unregistered Person(s) Detected</div>
            <div className="text-orange-400/70 text-xs">
              {unregisteredGuests.map(g => g.name).join(', ')} — not in the registration database
            </div>
          </div>
        </div>
      )}

      {/* Live activity feed */}
      <div className="grid grid-cols-3 gap-6" style={{ height: '22rem' }}>
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col">
          <h3 className="text-white font-mono mb-3 text-sm flex items-center gap-2"><Activity size={14}/> LIVE GUEST ACTIVITY FEED</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {guests.length === 0 && <div className="text-gray-500 text-center py-10">No guests detected in frame</div>}
            {guests.map(g => (
              <div key={g.id} className={`p-3 rounded border flex justify-between items-center hover:bg-gray-700/50 transition-colors ${g.name?.startsWith('Guest') ? 'bg-orange-900/10 border-orange-700/30' : 'bg-gray-900/50 border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${g.name?.startsWith('Guest') ? 'bg-orange-800 border-orange-600 text-orange-200' : 'bg-gray-700 border-gray-600 text-white'}`}>
                    {g.name?.startsWith('Guest') ? <UserX size={14}/> : g.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {g.name}
                      {g.name?.startsWith('Guest') && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded">UNREGISTERED</span>}
                    </div>
                    <div className="text-xs text-gray-400">{g.engagementScore}% engaged • {g.action}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs px-2 py-0.5 rounded bg-gray-800 border border-gray-600 text-gray-300">{g.emotion}</div>
                  <div className={`text-[10px] font-bold mt-1 ${g.engagementStatus === 'HIGH' ? 'text-green-500' : g.engagementStatus === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {g.engagementStatus}
                  </div>
                  {g.phoneDetected && <Smartphone size={11} className="text-red-500 animate-pulse ml-auto mt-1"/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col">
          <h3 className="text-white font-mono mb-3 text-sm flex items-center gap-2"><LayoutGrid size={14}/> ATTENTION HEATMAP</h3>
          <div className="flex-1 grid grid-cols-3 gap-1 bg-gray-900 p-2 rounded-lg border border-gray-800">
            {heatmap.map(zone => {
              const intensity = zone.engagement / 100;
              const color = intensity > 0.6 ? `rgba(251,146,60,${intensity})` : `rgba(255,0,60,${1 - intensity})`;
              return (
                <div key={zone.id} className="border border-gray-800 rounded flex items-center justify-center transition-all duration-500"
                  style={{ backgroundColor: zone.count > 0 ? color : '#111' }}>
                  {zone.count > 0 && (
                    <div className="text-center">
                      <div className="text-sm font-bold text-white drop-shadow-md">{zone.engagement}%</div>
                      <div className="text-[8px] text-white/70">{zone.count}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Status + Audio */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-white font-mono mb-4 flex items-center gap-2"><Cpu size={16}/> SYSTEM STATUS</h3>
          <div className="space-y-3">
            {[
              { label: 'Camera Feed', status: 'ACTIVE', icon: <Wifi size={14}/>, ok: true },
              { label: 'AI Face Detection', status: 'RUNNING', icon: <Cpu size={14}/>, ok: true },
              { label: 'Emotion Engine', status: 'ACTIVE', icon: <Activity size={14}/>, ok: true },
              { label: 'Phone Detection', status: 'ACTIVE', icon: <Smartphone size={14}/>, ok: true },
              { label: 'Session Timer', status: 'ACTIVE', icon: <Clock size={14}/>, ok: true },
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
