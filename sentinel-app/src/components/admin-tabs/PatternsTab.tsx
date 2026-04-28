import React, { useMemo } from 'react';
import { BarChart2, Zap, Trophy } from 'lucide-react';
import { TabProps } from './types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const PatternsTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const actionFreq = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredStudents.forEach(s => {
      (s.history || []).forEach(h => { if (h.action) counts[h.action] = (counts[h.action] || 0) + 1; });
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }, [filteredStudents]);

  const topDistractors = useMemo(() => {
    const distractors = ['Using Phone', 'Calling', 'Sleeping', 'Looking Away', 'Distracted', 'Not Focused'];
    return filteredStudents
      .filter(s => s.action && distractors.some(d => s.action!.toLowerCase().includes(d.toLowerCase()) || (s.engagementScore ?? 0) < 40))
      .sort((a,b) => (a.engagementScore ?? 0) - (b.engagementScore ?? 0))
      .slice(0, 5);
  }, [filteredStudents]);

  const peakDistractTime = useMemo(() => {
    const timeMap: Record<string, number> = {};
    filteredStudents.forEach(s => {
      (s.history || []).forEach(h => {
        if (h.engagement < 50) timeMap[h.timeLabel] = (timeMap[h.timeLabel] || 0) + 1;
      });
    });
    const peak = Object.entries(timeMap).sort((a,b)=>b[1]-a[1])[0];
    return peak ? peak[0] : 'N/A';
  }, [filteredStudents]);

  // Focus streak: students sorted by longest streak of high engagement
  const focusLeaderboard = useMemo(() => {
    return filteredStudents.map(s => {
      const history = s.history || [];
      let maxStreak = 0, streak = 0;
      history.forEach(h => { if (h.engagement >= 70) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; });
      return { name: s.name, score: s.engagementScore ?? 0, streak: maxStreak };
    }).sort((a,b) => b.streak - a.streak || b.score - a.score).slice(0, 5);
  }, [filteredStudents]);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-2 gap-6">
        {/* Action frequency chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5" style={{ height: '22rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <BarChart2 size={14}/> Action Frequency
          </h3>
          {actionFreq.length === 0 ? (
            <div className="text-gray-600 text-center pt-16">No history data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={actionFreq.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                <XAxis type="number" stroke="#666" fontSize={9}/>
                <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={90}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="count" fill="#00f0ff" radius={[0,4,4,0]} name="Occurrences"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top distractors */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5" style={{ height: '22rem' }}>
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
            <Zap size={14}/> Top Distractors
          </h3>
          {topDistractors.length === 0 ? (
            <div className="text-green-400 text-center py-8 text-sm">No significant distractors detected ✓</div>
          ) : (
            <div className="space-y-3">
              {topDistractors.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <span className="text-gray-500 text-sm font-mono w-5">#{i+1}</span>
                  <div className="w-7 h-7 rounded-full bg-red-800 flex items-center justify-center text-xs font-bold text-white">
                    {s.name?.slice(0,1)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.action}</div>
                  </div>
                  <div className="text-red-400 font-bold text-sm">{s.engagementScore}%</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-400">
            Peak distraction time: <span className="text-white font-mono">{peakDistractTime}</span>
          </div>
        </div>
      </div>

      {/* Focus leaderboard */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
          <Trophy size={14}/> Focus Streak Leaderboard
        </h3>
        {focusLeaderboard.length === 0 ? (
          <div className="text-gray-600 text-center py-8">No engagement history available yet.</div>
        ) : (
          <div className="space-y-2">
            {focusLeaderboard.map((s, i) => (
              <div key={s.name} className={`flex items-center gap-4 px-4 py-3 rounded-lg border ${i === 0 ? 'border-yellow-600/40 bg-yellow-900/10' : 'border-gray-700 bg-gray-900'}`}>
                <span className={`text-lg font-bold w-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </span>
                <div className="flex-1">
                  <div className="text-white font-medium">{s.name}</div>
                  <div className="text-xs text-gray-400">Current engagement: {s.score}%</div>
                </div>
                <div className="text-right">
                  <div className="text-hud-cyan font-bold">{s.streak}</div>
                  <div className="text-xs text-gray-500">streak pts</div>
                </div>
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${i === 0 ? 'bg-yellow-400' : 'bg-hud-cyan'}`}
                    style={{ width: `${s.score}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
