import React, { useState } from 'react';
import { Search, User, Users, Shield, BookOpen } from 'lucide-react';
import { TabProps } from './types';
import { RegisteredUser, PersonType } from '../../types';

const roleColors: Record<string, string> = {
  STUDENT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TEACHER: 'bg-green-500/20 text-green-400 border-green-500/30',
  ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  GUEST: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const roleIcons: Record<string, React.ReactNode> = {
  STUDENT: <Users size={12}/>,
  TEACHER: <BookOpen size={12}/>,
  ADMIN: <Shield size={12}/>,
  GUEST: <User size={12}/>,
};

export const ProfilesTab: React.FC<TabProps> = ({ registeredUsers, students }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const liveMap = new Map(students.map(s => [s.id, s]));

  const filtered = registeredUsers.filter(u => {
    const matchesSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.id?.includes(search) || u.rollNo?.includes(search);
    const roleStr = u.type === PersonType.TEACHER ? 'TEACHER' : u.type === PersonType.STUDENT ? 'STUDENT' : u.type === PersonType.GUEST ? 'GUEST' : 'STUDENT';
    const matchesRole = roleFilter === 'all' || roleStr === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-20 custom-scrollbar animate-fadeIn">
      {/* Search & Filter */}
      <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
        <Search size={14} className="text-gray-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
          className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"/>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-black text-white border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-hud-cyan">
          <option value="all">Role: All</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="GUEST">Guest</option>
          <option value="ADMIN">Admin</option>
        </select>
        <span className="text-xs text-gray-500">{filtered.length} users</span>
      </div>

      {/* Table */}
      {registeredUsers.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <Users size={48} className="mx-auto mb-4 opacity-30"/>
          <p>No registered users found.</p>
          <p className="text-xs mt-2 text-gray-600">Users are registered through the system onboarding flow.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900">
                <th className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">User</th>
                <th className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">Role</th>
                <th className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">ID</th>
                <th className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-400 font-mono uppercase px-4 py-3">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: RegisteredUser) => {
                const role = u.type === PersonType.TEACHER ? 'TEACHER' : u.type === PersonType.STUDENT ? 'STUDENT' : u.type === PersonType.GUEST ? 'GUEST' : 'STUDENT';
                const isLive = liveMap.has(u.id);
                const liveDet = liveMap.get(u.id);
                const lastSeen = isLive ? new Date().toLocaleTimeString() : (liveDet?.lastSeen ? new Date(liveDet.lastSeen).toLocaleString() : '—');
                const displayId = u.rollNo || u.id;
                return (
                  <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(u as any).image || u.photo ? (
                          <img src={((u as any).image || u.photo) as string} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-gray-600"/>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white border border-gray-600">
                            {u.name?.slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium">{u.name}</div>
                          {u.rollNo && <div className="text-xs text-gray-500 font-mono">{u.rollNo}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono border ${roleColors[role] || roleColors['GUEST']}`}>
                        {roleIcons[role]} {role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{displayId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isLive ? 'text-green-400 bg-green-400/10' : 'text-gray-500 bg-gray-700/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
                        {isLive ? 'LIVE' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {isLive ? lastSeen : '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">No results match your filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
