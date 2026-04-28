import React, { useState, useEffect } from 'react';
import { DetectionData, PersonType, AudioState, HeatmapZone, RegisteredUser } from '../types';
import {
  X, Activity, Users, BarChart2, Brain, Clock, Smile, Zap, Target,
  TrendingUp, Video, Bell, FileText, AlertTriangle, LineChart, Sparkles, Mic,
  Eye, EyeOff, ChevronRight, RefreshCw, Download, Search,
  Smartphone, BookOpen, Database, Filter, Camera, GitCompare,
  Trophy, Keyboard, Shield, Globe, Palette, Radio, UserCheck, Settings,
} from 'lucide-react';
import { Button } from './Button';
import { EMOTIONS } from '../constants';

// Tab components
import { OverviewTab } from './admin-tabs/OverviewTab';
import { StudentsTab } from './admin-tabs/StudentsTab';
import { PhoneAlertsTab } from './admin-tabs/PhoneAlertsTab';
import { TeachersTab } from './admin-tabs/TeachersTab';
import { AnalyticsTab } from './admin-tabs/AnalyticsTab';
import { AIInsightsTab } from './admin-tabs/AIInsightsTab';
import { TimelineTab } from './admin-tabs/TimelineTab';
import { ProfilesTab } from './admin-tabs/ProfilesTab';
import { SentimentTab } from './admin-tabs/SentimentTab';
import { PatternsTab } from './admin-tabs/PatternsTab';
import { ScoringTab } from './admin-tabs/ScoringTab';
import { CompareTab } from './admin-tabs/CompareTab';
import { KPIsTab } from './admin-tabs/KPIsTab';
import { RecordingTab } from './admin-tabs/RecordingTab';
import { AlertsTab } from './admin-tabs/AlertsTab';
import { ExportTab } from './admin-tabs/ExportTab';
import { GoalsTab } from './admin-tabs/GoalsTab';
import { AnomalyTab } from './admin-tabs/AnomalyTab';
import { PredictionTab } from './admin-tabs/PredictionTab';
import { PersonalTab } from './admin-tabs/PersonalTab';
import { VoiceTab } from './admin-tabs/VoiceTab';
import { LanguageTab } from './admin-tabs/LanguageTab';
import { ThemesTab } from './admin-tabs/ThemesTab';
import { ShortcutsTab } from './admin-tabs/ShortcutsTab';
import { BackupTab } from './admin-tabs/BackupTab';
import { ThemeToggle } from './ThemeToggle';

interface DashboardProps {
  students: DetectionData[];
  onClose: () => void;
  isTeacherInvisible: boolean;
  toggleTeacherInvisibility: () => void;
  audioState: AudioState;
  heatmap: HeatmapZone[];
  registeredUsers?: RegisteredUser[];
  sessionHistory?: Array<{ id: string; date: string; subject: string; duration: string; presentCount: number; totalStudents: number; avgEngagement: number; phoneIncidents: number }>;
}

const TAB_GROUPS = [
  {
    group: 'Core',
    tabs: [
      { id: 'Overview', icon: <Activity size={16} />, label: 'Overview' },
      { id: 'Students', icon: <Users size={16} />, label: 'Students' },
      { id: 'Phone Alerts', icon: <Smartphone size={16} />, label: 'Phone Alerts' },
      { id: 'Teachers', icon: <BookOpen size={16} />, label: 'Teachers' },
    ],
  },
  {
    group: 'Analytics',
    tabs: [
      { id: 'Analytics', icon: <BarChart2 size={16} />, label: 'Analytics' },
      { id: 'AI Insights', icon: <Brain size={16} />, label: 'AI Insights' },
      { id: 'Timeline', icon: <Clock size={16} />, label: 'Timeline' },
      { id: 'Profiles', icon: <UserCheck size={16} />, label: 'Profiles' },
    ],
  },
  {
    group: 'Intelligence',
    tabs: [
      { id: 'Sentiment', icon: <Smile size={16} />, label: 'Sentiment' },
      { id: 'Patterns', icon: <Zap size={16} />, label: 'Patterns' },
      { id: 'Scoring', icon: <Trophy size={16} />, label: 'Scoring' },
      { id: 'Compare', icon: <GitCompare size={16} />, label: 'Compare' },
      { id: 'KPIs', icon: <Target size={16} />, label: 'KPIs' },
    ],
  },
  {
    group: 'Management',
    tabs: [
      // { id: 'Recording', icon: <Video size={16}/>, label: 'Recording' },
      { id: 'Alerts', icon: <Bell size={16} />, label: 'Alerts' },
      // { id: 'Export', icon: <Download size={16}/>, label: 'Export' },
      // { id: 'Goals', icon: <Target size={16}/>, label: 'Goals' },
    ],
  },
  {
    group: 'Advanced AI',
    tabs: [
      { id: 'Anomaly', icon: <AlertTriangle size={16} />, label: 'Anomaly' },
      { id: 'Prediction', icon: <TrendingUp size={16} />, label: 'Prediction' },
      { id: 'Personal', icon: <FileText size={16} />, label: 'Personal' },
      { id: 'Voice', icon: <Mic size={16} />, label: 'Voice' },
    ],
  },
  {
    group: 'Settings',
    tabs: [
      { id: 'Language', icon: <Globe size={16} />, label: 'Language' },
      { id: 'Themes', icon: <Palette size={16} />, label: 'Themes' },
      { id: 'Shortcuts', icon: <Keyboard size={16} />, label: 'Shortcuts' },
      { id: 'Backup', icon: <Database size={16} />, label: 'Backup' },
    ],
  },
];

