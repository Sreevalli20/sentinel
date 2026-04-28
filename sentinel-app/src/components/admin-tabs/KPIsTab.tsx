import React, { useMemo } from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { TabProps } from './types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

interface KPI {
  label: string;
  actual: number;
  target: number;
  unit: string;
  lowerBetter?: boolean;
  color: string;
}

export const KPIsTab: React.FC<TabProps> = ({ filteredStudents, teacherList }) => {
  const kpis = useMemo<KPI[]>(() => {
    const total = filteredStudents.length;
    const present = filteredStudents.filter(s => s.attendanceStatus === 'PRESENT').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const classEngAvg = total > 0 ? Math.round(filteredStudents.reduce((a, b) => a + (b.engagementScore || 0), 0) / total) : 0;
    const studentsWithAlerts = filteredStudents.filter(s => (s.sessionAlertCount ?? 0) > 0).length;
    const phoneViolRate = total > 0 ? Math.round((studentsWithAlerts / total) * 100) : 0;
    const teacherEng = teacherList.length > 0 ? Math.round(teacherList.reduce((a, b) => a + (b.engagementScore || 0), 0) / teacherList.length) : 0;
    return [
      { label: 'Attendance Rate', actual: attendanceRate, target: 90, unit: '%', color: '#00f0ff' },
      { label: 'Class Engagement', actual: classEngAvg, target: 80, unit: '%', color: '#00ff41' },
      { label: 'Phone Violation Rate', actual: phoneViolRate, target: 0, unit: '%', lowerBetter: true, color: '#ff7c7c' },
      { label: 'Teacher Effectiveness', actual: teacherEng, target: 85, unit: '%', color: '#a78bfa' },
    ];
  }, [filteredStudents, teacherList]);

  const barData = kpis.map(k => ({ name: k.label.split(' ').slice(-1)[0], actual: k.actual, target: k.target }));

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* KPI gauge cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const ratio = kpi.lowerBetter
            ? (kpi.target === 0 ? (kpi.actual === 0 ? 1 : 0) : (kpi.actual <= kpi.target ? 1 : Math.max(0, kpi.target / kpi.actual)))
            : (kpi.target === 0 ? 0 : Math.min(1, kpi.actual / kpi.target));
          const pct = Math.min(1, Math.max(0, ratio));
          const good = kpi.lowerBetter ? kpi.actual <= kpi.target : kpi.actual >= kpi.target;
          const Trend = kpi.actual >= kpi.target ? TrendingUp : TrendingDown;
          const trendColor = good ? 'text-green-400' : 'text-red-400';
          return (
            <div key={kpi.label} className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
              {/* Circular gauge */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#333" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={kpi.color} strokeWidth="3"
                    strokeDasharray={`${pct * 100} ${100 - pct * 100}`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">{kpi.actual}</span>
                  <span className="text-[9px] text-gray-500">{kpi.unit}</span>
                </div>
              </div>
              <div className="text-xs text-white font-mono mb-1">{kpi.label}</div>
              <div className="text-xs text-gray-500">Target: {kpi.target}{kpi.unit}</div>
              <div className={`flex items-center justify-center gap-1 mt-2 text-xs font-bold ${trendColor}`}>
                <Trend size={12}/>
                {good ? 'On Target' : (kpi.lowerBetter ? 'Above Target' : 'Below Target')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Target vs Actual chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5" style={{ height: '20rem' }}>
        <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
          <Target size={14}/> Target vs. Actual
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
            <XAxis dataKey="name" stroke="#666" fontSize={10}/>
            <YAxis stroke="#666" fontSize={10} domain={[0, 100]}/>
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
            <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }}/>
            <Bar dataKey="actual" fill="#00f0ff" radius={[4,4,0,0]} name="Actual"/>
            <Bar dataKey="target" fill="#444" radius={[4,4,0,0]} name="Target"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        {kpis.map(kpi => {
          const good = kpi.lowerBetter ? kpi.actual <= kpi.target : kpi.actual >= kpi.target;
          const diff = Math.abs(kpi.actual - kpi.target);
          return (
            <div key={kpi.label} className={`rounded-xl border p-4 flex items-center gap-4 ${good ? 'bg-green-900/10 border-green-800/30' : 'bg-red-900/10 border-red-800/30'}`}>
              <div className={`text-2xl font-bold ${good ? 'text-green-400' : 'text-red-400'}`}>{kpi.actual}{kpi.unit}</div>
              <div>
                <div className="text-white text-sm font-medium">{kpi.label}</div>
                <div className={`text-xs ${good ? 'text-green-400' : 'text-red-400'}`}>
                  {good ? `✓ ${diff}${kpi.unit} ${kpi.lowerBetter ? 'below' : 'above'} target` : `${diff}${kpi.unit} ${kpi.lowerBetter ? 'above' : 'below'} target`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
