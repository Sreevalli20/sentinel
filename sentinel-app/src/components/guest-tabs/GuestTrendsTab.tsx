import React, { useMemo } from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { GuestTabProps } from './types';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export const GuestTrendsTab: React.FC<GuestTabProps> = ({ filteredGuests }) => {
  const emotionTrends = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGuests.forEach(g => {
      if (g.emotion) counts[g.emotion] = (counts[g.emotion] || 0) + 1;
      (g.history || []).forEach(h => { if (h.emotion) counts[h.emotion] = (counts[h.emotion] || 0) + 1; });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value })).sort((a, b) => b.count - a.count);
  }, [filteredGuests]);

  const actionTrends = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGuests.forEach(g => {
      if (g.action) counts[g.action] = (counts[g.action] || 0) + 1;
      (g.history || []).forEach(h => { if (h.action) counts[h.action] = (counts[h.action] || 0) + 1; });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value })).sort((a, b) => b.count - a.count);
  }, [filteredGuests]);

  const engagementTimeline = useMemo(() => {
    const merged: Record<string, number[]> = {};
    filteredGuests.forEach(g => {
      (g.history || []).forEach(h => {
        if (!merged[h.timeLabel]) merged[h.timeLabel] = [];
        merged[h.timeLabel].push(h.engagement);
      });
    });
    return Object.entries(merged).map(([time, vals]) => ({ time, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }));
  }, [filteredGuests]);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">Emotion Trends</h3>
          {emotionTrends.length === 0 ? <div className="text-gray-600 text-center pt-16 text-sm">No data yet</div> : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={emotionTrends.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                <XAxis dataKey="name" stroke="#666" fontSize={9}/>
                <YAxis stroke="#666" fontSize={9}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="count" fill="var(--color-hud-cyan)" radius={[4, 4, 0, 0]} name="Count"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '18rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">Action Trends</h3>
          {actionTrends.length === 0 ? <div className="text-gray-600 text-center pt-16 text-sm">No data yet</div> : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={actionTrends.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                <XAxis dataKey="name" stroke="#666" fontSize={9}/>
                <YAxis stroke="#666" fontSize={9}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Count"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '16rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><Activity size={14}/> Engagement Over Time</h3>
          {engagementTimeline.length === 0 ? <div className="text-gray-600 text-center pt-12 text-sm">No history yet</div> : (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={engagementTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                <XAxis dataKey="time" stroke="#666" fontSize={9}/>
                <YAxis stroke="#666" fontSize={9} domain={[0, 100]}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Line type="monotone" dataKey="avg" stroke="var(--color-hud-cyan)" dot={false} name="Avg Engagement"/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
