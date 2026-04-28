import React, { useState, useEffect } from 'react';
import { DetectionData, PersonType, AudioState, HeatmapZone, RegisteredUser } from '../types';
import {
  X, Activity, Users, BarChart2, MapPin, Bell, TrendingUp, UserCheck, GitBranch,
  FileText, Shield, Settings, Download, ChevronRight, RefreshCw, Search, Filter,
} from 'lucide-react';
import { Button } from './Button';
import { ThemeToggle } from './ThemeToggle';
import { EMOTIONS } from '../constants';

import { GuestOverviewTab } from './guest-tabs/GuestOverviewTab';
import { GuestAnalyticsTab } from './guest-tabs/GuestAnalyticsTab';
import { GuestTrackingTab } from './guest-tabs/GuestTrackingTab';
import { GuestAlertsTab } from './guest-tabs/GuestAlertsTab';
import { GuestTrendsTab } from './guest-tabs/GuestTrendsTab';
import { GuestProfilesTab } from './guest-tabs/GuestProfilesTab';
import { GuestInteractionsTab } from './guest-tabs/GuestInteractionsTab';
import { GuestReportsTab } from './guest-tabs/GuestReportsTab';
import { GuestSecurityTab } from './guest-tabs/GuestSecurityTab';
import { GuestSettingsTab } from './guest-tabs/GuestSettingsTab';
import { GuestExportTab } from './guest-tabs/GuestExportTab';

interface GuestDashboardProps {
  students: DetectionData[];
  audioState: AudioState;
  heatmap: HeatmapZone[];
  registeredUsers?: RegisteredUser[];
  sessionHistory?: Array<{ id: string; date: string; subject: string; duration: string; presentCount: number; totalStudents: number; avgEngagement: number; phoneIncidents: number; guestSummaries?: Array<{ id: string; name?: string; avgEngagement: number; phoneViolations: number; topEmotion: string; topAction: string }> }>;
  onClose: () => void;
}

const TAB_GROUPS = [
  { group: 'Core', tabs: [
    { id: 'Overview', icon: <Activity size={15}/>, label: 'Overview' },
    { id: 'Analytics', icon: <BarChart2 size={15}/>, label: 'Analytics' },
    { id: 'Tracking', icon: <MapPin size={15}/>, label: 'Tracking' },
    { id: 'Alerts', icon: <Bell size={15}/>, label: 'Alerts' },
  ]},
  { group: 'Insights', tabs: [
    { id: 'Trends', icon: <TrendingUp size={15}/>, label: 'Trends' },
    { id: 'Profiles', icon: <UserCheck size={15}/>, label: 'Profiles' },
    { id: 'Interactions', icon: <GitBranch size={15}/>, label: 'Interactions' },
  ]},
  { group: 'Management', tabs: [
    { id: 'Reports', icon: <FileText size={15}/>, label: 'Reports' },
    { id: 'Security', icon: <Shield size={15}/>, label: 'Security' },
    { id: 'Settings', icon: <Settings size={15}/>, label: 'Settings' },
    // { id: 'Export', icon: <Download size={15}/>, label: 'Export' },
  ]},
];

