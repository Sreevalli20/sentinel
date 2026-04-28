import React from 'react';
import { MapPin, LayoutGrid } from 'lucide-react';
import { GuestTabProps } from './types';

export const GuestTrackingTab: React.FC<GuestTabProps> = ({ filteredGuests, heatmap }) => {
  const totalGuests = filteredGuests.length;
  const guestsByZone = heatmap.map((z, i) => ({
    zone: `Zone ${i + 1}`,
    count: z.count,
    engagement: z.engagement,
  }));

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><LayoutGrid size={14}/> ATTENTION HEATMAP</h3>
          <div className="grid grid-cols-3 gap-1 bg-gray-900 p-3 rounded-lg border border-gray-800">
            {heatmap.map(zone => {
              const intensity = zone.engagement / 100;
              const color = zone.count > 0
                ? (intensity > 0.6 ? `rgba(251,146,60,${0.4 + intensity * 0.5})` : `rgba(255,100,60,${0.3 + (1 - intensity) * 0.5})`)
                : '#111';
              return (
                <div key={zone.id} className="border border-gray-800 rounded flex items-center justify-center min-h-[4rem] transition-all duration-300"
                  style={{ backgroundColor: color }}>
                  {zone.count > 0 && (
                    <div className="text-center">
                      <div className="text-sm font-bold text-white drop-shadow-md">{zone.engagement}%</div>
                      <div className="text-[9px] text-white/90">{zone.count} guest{zone.count !== 1 ? 's' : ''}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span className="text-hud-cyan font-mono">Guest focus by zone</span>
            <span>100%</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><MapPin size={14}/> GUEST ZONE DISTRIBUTION</h3>
          <div className="space-y-2">
            {guestsByZone.map((z, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14">{z.zone}</span>
                <div className="flex-1 h-6 bg-gray-900 rounded overflow-hidden">
                  <div className="h-full bg-hud-cyan/70 rounded transition-all" style={{ width: `${totalGuests > 0 ? (z.count / totalGuests) * 100 : 0}%` }}></div>
                </div>
                <span className="text-xs text-hud-cyan font-mono w-12">{z.count} guest{z.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
          {totalGuests === 0 && (
            <div className="text-gray-500 text-center py-6 text-sm">No guests in surveillance area.</div>
          )}
        </div>
      </div>
    </div>
  );
};
