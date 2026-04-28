import React, { useMemo } from 'react';
import { Smile, TrendingUp, Thermometer } from 'lucide-react';
import { TabProps } from './types';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const EMOTION_COLORS: Record<string, string> = {
  Happy: '#00ff41', Joy: '#00ff41', Neutral: '#00f0ff', Focused: '#a78bfa',
  Bored: '#ffc658', Sad: '#ff7c7c', Angry: '#ef4444', Fearful: '#f97316',
  Surprised: '#34d399', Disgusted: '#78716c',
};

const moodScore = (emotion: string) => {
  const scores: Record<string,number> = { Happy: 90, Joy: 95, Focused: 85, Neutral: 60, Surprised: 65, Bored: 35, Sad: 25, Angry: 15, Fearful: 20, Disgusted: 20 };
  return scores[emotion] ?? 50;
};

export const SentimentTab: React.FC<TabProps> = ({ filteredStudents, teacherList, guestList }) => {
  const allPeople = [...filteredStudents, ...teacherList, ...guestList];
  const emotionDist = useMemo(() => {
    const counts: Record<string, number> = {};
    allPeople.forEach(s => { if (s.emotion) counts[s.emotion] = (counts[s.emotion] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: EMOTION_COLORS[name] || '#888' }));
  }, [allPeople]);

  const avgMoodScore = useMemo(() => {
    if (allPeople.length === 0) return 0;
    return Math.round(allPeople.reduce((a, s) => a + moodScore(s.emotion || 'Neutral'), 0) / allPeople.length);
  }, [allPeople]);

  const moodLabel = avgMoodScore >= 75 ? { text: 'Positive', color: 'text-green-400' }
    : avgMoodScore >= 50 ? { text: 'Neutral', color: 'text-yellow-400' }
    : { text: 'Negative', color: 'text-red-400' };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      <div className="grid grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-5" style={{ height: '22rem' }}>
          <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
            <Smile size={14}/> Class Emotion Distribution
          </h3>
          {emotionDist.length === 0 ? (
            <div className="text-gray-600 text-center pt-20">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={emotionDist} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                <XAxis type="number" stroke="#666" fontSize={9}/>
                <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} width={70}/>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
                <Bar dataKey="value" fill="#00ff41" radius={[0, 4, 4, 0]} name="Count"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Mood gauge */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 flex flex-col items-center justify-center" style={{ height: '22rem' }}>
          <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2 self-start">
            <Thermometer size={14}/> Mood Temperature
          </h3>
          <div className="relative w-32 h-32 my-4">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#333" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={avgMoodScore >= 75 ? '#00ff41' : avgMoodScore >= 50 ? '#ffc658' : '#ef4444'}
                strokeWidth="3" strokeDasharray={`${avgMoodScore} ${100 - avgMoodScore}`} strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${moodLabel.color}`}>{avgMoodScore}</span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>
          <div className={`text-xl font-bold ${moodLabel.color}`}>{moodLabel.text}</div>
          <div className="text-xs text-gray-500 mt-1">Class Mood Score</div>
        </div>
      </div>

      {/* Individual emotion cards */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase flex items-center gap-2">
          <TrendingUp size={14}/> Individual Emotion States
        </h3>
        {allPeople.length === 0 ? (
          <div className="text-gray-600 text-center py-8">No one detected.</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {allPeople.map(s => {
              const color = EMOTION_COLORS[s.emotion || 'Neutral'] || '#888';
              const score = moodScore(s.emotion || 'Neutral');
              return (
                <div key={s.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                      {s.name?.slice(0,1)}
                    </div>
                    <span className="text-xs text-white font-medium truncate">{s.name}</span>
                  </div>
                  <div className="text-sm font-bold" style={{ color }}>{s.emotion}</div>
                  <div className="mt-1.5 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }}></div>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Mood: {score}/100</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
