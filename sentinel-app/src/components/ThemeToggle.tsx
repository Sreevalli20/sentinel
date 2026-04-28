import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

function applyTheme(isLight: boolean) {
  localStorage.setItem('sentinel-theme', isLight ? 'light' : 'dark');
  document.documentElement.classList.toggle('sentinel-light', isLight);
  window.dispatchEvent(new CustomEvent('sentinel-theme-change', { detail: { isLight } }));
}

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isLight, setIsLight] = useState(() => localStorage.getItem('sentinel-theme') === 'light');

  useEffect(() => {
    const handler = () => setIsLight(localStorage.getItem('sentinel-theme') === 'light');
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`p-2 rounded-lg border transition-all ${className} ${
        isLight
          ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
          : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800'
      }`}
    >
      {isLight ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
