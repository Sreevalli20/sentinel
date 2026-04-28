import { PersonType } from "./types";

export const APP_NAME = "SENTINEL";
export const VERSION = "5.0.0-PROD";

// --- SIMPLIFIED LABEL SETS (Client requirements) ---

export const EMOTIONS = ["Happy", "Sad", "Angry", "Neutral", "Dull", "Focused", "Confused"] as const;
export const TEACHER_EMOTIONS = ["Happy", "Neutral", "Focused", "Confident", "Engaged", "Tired", "Serious"] as const;
export type EmotionType = typeof EMOTIONS[number];

export const EMOTION_EMOJI: Record<string, string> = {
  Happy: "😊",
  Sad: "😢",
  Angry: "😠",
  Neutral: "😐",
  Dull: "😑",
  Focused: "🎯",
  Confused: "😕",
  // Teacher-specific
  Confident: "💪",
  Engaged: "✨",
  Tired: "😴",
  Serious: "🧐",
};

export const ACTIONS = ["Reading", "Writing", "Sleeping", "Eating", "Drinking", "Watching", "Playing", "Calling"] as const;
export const TEACHER_ACTIONS = ["Teaching", "Reading", "Writing on board", "Referring to notes", "Watching", "Engaging with students", "Sleeping", "Eating"] as const;
export type ActionType = typeof ACTIONS[number];

export const ENGAGEMENT_ACTIONS = ["Focused", "Concentration", "Listening", "Looking Away", "Looking Side", "Not Focused"] as const;

// Color mapping for bounding boxes
export const TYPE_COLORS = {
  [PersonType.STUDENT]: "border-hud-cyan text-hud-cyan shadow-[0_0_10px_#00f0ff]",
  [PersonType.TEACHER]: "border-hud-green text-hud-green shadow-[0_0_10px_#00ff41]",
  [PersonType.GUEST]: "border-hud-red text-hud-red shadow-[0_0_15px_#ff003c] animate-pulse",
  [PersonType.VIP]: "border-yellow-500 text-yellow-500 shadow-[0_0_15px_#eab308] animate-pulse",
};

export const ATTENDANCE_COLORS: Record<string, string> = {
    'PRESENT': 'text-hud-green',
    'ABSENT': 'text-red-500',
    'LATE': 'text-yellow-500',
    'BUNK': 'text-orange-500 animate-pulse'
};
