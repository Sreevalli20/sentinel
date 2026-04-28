import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Smartphone } from 'lucide-react';
import { TabProps } from './types';

interface Anomaly {
  studentId: string;
  studentName: string;
  type: 'low-engagement' | 'sudden-drop' | 'outlier' | 'phone-violation';
  severity: 'high' | 'medium';
  description: string;
  value: number;
  classAvg: number;
}

export const AnomalyTab: React.FC<TabProps> = ({ filteredStudents, teacherList }) => {
  const allPeople = [...filteredStudents, ...teacherList];
  const anomalies = useMemo<Anomaly[]>(() => {
    const list: Anomaly[] = [];
    const mean = allPeople.length > 0
      ? allPeople.reduce((a, s) => a + (s.engagementScore ?? 0), 0) / allPeople.length
      : 0;

    // Phone violations = anomalies
    allPeople.forEach(s => {
      const count = s.sessionAlertCount ?? 0;
      if (count > 0) {
        list.push({
          studentId: `phone-${s.id}`,
          studentName: s.name || s.id,
          type: 'phone-violation',
          severity: count >= 3 ? 'high' : 'medium',
          description: `Phone usage detected — ${count} violation(s) this session`,
          value: count,
          classAvg: Math.round(mean),
        });
      }
    });

    if (allPeople.length < 2) return list.sort((a, b) => (a.severity === 'high' ? 0 : 1) - (b.severity === 'high' ? 0 : 1));

    allPeople.forEach(s => {
      const score = s.engagementScore ?? 0;

      // Sudden drop detection
      const history = s.history || [];
      if (history.length >= 3) {
        const recent = history[history.length - 1].engagement;
        const prev = history[history.length - 3].engagement;
        const drop = prev - recent;
        if (drop >= 30) {
          list.push({
            studentId: `drop-${s.id}`,
            studentName: s.name || s.id,
            type: 'sudden-drop',
            severity: drop >= 50 ? 'high' : 'medium',
            description: `Sudden ${drop}-point engagement drop detected`,
            value: recent,
            classAvg: Math.round(mean),
          });
        }
      }

      // Critically low
      if (score < 25) {
        list.push({
          studentId: `crit-${s.id}`,
          studentName: s.name || s.id,
          type: 'low-engagement',
          severity: 'high',
          description: `Critically low engagement — immediate intervention needed`,
          value: score,
          classAvg: Math.round(mean),
        });
      }
    });

    return list.sort((a, b) => (a.severity === 'high' ? 0 : 1) - (b.severity === 'high' ? 0 : 1));
  }, [allPeople]);

  const scores = allPeople.map(s => s.engagementScore ?? 0);
  const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const classAvg = Math.round(mean);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Anomalies Detected', value: anomalies.length, color: anomalies.length > 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'Class Average', value: `${classAvg}%`, color: 'text-hud-cyan' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Distribution visualization */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase">Engagement Distribution — All Students</h3>
        <div className="flex items-end gap-1 h-20">
          {allPeople.map(s => {
            const score = s.engagementScore ?? 0;
            const isAnomaly = anomalies.some(a => a.studentId === s.id || a.studentId === `phone-${s.id}` || a.studentId === `drop-${s.id}` || a.studentId === `crit-${s.id}`);
            return (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-0.5" title={`${s.name}: ${score}%`}>
                <div className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(4, score * 0.6)}px`,
                    backgroundColor: isAnomaly ? '#ef4444' : score >= 70 ? '#00ff41' : score >= 50 ? '#ffc658' : '#ff7c7c',
                  }}></div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0%</span>
          <span className="text-hud-cyan font-mono">Mean: {classAvg}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Anomaly list */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
          <AlertTriangle size={14}/> Detected Anomalies
        </h3>
        {anomalies.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-green-400 text-lg font-bold mb-2">✓ No Anomalies</div>
            <div className="text-gray-500 text-sm">All students are within normal engagement range.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((a) => (
              <div key={a.studentId} className={`border rounded-lg p-4 flex items-start gap-4 ${a.severity === 'high' ? 'border-red-700/40 bg-red-900/10' : 'border-yellow-700/40 bg-yellow-900/10'}`}>
                <div className={`p-2 rounded-lg flex-shrink-0 ${a.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {a.type === 'sudden-drop' ? <TrendingDown size={16}/> : a.type === 'phone-violation' ? <Smartphone size={16}/> : <AlertTriangle size={16}/>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold">{a.studentName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-mono ${a.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {a.severity}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{a.type.replace('-', ' ')}</span>
                  </div>
                  <div className="text-sm text-gray-300">{a.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Score: <span className="text-white font-bold">{a.value}%</span> vs class avg <span className="text-white font-bold">{a.classAvg}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
