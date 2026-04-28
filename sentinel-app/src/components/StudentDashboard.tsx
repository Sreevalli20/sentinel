import React, { useState, useEffect } from 'react';
import { DetectionData } from '../types';
import { EMOTION_EMOJI } from '../constants';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Clock, Eye, Smartphone } from 'lucide-react';

interface StudentDashboardProps {
  students: DetectionData[];
  sessionDuration?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ students, sessionDuration = '--' }) => {
  const [emotionData, setEmotionData] = useState<{ emotion: string; count: number; percentage: number }[]>([]);
  const [engagementData, setEngagementData] = useState<{ time: string; engagement: number }[]>([]);

  useEffect(() => {
    const emotionCounts: Record<string, number> = {};
    const engagementOverTime: { time: string; engagement: number }[] = [];

    students.forEach(student => {
      if (student.emotion) {
        emotionCounts[student.emotion] = (emotionCounts[student.emotion] || 0) + 1;
      }
      if (student.history?.length) {
        student.history.slice(-5).forEach((entry, i) => {
          engagementOverTime.push({
            time: entry.timeLabel || `T${i}`,
            engagement: entry.engagement ?? student.engagementScore ?? 0
          });
        });
      } else if (student.engagementScore != null) {
        engagementOverTime.push({ time: 'Current', engagement: student.engagementScore });
      }
    });

    const total = students.length || 1;
    setEmotionData(
      Object.entries(emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: Math.round((count / total) * 100)
      }))
    );
    setEngagementData(engagementOverTime.slice(-20));
  }, [students]);

  const COLORS = ['#00f0ff', '#00ff41', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
  const avgEngagement = students.length > 0
    ? Math.round(students.reduce((s, st) => s + (st.engagementScore || 0), 0) / students.length)
    : 0;
  const alertCount = students.reduce((a, s) => a + (s.sessionAlertCount ?? 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-hud-cyan/20 rounded-lg"><Users size={20} className="text-hud-cyan"/></div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Total Students</div>
              <div className="text-2xl font-bold text-white">{students.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg"><TrendingUp size={20} className="text-green-500"/></div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Avg Engagement</div>
              <div className="text-2xl font-bold text-white">{avgEngagement}%</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle size={20} className="text-red-500"/></div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Session Alerts</div>
              <div className="text-2xl font-bold text-white">{alertCount}</div>
              <div className="text-[10px] text-gray-500">(never resets)</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg"><Clock size={20} className="text-purple-500"/></div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Session</div>
              <div className="text-lg font-bold text-white">{sessionDuration}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-gray-400 font-mono mb-4 flex items-center gap-2">Emotion Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={emotionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ emotion, percentage }) => `${emotion}: ${percentage}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="count"
              >
                {emotionData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-gray-400 font-mono mb-4 flex items-center gap-2">Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="colorEngTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
              <Area type="monotone" dataKey="engagement" stroke="#00ff41" fill="url(#colorEngTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Student Cards */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <h3 className="text-gray-400 font-mono mb-4 flex items-center gap-2">Individual Student Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 py-10">No students detected.</div>
          )}
          {students.map(student => (
            <div key={student.id} className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 hover:border-hud-cyan/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white">{student.name}</h4>
                <span className="text-xs text-hud-cyan font-mono">{student.rollNo || student.id}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Engagement</span>
                  <span className={student.engagementScore! > 70 ? 'text-green-500' : student.engagementScore! > 40 ? 'text-yellow-500' : 'text-red-500'}>
                    {student.engagementScore}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Emotion</span>
                  <span className="text-white flex items-center gap-1">
                    {EMOTION_EMOJI[student.emotion!] || '😐'} {student.emotion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Action</span>
                  <span className="text-white">{student.action}</span>
                </div>
                {(student.sessionAlertCount ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                    <Smartphone size={12}/> {student.sessionAlertCount} alerts this session
                  </div>
                )}
                {(student.phoneDetected || student.phoneSustained) && (
                  <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                    <Smartphone size={12}/> Phone in hand now
                  </div>
                )}
                {(student.engagementStreak ?? 0) > 10 && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs">
                    <Eye size={12}/> Streak: {student.engagementStreak ?? 0}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
