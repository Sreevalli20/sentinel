import React, { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Type, Keyboard, Globe } from 'lucide-react';
import { GuestTabProps } from './types';

const ACCENT_COLORS = [
  { label: 'Cyan', value: '#00f0ff', key: 'cyan' },
  { label: 'Green', value: '#00ff41', key: 'green' },
  { label: 'Orange', value: '#fb923c', key: 'orange' },
  { label: 'Purple', value: '#a78bfa', key: 'purple' },
  { label: 'Pink', value: '#f472b6', key: 'pink' },
  { label: 'Yellow', value: '#fbbf24', key: 'yellow' },
];

const Key = ({ k }: { k: string }) => (
  <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-gray-600 bg-gray-900 text-xs text-gray-300 font-mono">{k}</kbd>
);

export const GuestSettingsTab: React.FC<GuestTabProps> = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sentinel-theme') !== 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('sentinel-accent') || 'orange');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('sentinel-fontsize') || '14'));
  const [primaryLang, setPrimaryLang] = useState(() => localStorage.getItem('sentinel-lang') || 'en-US');

  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('sentinel-theme') !== 'light');
    window.addEventListener('sentinel-theme-change', handler);
    return () => window.removeEventListener('sentinel-theme-change', handler);
  }, []);

  useEffect(() => {
    const isLight = !darkMode;
    localStorage.setItem('sentinel-theme', isLight ? 'light' : 'dark');
    document.documentElement.classList.toggle('sentinel-light', isLight);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sentinel-accent', accent);
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('sentinel-fontsize', String(fontSize));
    document.documentElement.style.setProperty('--sentinel-font-size', `${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('sentinel-lang', primaryLang);
  }, [primaryLang]);

  const selectedAccent = ACCENT_COLORS.find(c => c.key === accent) || ACCENT_COLORS[2];

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Palette size={14}/> Display Mode</h3>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(false)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${!darkMode ? 'bg-hud-cyan/10 border-hud-cyan/40 text-hud-cyan' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
            <Sun size={18}/> Light
          </button>
          <button onClick={() => setDarkMode(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${darkMode ? 'bg-gray-700 border-gray-500 text-white' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
            <Moon size={18}/> Dark
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Palette size={14}/> Accent Color</h3>
        <div className="flex gap-4 flex-wrap">
          {ACCENT_COLORS.map(c => (
            <button key={c.key} onClick={() => setAccent(c.key)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${accent === c.key ? 'border-white/30 bg-white/5' : 'border-gray-700 hover:border-gray-500'}`}>
              <div className="w-10 h-10 rounded-full border-2 border-white/20" style={{ backgroundColor: c.value }}></div>
              <span className="text-xs text-gray-400">{c.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">Current: <span style={{ color: selectedAccent.value }} className="font-bold">{selectedAccent.label}</span></div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Type size={14}/> Font Size</h3>
        <div className="flex items-center gap-6">
          <span className="text-xs text-gray-500">A</span>
          <input type="range" min={11} max={18} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
            className="flex-1 accent-hud-cyan"/>
          <span className="text-base text-gray-300">A</span>
          <span className="text-xs text-hud-cyan font-mono w-12">{fontSize}px</span>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Globe size={14}/> Language</h3>
        <select value={primaryLang} onChange={e => setPrimaryLang(e.target.value)}
          className="bg-black border border-gray-600 rounded px-3 py-2 text-sm font-mono text-hud-cyan focus:outline-none focus:border-hud-cyan">
          <option value="en-US">English</option>
          <option value="te-IN">Telugu</option>
          <option value="hi-IN">Hindi</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
          <h3 className="text-white font-mono text-sm font-bold flex items-center gap-2"><Keyboard size={14}/> Shortcuts</h3>
        </div>
        <div className="p-4 space-y-3">
          {[
            { keys: 'Esc', label: 'Close dashboard overlay' },
            { keys: 'Click card', label: 'Open guest detail (Profiles tab)' },
            { keys: 'Esc', label: 'Close guest detail modal' },
          ].map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-gray-400 text-sm">{label}</span>
              <Key k={keys}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
