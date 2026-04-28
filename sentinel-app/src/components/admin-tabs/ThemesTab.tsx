import React, { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Type } from 'lucide-react';
import { TabProps } from './types';

const ACCENT_COLORS = [
  { label: 'Cyan', value: '#00f0ff', key: 'cyan' },
  { label: 'Green', value: '#00ff41', key: 'green' },
  { label: 'Purple', value: '#a78bfa', key: 'purple' },
  { label: 'Orange', value: '#fb923c', key: 'orange' },
  { label: 'Pink', value: '#f472b6', key: 'pink' },
  { label: 'Yellow', value: '#fbbf24', key: 'yellow' },
];

export const ThemesTab: React.FC<TabProps> = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sentinel-theme') !== 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('sentinel-accent') || 'cyan');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('sentinel-fontsize') || '14'));

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

  const selectedAccent = ACCENT_COLORS.find(c => c.key === accent) || ACCENT_COLORS[0];

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Dark/Light toggle */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
          <Palette size={14}/> Display Mode
        </h3>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(false)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${!darkMode ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
            <Sun size={18}/> Light Mode
          </button>
          <button onClick={() => setDarkMode(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${darkMode ? 'bg-gray-700 border-gray-500 text-white' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
            <Moon size={18}/> Dark Mode
          </button>
          <div className={`ml-4 px-3 py-1 rounded-full text-xs font-mono ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-yellow-500/10 text-yellow-400'}`}>
            {darkMode ? '● Dark' : '● Light'} — {darkMode ? 'Active' : 'Active'}
          </div>
        </div>
      </div>

      {/* Accent colors */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
          <Palette size={14}/> Accent Color
        </h3>
        <div className="flex gap-4 flex-wrap">
          {ACCENT_COLORS.map(c => (
            <button key={c.key} onClick={() => setAccent(c.key)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${accent === c.key ? 'border-white/30 bg-white/5' : 'border-gray-700 hover:border-gray-500'}`}>
              <div className="w-10 h-10 rounded-full border-2 border-white/20" style={{ backgroundColor: c.value }}></div>
              <span className="text-xs text-gray-400">{c.label}</span>
              {accent === c.key && <span className="text-xs text-white">✓</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Current accent: <span style={{ color: selectedAccent.value }} className="font-bold">{selectedAccent.label}</span>
          {' '}— Saved to localStorage
        </div>
      </div>

      {/* Font size */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
          <Type size={14}/> Font Size
        </h3>
        <div className="flex items-center gap-6">
          <span className="text-xs text-gray-500">A</span>
          <input type="range" min={11} max={18} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
            className="flex-1 accent-hud-cyan"/>
          <span className="text-base text-gray-300">A</span>
          <span className="text-xs text-hud-cyan font-mono w-12">{fontSize}px</span>
        </div>
        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700" style={{ fontSize: `${fontSize}px` }}>
          <span className="text-white">Preview — Sentinel Admin Dashboard</span>
        </div>
      </div>

      {/* Preview panel */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase">Theme Preview</h3>
        <div className="grid grid-cols-3 gap-3">
          {['Primary', 'Secondary', 'Danger'].map((label, i) => (
            <div key={label} className={`p-3 rounded-lg border text-center text-xs font-mono ${i === 0 ? 'bg-hud-cyan/10 border-hud-cyan/30 text-hud-cyan' : i === 1 ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {label} Button
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-gray-900 rounded p-3 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Card Component</div>
            <div className="text-white text-sm font-bold">Student Name</div>
            <div className="text-hud-cyan text-xs">75% Engaged</div>
          </div>
          <div className="bg-gray-900 rounded p-3 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Alert Component</div>
            <div className="text-orange-400 text-sm font-bold">⚠ Phone Alert</div>
            <div className="text-gray-400 text-xs">2 alerts this session</div>
          </div>
        </div>
      </div>
    </div>
  );
};
