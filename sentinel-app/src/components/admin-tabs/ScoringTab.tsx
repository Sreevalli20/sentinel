import React, { useMemo, useState } from 'react';
import { Trophy, ChevronUp, ChevronDown } from 'lucide-react';
import { TabProps } from './types';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';

interface StudentScore {
  id: string;
  name: string;
  engagement: number;
  focus: number;
  participation: number;
  behavioral: number;
  overall: number;
}

export const ScoringTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const [sortKey, setSortKey] = useState<keyof StudentScore>('overall');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<StudentScore | null>(null);

  // Participation: start at 100, decrease for non-classroom actions (sleeping, eating, playing, calling, drinking)
  // Per-frame penalties are small since history can have many entries per second
  const PENALTY_PER_FRAME = { Sleeping: 3, Eating: 2, Playing: 2, Calling: 2, Drinking: 1 };

  const scores = useMemo<StudentScore[]>(() => {
    return filteredStudents.map(s => {
      const engagement = s.engagementScore ?? 50;
      const focus = s.engagementStatus === 'HIGH' ? 85 : s.engagementStatus === 'MEDIUM' ? 60 : 35;

      const history = s.history || [];
      let participationPenalty = 0;
      history.forEach(h => {
        const act = h.action || '';
        if (act === 'Sleeping') participationPenalty += PENALTY_PER_FRAME.Sleeping;
        else if (act === 'Eating') participationPenalty += PENALTY_PER_FRAME.Eating;
        else if (act === 'Playing') participationPenalty += PENALTY_PER_FRAME.Playing;
        else if (act === 'Calling') participationPenalty += PENALTY_PER_FRAME.Calling;
        else if (act === 'Drinking') participationPenalty += PENALTY_PER_FRAME.Drinking;
      });
      // Also decrease with phone alerts
      participationPenalty += (s.sessionAlertCount ?? 0) * 15;
      const participation = Math.max(0, Math.min(100, 100 - participationPenalty));

      // Behavioral: start at 100, decrease with phone alerts
      const behavioral = Math.max(0, 100 - (s.sessionAlertCount ?? 0) * 20);

      const overall = Math.round((engagement + focus + participation + behavioral) / 4);
      return { id: s.id, name: s.name || s.id, engagement, focus: Math.round(focus), participation: Math.round(participation), behavioral, overall };
    });
  }, [filteredStudents]);

  const sorted = useMemo(() => {
    return [...scores].sort((a, b) => sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
  }, [scores, sortKey, sortDir]);

  const top3 = useMemo(() => [...scores].sort((a,b)=>b.overall-a.overall).slice(0,3), [scores]);
  const bottom3 = useMemo(() => [...scores].sort((a,b)=>a.overall-b.overall).slice(0,3), [scores]);

  const toggleSort = (key: keyof StudentScore) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const radarData = selected ? [
    { subject: 'Engagement', value: selected.engagement },
    { subject: 'Focus', value: selected.focus },
    { subject: 'Participation', value: selected.participation },
    { subject: 'Behavioral', value: selected.behavioral },
  ] : [];

  const SortIcon = ({ col }: { col: keyof StudentScore }) => sortKey === col
    ? (sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>)
    : null;

  const scoreColor = (v: number) => v >= 70 ? 'text-green-400' : v >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-2 gap-4">
        {/* Top 3 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><Trophy size={12}/> Top Performers</h3>
          <div className="space-y-2">
            {top3.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 bg-green-900/10 border border-green-800/20 rounded p-2">
                <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <span className="flex-1 text-white text-sm">{s.name}</span>
                <span className="text-green-400 font-bold">{s.overall}%</span>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom 3 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase">Needs Improvement</h3>
          <div className="space-y-2">
            {bottom3.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-red-900/10 border border-red-800/20 rounded p-2">
                <span className="text-sm">⚠️</span>
                <span className="flex-1 text-white text-sm">{s.name}</span>
                <span className="text-red-400 font-bold">{s.overall}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Scores table */}
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900">
                <th className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">Student</th>
                {(['engagement','focus','participation','behavioral','overall'] as const).map(col => (
                  <th key={col} className="text-center text-xs text-gray-400 font-mono uppercase px-2 py-3 cursor-pointer hover:text-white select-none" onClick={() => toggleSort(col)}>
                    <span className="flex items-center justify-center gap-1">{col.charAt(0).toUpperCase() + col.slice(1)} <SortIcon col={col}/></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={6} className="text-center text-gray-500 py-8">No students detected.</td></tr>}
              {sorted.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors ${selected?.id === s.id ? 'bg-hud-cyan/5 border-hud-cyan/20' : ''}`}>
                  <td className="px-4 py-2.5 text-white font-medium text-xs">{s.name}</td>
                  {(['engagement','focus','participation','behavioral','overall'] as const).map(col => (
                    <td key={col} className={`text-center px-2 py-2.5 text-xs font-bold ${col === 'overall' ? 'text-white' : scoreColor(s[col])}`}>{s[col]}%</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Radar chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-gray-400 font-mono mb-2 text-xs uppercase">Student Radar</h3>
          {!selected ? (
            <div className="text-gray-600 text-xs text-center py-16">Click a student to see radar chart</div>
          ) : (
            <>
              <div className="text-hud-cyan text-sm font-bold mb-3">{selected.name}</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333"/>
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#aaa' }}/>
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={false}/>
                  <Radar dataKey="value" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.2}/>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                </RadarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
