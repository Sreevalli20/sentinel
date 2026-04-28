import React, { useState, useEffect } from 'react';
import { ViewState, SessionConfig, SessionStats, RegisteredUser } from './types';
import { Registration } from './components/Registration';
import { Monitoring } from './components/Monitoring';
import { Button } from './components/Button';
import { DatabaseView } from './components/DatabaseView';
import { ShieldCheck, Play, UserPlus, Clock, Download, FileText, WifiOff, CheckCircle, Activity, BookOpen, User, Users, Database, Mail, Loader2 } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { APP_NAME, VERSION, ATTENDANCE_COLORS } from './constants';

// API endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>(ViewState.HOME);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSavingSession, setIsSavingSession] = useState(false);
    const [emailStatus, setEmailStatus] = useState<string | null>(null);

    // CENTRAL STATE for Registered Users with Persistence
    const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
        try {
            const saved = localStorage.getItem('sentinel_users');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load users", e);
            return [];
        }
    });

    // Sync state to storage
    useEffect(() => {
        localStorage.setItem('sentinel_users', JSON.stringify(registeredUsers));
    }, [registeredUsers]);

    // Network Status Listeners
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        }
    }, []);

    // Helper to get current Local time for input fields
    const getLocalTimeInput = (offsetMinutes = 0) => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + offsetMinutes);
        return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    };

    const getLocalEndTimeInput = () => {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    };

    const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
        startTime: getLocalTimeInput(-30),
        endTime: getLocalEndTimeInput(),
        durationMinutes: 60,
        subject: "General Lecture"
    });
    const [lastStats, setLastStats] = useState<SessionStats | null>(null);

    const [sessionHistory, setSessionHistory] = useState<Array<{
        id: string; date: string; subject: string; duration: string;
        teacherId?: string; teacherName?: string; presentCount: number; totalStudents: number;
        avgEngagement: number; phoneIncidents: number;
        guestSummaries?: Array<{ id: string; name?: string; avgEngagement: number; phoneViolations: number; topEmotion: string; topAction: string }>;
    }>>(() => {
        try {
            const s = localStorage.getItem('sentinel_session_history');
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('sentinel_session_history', JSON.stringify(sessionHistory));
    }, [sessionHistory]);

    const handleEnterSetup = () => {
        setSessionConfig({
            startTime: getLocalTimeInput(-30),
            endTime: getLocalEndTimeInput(),
            durationMinutes: 60,
            subject: "General Lecture"
        });
        setView(ViewState.ATTENDANCE_SETUP);
    };

    const handleRegisterUser = (user: RegisteredUser) => {
        setRegisteredUsers(prev => [...prev, user]);
    };

    const handleDeleteUser = (id: string) => {
        setRegisteredUsers(prev => prev.filter(u => u.id !== id));
    };

    const handleExportCSV = () => {
        if (!lastStats) return;

        const headers = ["Name", "Roll No", "Email", "Status", "Avg Engagement", "Top Emotion", "Top Action"];
        const rows = lastStats.studentSummaries.map(s => [
            s.name,
            s.rollNo,
            s.email || 'N/A',
            s.attendanceStatus,
            `${s.avgEngagement}%`,
            s.topEmotion,
            s.topAction
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SENTINEL_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveSessionToBackend = async (stats: SessionStats): Promise<{ success: boolean, emailsSent?: number }> => {
        try {
            const sessionData = {
                subject: sessionConfig.subject,
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + sessionConfig.durationMinutes * 60000).toISOString(),
                stats: {
                    ...stats,
                    studentSummaries: stats.studentSummaries.map(s => ({
                        ...s,
                        email: s.email
                    }))
                }
            };

            console.log("💾 Saving session to backend:", sessionData);

            const response = await fetch(`${API_BASE_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Session saved to backend successfully:', result);
                return { success: true, emailsSent: result.emailsSent || 0 };
            } else {
                console.error('❌ Failed to save session to backend:', result);
                return { success: false };
            }
        } catch (error) {
            console.error('❌ Error saving session:', error);
            return { success: false };
        }
    };

    const handleFinishSession = async () => {
        if (!lastStats) {
            setView(ViewState.HOME);
            return;
        }

        setIsSavingSession(true);
        setEmailStatus("Saving session and sending emails...");

        try {
            // Save session to backend (this will trigger email notifications)
            const result = await saveSessionToBackend(lastStats);

            if (result.success) {
                if (result.emailsSent && result.emailsSent > 0) {
                    setEmailStatus(`✅ Session saved! Emails sent to ${result.emailsSent} absent student(s)`);
                } else {
                    setEmailStatus(`✅ Session saved! No emails sent (no absent students or no email addresses)`);
                }
                console.log("Session saved successfully!");
            } else {
                setEmailStatus("⚠️ Session saved locally but failed to save to server");
                console.warn("Session was not saved to backend, but continuing...");
            }

            // Save to local history regardless
            const sesId = `ses-${Date.now()}`;
            const csvRows = [
                ['Name', 'Roll No', 'Email', 'Status', 'Avg Engagement', 'Top Emotion', 'Top Action', 'Phone Violations'],
                ...(lastStats.studentSummaries || []).map(s => [
                    s.name, s.rollNo, s.email || '', s.attendanceStatus, `${s.avgEngagement}%`, s.topEmotion, s.topAction, s.phoneViolations,
                ]),
            ];
            const csv = csvRows.map(r => r.join(',')).join('\n');
            try {
                localStorage.setItem(`sentinel_session_export_${sesId}`, csv);
            } catch (_) { }

            setSessionHistory(prev => [{
                id: sesId,
                date: new Date().toLocaleString(),
                subject: sessionConfig.subject,
                duration: lastStats.durationString || '—',
                presentCount: lastStats.presentCount,
                totalStudents: lastStats.totalStudents,
                avgEngagement: lastStats.avgEngagement,
                phoneIncidents: lastStats.phoneIncidents,
                guestSummaries: lastStats.guestSummaries,
            }, ...prev].slice(0, 50));

            // Show success message before navigating
            setTimeout(() => {
                setView(ViewState.HOME);
                setEmailStatus(null);
            }, 2000);
        } catch (error) {
            console.error("Error in handleFinishSession:", error);
            setEmailStatus("❌ Error saving session");
            setTimeout(() => {
                setView(ViewState.HOME);
                setEmailStatus(null);
            }, 2000);
        } finally {
            setIsSavingSession(false);
        }
    };

    const renderHome = () => (
        <div className="flex flex-col items-center justify-center h-full gap-12 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle className="!p-2.5" />
            </div>

            {isOffline && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 border border-gray-600 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                    <WifiOff size={16} className="text-gray-400" />
                    <span className="text-gray-400 font-mono text-xs font-bold tracking-wider">OFFLINE MODE ACTIVE</span>
                </div>
            )}

            <div className="relative z-10 text-center animate-bounce-in">
                <div className="text-hud-cyan font-mono tracking-[0.5em] mb-4">SYSTEM READY</div>
                <h1 className="text-6xl font-bold text-white mb-2 font-mono tracking-tighter shadow-cyan-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">
                    {APP_NAME}
                </h1>
                <div className="text-gray-400 font-mono text-sm">v{VERSION} | AI SURVEILLANCE MODULE</div>
                <div className="text-xs text-gray-500 mt-2 font-mono flex flex-col items-center gap-1">
                    <span className="flex items-center gap-2">
                        {registeredUsers.length} Users Registered
                        <button onClick={() => setView(ViewState.DATABASE)} className="text-hud-cyan hover:text-cyan-400 underline flex items-center gap-1">
                            <Database size={10} /> Database
                        </button>
                    </span>
                </div>
            </div>

            <div className="relative z-10 flex gap-6 flex-wrap justify-center">
                <Button
                    className="w-56 h-20 text-lg"
                    onClick={() => setView(ViewState.REGISTER_SELECTION)}
                    icon={<UserPlus size={22} />}
                >
                    REGISTER
                </Button>
                <Button
                    className="w-56 h-20 text-lg"
                    variant="success"
                    onClick={handleEnterSetup}
                    icon={<Play size={22} />}
                >
                    START ATTENDANCE
                </Button>
                <Button
                    className="w-56 h-20 text-lg"
                    variant="secondary"
                    onClick={() => setView(ViewState.DATABASE)}
                    icon={<Database size={22} />}
                >
                    DATABASE
                </Button>
            </div>
        </div>
    );

    const renderAttendanceSetup = () => (
        <div className="flex flex-col items-center justify-center h-full gap-8">
            <h2 className="text-3xl font-mono text-white mb-8">SESSION CONFIGURATION</h2>

            <div className="bg-gray-900 p-8 rounded border border-gray-700 w-96 space-y-6">
                <div>
                    <label className="block text-gray-400 mb-2 font-mono">Subject Name</label>
                    <input
                        type="text"
                        value={sessionConfig.subject}
                        onChange={(e) => setSessionConfig({ ...sessionConfig, subject: e.target.value })}
                        className="w-full bg-black border border-gray-600 p-3 text-white rounded focus:border-hud-cyan outline-none"
                        placeholder="e.g. Data Structures"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 mb-2 font-mono">Start Time</label>
                        <input
                            type="time"
                            value={sessionConfig.startTime}
                            onChange={(e) => setSessionConfig({ ...sessionConfig, startTime: e.target.value })}
                            className="w-full bg-black border border-gray-600 p-3 text-white rounded focus:border-hud-cyan outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2 font-mono">End Time</label>
                        <input
                            type="time"
                            value={sessionConfig.endTime}
                            onChange={(e) => setSessionConfig({ ...sessionConfig, endTime: e.target.value })}
                            className="w-full bg-black border border-gray-600 p-3 text-white rounded focus:border-hud-cyan outline-none"
                        />
                    </div>
                </div>

                <Button className="w-full mt-4" onClick={() => setView(ViewState.MONITORING)} icon={<ShieldCheck />}>
                    INITIALIZE MONITORING
                </Button>
            </div>

            <div className="absolute top-8 right-8">
                <Button onClick={() => setView(ViewState.HOME)} variant="secondary">Back</Button>
            </div>
        </div>
    );

    const renderSummary = () => {
        if (!lastStats) return null;

        const absentees = lastStats.studentSummaries.filter(s => s.attendanceStatus === 'ABSENT');

        return (
            <div className="flex flex-col h-full p-8 overflow-hidden bg-black text-white font-mono">
                <div className="flex justify-between items-start mb-8 border-b border-gray-800 pb-6">
                    <div>
                        <h2 className="text-4xl font-bold text-hud-cyan flex items-center gap-4 tracking-tight">
                            <FileText size={40} /> OFFICIAL SESSION REPORT
                        </h2>
                        <div className="text-gray-500 mt-2 text-sm flex items-center gap-4">
                            <span>GENERATED BY {APP_NAME} v{VERSION}</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">{sessionConfig.subject}</div>
                        <div className="text-gray-400 text-sm flex items-center justify-end gap-2">
                            <Clock size={14} /> {lastStats.startTime} — {lastStats.endTime}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col gap-8">
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={64} /></div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Student Attendance</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-white">{lastStats.presentCount}</span>
                                <span className="text-xl text-gray-500">/ {lastStats.totalStudents}</span>
                            </div>
                            <div className="mt-4 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-hud-cyan" style={{ width: `${(lastStats.presentCount / lastStats.totalStudents) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={64} /></div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Overall Engagement</div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-5xl font-bold ${lastStats.avgEngagement > 70 ? 'text-hud-green' : lastStats.avgEngagement > 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {lastStats.avgEngagement}%
                                </span>
                            </div>
                            <div className="mt-4 text-xs text-gray-500">Class Average Score</div>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Mail size={64} /></div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Email Notifications</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-yellow-500">{absentees.length}</span>
                                <span className="text-xl text-gray-500">Absentees</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">Emails will be sent to absent students</div>
                        </div>
                    </div>

                    <div className="flex-1 flex gap-8 overflow-hidden">
                        <div className="w-1/3 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
                            <div className="p-4 bg-red-900/20 border-b border-red-900/30 flex justify-between items-center">
                                <h3 className="text-red-400 font-bold flex items-center gap-2"><User size={16} /> ABSENTEE LIST</h3>
                                <span className="bg-red-500 text-black text-xs font-bold px-2 py-0.5 rounded">{absentees.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                {absentees.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                        <CheckCircle size={48} className="mb-2 text-green-900" />
                                        <span>100% ATTENDANCE</span>
                                        <span className="text-xs mt-1">No emails will be sent</span>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <thead className="text-gray-500 border-b border-gray-800">
                                            <tr>
                                                <th className="p-3">Name</th>
                                                <th className="p-3">Roll No</th>
                                                <th className="p-3">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {absentees.map((s, i) => (
                                                <tr key={i} className="hover:bg-white/5">
                                                    <td className="p-3 font-bold text-gray-300">{s.name}</td>
                                                    <td className="p-3 text-gray-500">{s.rollNo}</td>
                                                    <td className="p-3 text-gray-400 text-xs">{s.email || 'No email'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
                            <div className="p-4 bg-black border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-gray-400 font-bold flex items-center gap-2"><FileText size={16} /> COMPLETE SESSION ROSTER</h3>
                                <Button variant="secondary" className="text-xs py-1 h-8" icon={<Download size={14} />} onClick={handleExportCSV}>EXPORT CSV</Button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-gray-800 text-gray-400 uppercase font-bold shadow-lg z-10">
                                        <tr>
                                            <th className="p-4">Student</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Emotion</th>
                                            <th className="p-4">Action</th>
                                            <th className="p-4 text-right">Engagement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {lastStats.studentSummaries.map((s, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{s.name}</div>
                                                    <div className="text-gray-500 text-[10px]">{s.rollNo}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${ATTENDANCE_COLORS[s.attendanceStatus]?.split(' ')[0] || 'text-gray-500'}`}>
                                                        {s.attendanceStatus}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-300">{s.topEmotion}</td>
                                                <td className="p-4 text-hud-cyan">{s.topAction}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                            <div className={`h-full ${s.avgEngagement > 60 ? 'bg-hud-green' : 'bg-red-500'}`} style={{ width: `${s.avgEngagement}%` }}></div>
                                                        </div>
                                                        <span className="font-bold">{s.avgEngagement}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Mail size={14} className="text-hud-cyan" />
                        {absentees.length > 0 ? `Email notifications will be sent to ${absentees.length} absent student(s)` : 'No absent students to notify'}
                    </div>
                    <Button
                        onClick={handleFinishSession}
                        variant="primary"
                        className="px-8"
                        icon={isSavingSession ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        disabled={isSavingSession}
                    >
                        {isSavingSession ? 'SAVING SESSION...' : 'FINISH SESSION'}
                    </Button>
                </div>
                {emailStatus && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg text-center text-sm">
                        {emailStatus}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="sentinel-app h-screen w-screen bg-black text-white font-mono overflow-hidden">
            {view === ViewState.HOME && renderHome()}

            {view === ViewState.REGISTER_SELECTION && (
                <div className="h-full">
                    <Registration
                        onBack={() => setView(ViewState.HOME)}
                        onRegister={handleRegisterUser}
                        registeredUsers={registeredUsers}
                    />
                </div>
            )}

            {view === ViewState.ATTENDANCE_SETUP && renderAttendanceSetup()}

            {view === ViewState.MONITORING && (
                <Monitoring
                    onBack={() => setView(ViewState.ATTENDANCE_SETUP)}
                    onStop={(stats) => {
                        setLastStats(stats);
                        setView(ViewState.SUMMARY);
                    }}
                    registeredUsers={registeredUsers}
                    config={sessionConfig}
                    sessionHistory={sessionHistory}
                />
            )}

            {view === ViewState.SUMMARY && renderSummary()}

            {view === ViewState.DATABASE && (
                <DatabaseView
                    registeredUsers={registeredUsers}
                    onDeleteUser={handleDeleteUser}
                    onBack={() => setView(ViewState.HOME)}
                />
            )}
        </div>
    );
};

export default App;