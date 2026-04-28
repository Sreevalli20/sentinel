import React, { useState } from 'react';
import { RegisteredUser, PersonType } from '../types';
import { Button } from './Button';
import {
  Database, Trash2, User, BookOpen, Users, ShieldCheck,
  ArrowLeft, CreditCard, LogIn, PieChart as PieChartIcon
} from 'lucide-react';
import { AdminAuth } from './AdminAuth';

// Recharts imports
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface DatabaseViewProps {
  registeredUsers: RegisteredUser[];
  onDeleteUser: (id: string) => void;
  onBack: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  registeredUsers,
  onDeleteUser,
  onBack
}) => {
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [isStudentAuthenticated, setIsStudentAuthenticated] = useState(false);

  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const [showStudentAuth, setShowStudentAuth] = useState(false);

  const students = registeredUsers.filter(u => u.type === PersonType.STUDENT);
  const teachers = registeredUsers.filter(u => u.type === PersonType.TEACHER);
  const guests = registeredUsers.filter(u => u.type === PersonType.GUEST);

  // Determine what data to show in charts based on login
  const showFullData = isTeacherAuthenticated; // Only teacher sees full data

  // Pie Chart Data
  const pieData = showFullData
    ? [
      { name: 'Students', value: students.length, fill: '#22d3ee' },
      { name: 'Teachers', value: teachers.length, fill: '#4ade80' },
      { name: 'Guests', value: guests.length, fill: '#f87171' },
    ].filter(item => item.value > 0)
    : [
      { name: 'Teachers', value: teachers.length, fill: '#4ade80' },
    ].filter(item => item.value > 0);

  // Bar Chart Data
  const barData = showFullData
    ? [
      { category: 'Students', count: students.length },
      { category: 'Teachers', count: teachers.length },
      { category: 'Guests', count: guests.length },
    ]
    : [
      { category: 'Teachers', count: teachers.length },
    ];

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Delete ${name} from database? This cannot be undone.`)) {
      onDeleteUser(id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={18} />}>
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Database size={28} className="text-hud-cyan" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">REGISTERED USERS DATABASE</h1>
              <p className="text-gray-500 text-xs">All stored registration details</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Teacher Login */}
          {!isTeacherAuthenticated ? (
            <Button
              variant="secondary"
              onClick={() => setShowTeacherAuth(true)}
              icon={<ShieldCheck size={18} />}
            >
              Teacher Login
            </Button>
          ) : (
            <span className="text-hud-green text-sm font-bold flex items-center gap-2 bg-gray-900 px-4 py-1.5 rounded-xl border border-hud-green/30">
              <ShieldCheck size={16} /> Teacher Mode
            </span>
          )}

          {/* Student Login */}
          {!isStudentAuthenticated ? (
            <Button
              variant="secondary"
              onClick={() => setShowStudentAuth(true)}
              icon={<LogIn size={18} />}
              className="border-hud-cyan/50 hover:border-hud-cyan"
            >
              Student Login
            </Button>
          ) : (
            <span className="text-hud-cyan text-sm font-bold flex items-center gap-2 bg-gray-900 px-4 py-1.5 rounded-xl border border-hud-cyan/30">
              <User size={16} /> Student Mode
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards - Always show full stats */}
      <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-800">
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <div className="text-gray-500 text-xs uppercase tracking-wider">Total</div>
          <div className="text-2xl font-bold text-white mt-1">{registeredUsers.length}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl border border-hud-cyan/30">
          <div className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1">
            <User size={12} /> Students
          </div>
          <div className="text-2xl font-bold text-hud-cyan mt-1">{students.length}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl border border-hud-green/30">
          <div className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1">
            <BookOpen size={12} /> Teachers
          </div>
          <div className="text-2xl font-bold text-hud-green mt-1">{teachers.length}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl border border-hud-red/30">
          <div className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1">
            <Users size={12} /> Guests
          </div>
          <div className="text-2xl font-bold text-hud-red mt-1">{guests.length}</div>
        </div>
      </div>

      {/* Charts Section */}
      {registeredUsers.length > 0 && (
        <div className="p-6 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3 mb-4">
            <PieChartIcon size={24} className="text-hud-cyan" />
            <h2 className="text-xl font-bold tracking-tight">
              {showFullData ? "User Distribution" : "Teachers Distribution"}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-center">
                {showFullData ? "Distribution (Pie)" : "Teachers (Pie)"}
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-center">
                {showFullData ? "Count Comparison (Bar)" : "Teachers Count"}
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="category" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill={showFullData ? "#22d3ee" : "#4ade80"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {registeredUsers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Database size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-bold">No registered users</p>
            <p className="text-sm mt-1">Register users to see them here</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {registeredUsers.map(user => (
              <div
                key={user.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                    {user.photo ? (
                      <img src={user.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-gray-500">
                        {user.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {user.name}
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${user.type === PersonType.STUDENT ? 'bg-hud-cyan/20 text-hud-cyan' :
                          user.type === PersonType.TEACHER ? 'bg-hud-green/20 text-hud-green' :
                            'bg-hud-red/20 text-hud-red'
                        }`}>
                        {user.type}
                      </span>
                    </div>
                    <div className="text-gray-500 text-sm mt-1 flex flex-wrap gap-3 items-center">
                      {user.rollNo && <span>Roll: {user.rollNo}</span>}
                      {user.subject && <span>Subject: {user.subject}</span>}
                      {user.branch && <span>Branch: {user.branch}</span>}
                      {user.age && <span>Age: {user.age}</span>}
                      {user.idCardPhoto && (
                        <span className="flex items-center gap-1 text-hud-green" title="ID Card captured">
                          <CreditCard size={12} /> ID Card
                        </span>
                      )}
                      {user.registrationDate && (
                        <span>Registered: {new Date(user.registrationDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {!user.faceDescriptor && (
                      <span className="text-amber-500 text-[10px] mt-1 block">No face descriptor</span>
                    )}
                  </div>
                </div>

                {/* Delete button ONLY for Teacher */}
                {isTeacherAuthenticated && (
                  <Button
                    variant="danger"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDeleteUser(user.id, user.name)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modals */}
      {showTeacherAuth && (
        <AdminAuth
          mode="teacher"
          onSuccess={() => {
            setIsTeacherAuthenticated(true);
            setShowTeacherAuth(false);
          }}
          onCancel={() => setShowTeacherAuth(false)}
        />
      )}

      {showStudentAuth && (
        <AdminAuth
          mode="student"
          onSuccess={() => {
            setIsStudentAuthenticated(true);
            setShowStudentAuth(false);
          }}
          onCancel={() => setShowStudentAuth(false)}
        />
      )}
    </div>
  );
};