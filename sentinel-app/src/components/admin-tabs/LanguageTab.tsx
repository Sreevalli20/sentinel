import React, { useEffect, useRef, useState } from 'react';
import { Globe, Mic } from 'lucide-react';
import { TabProps } from './types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const LANGUAGES = [
  { label: 'English', code: 'en-US' },
  { label: 'Telugu', code: 'te-IN' },
  { label: 'Hindi', code: 'hi-IN' },
] as const;

export const LanguageTab: React.FC<TabProps> = ({ audioState }) => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interim, setInterim] = useState('');
  const [primaryLang, setPrimaryLang] = useState<(typeof LANGUAGES)[number]['code']>('en-US');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  isListeningRef.current = isListening;

  const sentimentFromAudio = audioState.status === 'CHAOS' ? { label: 'Chaotic', color: 'text-red-400' }
    : audioState.status === 'DISCUSSION' ? { label: 'Engaged', color: 'text-green-400' }
    : audioState.status === 'WHISPER' ? { label: 'Subdued', color: 'text-blue-400' }
    : { label: 'Silent', color: 'text-gray-400' };

  // Language distribution: 100% for selected language (single-language recognition)
  const languageData = LANGUAGES.map(l => ({
    lang: l.label,
    pct: l.code === primaryLang ? 100 : 0,
    color: l.code === primaryLang ? '#00f0ff' : '#333',
  }));

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

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Audio sentiment */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-400 font-mono mb-2">AUDIO SENTIMENT</div>
          <div className={`text-3xl font-bold ${sentimentFromAudio.color}`}>{sentimentFromAudio.label}</div>
          <div className="text-xs text-gray-500 mt-2">Based on: {audioState.status}</div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-400 font-mono mb-2">RECOGNITION</div>
          <button
            onClick={() => setIsListening(!isListening)}
            className={`px-4 py-2 rounded-lg font-mono text-sm border transition-all ${isListening ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'}`}
          >
            {isListening ? '● Listening' : 'Start'}
          </button>
          <div className="text-xs text-gray-500 mt-2">{isListening ? 'Microphone active' : 'Click to start'}</div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-400 font-mono mb-2">LANGUAGE</div>
          <select
            value={primaryLang}
            onChange={e => handleLangChange(e.target.value)}
            className="bg-black border border-gray-600 rounded px-3 py-2 text-sm font-mono text-hud-cyan focus:outline-none focus:border-hud-cyan"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-2">Recognition language</div>
        </div>
      </div>

      {/* Language distribution */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5" style={{ height: '12rem' }}>
        <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
          <Globe size={14}/> Language Distribution
        </h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={languageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
            <XAxis dataKey="lang" stroke="#666" fontSize={11}/>
            <YAxis stroke="#666" fontSize={11} domain={[0, 100]} tickFormatter={v => `${v}%`}/>
            <Tooltip formatter={(v) => [`${v}%`, 'Usage']} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
            <Bar dataKey="pct" radius={[6,6,0,0]} fill="#00f0ff"/>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-gray-500 mt-2">Recognizing in {LANGUAGES.find(l => l.code === primaryLang)?.label ?? primaryLang}</div>
      </div>

      {/* Transcript */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
          <Mic size={14}/> Speech-to-Text Transcript
        </h3>
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
