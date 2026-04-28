import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Brain, Award, RefreshCw, AlertCircle, Activity, Smile, Zap } from 'lucide-react';
import { TabProps } from './types';
import { TeacherDashboard } from '../TeacherDashboard';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { TeacherData } from '../../types';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface ExtendedTabProps extends TabProps {
  teacherList?: any[];
  studentList?: any[];
  isTeacherInvisible?: boolean;
  toggleTeacherInvisibility?: () => void;
}

export const TeachersTab: React.FC<ExtendedTabProps> = ({
  teacherList: propTeacherList = [],
  studentList = [],
  isTeacherInvisible = false,
  toggleTeacherInvisibility = () => { },
}) => {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch teachers from API
  const fetchTeachers = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/teachers/attendance`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.teachers) {
        setTeachers(data.teachers);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch teachers');
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to connect to server. Please ensure the Flask server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeachers();

    // Refresh teacher list every 30 seconds
    const interval = setInterval(fetchTeachers, 30000);

    return () => clearInterval(interval);
  }, []);

  // Use prop teacherList if provided, otherwise use fetched teachers
  const displayTeachers = propTeacherList.length > 0 ? propTeacherList : teachers;

  const avgEng = displayTeachers.length > 0
    ? Math.round(displayTeachers.reduce((a, b) => a + (b.engagementScore || 0), 0) / displayTeachers.length) : 0;
  const classAvg = studentList.length > 0
    ? Math.round(studentList.reduce((a, b) => a + (b.engagementScore || 0), 0) / studentList.length) : 0;

  // Build correlation dataset from student histories
  const correlationData = (() => {
    const maxLen = 10;
    const points: { time: string; teacherEng: number; classEng: number }[] = [];
    const teacherHistory = displayTeachers[0]?.history || [];
    for (let i = 0; i < Math.min(maxLen, teacherHistory.length); i++) {
      const t = teacherHistory[i];
      const studentAvgAt = studentList.length > 0
        ? Math.round(studentList.reduce((a, s) => {
          const h = s.history?.[i];
          return a + (h?.engagement ?? s.engagementScore ?? 50);
        }, 0) / studentList.length) : classAvg;
      points.push({ time: t.timeLabel, teacherEng: t.engagement, classEng: studentAvgAt });
    }
    if (points.length === 0) {
      return [
        { time: 'Now', teacherEng: avgEng, classEng: classAvg },
      ];
    }
    return points;
  })();

  // Dynamic AI recommendations based on actual data
  const getAIRecommendations = () => {
    const recommendations = [];

    if (avgEng > 75) {
      recommendations.push({
        icon: '🎯',
        text: 'Class engagement is excellent! Maintain current teaching pace.',
        type: 'positive'
      });
    } else if (avgEng < 50) {
      recommendations.push({
        icon: '⚠️',
        text: 'Low engagement detected. Consider interactive activities or breaks.',
        type: 'alert'
      });
    } else {
      recommendations.push({
        icon: '💡',
        text: 'Engagement is moderate. Try incorporating more visual elements.',
        type: 'suggestion'
      });
    }

    if (displayTeachers.length > 0 && displayTeachers[0].emotion === 'Tired') {
      recommendations.push({
        icon: '😊',
        text: 'Teacher shows signs of fatigue. Consider a short break.',
        type: 'suggestion'
      });
    }

    recommendations.push({
      icon: '⚡',
      text: avgEng > 70 ? 'Peak attention detected — optimal time for key concepts.' : 'Monitor engagement levels closely in the next 5 minutes.',
      type: 'alert'
    });

    return recommendations;
  };

  const aiRecommendations = getAIRecommendations();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hud-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading teachers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchTeachers}
            className="px-4 py-2 bg-hud-cyan text-black rounded-lg hover:bg-hud-cyan/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pb-20 custom-scrollbar animate-fadeIn min-h-0">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700 flex-shrink-0">
        <div>
          <h3 className="text-white font-bold font-mono">TEACHER MANAGEMENT</h3>
          <div className="text-xs text-gray-400">
            Total Teachers: <span className="text-hud-cyan font-bold">{displayTeachers.length}</span>
          </div>
        </div>
        <button
          onClick={fetchTeachers}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-all text-xs disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Mode Control */}
      <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700 flex-shrink-0">
        <div>
          <h3 className="text-white font-bold font-mono">TEACHER STATUS CONTROL</h3>
          <div className="text-xs text-gray-400">Toggle monitoring vs. teaching mode visibility</div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded border border-gray-600">
            <div className={`w-2 h-2 rounded-full ${isTeacherInvisible ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-xs font-mono text-white">{isTeacherInvisible ? 'HIDDEN (MONITORING)' : 'VISIBLE (TEACHING)'}</span>
          </div>
          <button onClick={toggleTeacherInvisibility}
            className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold border transition-all ${isTeacherInvisible ? 'bg-hud-green text-black border-hud-green' : 'bg-gray-700 text-white border-gray-600'}`}>
            {isTeacherInvisible ? <Eye size={14} /> : <EyeOff size={14} />}
            {isTeacherInvisible ? 'SWITCH TO TEACHING MODE' : 'SWITCH TO MONITORING MODE'}
          </button>
        </div>
      </div>

      {/* Teacher Cards Grid */}
      {displayTeachers.length > 0 && (
        <div className="grid grid-cols-2 gap-4 flex-shrink-0">
          {displayTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="flex items-center gap-4">
                {teacher.photo ? (
                  <img
                    src={teacher.photo}
                    alt={teacher.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-hud-cyan"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-hud-cyan">
                    {teacher.name?.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{teacher.name}</h3>
                  <div className="text-xs text-hud-cyan font-mono">{teacher.subject || 'No Subject'}</div>
                  <div className="flex gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs">
                      <Activity size={12} className="text-hud-cyan" />
                      <span className="text-white">{teacher.engagementScore || 0}%</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Smile size={12} className="text-yellow-400" />
                      <span className="text-white">{teacher.emotion || 'Neutral'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Zap size={12} className="text-orange-500" />
                      <span className="text-white">{teacher.action || 'Teaching'}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Engagement Status:</span>
                  <span className={`font-bold ${teacher.engagementStatus === 'HIGH' ? 'text-green-500' :
                    teacher.engagementStatus === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                    {teacher.engagementStatus || 'HIGH'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full bg-hud-cyan transition-all duration-300"
                    style={{ width: `${teacher.engagementScore || 85}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {displayTeachers.length === 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
          <p className="text-gray-400">No teachers found in the database.</p>
          <p className="text-xs text-gray-500 mt-2">Register a teacher to see them here.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 flex-shrink-0">
        {/* Correlation chart */}
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '14rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <TrendingUp size={14} /> Teacher vs. Class Engagement Correlation
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={correlationData}>
              <defs>
                <linearGradient id="colorTeacherCorr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClassCorr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" fontSize={9} />
              <YAxis stroke="#666" fontSize={9} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Area type="monotone" dataKey="teacherEng" stroke="#00ff41" fill="url(#colorTeacherCorr)" name="Teacher" />
              <Area type="monotone" dataKey="classEng" stroke="#00f0ff" fill="url(#colorClassCorr)" name="Class Avg" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" style={{ height: '14rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <Brain size={14} /> AI Recommendations
          </h3>
          <div className="space-y-2 overflow-y-auto h-40 custom-scrollbar">
            {aiRecommendations.map((r, i) => (
              <div key={i} className={`p-2 rounded text-xs border ${r.type === 'positive' ? 'border-green-800/40 bg-green-900/10 text-green-300' : r.type === 'alert' ? 'border-orange-800/40 bg-orange-900/10 text-orange-300' : 'border-hud-cyan/20 bg-hud-cyan/5 text-gray-300'}`}>
                <span className="mr-1">{r.icon}</span> {r.text}
              </div>
            ))}
            {displayTeachers.length === 0 && <div className="text-gray-600 text-center py-4">No teacher detected — recommendations unavailable.</div>}
          </div>
        </div>
      </div>

      {/* Teacher Dashboard */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <TeacherDashboard teachers={displayTeachers} sessionDuration="Session Active" avgEngagement={avgEng} />
      </div>
    </div>
  );
};