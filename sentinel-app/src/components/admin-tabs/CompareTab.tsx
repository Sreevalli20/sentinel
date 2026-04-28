
import React, { useState, useMemo } from 'react';
import { GitCompare } from 'lucide-react';
import { TabProps } from './types';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const CompareTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const [leftId, setLeftId] = useState<string>(filteredStudents[0]?.id || '');
  const [rightId, setRightId] = useState<string>(filteredStudents[1]?.id || '');

  const left = filteredStudents.find(s => s.id === leftId);
  const right = filteredStudents.find(s => s.id === rightId);

  const chartData = useMemo(() => {
    if (!left || !right) return [];
    const leftH = left.history || [];
    const rightH = right.history || [];
    const maxLen = Math.max(leftH.length, rightH.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      time: leftH[i]?.timeLabel || rightH[i]?.timeLabel || `t${i}`,
      [left.name || 'A']: leftH[i]?.engagement ?? null,
      [right.name || 'B']: rightH[i]?.engagement ?? null,
    }));
  }, [left, right]);

  const metrics = [
    { label: 'Engagement', leftVal: left?.engagementScore ?? 0, rightVal: right?.engagementScore ?? 0, format: (v: number) => `${v}%` },
    { label: 'Status', leftVal: left?.engagementStatus || '—', rightVal: right?.engagementStatus || '—', format: (v: string) => v, isText: true },
    { label: 'Emotion', leftVal: left?.emotion || '—', rightVal: right?.emotion || '—', format: (v: string) => v, isText: true },
    { label: 'Action', leftVal: left?.action || '—', rightVal: right?.action || '—', format: (v: string) => v, isText: true },
    { label: 'Session Alerts', leftVal: left?.sessionAlertCount ?? 0, rightVal: right?.sessionAlertCount ?? 0, format: (v: number) => `${v}`, lowerBetter: true },
    { label: 'Attendance', leftVal: left?.attendanceStatus || '—', rightVal: right?.attendanceStatus || '—', format: (v: string) => v, isText: true },
  ];

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-hud-cyan/20 p-4">
          <div className="text-xs text-hud-cyan font-mono mb-2">STUDENT A</div>
          <select value={leftId} onChange={e => setLeftId(e.target.value)}
            className="w-full bg-black text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-hud-cyan">
            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="bg-gray-800 rounded-xl border border-purple-500/20 p-4">
          <div className="text-xs text-purple-400 font-mono mb-2">STUDENT B</div>
          <select value={rightId} onChange={e => setRightId(e.target.value)}
            className="w-full bg-black text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Metric comparison */}
      {(!left || !right) ? (
        <div className="text-gray-500 text-center py-10">Select two students to compare.</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-900 border-b border-gray-700">
              <div className="text-center py-3 text-xs font-mono text-hud-cyan">{left.name}</div>
              <div className="text-center py-3 text-xs font-mono text-gray-400 border-x border-gray-700">METRIC</div>
              <div className="text-center py-3 text-xs font-mono text-purple-400">{right.name}</div>
            </div>
            {metrics.map(({ label, leftVal, rightVal, format, isText, lowerBetter }) => {
              const leftBetter = isText ? false : lowerBetter ? (leftVal as number) <= (rightVal as number) : (leftVal as number) >= (rightVal as number);
              const rightBetter = isText ? false : lowerBetter ? (rightVal as number) <= (leftVal as number) : (rightVal as number) >= (leftVal as number);
              return (
                <div key={label} className="grid grid-cols-3 border-b border-gray-700/50 hover:bg-gray-700/20">
                  <div className={`text-center py-3 font-bold text-sm ${isText ? 'text-gray-300' : leftBetter ? 'text-green-400' : 'text-red-400'}`}>
                    {format(leftVal as never)}
                  </div>
                  <div className="text-center py-3 text-xs text-gray-400 font-mono border-x border-gray-700">{label}</div>
                  <div className={`text-center py-3 font-bold text-sm ${isText ? 'text-gray-300' : rightBetter ? 'text-green-400' : 'text-red-400'}`}>
                    {format(rightVal as never)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dual area chart */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5" style={{ height: '18rem' }}>
            <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
              <GitCompare size={14}/> Engagement Over Time
            </h3>
            {chartData.length === 0 ? (
              <div className="text-gray-600 text-center pt-12">No history data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLeft" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                  <XAxis dataKey="time" stroke="#666" fontSize={9}/>
                  <YAxis stroke="#666" fontSize={9} domain={[0, 100]}/>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }}/>
                  {left && <Area type="monotone" dataKey={left.name || 'A'} stroke="#00f0ff" fill="url(#colorLeft)" connectNulls/>}
                  {right && <Area type="monotone" dataKey={right.name || 'B'} stroke="#a78bfa" fill="url(#colorRight)" connectNulls/>}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
};
