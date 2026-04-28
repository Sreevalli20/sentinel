import React from 'react';
import { Shield, AlertTriangle, Smartphone, UserX } from 'lucide-react';
import { GuestTabProps } from './types';

export const GuestSecurityTab: React.FC<GuestTabProps> = ({ filteredGuests, unregisteredGuests }) => {
  const highRisk = filteredGuests.filter(g => (g.sessionAlertCount ?? 0) >= 3);
  const watchlist = [...highRisk, ...unregisteredGuests.filter(u => !highRisk.some(h => h.id === u.id))];

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Shield size={14}/> RISK ASSESSMENT</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">High-risk guests (3+ alerts)</span>
              <span className="text-red-400 font-bold">{highRisk.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Unregistered guests</span>
              <span className="text-orange-400 font-bold">{unregisteredGuests.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><AlertTriangle size={14}/> WATCHLIST</h3>
          <p className="text-xs text-gray-500 mb-3">Guests requiring attention (high alerts or unregistered)</p>
          {watchlist.length === 0 ? (
            <div className="text-gray-500 text-center py-6 text-sm">No guests on watchlist.</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {watchlist.map(g => {
                const isUnreg = g.name?.startsWith('Guest');
                const alertCount = g.sessionAlertCount ?? 0;
                return (
                  <div key={g.id} className={`flex items-center gap-3 bg-gray-900 rounded-lg p-3 border ${alertCount >= 3 ? 'border-red-700/40' : 'border-orange-700/40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isUnreg ? 'bg-orange-800 text-orange-200' : 'bg-gray-700 text-white'}`}>
                      {isUnreg ? <UserX size={12}/> : g.name?.slice(0, 1)}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-bold">{g.name}</div>
                      <div className="text-xs text-gray-500">
                        {isUnreg ? 'Unregistered' : 'Registered'} • {alertCount} alert(s)
                      </div>
                    </div>
                    {alertCount > 0 && <Smartphone size={14} className="text-orange-400"/>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
