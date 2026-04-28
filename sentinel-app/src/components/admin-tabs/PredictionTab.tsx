import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TabProps } from './types';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';

function linearRegression(values: number[]) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const xs = values.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  const numerator = xs.reduce((a, x, i) => a + (x - xMean) * (values[i] - yMean), 0);
  const denominator = xs.reduce((a, x) => a + Math.pow(x - xMean, 2), 0);
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

export const PredictionTab: React.FC<TabProps> = ({ filteredStudents }) => {
  const classHistory = useMemo(() => {
    const maxLen = Math.max(...filteredStudents.map(s => s.history?.length ?? 0), 1);
    return Array.from({ length: maxLen }, (_, i) => {
      const vals = filteredStudents.map(s => s.history?.[i]?.engagement ?? s.engagementScore ?? 50);
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      return { index: i, avg, label: filteredStudents[0]?.history?.[i]?.timeLabel || `t${i}` };
    });
  }, [filteredStudents]);

  const { slope, intercept } = useMemo(() => {
    return linearRegression(classHistory.map(h => h.avg));
  }, [classHistory]);

  const predicted = useMemo(() => {
    const n = classHistory.length;
    const extPoints = 5;
    return Array.from({ length: extPoints }, (_, i) => ({
      index: n + i,
      avg: null as number | null,
      label: `P${i+1}`,
      predicted: Math.max(0, Math.min(100, Math.round(intercept + slope * (n + i)))),
    }));
  }, [classHistory, slope, intercept]);

  const combined = [
    ...classHistory.map(h => ({ ...h, predicted: null as number | null })),
    ...predicted,
  ];

  const currentAvg = classHistory.length > 0 ? classHistory[classHistory.length - 1].avg : 0;
  const endPrediction = predicted.length > 0 ? (predicted[predicted.length - 1].predicted ?? 0) : currentAvg;
  const trend = slope > 1 ? 'up' : slope < -1 ? 'down' : 'stable';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-yellow-400';

  const studentPredictions = useMemo(() => {
    return filteredStudents.map(s => {
      const hist = (s.history || []).map(h => h.engagement);
      const { slope: sSlope, intercept: sIntercept } = linearRegression(hist.length >= 2 ? hist : [s.engagementScore ?? 50]);
      const projected = Math.max(0, Math.min(100, Math.round(sIntercept + sSlope * (hist.length + 3))));
      return { id: s.id, name: s.name || s.id, current: s.engagementScore ?? 0, projected, slope: sSlope };
    }).sort((a, b) => b.projected - a.projected);
  }, [filteredStudents]);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Current Class Avg', value: `${currentAvg}%`, color: 'text-hud-cyan' },
          { label: 'Predicted End-of-Session', value: `${endPrediction}%`, color: trendColor },
          { label: 'Trend Slope', value: `${slope > 0 ? '+' : ''}${slope.toFixed(1)} pts/min`, color: trendColor },
          { label: 'Trend Direction', value: trend.charAt(0).toUpperCase() + trend.slice(1), color: trendColor },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5" style={{ height: '22rem' }}>
        <h3 className="text-gray-400 font-mono mb-3 text-xs uppercase flex items-center gap-2">
          <TrendIcon size={14} className={trendColor}/> Class Engagement Prediction
          <span className="text-gray-600 text-xs">(dashed = projection)</span>
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={combined}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
            <XAxis dataKey="label" stroke="#666" fontSize={9}/>
            <YAxis stroke="#666" fontSize={9} domain={[0, 100]}/>
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}/>
            <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }}/>
            <ReferenceLine y={80} stroke="#444" strokeDasharray="5 5" label={{ value: 'Target', fill: '#666', fontSize: 10 }}/>
            <Line type="monotone" dataKey="avg" stroke="#00f0ff" dot={false} name="Actual" connectNulls={false}/>
            <Line type="monotone" dataKey="predicted" stroke="#a78bfa" strokeDasharray="6 3" dot={false} name="Predicted" connectNulls={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-student predictions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-gray-400 font-mono mb-4 text-xs uppercase">Per-Student Projections</h3>
        {studentPredictions.length === 0 ? (
          <div className="text-gray-600 text-center py-8">No students to predict.</div>
        ) : (
          <div className="space-y-2">
            {studentPredictions.map(s => {
              const delta = s.projected - s.current;
              const color = delta > 5 ? 'text-green-400' : delta < -5 ? 'text-red-400' : 'text-yellow-400';
              const Icon = delta > 5 ? TrendingUp : delta < -5 ? TrendingDown : Minus;
              return (
                <div key={s.id} className="flex items-center gap-4 bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                    {s.name.slice(0,1)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">Current: {s.current}% → Projected: {s.projected}%</div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${color}`}>
                    <Icon size={14}/> {delta > 0 ? '+' : ''}{delta}%
                  </div>
                  <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-gray-600 to-hud-cyan" style={{ width: `${s.projected}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
