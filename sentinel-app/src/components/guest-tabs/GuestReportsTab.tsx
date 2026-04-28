import React from 'react';
import { FileText, Users, Activity, Smartphone, AlertTriangle } from 'lucide-react';
import { GuestTabProps } from './types';

export const GuestReportsTab: React.FC<GuestTabProps> = ({ filteredGuests }) => {
  const total = filteredGuests.length;
  const avgEng = total > 0 ? Math.round(filteredGuests.reduce((a, g) => a + (g.engagementScore ?? 0), 0) / total) : 0;
  const totalAlerts = filteredGuests.reduce((a, g) => a + (g.sessionAlertCount ?? 0), 0);
  const violators = filteredGuests.filter(g => (g.sessionAlertCount ?? 0) > 0).length;
  const registered = filteredGuests.filter(g => !g.name?.startsWith('Guest')).length;
  const unregistered = filteredGuests.filter(g => g.name?.startsWith('Guest')).length;

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><FileText size={14}/> GUEST SESSION SUMMARY</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Users size={12}/> Total Guests</div>
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-xs text-gray-500 mt-1">{registered} registered, {unregistered} unregistered</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Activity size={12}/> Avg Engagement</div>
            <div className="text-2xl font-bold text-hud-cyan">{avgEng}%</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Smartphone size={12}/> Total Alerts</div>
            <div className="text-2xl font-bold text-orange-400">{totalAlerts}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><AlertTriangle size={12}/> Guests with Violations</div>
            <div className="text-2xl font-bold text-red-400">{violators}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