export const Dashboard: React.FC<DashboardProps> = ({
  students, onClose, isTeacherInvisible, toggleTeacherInvisibility,
  audioState, heatmap, registeredUsers = [], sessionHistory = [],
}) => {
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterEmotion, setFilterEmotion] = useState<string>('all');
  const [filterEngagement, setFilterEngagement] = useState<string>('all');
  const [sessionStart] = useState(new Date());
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});
  const [tabSearch, setTabSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const studentList = students.filter(s => s.type === PersonType.STUDENT);
  const teacherList = students.filter(s => s.type === PersonType.TEACHER);
  const guestList = students.filter(s => s.type === PersonType.GUEST);

  let filteredStudents = studentList;
  if (filterEmotion !== 'all') filteredStudents = filteredStudents.filter(s => s.emotion === filterEmotion);
  if (filterEngagement === 'high') filteredStudents = filteredStudents.filter(s => (s.engagementScore ?? 0) >= 70);
  if (filterEngagement === 'low') filteredStudents = filteredStudents.filter(s => (s.engagementScore ?? 0) < 50);

  const sessionDuration = (() => {
    const diff = Math.floor((currentTime.getTime() - sessionStart.getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}m ${s}s`;
  })();

  const refreshTab = () => setRefreshKeys(k => ({ ...k, [activeTab]: (k[activeTab] || 0) + 1 }));

  const tabProps = {
    students,
    studentList,
    filteredStudents,
    teacherList,
    guestList,
    audioState,
    heatmap,
    registeredUsers,
    isTeacherInvisible,
    toggleTeacherInvisibility,
    sessionStartTime: sessionDuration,
    sessionHistory,
    refreshKey: refreshKeys[activeTab] || 0,
    onRefresh: refreshTab,
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Overview': return <OverviewTab {...tabProps} />;
      case 'Students': return <StudentsTab {...tabProps} />;
      case 'Phone Alerts': return <PhoneAlertsTab {...tabProps} />;
      case 'Teachers': return <TeachersTab {...tabProps} />;
      case 'Analytics': return <AnalyticsTab {...tabProps} />;
      case 'AI Insights': return <AIInsightsTab {...tabProps} />;
      case 'Timeline': return <TimelineTab {...tabProps} />;
      case 'Profiles': return <ProfilesTab {...tabProps} />;
      case 'Sentiment': return <SentimentTab {...tabProps} />;
      case 'Patterns': return <PatternsTab {...tabProps} />;
      case 'Scoring': return <ScoringTab {...tabProps} />;
      case 'Compare': return <CompareTab {...tabProps} />;
      case 'KPIs': return <KPIsTab {...tabProps} />;
      case 'Recording': return <RecordingTab {...tabProps} />;
      case 'Alerts': return <AlertsTab {...tabProps} />;
      case 'Export': return <ExportTab {...tabProps} />;
      case 'Goals': return <GoalsTab {...tabProps} />;
      case 'Anomaly': return <AnomalyTab {...tabProps} />;
      case 'Prediction': return <PredictionTab {...tabProps} />;
      case 'Personal': return <PersonalTab {...tabProps} />;
      case 'Voice': return <VoiceTab {...tabProps} />;
      case 'Language': return <LanguageTab {...tabProps} />;
      case 'Themes': return <ThemesTab {...tabProps} />;
      case 'Shortcuts': return <ShortcutsTab {...tabProps} />;
      case 'Backup': return <BackupTab {...tabProps} />;
      default: return null;
    }
  };

  return (
    <div className="sentinel-dashboard fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="sentinel-dashboard-panel bg-[#0a0a0a] w-full h-full max-w-[1600px] max-h-[900px] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="sentinel-dashboard-header h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#111] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-hud-cyan/10 rounded-lg border border-hud-cyan/20 text-hud-cyan">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight font-mono uppercase">Sentinel Admin Console</h1>
              <div className="text-xs text-hud-cyan/70 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse"></span>
                TEACHER ACCESS • {currentTime.toLocaleTimeString()} • Session: {sessionDuration}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex gap-4 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1"><Users size={12} /> <span className="text-white font-bold">{studentList.length}</span></span>
              <span className="flex items-center gap-1"><BookOpen size={12} /> <span className="text-white font-bold">{teacherList.length}</span></span>
              <span className="flex items-center gap-1"><AlertTriangle size={12} /> <span className="text-white font-bold">{guestList.length}</span></span>
            </div>
            <div className="h-6 w-px bg-gray-800"></div>
            <ThemeToggle />
            <button onClick={toggleTeacherInvisibility}
              className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs border transition-all ${isTeacherInvisible ? 'border-hud-green text-hud-green bg-hud-green/10' : 'border-gray-600 text-gray-400 hover:text-white'}`}>
              {isTeacherInvisible ? <EyeOff size={13} /> : <Eye size={13} />}
              {isTeacherInvisible ? 'Monitoring' : 'Teaching'}
            </button>
            <Button variant="secondary" onClick={onClose} icon={<X size={16} />}>CLOSE</Button>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="sentinel-dashboard-sidebar w-52 bg-[#0f0f0f] border-r border-gray-800 overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0">
            {/* Tab search - sticky at top */}
            <div className="sticky top-0 z-10 flex-shrink-0 p-3 border-b border-gray-800 bg-[#0f0f0f]">
              <div className="text-[10px] text-gray-500 font-mono mb-1.5 flex items-center gap-1"><Search size={10} /> SEARCH TABS</div>
              <div className="relative">
                <input type="text" value={tabSearch} onChange={e => setTabSearch(e.target.value)} placeholder="e.g. Recording, Analytics..."
                  className="w-full bg-black text-white border border-gray-600 pl-2 pr-2 py-2 rounded text-xs font-mono focus:outline-none focus:border-hud-cyan placeholder-gray-500" />
              </div>
            </div>
            {/* Filters */}
            <div className="p-3 border-b border-gray-800 space-y-1.5">
              <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Filter size={10} /> FILTERS</div>
              <select value={filterEmotion} onChange={e => setFilterEmotion(e.target.value)}
                className="w-full bg-black text-white border border-gray-600 p-1.5 rounded text-xs font-mono focus:outline-none focus:border-hud-cyan">
                <option value="all">Emotion: All</option>
                {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <select value={filterEngagement} onChange={e => setFilterEngagement(e.target.value)}
                className="w-full bg-black text-white border border-gray-600 p-1.5 rounded text-xs font-mono focus:outline-none focus:border-hud-cyan">
                <option value="all">Engagement: All</option>
                <option value="high">High (≥70%)</option>
                <option value="low">Low ({'<'}50%)</option>
              </select>
            </div>

            {/* Tab groups */}
            <div className="p-2 space-y-3 flex-1">
              {TAB_GROUPS.map(({ group, tabs }) => {
                const q = tabSearch.trim().toLowerCase();
                const filteredTabs = q ? tabs.filter(t => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) : tabs;
                if (filteredTabs.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="text-[9px] text-gray-600 font-mono uppercase px-2 pb-1">{group}</div>
                    <div className="space-y-0.5">
                      {filteredTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${activeTab === tab.id
                              ? 'bg-hud-cyan/10 text-hud-cyan border border-hud-cyan/20'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
                            }`}>
                          {tab.icon}
                          <span className="flex-1 text-left">{tab.label}</span>
                          {activeTab === tab.id && <ChevronRight size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tab count */}
            <div className="p-3 border-t border-gray-800 text-center text-xs text-gray-600 font-mono">
              25 modules loaded
            </div>
          </div>

          {/* Content */}
          <div className="sentinel-dashboard-content flex-1 bg-black p-6 overflow-hidden relative">
            <div className="dashboard-grid-overlay absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex justify-between items-end mb-5 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white font-mono">{activeTab.toUpperCase()}</h2>
                  <div className="h-0.5 w-16 bg-hud-cyan mt-1.5 rounded-full"></div>
                </div>
                <button onClick={refreshTab} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded" title="Refresh this tab">
                  <RefreshCw size={16} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" key={refreshKeys[activeTab] || 0}>
                {renderTab()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
