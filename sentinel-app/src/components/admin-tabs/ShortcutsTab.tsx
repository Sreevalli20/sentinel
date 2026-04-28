import React from 'react';
import { Keyboard } from 'lucide-react';
import { TabProps } from './types';

const SHORTCUT_GROUPS = [
  {
    group: 'Working Shortcuts',
    shortcuts: [
      { keys: 'Esc', label: 'Close dashboard overlay' },
      { keys: 'Click card', label: 'Open student drill-down (Students tab)' },
      { keys: 'Esc', label: 'Close student detail modal' },
    ],
  },
];

const Key = ({ k }: { k: string }) => (
  <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-gray-600 bg-gray-900 text-xs text-gray-300 font-mono shadow-sm">{k}</kbd>
);

export const ShortcutsTab: React.FC<TabProps> = () => {
  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="flex items-center gap-3 text-gray-400">
        <Keyboard size={16}/>
        <span className="text-sm font-mono">Keyboard reference for Sentinel Admin Dashboard</span>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {SHORTCUT_GROUPS.map(({ group, shortcuts }) => (
          <div key={group} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-mono text-sm font-bold">{group}</h3>
            </div>
            <div className="p-4 space-y-3">
              {shortcuts.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-gray-400 text-sm">{label}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {keys.split(' + ').map((k, i, arr) => (
                      <React.Fragment key={i}>
                        <Key k={k}/>
                        {i < arr.length - 1 && <span className="text-gray-600 text-xs">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-xs text-gray-500">
        <span className="text-gray-400 font-bold">Note: </span>
        Only shortcuts that work in this app are listed above.
      </div>
    </div>
  );
};
