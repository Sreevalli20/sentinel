import React, { useMemo } from 'react';
import { Brain, AlertTriangle, Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { TabProps } from './types';

export const AIInsightsTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const classAvg = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((a, b) => a + (b.engagementScore || 0), 0) / filteredStudents.length) : 0;

  const interventions = useMemo(() =>
    filteredStudents.filter(s => (s.engagementScore ?? 0) < 40)
      .sort((a, b) => (a.engagementScore ?? 0) - (b.engagementScore ?? 0)),
    [filteredStudents]);

  const suggestions = useMemo(() => {
    const list: { icon: string; text: string; priority: 'high' | 'medium' | 'low' }[] = [];
    if (classAvg < 50) list.push({ icon: '🚨', text: 'Class engagement critically low — consider interactive activity or short break.', priority: 'high' });
    if (classAvg >= 50 && classAvg < 70) list.push({ icon: '💡', text: 'Engagement below target. Try a quick knowledge check or group activity.', priority: 'medium' });
    if (classAvg >= 70) list.push({ icon: '✅', text: 'Class engagement is healthy. Optimal moment to introduce complex topics.', priority: 'low' });
    const phoneUsers = filteredStudents.filter(s => s.phoneDetected).length;
    if (phoneUsers > 2) list.push({ icon: '📵', text: `${phoneUsers} students using phones — address now to prevent further spread.`, priority: 'high' });
    const dominant = filteredStudents.reduce((acc, s) => { if (s.emotion) acc[s.emotion] = (acc[s.emotion] || 0) + 1; return acc; }, {} as Record<string,number>);
    const topEmotion = Object.entries(dominant).sort((a,b)=>b[1]-a[1])[0]?.[0];
    if (topEmotion === 'Bored' || topEmotion === 'Sad') list.push({ icon: '😔', text: `Dominant emotion: ${topEmotion}. Consider energizer activity or change of pace.`, priority: 'medium' });
    if (topEmotion === 'Happy' || topEmotion === 'Joy') list.push({ icon: '😊', text: `Positive mood detected (${topEmotion}). Students are receptive — great teaching moment.`, priority: 'low' });
    if (list.length === 0) list.push({ icon: '🎯', text: 'Session progressing normally. Continue current teaching approach.', priority: 'low' });
    return list;
  }, [filteredStudents, classAvg]);

  const patternCards = useMemo(() => {
    const totalAlerts = filteredStudents.reduce((a,s)=>a+(s.sessionAlertCount||0),0);
    const highFocus = filteredStudents.filter(s=>(s.engagementScore??0)>=70).length;
    const lowFocus = filteredStudents.filter(s=>(s.engagementScore??0)<50).length;
    return [
      { label: 'Focused Students', value: `${highFocus}/${filteredStudents.length}`, color: 'text-green-400', desc: 'Engagement ≥ 70%' },
      { label: 'Needs Attention', value: `${lowFocus}/${filteredStudents.length}`, color: 'text-red-400', desc: 'Engagement < 50%' },
      { label: 'Phone Alerts', value: totalAlerts, color: 'text-orange-400', desc: 'Session total' },
      { label: 'Predictive Score', value: `${Math.min(100, Math.round(classAvg * 1.05))}%`, color: 'text-purple-400', desc: 'Projected end-of-session' },
    ];
  }, [filteredStudents, classAvg]);

  const priorityColors = { high: 'border-red-700/40 bg-red-900/10', medium: 'border-yellow-700/40 bg-yellow-900/10', low: 'border-green-700/40 bg-green-900/10' };
  const priorityTextColors = { high: 'text-red-300', medium: 'text-yellow-300', low: 'text-green-300' };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Pattern cards */}
      <div className="grid grid-cols-4 gap-4">
        {patternCards.map(({ label, value, color, desc }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-white font-mono mt-1">{label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Intervention list */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-white font-mono mb-4 flex items-center gap-2">
            <AlertTriangle size={16}/> STUDENTS NEEDING INTERVENTION
            <span className="text-xs text-red-400 bg-red-900/20 px-2 py-0.5 rounded-full">{interventions.length} students below 40%</span>
          </h3>
          {interventions.length === 0 ? (
            <div className="text-green-400 text-center py-8 text-sm">All students are above intervention threshold ✓</div>
          ) : (
            <div className="space-y-2">
              {interventions.map(s => (
                <div key={s.id} className="bg-red-900/10 border border-red-800/30 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center text-white text-xs font-bold">
                    {s.name?.slice(0,1)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-bold">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.emotion} • {s.action}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-bold text-lg">{s.engagementScore}%</div>
                    {(s.sessionAlertCount ?? 0) > 0 && <div className="text-xs text-orange-400">⚠ {s.sessionAlertCount} alerts</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teaching suggestions */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-white font-mono mb-4 flex items-center gap-2">
            <Lightbulb size={16}/> TEACHING SUGGESTIONS
          </h3>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className={`${priorityColors[s.priority]} border rounded-lg p-3`}>
                <div className={`text-sm ${priorityTextColors[s.priority]}`}>
                  <span className="mr-2 text-base">{s.icon}</span>{s.text}
                </div>
                <div className={`text-xs mt-1 uppercase font-mono ${priorityTextColors[s.priority]} opacity-60`}>{s.priority} priority</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive accuracy */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-white font-mono mb-4 flex items-center gap-2">
          <Brain size={16}/> AI MODEL PERFORMANCE
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Emotion Detection', acc: 87, color: '#00f0ff' },
            { label: 'Engagement Prediction', acc: 82, color: '#00ff41' },
            { label: 'Phone Detection', acc: 94, color: '#ffc658' },
            { label: 'Anomaly Detection', acc: 78, color: '#ff7c7c' },
          ].map(({ label, acc, color }) => (
            <div key={label} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#333" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
                    strokeDasharray={`${acc} ${100-acc}`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{acc}%</div>
              </div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
