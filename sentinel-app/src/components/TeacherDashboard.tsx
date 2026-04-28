import React from 'react';
import { DetectionData } from '../types';
import { 
  User, BookOpen, Activity, Smile, Zap, 
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  BarChart3, Brain, MessageSquare, Award
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface TeacherDashboardProps {
  teachers: DetectionData[];
  sessionDuration: string;
  avgEngagement: number;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teachers, sessionDuration, avgEngagement }) => {
  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-900/30 rounded-xl border border-dashed border-gray-700 p-12">
        <User size={64} className="mb-4 opacity-20" />
        <h3 className="text-xl font-mono text-white mb-2">NO TEACHER DETECTED</h3>
        <p className="max-w-md text-center text-sm">The system is actively scanning for registered faculty members. Ensure the teacher is within the camera's field of view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn h-full overflow-y-auto pr-2 custom-scrollbar">
      {teachers.map(teacher => (
        <div key={teacher.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-hud-cyan/20 to-transparent p-6 flex justify-between items-start border-b border-gray-700">
            <div className="flex gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gray-700 border-2 border-hud-cyan flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  {teacher.name?.slice(0,1)}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-hud-cyan text-black p-1.5 rounded-lg shadow-lg">
                  <Award size={16} />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{teacher.name}</h2>
                <div className="flex gap-4 text-sm font-mono text-gray-400">
                  <span className="flex items-center gap-2"><BookOpen size={14} className="text-hud-cyan"/> {teacher.subject || 'Faculty'}</span>
                  <span className="flex items-center gap-2"><Clock size={14} className="text-gray-500"/> Session: {sessionDuration}</span>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                   <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full border border-green-500/20 uppercase tracking-widest">Active Teaching</span>
                   <span className="px-3 py-1 bg-hud-cyan/10 text-hud-cyan text-[10px] font-bold rounded-full border border-hud-cyan/20 uppercase tracking-widest">AI Verified</span>
                   {(teacher.sessionAlertCount ?? 0) > 0 && (
                     <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded-full border border-orange-500/30 uppercase tracking-widest">
                       ⚠ {teacher.sessionAlertCount} Phone Alert{teacher.sessionAlertCount! > 1 ? 's' : ''}
                     </span>
                   )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-gray-500 text-xs uppercase font-mono mb-1">Teaching Performance</div>
              <div className="text-4xl font-bold text-hud-cyan">{avgEngagement}%</div>
              <div className="text-[10px] text-green-400 mt-1 flex items-center justify-end gap-1">
                <TrendingUp size={12}/> +2.4% vs session avg
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="p-6 grid grid-cols-4 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
               <div className="text-gray-500 text-[10px] uppercase font-mono mb-2 flex items-center gap-2">
                  <Zap size={12} className="text-orange-500"/> Current Action
               </div>
               <div className="text-xl font-bold text-white">{teacher.action}</div>
               <div className="mt-2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-3/4"></div>
               </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
               <div className="text-gray-500 text-[10px] uppercase font-mono mb-2 flex items-center gap-2">
                  <Smile size={12} className="text-yellow-400"/> Emotional State
               </div>
               <div className="text-xl font-bold text-white">{teacher.emotion}</div>
               <div className="text-[10px] text-gray-400 mt-1 italic">"Positive reinforcement detected"</div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
               <div className="text-gray-500 text-[10px] uppercase font-mono mb-2 flex items-center gap-2">
                  <Activity size={12} className="text-hud-cyan"/> Engagement
               </div>
               <div className="text-xl font-bold text-white">{teacher.engagementScore}%</div>
               <div className="mt-2 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < (teacher.engagementScore! / 20) ? 'bg-hud-cyan' : 'bg-gray-800'}`}></div>
                  ))}
               </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
               <div className="text-gray-500 text-[10px] uppercase font-mono mb-2 flex items-center gap-2">
                  <Brain size={12} className="text-purple-500"/> Phone Alerts
               </div>
               <div className="text-xl font-bold text-white">{(teacher.sessionAlertCount ?? 0)}</div>
               <div className="text-[10px] text-gray-400 mt-1">This session</div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="p-6 grid grid-cols-3 gap-6 border-t border-gray-700">
             <div className="col-span-2 bg-gray-900/30 rounded-xl border border-gray-700 p-4">
                <h4 className="text-gray-400 text-[10px] uppercase font-mono mb-4 flex items-center gap-2">
                   <BarChart3 size={14}/> Engagement Trajectory
                </h4>
                <div className="h-48">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={teacher.history || []}>
                        <defs>
                          <linearGradient id="colorTeacher" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="timeLabel" hide />
                        <YAxis stroke="#555" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                        <Area type="monotone" dataKey="engagement" stroke="#00f0ff" fillOpacity={1} fill="url(#colorTeacher)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="space-y-4">
                <div className="bg-gray-900/30 rounded-xl border border-gray-700 p-4">
                   <h4 className="text-gray-400 text-[10px] uppercase font-mono mb-3 flex items-center gap-2">
                      <MessageSquare size={14}/> Feedback Summary
                   </h4>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-green-400">
                         <CheckCircle2 size={12}/> Clear communication style
                      </div>
                      <div className="flex items-center gap-2 text-xs text-yellow-400">
                         <AlertTriangle size={12}/> Pace is slightly fast
                      </div>
                      <div className="flex items-center gap-2 text-xs text-hud-cyan">
                         <CheckCircle2 size={12}/> Excellent visual aid usage
                      </div>
                   </div>
                </div>
                <div className="bg-hud-cyan/5 rounded-xl border border-hud-cyan/20 p-4">
                   <div className="text-[10px] text-hud-cyan font-bold uppercase mb-1">AI Recommendation</div>
                   <p className="text-[11px] text-gray-300 italic">"The students in the back-left quadrant show a 12% drop in attention. Consider moving towards that area or initiating a direct question."</p>
                </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};
