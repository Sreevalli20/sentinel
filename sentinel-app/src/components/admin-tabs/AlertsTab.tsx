import React, { useMemo, useState, useEffect } from 'react';
import { Bell, Smartphone, TrendingDown, UserX, Filter, CheckCircle } from 'lucide-react';
import { TabProps } from './types';

const RESOLVED_STORAGE_KEY = 'sentinel-resolved-alerts';

interface AlertItem {
  id: string;
  type: 'phone' | 'engagement' | 'guest' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  student: string;
  time: string;
  resolved: boolean;
}

const TYPE_ICONS = {
  phone: <Smartphone size={14}/>,
  engagement: <TrendingDown size={14}/>,
  guest: <UserX size={14}/>,
  system: <Bell size={14}/>,
};

const SEVERITY_COLORS = {
  critical: 'border-red-700/40 bg-red-900/10 text-red-400',
  high: 'border-orange-700/40 bg-orange-900/10 text-orange-400',
  medium: 'border-yellow-700/40 bg-yellow-900/10 text-yellow-400',
  low: 'border-gray-700 bg-gray-900/50 text-gray-400',
};

export const AlertsTab: React.FC<TabProps> = ({ filteredStudents, teacherList, guestList }) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>(() => {
    try {
      const stored = sessionStorage.getItem(RESOLVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    sessionStorage.setItem(RESOLVED_STORAGE_KEY, JSON.stringify(resolvedMap));
  }, [resolvedMap]);

  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];
    [...filteredStudents, ...teacherList].forEach(s => {
      if ((s.sessionAlertCount ?? 0) > 0) {
        const count = s.sessionAlertCount ?? 0;
        list.push({
          id: `phone-${s.id}`,
          type: 'phone',
          severity: count >= 4 ? 'critical' : count >= 3 ? 'high' : count >= 2 ? 'medium' : 'low',
          message: `Phone detected — ${count} violation(s) this session`,
          student: s.name || s.id,
          time: 'Session',
          resolved: false,
        });
      }
      if ((s.engagementScore ?? 50) < 40) {
        list.push({
          id: `eng-${s.id}`,
          type: 'engagement',
          severity: (s.engagementScore ?? 50) < 25 ? 'high' : 'medium',
          message: `Engagement critically low at ${s.engagementScore}%`,
          student: s.name || s.id,
          time: 'Now',
          resolved: false,
        });
      }
    });
    guestList.forEach(g => {
      list.push({
        id: `guest-${g.id}`,
        type: 'guest',
        severity: 'medium',
        message: `Unregistered guest detected in classroom`,
        student: g.name || 'Unknown Guest',
        time: 'Now',
        resolved: false,
      });
    });
    return list;
  }, [filteredStudents, guestList]);

  const filtered = alerts.filter(a => {
    const res = resolvedMap[a.id] ?? a.resolved;
    if (typeFilter === 'active') return !res;
    if (typeFilter === 'resolved') return res;
    if (['phone','engagement','guest','system'].includes(typeFilter)) return a.type === typeFilter;
    return true;
  });

  const toggleResolved = (id: string) => {
    setResolvedMap(m => ({ ...m, [id]: !m[id] }));
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {(['critical','high','medium','low'] as const).map(sev => {
          const count = alerts.filter(a => a.severity === sev).length;
          const colors = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-gray-400' };
          return (
            <div key={sev} className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${colors[sev]}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-1 uppercase">{sev}</div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
        <Filter size={13} className="text-gray-400"/>
        {['all','active','resolved','phone','engagement','guest'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded text-xs font-mono transition-all ${typeFilter === t ? 'bg-hud-cyan/10 border border-hud-cyan/30 text-hud-cyan' : 'text-gray-400 hover:text-white'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">{filtered.length} alerts</span>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <Bell size={48} className="mx-auto mb-4 opacity-20"/>
          <p>No alerts match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const isResolved = resolvedMap[alert.id] ?? alert.resolved;
            return (
              <div key={alert.id} className={`border rounded-lg p-4 flex items-center gap-4 transition-opacity ${isResolved ? 'opacity-50' : ''} ${SEVERITY_COLORS[alert.severity]}`}>
                <div className="flex-shrink-0">{TYPE_ICONS[alert.type]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-medium text-sm">{alert.student}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded uppercase font-mono ${SEVERITY_COLORS[alert.severity]}`}>{alert.severity}</span>
                    <span className="text-xs text-gray-500 capitalize">{alert.type}</span>
                  </div>
                  <div className="text-xs text-gray-400">{alert.message}</div>
                </div>
                <div className="text-xs text-gray-500 font-mono">{alert.time}</div>
                <button onClick={() => toggleResolved(alert.id)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition-all ${isResolved ? 'border-green-800/40 text-green-400 bg-green-900/10' : 'border-gray-600 text-gray-400 hover:border-green-600 hover:text-green-400'}`}>
                  <CheckCircle size={12}/>
                  {isResolved ? 'Resolved' : 'Resolve'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
