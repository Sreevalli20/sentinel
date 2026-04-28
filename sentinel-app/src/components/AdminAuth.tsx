// AdminAuth.tsx  (Renamed logic to PasskeyAuth for clarity, but keeping filename as requested)

import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, X, AlertTriangle, User } from 'lucide-react';
import { Button } from './Button';

interface PasskeyAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
  mode: 'teacher' | 'student';           // ← Key change
  teacherPin?: string;
  studentPin?: string;
}

export const AdminAuth: React.FC<PasskeyAuthProps> = ({
  onSuccess,
  onCancel,
  mode = 'teacher',
  teacherPin = '1234',
  studentPin = '5678'                    // Default Student PIN (you can change)
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTeacher = mode === 'teacher';

  const title = isTeacher ? 'TEACHER ACCESS' : 'STUDENT ACCESS';
  const subtitle = isTeacher 
    ? 'RESTRICTED: TEACHER ONLY' 
    : 'ENTER YOUR STUDENT PASS KEY';
  const errorMessage = isTeacher 
    ? 'ACCESS DENIED: INCORRECT TEACHER PIN' 
    : 'ACCESS DENIED: INCORRECT STUDENT PIN';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInput = (val: string) => {
    if (val === 'C') {
      setPin('');
      setError(false);
      return;
    }
    if (val === '<') {
      setPin(prev => prev.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length < 4) {
      setPin(prev => prev + val);
      setError(false);
    }
  };

  const handleSubmit = () => {
    const correctPin = isTeacher ? teacherPin : studentPin;

    if (pin === correctPin) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-bounce-in">
        
        {/* Header */}
        <div className="bg-black p-6 text-center border-b border-gray-800">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full bg-gray-800 ${error ? 'animate-pulse border-2 border-red-500' : 'border border-gray-700'}`}>
              {error ? (
                <AlertTriangle size={32} className="text-red-500"/>
              ) : isTeacher ? (
                <ShieldCheck size={32} className="text-hud-green"/>
              ) : (
                <User size={32} className="text-hud-cyan"/>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-mono font-bold text-white tracking-widest">{title}</h2>
          <p className="text-gray-500 text-xs font-mono mt-2">{subtitle}</p>
        </div>

        {/* PIN Display */}
        <div className="p-8 pb-4">
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length 
                    ? (error ? 'bg-red-500' : isTeacher ? 'bg-hud-green' : 'bg-hud-cyan shadow-[0_0_10px_#00f0ff]') 
                    : 'bg-gray-800'
                }`}
              />
            ))}
          </div>

          <div className="text-center text-red-500 text-xs font-mono h-4 mb-4">
            {error ? errorMessage : ''}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleInput(num.toString())}
                className="h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-mono text-xl font-bold transition-all active:scale-95 border border-gray-700"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={() => handleInput('C')} 
              className="h-16 w-16 rounded-full bg-red-900/20 hover:bg-red-900/40 text-red-500 font-mono text-sm font-bold border border-red-900/50"
            >
              CLR
            </button>
            <button 
              onClick={() => handleInput('0')} 
              className="h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-mono text-xl font-bold border border-gray-700"
            >
              0
            </button>
            <button 
              onClick={handleSubmit} 
              className={`h-16 w-16 rounded-full font-mono text-xl font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all ${
                isTeacher 
                  ? 'bg-hud-green hover:bg-green-400 text-black' 
                  : 'bg-hud-cyan hover:bg-cyan-400 text-black'
              }`}
            >
              Go
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black border-t border-gray-800 flex justify-center">
          <button 
            onClick={onCancel} 
            className="text-gray-500 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-2"
          >
            <X size={12}/> Cancel Access
          </button>
        </div>

        {/* Hidden Input for Keyboard Support */}
        <input 
          ref={inputRef}
          type="text" 
          className="opacity-0 absolute" 
          value={pin} 
          onChange={e => {
            const val = e.target.value;
            if (/^\d*$/.test(val) && val.length <= 4) setPin(val);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};