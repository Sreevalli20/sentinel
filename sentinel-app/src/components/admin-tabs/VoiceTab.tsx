import React from 'react';
import { Mic } from 'lucide-react';
import { TabProps } from './types';

export const VoiceTab: React.FC<TabProps> = ({ audioState }) => {
  const statusColors: Record<string, string> = {
    SILENCE: 'text-gray-400',
    WHISPER: 'text-blue-400',
    DISCUSSION: 'text-yellow-400',
    CHAOS: 'text-red-400',
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Live audio state — real data from microphone */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-mono flex items-center gap-2"><Mic size={16}/> LIVE ACOUSTIC MONITOR</h3>
          <span className={`text-sm font-bold font-mono ${statusColors[audioState.status] || 'text-gray-400'}`}>
            ● {audioState.status}
          </span>
        </div>

        {/* Level bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Audio Level</span>
            <span className="font-mono">{audioState.level}%</span>
          </div>
          <div className="w-full h-6 bg-gray-900 rounded overflow-hidden">
            <div className={`h-full transition-all duration-200 rounded ${audioState.status === 'CHAOS' ? 'bg-red-500' : audioState.status === 'DISCUSSION' ? 'bg-yellow-500' : 'bg-hud-cyan'}`}
              style={{ width: `${audioState.level}%` }}></div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-4 gap-3">
          {['SILENCE', 'WHISPER', 'DISCUSSION', 'CHAOS'].map(s => (
            <div key={s} className={`text-center p-3 rounded-lg border ${audioState.status === s ? 'border-white/20 bg-white/5' : 'border-gray-700 bg-gray-900/50'}`}>
              <div className={`text-lg mb-1 ${audioState.status === s ? 'opacity-100' : 'opacity-30'}`}>
                {s === 'SILENCE' ? '🔇' : s === 'WHISPER' ? '🤫' : s === 'DISCUSSION' ? '💬' : '🔊'}
              </div>
              <div className={`text-xs font-mono ${audioState.status === s ? statusColors[s] : 'text-gray-600'}`}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
