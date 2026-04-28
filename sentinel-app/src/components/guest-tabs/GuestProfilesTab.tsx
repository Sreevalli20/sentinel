import React, { useState } from 'react';
import { UserX, UserCheck, Smartphone, TrendingUp, Activity, Smile, FileText, X } from 'lucide-react';
import { DetectionData } from '../../types';
import { GuestTabProps } from './types';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

const GuestDetail: React.FC<{ guest: DetectionData; onClose: () => void }> = ({ guest, onClose }) => {
  const historyData = guest.history || [];
  const emotionCounts = historyData.reduce((acc, h) => { acc[h.emotion] = (acc[h.emotion] || 0) + 1; return acc; }, {} as Record<string,number>);
  const emotionData = Object.keys(emotionCounts).map(k => ({ name: k, value: emotionCounts[k] }));
  const isUnregistered = guest.name?.startsWith('Guest');

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-fadeIn">
      <div className="flex-shrink-0 flex justify-between items-start p-6 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
            {isUnregistered ? <UserX size={24} className="text-orange-400"/> : <UserCheck size={24} className="text-green-400"/>}
            {guest.name}
            {isUnregistered
              ? <span className="text-sm bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full">UNREGISTERED</span>
              : <span className="text-sm bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-full">REGISTERED GUEST</span>
            }
          </h2>
          <div className="flex gap-5 text-xs text-gray-400 mt-2">
            <span className="flex items-center gap-1"><Activity size={11} className="text-hud-cyan"/> {guest.engagementScore}%</span>
            <span className="flex items-center gap-1"><Smile size={11} className="text-yellow-400"/> {guest.emotion}</span>
            <span className="flex items-center gap-1 text-white">{guest.action}</span>
            {(guest.sessionAlertCount ?? 0) > 0 && <span className="text-orange-400">⚠ {guest.sessionAlertCount} alerts</span>}
          </div>
        </div>
        <button onClick={onClose} className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white text-xs font-mono">
          <X size={14}/> CLOSE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl" style={{ height: '14rem' }}>
              <h3 className="text-gray-400 font-mono mb-2 text-xs uppercase flex items-center gap-2"><TrendingUp size={13}/> Engagement Timeline</h3>
              {historyData.length === 0 ? (
                <div className="text-gray-600 text-center pt-10 text-sm">No history data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorGuestEng" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-hud-cyan)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-hud-cyan)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                    <XAxis dataKey="timeLabel" stroke="#666" fontSize={9}/>
                    <YAxis stroke="#666" fontSize={9} domain={[0,100]}/>
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                    <Area type="monotone" dataKey="engagement" stroke="var(--color-hud-cyan)" fill="url(#colorGuestEng)"/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl" style={{ height: '10rem' }}>
              <h3 className="text-gray-400 font-mono mb-2 text-xs uppercase">Emotion Distribution</h3>
              {emotionData.length === 0 ? (
                <div className="text-gray-600 text-center pt-6 text-xs">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie data={emotionData} cx="50%" cy="50%" outerRadius={45} dataKey="value" paddingAngle={4}>
                      {emotionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex-1 min-h-[8rem]">
              <h3 className="text-gray-400 font-mono mb-2 text-xs uppercase flex items-center gap-2"><FileText size={11}/> Session Log</h3>
              <div className="overflow-y-auto h-32 custom-scrollbar space-y-1">
                {historyData.length === 0 && <div className="text-gray-600 text-xs text-center py-4">No logs</div>}
                {historyData.slice().reverse().map((log, i) => (
                  <div key={i} className="flex justify-between bg-black/50 border border-gray-800 px-2 py-1 rounded text-xs font-mono">
                    <span className="text-gray-500">{log.timeLabel}</span>
                    <span className={log.engagement > 50 ? 'text-green-500' : 'text-red-500'}>{log.engagement}%</span>
                    <span className="text-gray-400 truncate max-w-16">{log.action}</span>
                    {log.phone && <Smartphone size={9} className="text-red-500"/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <h3 className="text-gray-400 font-mono mb-2 text-xs uppercase">Actions & Emotions</h3>
          <div className="overflow-y-auto max-h-40 custom-scrollbar space-y-1">
            {historyData.length === 0 && <div className="text-gray-600 text-xs text-center py-3">No data</div>}
            {historyData.slice().reverse().map((log, i) => (
              <div key={i} className="flex justify-between bg-black/50 border border-gray-800 px-2 py-1 rounded text-xs">
                <span className="text-gray-500">{log.timeLabel}</span>
                <span className="text-hud-cyan">{log.emotion}</span>
                <span className="text-gray-400">{log.action}</span>
                {log.phone && <Smartphone size={9} className="text-red-500"/>}
              </div>
            ))}
          </div>
        </div>

        {(guest.sessionAlertCount ?? 0) > 0 && (
          <div className="mt-4 bg-red-900/30 border border-red-800/40 p-4 rounded-xl">
            <h3 className="text-red-400 font-mono mb-2 text-xs uppercase">Phone Violations</h3>
            <div className="text-white text-sm font-bold">⚠ {guest.sessionAlertCount} alert(s) this session</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const GuestProfilesTab: React.FC<GuestTabProps> = ({ filteredGuests }) => {
  const [selected, setSelected] = useState<DetectionData | null>(null);
  const [filter, setFilter] = useState<'all' | 'registered' | 'unregistered'>('all');
  const reg = filteredGuests.filter(g => !g.name?.startsWith('Guest'));
  const unreg = filteredGuests.filter(g => g.name?.startsWith('Guest'));
  const displayed = filter === 'registered' ? reg : filter === 'unregistered' ? unreg : filteredGuests;

  return (
    <div className="h-full relative flex flex-col">
      <div className="flex gap-2 mb-4 flex-shrink-0">
        {(['all','registered','unregistered'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono border transition-all ${filter === f ? 'bg-hud-cyan/10 border-hud-cyan/30 text-hud-cyan' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
            {f === 'all' ? `All (${filteredGuests.length})` : f === 'registered' ? `Registered (${reg.length})` : `Unknown (${unreg.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        {displayed.length === 0 && (
          <div className="text-center text-gray-500 py-20">No guests in this category.</div>
        )}
        <div className="grid grid-cols-4 gap-4">
          {displayed.map(g => {
            const isUnreg = g.name?.startsWith('Guest');
            return (
              <div key={g.id} onClick={() => setSelected(g)}
                className={`bg-gray-800 rounded-xl border p-4 cursor-pointer transition-colors ${isUnreg ? 'border-orange-700/40 hover:border-orange-500' : 'border-gray-700 hover:border-hud-cyan'}`}>
                <div className="flex flex-col items-center mb-3">
                  <div className={`w-14 h-14 rounded-full mb-2 border-2 flex items-center justify-center text-xl font-bold ${isUnreg ? 'bg-orange-900/40 border-orange-600 text-orange-300' : 'bg-gray-700 border-hud-cyan/40 text-white'}`}>
                    {isUnreg ? <UserX size={20}/> : g.name?.slice(0,1)}
                  </div>
                  <div className="text-sm font-bold text-white text-center">{g.name}</div>
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full mt-1 ${isUnreg ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                    {isUnreg ? 'UNREGISTERED' : 'REGISTERED'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Engagement</span><span>{g.engagementScore}%</span></div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${g.engagementScore! > 60 ? 'bg-hud-cyan' : 'bg-red-500'}`} style={{ width: `${g.engagementScore}%` }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="bg-gray-900 p-1.5 rounded border border-gray-700 text-center">
                      <div className="text-gray-500 text-[10px]">Emotion</div>
                      <div className="text-white font-bold truncate">{g.emotion}</div>
                    </div>
                    <div className="bg-gray-900 p-1.5 rounded border border-gray-700 text-center">
                      <div className="text-gray-500 text-[10px]">Action</div>
                      <div className="text-white font-bold truncate">{g.action}</div>
                    </div>
                  </div>
                  {(g.sessionAlertCount ?? 0) > 0 && (
                    <div className="text-center text-xs text-orange-400 font-bold">⚠ {g.sessionAlertCount} phone alert(s)</div>
                  )}
                  {g.phoneDetected && <div className="flex items-center justify-center gap-1 text-xs text-red-400"><Smartphone size={11} className="animate-pulse"/> In use</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selected && <GuestDetail guest={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
};
