import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

function applyStoredTheme() {
  const theme = localStorage.getItem('sentinel-theme');
  const accent = localStorage.getItem('sentinel-accent') || 'cyan';
  const fontSize = localStorage.getItem('sentinel-fontsize') || '14';
  document.documentElement.classList.toggle('sentinel-light', theme === 'light');
  document.documentElement.setAttribute('data-accent', accent);
  document.documentElement.style.setProperty('--sentinel-font-size', `${fontSize}px`);
}
applyStoredTheme();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Sentinel Core SW registered: ', registration.scope);
      })
      .catch(err => {
        // Silently fail in preview environments where origin mismatch is common
        // console.debug('SW Registration info:', err);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
