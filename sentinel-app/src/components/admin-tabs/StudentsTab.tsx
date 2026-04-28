import React, { useState, useEffect } from 'react';
import { DetectionData } from '../../types';
import { X, Activity, Smile, Zap, Smartphone, TrendingUp, FileText, RefreshCw, AlertCircle, Focus, Battery, Shield } from 'lucide-react';
import { TabProps } from './types';
import { ATTENDANCE_COLORS, EMOTION_EMOJI } from '../../constants';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF003C'];

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface StudentDetailProps {
  student: DetectionData;
  onClose: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, onClose }) => {
  const historyData = student.history || [];
  const emotionCounts = historyData.reduce((acc, curr) => {
    acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const emotionData = Object.keys(emotionCounts).map(key => ({ name: key, value: emotionCounts[key] }));
  const phoneEvents = historyData.filter(h => h.phone);

  const getStabilityIcon = (status?: string) => {
    switch (status) {
      case 'LOCKED': return <Shield size={14} className="text-green-500" />;
      case 'STABLE': return <Shield size={14} className="text-blue-500" />;
      default: return <Shield size={14} className="text-red-500" />;
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-6 flex flex-col animate-fadeIn overflow-hidden">
      <div className="flex justify-between items-start mb-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-mono font-bold text-white mb-1 flex items-center gap-3">
            {student.name}
            <span className="text-sm bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-gray-400">{student.rollNo}</span>
            {(student.sessionAlertCount ?? 0) > 0 && (
              <span className="text-sm bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30 text-orange-400">⚠ {student.sessionAlertCount} alerts</span>
            )}
          </h2>
          <div className="flex gap-4 text-sm text-gray-400 mb-2">
            {student.branch && <span>📚 {student.branch}</span>}
            {student.email && <span>📧 {student.email}</span>}
          </div>
          <div className="flex gap-6 text-sm font-mono text-gray-400 flex-wrap">
            <span className="flex items-center gap-2"><Activity size={14} className="text-hud-cyan" /> Engagement: <span className="text-white font-bold">{student.engagementScore}%</span></span>
            <span className="flex items-center gap-2"><Smile size={14} className="text-yellow-400" /> Emotion: <span className="text-white">{EMOTION_EMOJI[student.emotion!] || ''} {student.emotion}</span></span>
            <span className="flex items-center gap-2"><Zap size={14} className="text-orange-500" /> Action: <span className="text-white">{student.engagementAction || student.action}</span></span>
            <span className="flex items-center gap-2"><Focus size={14} className="text-purple-500" /> Focus Streak: <span className="text-white">{student.focusStreak}s</span></span>
            <span className="flex items-center gap-2">{getStabilityIcon(student.stabilityStatus)} Stability: <span className="text-white">{student.stabilityStatus}</span></span>
            <span className={`font-bold ${ATTENDANCE_COLORS[student.attendanceStatus || 'ABSENT']?.split(' ')[0]}`}>{student.attendanceStatus}</span>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-all font-mono text-xs">
          <X size={16} /> CLOSE
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex-1 flex flex-col">
            <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><TrendingUp size={14} /> Engagement Timeline</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorEngDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="timeLabel" stroke="#666" fontSize={9} />
                  <YAxis stroke="#666" fontSize={9} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                  <Area type="monotone" dataKey="engagement" stroke="#00ff41" fill="url(#colorEngDetail)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col min-h-[12rem]">
            <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2 flex-shrink-0"><Smartphone size={14} /> Phone Detection Timeline</h3>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1">
              {phoneEvents.length === 0 ? (
                <div className="text-gray-600 text-xs text-center py-4">No phone detections recorded</div>
              ) : phoneEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between bg-red-900/20 border border-red-800/30 px-3 py-1.5 rounded text-xs">
                  <span className="text-red-400 font-mono">{ev.timeLabel}</span>
                  <span className="text-gray-400">{ev.action}</span>
                  <span className={`font-bold ${ev.engagement > 50 ? 'text-green-500' : 'text-red-500'}`}>{ev.engagement}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl h-48 flex flex-col">
            <h3 className="text-gray-400 font-mono mb-2 text-xs uppercase">Emotion Distribution</h3>
            <div className="flex-1 min-h-0">
              {emotionData.length === 0 ? (
                <div className="text-gray-600 text-center pt-8 text-xs">No emotion data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#666" fontSize={9} />
                    <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #555' }} />
                    <Bar dataKey="value" fill="#00f0ff" radius={[0, 4, 4, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex-1 flex flex-col overflow-hidden">
            <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2"><FileText size={14} /> Session Logs</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {historyData.length === 0 && <div className="text-center text-gray-600 py-4 text-xs">No logs yet.</div>}
              {historyData.slice().reverse().map((log, idx) => (
                <div key={idx} className="p-2 bg-black/50 rounded border border-gray-800 text-xs font-mono flex justify-between items-center">
                  <span className="text-gray-500">{log.timeLabel}</span>
                  <div className="flex items-center gap-2">
                    <span className={log.engagement > 50 ? 'text-green-500' : 'text-red-500'}>{log.engagement}%</span>
                    <span className="text-white truncate max-w-16">{log.action}</span>
                    {log.phone && <Smartphone size={10} className="text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentsTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const [selected, setSelected] = useState<DetectionData | null>(null);
  const [students, setStudents] = useState<DetectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch students from API
  const fetchStudents = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/students/attendance`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.students) {
        setStudents(data.students);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to connect to server. Please ensure the Flask server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Start a new session
  const startSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Computer Science',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSessionId(data.sessionId);
        console.log('Session started:', data.sessionId);
      }
    } catch (err) {
      console.error('Error starting session:', err);
    }
  };

  // Update student metrics
  const updateStudentMetrics = async (studentId: string, updates: Partial<DetectionData>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/attendance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          sessionId: currentSessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId
            ? { ...student, ...updates }
            : student
        )
      );
    } catch (err) {
      console.error('Error updating student metrics:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    startSession(); // Auto-start session when component mounts

    // Refresh student list every 30 seconds
    const interval = setInterval(fetchStudents, 30000);

    return () => clearInterval(interval);
  }, []);

  // Use filteredStudents if provided, otherwise use fetched students
  const displayStudents = filteredStudents && filteredStudents.length > 0
    ? filteredStudents
    : students;

  // Calculate summary statistics
  const summaryStats = {
    total: displayStudents.length,
    present: displayStudents.filter(s => s.attendanceStatus === 'PRESENT').length,
    absent: displayStudents.filter(s => s.attendanceStatus === 'ABSENT').length,
    late: displayStudents.filter(s => s.attendanceStatus === 'LATE').length,
    bunk: displayStudents.filter(s => s.attendanceStatus === 'BUNK').length,
    avgEngagement: Math.round(displayStudents.reduce((sum, s) => sum + (s.engagementScore || 0), 0) / displayStudents.length) || 0,
    phoneViolations: displayStudents.reduce((sum, s) => sum + (s.sessionAlertCount || 0), 0),
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hud-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading students...</p>
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
            onClick={fetchStudents}
            className="px-4 py-2 bg-hud-cyan text-black rounded-lg hover:bg-hud-cyan/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto custom-scrollbar">
      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-3 mb-6 px-2">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-2xl font-bold text-white">{summaryStats.total}</div>
        </div>
        <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
          <div className="text-xs text-green-400">Present</div>
          <div className="text-2xl font-bold text-green-500">{summaryStats.present}</div>
        </div>
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
          <div className="text-xs text-red-400">Absent</div>
          <div className="text-2xl font-bold text-red-500">{summaryStats.absent}</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3">
          <div className="text-xs text-yellow-400">Late</div>
          <div className="text-2xl font-bold text-yellow-500">{summaryStats.late}</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-3">
          <div className="text-xs text-purple-400">Avg Engagement</div>
          <div className="text-2xl font-bold text-purple-500">{summaryStats.avgEngagement}%</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-800/30 rounded-lg p-3">
          <div className="text-xs text-orange-400">Phone Violations</div>
          <div className="text-2xl font-bold text-orange-500">{summaryStats.phoneViolations}</div>
        </div>
      </div>

      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="text-sm text-gray-400">
          Session ID: {currentSessionId ? currentSessionId.slice(0, 8) : 'Not started'}...
        </div>
        <button
          onClick={fetchStudents}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-all text-xs disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-4 gap-4 animate-fadeIn pb-20">
        {displayStudents.length === 0 && (
          <div className="col-span-4 text-center text-gray-500 py-20">
            No students found in the database.
          </div>
        )}
        {displayStudents.map(s => (
          <div key={s.id} onClick={() => setSelected(s)}
            className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-hud-cyan transition-colors cursor-pointer group">
            <div className="flex flex-col items-center mb-4">
              {s.photo ? (
                <img
                  src={s.photo}
                  alt={s.name}
                  className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-gray-600 group-hover:border-hud-cyan transition-colors"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-700 mb-3 border-2 border-gray-600 flex items-center justify-center text-2xl font-bold text-gray-400">
                  {s.name?.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h3 className="text-base font-bold text-white">{s.name}</h3>
              <div className="text-xs text-hud-cyan font-mono">{s.rollNo || s.id.slice(0, 8)}</div>
              {s.focusFire && (
                <div className="text-xs text-orange-500 mt-1 animate-pulse">🔥 Focus Streak!</div>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Engagement</span>
                  <span className="flex items-center gap-1">
                    {s.engagementStatus === 'HIGH' && <Zap size={10} className="text-green-500" />}
                    {s.engagementStatus === 'MEDIUM' && <Activity size={10} className="text-yellow-500" />}
                    {s.engagementStatus === 'LOW' && <AlertCircle size={10} className="text-red-500" />}
                    {s.engagementScore || 0}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${(s.engagementScore || 0) > 70 ? 'bg-green-500' :
                        (s.engagementScore || 0) > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${s.engagementScore || 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-gray-900 p-1.5 rounded border border-gray-700 text-center">
                  <div className="text-gray-500 text-[10px]">Action</div>
                  <div className="text-white font-bold truncate text-xs">{s.engagementAction || s.action || 'N/A'}</div>
                </div>
                <div className="bg-gray-900 p-1.5 rounded border border-gray-700 text-center">
                  <div className="text-gray-500 text-[10px]">Emotion</div>
                  <div className="text-white font-bold truncate text-xs flex items-center justify-center gap-1">
                    {EMOTION_EMOJI[s.emotion || 'Neutral']} {s.emotion || 'Neutral'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.attendanceStatus === 'PRESENT' ? 'bg-green-500/20 text-green-500' :
                      s.attendanceStatus === 'LATE' ? 'bg-yellow-500/20 text-yellow-500' :
                        s.attendanceStatus === 'BUNK' ? 'bg-red-500/20 text-red-500' :
                          'bg-gray-500/20 text-gray-400'
                    }`}>
                    {s.attendanceStatus || 'ABSENT'}
                  </span>
                  {s.focusStreak && s.focusStreak > 10 && (
                    <span className="text-xs text-purple-500">🔥{s.focusStreak}s</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {(s.sessionAlertCount ?? 0) > 0 && (
                    <span className="text-xs text-orange-500 font-bold">⚠{s.sessionAlertCount}</span>
                  )}
                  {s.phoneDetected && <Smartphone size={12} className="text-red-500 animate-pulse" />}
                  {s.stabilityStatus === 'LOCKED' && <Shield size={12} className="text-green-500" />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && <StudentDetail student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};