import React, { useMemo, useState } from 'react';
import { Clock, Smartphone, User, Filter } from 'lucide-react';
import { TabProps } from './types';
import { PersonType } from '../../types';

interface TimelineEvent {
  studentId: string;
  studentName: string;
  timeLabel: string;
  engagement: number;
  emotion: string;
  action: string;
  phone: boolean;
}

export const TimelineTab: React.FC<TabProps> = ({ filteredStudents, teacherList }) => {
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const allPeople = [...filteredStudents, ...teacherList];

  const allEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    allPeople.forEach(s => {
      (s.history || []).forEach(h => {
        events.push({
          studentId: s.id,
          studentName: s.name || s.id,
          timeLabel: h.timeLabel,
          engagement: h.engagement,
          emotion: h.emotion,
          action: h.action,
          phone: h.phone || false,
        });
      });
    });
    return events.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  }, [allPeople]);

  const filtered = useMemo(() => {
    let ev = allEvents;
    if (personFilter !== 'all') ev = ev.filter(e => e.studentId === personFilter);
    if (typeFilter === 'phone') ev = ev.filter(e => e.phone);
    if (typeFilter === 'low') ev = ev.filter(e => e.engagement < 50);
    if (typeFilter === 'high') ev = ev.filter(e => e.engagement >= 70);
    return ev;
  }, [allEvents, personFilter, typeFilter]);

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Filters */}
      <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
        <Filter size={14} className="text-gray-400"/>
        <select value={personFilter} onChange={e => setPersonFilter(e.target.value)}
          className="bg-black text-white border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-hud-cyan">
          <option value="all">Person: All</option>
          {allPeople.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type === PersonType.TEACHER ? 'Teacher' : 'Student'})</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-black text-white border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-hud-cyan">
          <option value="all">Event: All</option>
          <option value="phone">Phone Events</option>
          <option value="low">Low Engagement</option>
          <option value="high">High Engagement</option>
        </select>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} events</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No timeline events recorded yet.</div>
      ) : (
        <div className="relative max-h-[28rem] overflow-y-auto custom-scrollbar">
          {/* Timeline line */}
          <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-gray-700"></div>

          <div className="space-y-1">
            {filtered.slice().reverse().map((ev, i) => (
              <div key={i} className="flex items-center gap-4">
                {/* Time label */}
                <div className="w-28 text-right text-xs text-gray-500 font-mono flex-shrink-0">{ev.timeLabel}</div>

                {/* Dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 z-10 border-2 ${ev.phone ? 'bg-red-500 border-red-400' : ev.engagement >= 70 ? 'bg-green-500 border-green-400' : ev.engagement >= 50 ? 'bg-yellow-500 border-yellow-400' : 'bg-red-500 border-red-400'}`}></div>

                {/* Event card */}
                <div className={`flex-1 flex items-center gap-3 px-3 py-2 rounded border text-xs ${ev.phone ? 'bg-red-900/10 border-red-800/30' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                    <User size={10} className="text-gray-500"/>
                    <span className="text-white font-mono truncate">{ev.studentName}</span>
                  </div>

                  {/* Sparkline bar */}
                  <div className="w-20 h-3 bg-gray-900 rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full rounded-full ${ev.engagement >= 70 ? 'bg-green-500' : ev.engagement >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${ev.engagement}%` }}></div>
                  </div>
                  <span className={`font-bold w-8 ${ev.engagement >= 70 ? 'text-green-400' : ev.engagement >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{ev.engagement}%</span>

                  <span className="text-gray-400 flex-1 truncate">{ev.action}</span>
                  <span className="text-gray-500 w-16 truncate">{ev.emotion}</span>
                  {ev.phone && <span className="flex items-center gap-0.5 text-red-400"><Smartphone size={10}/> Phone</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
