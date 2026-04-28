import React, { useState } from 'react';
import { User, Activity, TrendingUp, Smartphone, FileText, Smile, Zap } from 'lucide-react';
import { TabProps } from './types';
import { EMOTION_EMOJI } from '../../constants';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export const PersonalTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const [selectedId, setSelectedId] = useState<string>(filteredStudents[0]?.id || '');
  const student = filteredStudents.find(s => s.id === selectedId);

  const historyData = student?.history || [];
  const emotionCounts = historyData.reduce((acc, curr) => {
    acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const emotionData = Object.keys(emotionCounts).map(key => ({ name: key, value: emotionCounts[key] }));
  const phoneEvents = historyData.filter(h => h.phone);

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Student selector */}
      <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
        <User size={14} className="text-gray-400"/>
        <label className="text-xs text-gray-400 font-mono">SELECT STUDENT:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="bg-black text-white border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-hud-cyan flex-1 max-w-xs">
          {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {student && (
          <div className="flex items-center gap-4 ml-4 text-xs text-gray-400">
            <span><Activity size={11} className="inline mr-1 text-hud-cyan"/>{student.engagementScore}% engaged</span>
            <span><Smile size={11} className="inline mr-1 text-yellow-400"/>{EMOTION_EMOJI[student.emotion!] || ''} {student.emotion}</span>
            <span><Zap size={11} className="inline mr-1 text-orange-400"/>{student.action}</span>
          </div>
        )}
      </div>

      {!student ? (
        <div className="text-center text-gray-500 py-20">No students match the current filter.</div>
      ) : (
        <>
          {/* Profile header */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-hud-cyan/30 flex items-center justify-center text-3xl font-bold text-gray-300">
                {student.name?.slice(0,1)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-mono">{student.name}</h2>
                <div className="text-hud-cyan text-sm font-mono">{student.rollNo || student.id}</div>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${student.attendanceStatus === 'PRESENT' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {student.attendanceStatus}
                  </span>
                  {(student.sessionAlertCount ?? 0) > 0 && (
                    <span className="text-xs text-orange-400">⚠ {student.sessionAlertCount} phone alerts</span>
                  )}
                </div>
              </div>
              <div className="ml-auto grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Engagement', value: `${student.engagementScore}%`, color: 'text-hud-cyan' },
                  { label: 'Status', value: student.engagementStatus, color: student.engagementStatus === 'HIGH' ? 'text-green-400' : student.engagementStatus === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400' },
                  { label: 'Phone Alerts', value: student.sessionAlertCount ?? 0, color: 'text-orange-400' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Engagement timeline */}
            <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
              <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
                <TrendingUp size={13}/> Engagement Timeline
              </h3>
              {historyData.length === 0 ? (
                <div className="text-gray-600 text-center pt-16">No history available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorPersonEng" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                    <XAxis dataKey="timeLabel" stroke="#666" fontSize={9}/>
                    <YAxis stroke="#666" fontSize={9} domain={[0, 100]}/>
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                    <Area type="monotone" dataKey="engagement" stroke="#00ff41" fill="url(#colorPersonEng)"/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Emotion history */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
              <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase">Emotion History</h3>
              {emotionData.length === 0 ? (
                <div className="text-gray-600 text-center pt-16">No emotion data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={emotionData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                    <XAxis type="number" stroke="#666" fontSize={9}/>
                    <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={60}/>
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #555' }}/>
                    <Bar dataKey="value" fill="#00f0ff" radius={[0, 4, 4, 0]} name="Count"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Session logs + phone events */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col min-h-0" style={{ height: '16rem' }}>
              <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2 flex-shrink-0"><FileText size={13}/> Session Logs</h3>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1">
                {historyData.length === 0 ? (
                  <div className="text-gray-600 text-xs text-center py-4">No logs yet.</div>
                ) : historyData.slice().reverse().map((log, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/50 border border-gray-800 px-3 py-1.5 rounded text-xs font-mono">
                    <span className="text-gray-500">{log.timeLabel}</span>
                    <span className={log.engagement > 50 ? 'text-green-500' : 'text-red-500'}>{log.engagement}%</span>
                    <span className="text-white truncate max-w-20">{log.action}</span>
                    {log.phone && <Smartphone size={10} className="text-red-500"/>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col min-h-0" style={{ height: '16rem' }}>
              <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2 flex-shrink-0">
                <Smartphone size={13}/> Phone Detection Log
              </h3>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1">
                {phoneEvents.length === 0 ? (
                  <div className="text-green-400 text-xs text-center py-4">No phone detections ✓</div>
                ) : phoneEvents.map((ev, i) => (
                  <div key={`phone-${ev.timeLabel}-${i}`} className="flex items-center justify-between bg-red-900/10 border border-red-800/20 px-3 py-1.5 rounded text-xs flex-shrink-0">
                    <span className="text-red-400 font-mono">{ev.timeLabel}</span>
                    <span className="text-gray-400">{ev.action}</span>
                    <span className={`font-bold ${ev.engagement > 50 ? 'text-green-500' : 'text-red-500'}`}>{ev.engagement}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
