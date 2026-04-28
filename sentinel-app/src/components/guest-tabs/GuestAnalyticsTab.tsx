import React, { useState, useMemo } from 'react';
import { BarChart2, Activity, TrendingUp } from 'lucide-react';
import { GuestTabProps } from './types';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#f87171'];

export const GuestAnalyticsTab: React.FC<GuestTabProps> = ({ filteredGuests }) => {
  const [timeRange, setTimeRange] = useState<5 | 10 | 20>(10);

  const emotionDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGuests.forEach(g => {
      if (g.emotion) counts[g.emotion] = (counts[g.emotion] || 0) + 1;
      (g.history || []).forEach(h => { if (h.emotion) counts[h.emotion] = (counts[h.emotion] || 0) + 1; });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredGuests]);

  const actionDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGuests.forEach(g => { if (g.action) counts[g.action] = (counts[g.action] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredGuests]);

  const engagementTimeline = useMemo(() => {
    const merged: Record<string, number[]> = {};
    filteredGuests.forEach(g => {
      (g.history || []).slice(-timeRange).forEach(h => {
        if (!merged[h.timeLabel]) merged[h.timeLabel] = [];
        merged[h.timeLabel].push(h.engagement);
      });
    });
    return Object.entries(merged).map(([time, vals]) => ({
      time, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  }, [filteredGuests, timeRange]);

  const distractionData = useMemo(() => {
    const timeMap: Record<string, { total: number; d: number }> = {};
    filteredGuests.forEach(g => {
      (g.history || []).slice(-timeRange).forEach(h => {
        if (!timeMap[h.timeLabel]) timeMap[h.timeLabel] = { total: 0, d: 0 };
        timeMap[h.timeLabel].total++;
        if (h.engagement < 50) timeMap[h.timeLabel].d++;
      });
    });
    return Object.entries(timeMap).map(([time, d]) => ({
      time, rate: d.total > 0 ? Math.round((d.d / d.total) * 100) : 0,
    }));
  }, [filteredGuests, timeRange]);

  return (
    <div className="space-y-5 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs font-mono">TIME RANGE:</span>
        {([5, 10, 20] as const).map(t => (
          <button key={t} onClick={() => setTimeRange(t)}
            className={`px-3 py-1 rounded text-xs font-mono border transition-all ${timeRange === t ? 'bg-hud-cyan/10 border-hud-cyan text-hud-cyan' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
            Last {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><Activity size={13}/> Guest Engagement Over Time</h3>
          {engagementTimeline.length === 0 ? <div className="text-gray-600 text-center pt-16 text-sm">No history yet</div> : (
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={engagementTimeline}>
                <defs>
                  <linearGradient id="guestEngGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-hud-cyan)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--color-hud-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                <XAxis dataKey="time" stroke="#666" fontSize={9}/><YAxis stroke="#666" fontSize={9} domain={[0,100]}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Area type="monotone" dataKey="avg" stroke="var(--color-hud-cyan)" fill="url(#guestEngGrad)" name="Avg Engagement"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><BarChart2 size={13}/> Emotion Distribution</h3>
          {emotionDist.length === 0 ? <div className="text-gray-600 text-center pt-16 text-sm">No data</div> : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={emotionDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                <XAxis type="number" stroke="#666" fontSize={9}/>
                <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={80}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="value" fill="var(--color-hud-cyan)" radius={[0,4,4,0]} name="Count"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><BarChart2 size={13}/> Action Breakdown</h3>
          {actionDist.length === 0 ? <div className="text-gray-600 text-center pt-16 text-sm">No data</div> : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={actionDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                <XAxis type="number" stroke="#666" fontSize={9}/><YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={80}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="value" fill="var(--color-hud-cyan)" radius={[0,4,4,0]} name="Count"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><TrendingUp size={13}/> Distraction Rate</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={distractionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
              <XAxis dataKey="time" stroke="#666" fontSize={9}/><YAxis stroke="#666" fontSize={9} domain={[0,100]}/>
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
              <Line type="monotone" dataKey="rate" stroke="#f87171" dot={false} name="Distraction %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Avg Engagement', value: `${filteredGuests.length > 0 ? Math.round(filteredGuests.reduce((a,b)=>a+(b.engagementScore||0),0)/filteredGuests.length) : 0}%`, color: 'text-hud-cyan' },
          { label: 'High Engagement', value: filteredGuests.filter(g=>(g.engagementScore??0)>=70).length, color: 'text-green-400' },
          { label: 'Low Engagement', value: filteredGuests.filter(g=>(g.engagementScore??0)<50).length, color: 'text-red-400' },
          { label: 'Phone Alerts', value: filteredGuests.reduce((a,g)=>a+(g.sessionAlertCount||0),0), color: 'text-orange-400' },
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
