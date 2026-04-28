import React, { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';
import { TabProps } from './types';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line,
} from 'recharts';

const COLORS = ['#00f0ff', '#00ff41', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#a4de6c'];

export const AnalyticsTab: React.FC<TabProps> = ({ filteredStudents, teacherList, guestList }) => {
  const [timeRange, setTimeRange] = useState<5 | 10 | 20>(10);
  const allPeople = [...filteredStudents, ...teacherList, ...guestList];

  // Engagement over time (from history)
  const engagementTimeline = useMemo(() => {
    const merged: Record<string, number[]> = {};
    allPeople.forEach(s => {
      (s.history || []).slice(-timeRange).forEach(h => {
        if (!merged[h.timeLabel]) merged[h.timeLabel] = [];
        merged[h.timeLabel].push(h.engagement);
      });
    });
    return Object.entries(merged).map(([time, vals]) => ({
      time,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  }, [allPeople, timeRange]);

  // Emotion distribution (all people — current + history)
  const emotionData = useMemo(() => {
    const counts: Record<string, number> = {};
    allPeople.forEach(s => {
      if (s.emotion) counts[s.emotion] = (counts[s.emotion] || 0) + 1;
      (s.history || []).forEach(h => {
        if (h.emotion) counts[h.emotion] = (counts[h.emotion] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allPeople]);

  // Action distribution
  const actionData = useMemo(() => {
    const counts: Record<string, number> = {};
    allPeople.forEach(s => { if (s.action) counts[s.action] = (counts[s.action] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allPeople]);

  // Distraction over time
  const distractionData = useMemo(() => {
    if (allPeople.length === 0) return [];
    const timeMap: Record<string, { total: number; distracted: number }> = {};
    allPeople.forEach(s => {
      (s.history || []).slice(-timeRange).forEach(h => {
        if (!timeMap[h.timeLabel]) timeMap[h.timeLabel] = { total: 0, distracted: 0 };
        timeMap[h.timeLabel].total++;
        if (h.engagement < 50) timeMap[h.timeLabel].distracted++;
      });
    });
    return Object.entries(timeMap).map(([time, d]) => ({
      time,
      rate: d.total > 0 ? Math.round((d.distracted / d.total) * 100) : 0,
    }));
  }, [allPeople, timeRange]);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Time range filter */}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs font-mono">TIME RANGE:</span>
        {([5, 10, 20] as const).map(t => (
          <button key={t} onClick={() => setTimeRange(t)}
            className={`px-3 py-1 rounded text-xs font-mono border transition-all ${timeRange === t ? 'bg-hud-cyan/10 border-hud-cyan text-hud-cyan' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
            Last {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Engagement over time */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <Activity size={14}/> Class Engagement Over Time
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={engagementTimeline}>
              <defs>
                <linearGradient id="colorAnalEng" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
              <XAxis dataKey="time" stroke="#666" fontSize={9}/>
              <YAxis stroke="#666" fontSize={9} domain={[0, 100]}/>
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
              <Area type="monotone" dataKey="avg" stroke="#00f0ff" fill="url(#colorAnalEng)" name="Avg Engagement"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion Breakdown */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <PieIcon size={14}/> Emotion Distribution
          </h3>
          {emotionData.length === 0 ? (
            <div className="text-gray-600 text-center pt-16">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={emotionData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                <XAxis type="number" stroke="#666" fontSize={9}/>
                <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={70}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="value" fill="#00f0ff" radius={[0, 4, 4, 0]} name="Count"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Action Distribution */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <BarChart2 size={14}/> Action Distribution
          </h3>
          {actionData.length === 0 ? (
            <div className="text-gray-600 text-center pt-16">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={actionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                <XAxis type="number" stroke="#666" fontSize={9}/>
                <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={80}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="value" fill="#00ff41" radius={[0, 4, 4, 0]} name="Count"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distraction Rate */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <TrendingUp size={14}/> Distraction Rate Over Time
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={distractionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
              <XAxis dataKey="time" stroke="#666" fontSize={9}/>
              <YAxis stroke="#666" fontSize={9} domain={[0, 100]}/>
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
              <Line type="monotone" dataKey="rate" stroke="#ff7c7c" dot={false} name="Distraction %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Class Avg Engagement', value: `${allPeople.length > 0 ? Math.round(allPeople.reduce((a,b) => a+(b.engagementScore||0),0)/allPeople.length) : 0}%`, color: 'text-hud-cyan' },
          { label: 'High Engagement', value: allPeople.filter(s => (s.engagementScore ?? 0) >= 70).length, color: 'text-green-400' },
          { label: 'Low Engagement', value: allPeople.filter(s => (s.engagementScore ?? 0) < 50).length, color: 'text-red-400' },
          { label: 'Total Alerts', value: allPeople.reduce((a,s)=>a+(s.sessionAlertCount||0),0), color: 'text-orange-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
