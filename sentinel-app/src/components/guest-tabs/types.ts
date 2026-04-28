import { DetectionData, AudioState, HeatmapZone, RegisteredUser, GuestSummary } from '../../types';

export interface SessionHistoryItem {
  id: string;
  date: string;
  subject: string;
  duration: string;
  presentCount: number;
  totalStudents: number;
  avgEngagement: number;
  phoneIncidents: number;
  guestSummaries?: GuestSummary[];
}

export interface GuestTabProps {
  allGuests: DetectionData[];
  registeredGuests: DetectionData[];
  unregisteredGuests: DetectionData[];
  filteredGuests: DetectionData[];
  audioState: AudioState;
  heatmap: HeatmapZone[];
  registeredUsers: RegisteredUser[];
  sessionHistory?: SessionHistoryItem[];
  refreshKey?: number;
  onRefresh?: () => void;
}
