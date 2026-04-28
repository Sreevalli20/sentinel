export enum ViewState {
  HOME = "HOME",
  REGISTER_SELECTION = "REGISTER_SELECTION",
  REGISTER_TEACHER = "REGISTER_TEACHER",
  REGISTER_STUDENT = "REGISTER_STUDENT",
  ATTENDANCE_SETUP = "ATTENDANCE_SETUP",
  MONITORING = "MONITORING",
  SUMMARY = "SUMMARY",
  DATABASE = "DATABASE",
}

export enum PersonType {
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  GUEST = "GUEST",
  VIP = "VIP",
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MetricHistory {
  timestamp: number;
  timeLabel: string;
  engagement: number;
  emotion: string;
  action: string;
  phone: boolean;
  engagementStatus: string;
}

export interface DetectionData {
  id: string;
  name: string;
  type: PersonType;
  box: BoundingBox;
  emotion: string;
  action: string;
  engagementScore: number;
  engagementStatus: string;
  phoneDetected: boolean;
  phoneUsageDuration: number;
  phoneIncident?: boolean;
  phoneSustained?: boolean;
  sessionAlertCount: number;
  engagementStreak: number;
  attendanceStatus?: string;
  rollNo?: string;
  email?: string;
  history: MetricHistory[];
}

export interface SecuritySnapshot {
  id: string;
  timestamp: string;
  image: string; // base64 crop
}

export interface RegisteredUser {
  id: string;
  name: string;
  type: PersonType;
  photo: string;
  faceDescriptor: number[] | null;
  rollNo?: string;
  subject?: string;
  age?: number;
  branch?: string;
  email?: string;
  idCardPhoto?: string;
  registrationDate?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SessionConfig {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  subject: string; // Added Subject
}

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  attendanceStatus: string;
  avgEngagement: number;
  phoneViolations: number;
  topEmotion: string;
  topAction: string;
  attendanceScore: number;
}

export interface GuestSummary {
  id: string;
  name: string;
  avgEngagement: number;
  phoneViolations: number;
  topEmotion: string;
  topAction: string;
}

export interface SessionStats {
  startTime: string;
  endTime: string;
  durationString: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  bunkCount: number;
  lateCount: number;
  avgEngagement: number;
  phoneIncidents: number;
  totalTeachers: number;
  totalGuests: number;
  studentSummaries: StudentSummary[];
  guestSummaries: GuestSummary[];
  heatmap: HeatmapZone[];
}

export interface TeacherData {
  id: string;
  type: PersonType;
  name: string;
  subject?: string;
  photo?: string;
  registrationDate?: string;
  engagementScore?: number;
  engagementStatus?: "HIGH" | "MEDIUM" | "LOW";
  emotion?: string;
  action?: string;
  engagementAction?: string;
  attendanceStatus?: "PRESENT" | "ABSENT" | "LATE";
  phoneDetected?: boolean;
  sessionAlertCount?: number;
  focusStreak?: number;
  stabilityStatus?: "LOCKED" | "STABLE" | "UNSTABLE";
  lastSeen?: number;
  history?: MetricHistory[];
}

export interface HeatmapZone {
  id: number; // 0-8
  engagement: number;
  count: number;
}

export interface AudioState {
  level: number; // 0-100
  status: "SILENCE" | "WHISPER" | "DISCUSSION" | "CHAOS";
}

export interface SessionConfig {
  subject: string;
  startTime: string;
  endTime: string;
}

export interface HeatmapZone {
  id: number;
  count: number;
  engagement: number;
}

export interface Teacher {
  id: string;
  name: string;
  type: string;
  subject: string;
  photo: string;
  registrationDate: string;
}
