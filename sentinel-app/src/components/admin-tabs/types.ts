import { DetectionData, AudioState, HeatmapZone, RegisteredUser, SessionStats } from '../../types';

export interface SessionHistoryItem {
  id: string;
  date: string;
  subject: string;
  duration: string;
  teacherId?: string;
  teacherName?: string;
  presentCount: number;
  totalStudents: number;
  avgEngagement: number;
  phoneIncidents: number;
}

export interface TabProps {
  students: DetectionData[];
  studentList: DetectionData[];
  filteredStudents: DetectionData[];
  teacherList: DetectionData[];
  guestList: DetectionData[];
  audioState: AudioState;
  heatmap: HeatmapZone[];
  registeredUsers: RegisteredUser[];
  isTeacherInvisible: boolean;
  toggleTeacherInvisibility: () => void;
  sessionStartTime?: string;
  sessionHistory?: SessionHistoryItem[];
  refreshKey?: number;
  onRefresh?: () => void;
}