export const GuestDashboard: React.FC<GuestDashboardProps> = ({
  students, audioState, heatmap, registeredUsers = [], sessionHistory = [], onClose,
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [filterEngagement, setFilterEngagement] = useState('all');
  const [tabSearch, setTabSearch] = useState('');
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const allGuests = students.filter(s => s.type === PersonType.GUEST);
  const registeredGuests = allGuests.filter(g => !g.name?.startsWith('Guest'));
  const unregisteredGuests = allGuests.filter(g => g.name?.startsWith('Guest'));

  let filteredGuests = allGuests;
  if (filterEmotion !== 'all') filteredGuests = filteredGuests.filter(g => g.emotion === filterEmotion);
  if (filterEngagement === 'high') filteredGuests = filteredGuests.filter(g => (g.engagementScore ?? 0) >= 70);
  if (filterEngagement === 'low') filteredGuests = filteredGuests.filter(g => (g.engagementScore ?? 0) < 50);

  const refreshTab = () => setRefreshKeys(k => ({ ...k, [activeTab]: (k[activeTab] || 0) + 1 }));

  const tabProps = {
    allGuests, registeredGuests, unregisteredGuests, filteredGuests,
    audioState, heatmap, registeredUsers, sessionHistory,
    refreshKey: refreshKeys[activeTab] || 0, onRefresh: refreshTab,
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Overview': return <GuestOverviewTab {...tabProps}/>;
      case 'Analytics': return <GuestAnalyticsTab {...tabProps}/>;
      case 'Tracking': return <GuestTrackingTab {...tabProps}/>;
      case 'Alerts': return <GuestAlertsTab {...tabProps}/>;
      case 'Trends': return <GuestTrendsTab {...tabProps}/>;
      case 'Profiles': return <GuestProfilesTab {...tabProps}/>;
      case 'Interactions': return <GuestInteractionsTab {...tabProps}/>;
      case 'Reports': return <GuestReportsTab {...tabProps}/>;
      case 'Security': return <GuestSecurityTab {...tabProps}/>;
      case 'Settings': return <GuestSettingsTab {...tabProps}/>;
      case 'Export': return <GuestExportTab {...tabProps}/>;
      default: return <GuestOverviewTab {...tabProps}/>;
    }
  };

  return (
    <div className="sentinel-dashboard fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="sentinel-dashboard-panel bg-[#0a0a0a] w-full h-full max-w-[1600px] max-h-[900px] rounded-2xl border border-hud-cyan/30 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="sentinel-dashboard-header h-16 border-b border-hud-cyan/20 flex items-center justify-between px-6 bg-[#111] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-hud-cyan/10 rounded-lg border border-hud-cyan/20 text-hud-cyan">
              <Users size={22}/>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight font-mono uppercase">Guest Monitoring Dashboard</h1>
              <div className="text-xs font-mono flex items-center gap-3">
                <span className="text-hud-cyan/70 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse"></span>
                  LIVE • {currentTime.toLocaleTimeString()}
                </span>
                <span className="text-green-400 flex items-center gap-1.5"><UserCheck size={11}/> {registeredGuests.length} registered</span>
                <span className="text-orange-400 flex items-center gap-1.5">{unregisteredGuests.length} unregistered</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {unregisteredGuests.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded text-xs text-orange-400 font-mono">
                {unregisteredGuests.length} Unknown Person(s)
              </div>
            )}
            <Button variant="secondary" onClick={onClose} icon={<X size={16}/>}>CLOSE</Button>
          </div>
        </div>

        {/* Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="sentinel-dashboard-sidebar w-52 bg-[#0f0f0f] border-r border-hud-cyan/20 overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0">
            <div className="sticky top-0 z-10 flex-shrink-0 p-3 border-b border-hud-cyan/20 bg-[#0f0f0f]">
              <div className="text-[10px] text-gray-500 font-mono mb-1.5 flex items-center gap-1"><Search size={10}/> SEARCH TABS</div>
              <input type="text" value={tabSearch} onChange={e => setTabSearch(e.target.value)} placeholder="e.g. Alerts, Profiles..."
                className="w-full bg-black text-white border border-gray-600 pl-2 pr-2 py-2 rounded text-xs font-mono focus:outline-none focus:border-hud-cyan placeholder-gray-500"/>
            </div>
            <div className="p-3 border-b border-hud-cyan/20 space-y-1.5">
              <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Filter size={10}/> FILTERS</div>
              <select value={filterEmotion} onChange={e => setFilterEmotion(e.target.value)}
                className="w-full bg-black text-white border border-gray-600 p-1.5 rounded text-xs font-mono focus:outline-none focus:border-hud-cyan">
                <option value="all">Emotion: All</option>
                {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <select value={filterEngagement} onChange={e => setFilterEngagement(e.target.value)}
                className="w-full bg-black text-white border border-gray-600 p-1.5 rounded text-xs font-mono focus:outline-none focus:border-hud-cyan">
                <option value="all">Engagement: All</option>
                <option value="high">High (≥70%)</option>
                <option value="low">Low (&lt;50%)</option>
              </select>
            </div>
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
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                            activeTab === tab.id
                              ? 'bg-hud-cyan/10 text-hud-cyan border border-hud-cyan/20'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
                          }`}>
                          {tab.icon}
                          <span className="flex-1 text-left">{tab.label}</span>
                          {activeTab === tab.id && <ChevronRight size={11}/>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-hud-cyan/20 text-center text-xs text-gray-600 font-mono">11 modules</div>
          </div>

          {/* Content */}
          <div className="sentinel-dashboard-content flex-1 bg-black p-6 overflow-hidden relative">
            <div className="dashboard-grid-overlay absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex justify-between items-end mb-5 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white font-mono">{activeTab.toUpperCase()}</h2>
                  <div className="h-0.5 w-14 bg-hud-cyan mt-1.5 rounded-full"></div>
                </div>
                <button onClick={refreshTab} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded" title="Refresh this tab"><RefreshCw size={15}/></button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" key={refreshKeys[activeTab] || 0}>{renderTab()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
