import React, { useState } from 'react';
import { Target, Edit3, CheckCircle } from 'lucide-react';
import { TabProps } from './types';

interface Goal {
  id: string;
  label: string;
  target: number;
  unit: string;
  actual: number;
  lowerBetter?: boolean;
  color: string;
  icon: string;
}

export const GoalsTab: React.FC<TabProps> = ({ filteredStudents, teacherList }) => {
  const allPeople = [...filteredStudents, ...teacherList];
  const classAvg = allPeople.length > 0
    ? Math.round(allPeople.reduce((a, b) => a + (b.engagementScore || 0), 0) / allPeople.length) : 0;
  const phoneViolations = allPeople.reduce((a, s) => a + (s.sessionAlertCount || 0), 0);
  const present = filteredStudents.filter(s => s.attendanceStatus === 'PRESENT').length;
  const attendanceRate = filteredStudents.length > 0 ? Math.round((present / filteredStudents.length) * 100) : 0;
  const happyCount = allPeople.filter(s => ['Happy', 'Joy', 'Focused'].includes(s.emotion || '')).length;
  const moodRate = allPeople.length > 0 ? Math.round((happyCount / allPeople.length) * 100) : 0;

  const [goals] = useState<Goal[]>([
    { id: 'g1', label: 'Class Engagement', target: 80, unit: '%', actual: classAvg, color: '#00f0ff', icon: '📈' },
    { id: 'g2', label: 'Zero Phone Violations', target: 0, unit: '', actual: phoneViolations, lowerBetter: true, color: '#ff7c7c', icon: '📵' },
    { id: 'g3', label: 'Attendance Rate', target: 90, unit: '%', actual: attendanceRate, color: '#00ff41', icon: '✅' },
    { id: 'g4', label: 'Positive Mood', target: 70, unit: '%', actual: moodRate, color: '#ffc658', icon: '😊' },
  ]);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Goal cards */}
      <div className="grid grid-cols-2 gap-5">
        {goals.map(goal => {
          const pct = goal.lowerBetter
            ? (goal.actual === 0 ? 100 : Math.max(0, 100 - goal.actual * 20))
            : Math.min(100, goal.target > 0 ? Math.round((goal.actual / goal.target) * 100) : 0);
          const achieved = goal.lowerBetter ? goal.actual <= goal.target : goal.actual >= goal.target;
          return (
            <div key={goal.id} className={`bg-gray-800 rounded-xl border p-5 ${achieved ? 'border-green-700/40' : 'border-gray-700'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xl mr-2">{goal.icon}</span>
                  <span className="text-white font-bold">{goal.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {achieved && <CheckCircle size={16} className="text-green-400"/>}
                  <button className="text-gray-500 hover:text-gray-300">
                    <Edit3 size={14}/>
                  </button>
                </div>
              </div>

              <div className="flex items-end gap-4 mb-4">
                <div>
                  <div className="text-4xl font-bold text-white">{goal.actual}{goal.unit}</div>
                  <div className="text-xs text-gray-400">current</div>
                </div>
                <div className="text-gray-600 text-xl mb-2">/</div>
                <div>
                  <div className="text-2xl font-bold text-gray-500">{goal.target}{goal.unit}</div>
                  <div className="text-xs text-gray-500">target</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: achieved ? '#00ff41' : goal.color }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{pct}% of goal</span>
                  <span className={achieved ? 'text-green-400 font-bold' : 'text-gray-400'}>
                    {achieved ? 'Goal Achieved! ✓' : `${Math.abs(goal.actual - goal.target)}${goal.unit} to go`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase">Session Progress Summary</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Goals Met', value: goals.filter(g => g.lowerBetter ? g.actual <= g.target : g.actual >= g.target).length, total: goals.length, color: 'text-green-400' },
            { label: 'In Progress', value: goals.filter(g => g.lowerBetter ? g.actual > g.target : g.actual < g.target).length, total: goals.length, color: 'text-yellow-400' },
            { label: 'Class Avg', value: `${classAvg}%`, total: null, color: 'text-hud-cyan' },
            { label: 'Attendance', value: `${attendanceRate}%`, total: null, color: 'text-blue-400' },
          ].map(({ label, value, total, color }) => (
            <div key={label} className="text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}{total !== null ? `/${total}` : ''}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
