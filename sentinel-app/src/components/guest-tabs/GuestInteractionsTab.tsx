import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Users, Calendar, Mic } from 'lucide-react';
import { GuestTabProps } from './types';

const LANGUAGES = [
  { label: 'English', code: 'en-US' },
  { label: 'Telugu', code: 'te-IN' },
  { label: 'Hindi', code: 'hi-IN' },
] as const;

export const GuestInteractionsTab: React.FC<GuestTabProps> = ({ filteredGuests, sessionHistory = [], audioState }) => {
  const avgEngagement = filteredGuests.length > 0
    ? Math.round(filteredGuests.reduce((a, g) => a + (g.engagementScore ?? 0), 0) / filteredGuests.length) : 0;
  const highEng = filteredGuests.filter(g => (g.engagementScore ?? 0) >= 70).length;
  const lowEng = filteredGuests.filter(g => (g.engagementScore ?? 0) < 50).length;

  const [transcript, setTranscript] = useState<string[]>([]);
  const [interim, setInterim] = useState('');
  const [primaryLang, setPrimaryLang] = useState<(typeof LANGUAGES)[number]['code']>('en-US');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  isListeningRef.current = isListening;

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = primaryLang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }
      if (finalText) {
        setTranscript(prev => [...prev, finalText.trim()].filter(Boolean));
      }
      setInterim(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      const msg = event.error === 'network'
        ? 'Speech recognition requires internet and Google\'s servers. Check your connection, try Chrome (not Cursor preview), and ensure you\'re on HTTPS if remote.'
        : event.error === 'not-allowed'
        ? 'Microphone access denied. Allow microphone permission and try again.'
        : event.error === 'audio-capture'
        ? 'Could not access microphone. Check if another app is using it.'
        : event.error === 'service-not-allowed'
        ? 'Speech recognition not allowed in this context. Use Chrome on a secure page (HTTPS or localhost).'
        : `Recognition error: ${event.error}`;
      setError(msg);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;
    return () => {
      recognitionRef.current = null;
      try {
        recognition.stop();
      } catch {}
    };
  }, [primaryLang]);

  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      setError(null);
      try {
        recognitionRef.current.lang = primaryLang;
        recognitionRef.current.start();
      } catch (e) {
        setError('Could not start microphone. Check permissions.');
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, [isListening, primaryLang]);

  const handleLangChange = (code: string) => {
    setPrimaryLang(code as typeof primaryLang);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const sessionsByGuest = useMemo(() => {
    const map: Record<string, { name: string; sessions: Array<{ id: string; date: string; subject: string; duration: string; avgEngagement: number; topEmotion: string; topAction: string; phoneViolations: number }> }> = {};
    sessionHistory.forEach(s => {
      (s.guestSummaries || []).forEach(g => {
        if (!map[g.id]) map[g.id] = { name: g.name || g.id, sessions: [] };
        map[g.id].sessions.push({
          id: s.id,
          date: s.date,
          subject: s.subject,
          duration: s.duration,
          avgEngagement: g.avgEngagement,
          topEmotion: g.topEmotion,
          topAction: g.topAction,
          phoneViolations: g.phoneViolations
        });
      });
    });
    filteredGuests.forEach(g => {
      if (!map[g.id]) map[g.id] = { name: g.name || g.id, sessions: [] };
    });
    return map;
  }, [sessionHistory, filteredGuests]);

  const guestIds = useMemo(() => {
    const ids = new Set<string>();
    Object.keys(sessionsByGuest).forEach(id => ids.add(id));
    filteredGuests.forEach(g => ids.add(g.id));
    return Array.from(ids);
  }, [sessionsByGuest, filteredGuests]);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Users size={14}/> GUEST ENGAGEMENT SUMMARY</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Average Engagement</span>
              <span className="text-hud-cyan font-bold">{avgEngagement}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">High Engagement (≥70%)</span>
              <span className="text-green-400 font-bold">{highEng} guests</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Low Engagement (&lt;50%)</span>
              <span className="text-red-400 font-bold">{lowEng} guests</span>
            </div>
          </div>
          {filteredGuests.length === 0 && (
            <div className="text-gray-500 text-center py-6 text-sm">No guests in surveillance area.</div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Mic size={14}/> SPEECH RECOGNITION</h3>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`px-4 py-2 rounded-lg font-mono text-sm border transition-all ${isListening ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'}`}
            >
              {isListening ? '● Listening' : 'Start'}
            </button>
            <select
              value={primaryLang}
              onChange={e => handleLangChange(e.target.value)}
              className="bg-black border border-gray-600 rounded px-3 py-2 text-sm font-mono text-hud-cyan focus:outline-none focus:border-hud-cyan"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500 mt-2">Audio status: {audioState.status}</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Calendar size={14}/> SESSIONS BY GUEST</h3>
        <p className="text-xs text-gray-500 mb-4">Sessions each guest has attended (from past recordings)</p>
        {guestIds.length === 0 ? (
          <div className="text-gray-500 text-center py-8 text-sm">No guest session data yet. Complete sessions with guests to see history here.</div>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
            {guestIds.map(gid => {
              const data = sessionsByGuest[gid];
              const name = data?.name || gid;
              const sessions = data?.sessions || [];
              return (
                <div key={gid} className="bg-gray-900 rounded-lg border border-gray-700 p-3">
                  <div className="font-medium text-white text-sm mb-2">{name}</div>
                  {sessions.length === 0 ? (
                    <div className="text-gray-500 text-xs">No past sessions recorded</div>
                  ) : (
                    <div className="space-y-1.5">
                      {sessions.map(s => (
                        <div key={s.id} className="flex items-center gap-3 text-xs text-gray-400 bg-gray-800 rounded px-2 py-1.5">
                          <span className="text-gray-500 shrink-0">{s.date}</span>
                          <span className="text-gray-300">{s.subject}</span>
                          <span className="text-hud-cyan">{s.avgEngagement}%</span>
                          <span>{s.topEmotion}</span>
                          <span>{s.topAction}</span>
                          {s.phoneViolations > 0 && <span className="text-red-400">{s.phoneViolations} alerts</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2"><Mic size={14}/> SPEECH-TO-TEXT TRANSCRIPT</h3>
        <p className="text-xs text-gray-500 mb-4">Live speech recognition — same as admin dashboard Language tab</p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/40 text-red-400 text-sm">{error}</div>
        )}
        <div className="bg-black/60 rounded-lg p-4 border border-gray-700 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {!isListening && transcript.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">Click &quot;Start&quot; to begin speech recognition.</div>
          ) : transcript.length === 0 && !interim ? (
            <div className="text-gray-500 text-sm text-center py-4">Listening... Speak to see transcript.</div>
          ) : (
            <>
              {transcript.map((line, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-gray-600 font-mono text-xs flex-shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}:</span>
                  <span className="text-gray-300">{line}</span>
                </div>
              ))}
              {interim && (
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-600 font-mono text-xs flex-shrink-0 pt-0.5">—:</span>
                  <span className="text-hud-cyan/80 italic">{interim}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
