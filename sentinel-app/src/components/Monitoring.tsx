// Monitoring.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import {
  DetectionData, BoundingBox, PersonType, MetricHistory,
  SessionConfig, SessionStats, StudentSummary, GuestSummary, AudioState,
  HeatmapZone, RegisteredUser
} from '../types';
import {
  loadFaceRecognitionModels,
  getDescriptorsFromVideo,
  createFaceMatcher,
  matchDescriptorToUser,
} from '../services/faceRecognition';
import { EMOTIONS, ACTIONS, ENGAGEMENT_ACTIONS, EMOTION_EMOJI, TYPE_COLORS, ATTENDANCE_COLORS } from '../constants';
import { inferActionFromLandmarks } from '../utils/actionFromLandmarks';
import { inferActionFrom68Landmarks } from '../utils/actionFrom68Landmarks';
import {
  Camera, Shield, Activity, Users, AlertCircle, Smartphone,
  Clock, LogOut, LayoutGrid, Mic,
  Volume2, VolumeX, Eye, EyeOff, Maximize2, Minimize2,
  ChevronRight, Play, Square, RefreshCw
} from 'lucide-react';
import { Button } from './Button';
import { Dashboard } from './Dashboard';
import { GuestDashboard } from './GuestDashboard';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface MonitoringProps {
  config: SessionConfig;
  onStop: (stats: SessionStats) => void;
  onBack?: () => void;
  registeredUsers: RegisteredUser[];
  sessionHistory?: Array<{ id: string; date: string; subject: string; duration: string; presentCount: number; totalStudents: number; avgEngagement: number; phoneIncidents: number }>;
}

export const Monitoring: React.FC<MonitoringProps> = ({ config, onStop, onBack, registeredUsers, sessionHistory = [] }) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<{
    blazeface: blazeface.BlazeFaceModel | null;
    cocoSsd: cocoSsd.ObjectDetection | null;
    faceLandmarks: any | null;
  }>({ blazeface: null, cocoSsd: null, faceLandmarks: null });
  const requestRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastObjectDetectionRef = useRef<number>(0);
  const lastObjectsRef = useRef<any[]>([]);
  const isProcessingRef = useRef(false);
  const phoneBufferRef = useRef<Record<string, boolean[]>>({});
  const alertCooldownRef = useRef<Record<string, number>>({});
  const phoneStartTimeRef = useRef<Record<string, number>>({});
  const sessionAlertCountRef = useRef<Record<string, number>>({});
  const displayEmotionRef = useRef<Record<string, { value: string; updatedAt: number }>>({});
  const displayActionRef = useRef<Record<string, { value: string; updatedAt: number }>>({});
  const lastFaceSeenAtRef = useRef<number>(0);
  const DISPLAY_COOLDOWN_MS = 1500;
  const faceMatchRef = useRef<Map<number, { user: RegisteredUser; updatedAt: number }>>(new Map());
  const emotionRef = useRef<Map<number, string>>(new Map());
  const actionLandmarksRef = useRef<Map<number, any>>(new Map());
  const STICKY_IDENTITY_MS = 4000;
  const faceMatcherRef = useRef<ReturnType<typeof createFaceMatcher>>(null);
  const recognitionFrameCounterRef = useRef(0);
  const latestDetectionsRef = useRef<DetectionData[]>([]);

  // State
  const [status, setStatus] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [detections, setDetections] = useState<DetectionData[]>([]);
  const [sessionData, setSessionData] = useState<Record<string, Partial<StudentSummary>>>(() => {
    const initial: Record<string, Partial<StudentSummary>> = {};
    registeredUsers.forEach(u => {
      if (u.type === PersonType.STUDENT) {
        initial[u.id] = {
          id: u.id,
          name: u.name,
          rollNo: u.rollNo!,
          email: u.email,
          attendanceStatus: 'ABSENT',
          avgEngagement: 0,
          phoneViolations: 0,
          topEmotion: 'Neutral',
          topAction: 'Sitting',
          attendanceScore: 0
        };
      }
    });
    return initial;
  });

  const [audioState, setAudioState] = useState<AudioState>({ level: 0, status: 'SILENCE' });
  const [sessionStatus, setSessionStatus] = useState<'WAITING' | 'ACTIVE' | 'EXPIRED'>('WAITING');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showGuestDashboard, setShowGuestDashboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isTeacherInvisible, setIsTeacherInvisible] = useState(false);
  const [heatmap, setHeatmap] = useState<HeatmapZone[]>(Array.from({ length: 9 }, (_, i) => ({ id: i, count: 0, engagement: 0 })));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // --- BACKEND FACE RECOGNITION FUNCTION ---
  const recognizeFacesWithBackend = useCallback(async (faces: any[]) => {
    if (faces.length === 0 || !videoRef.current) return null;

    try {
      // Capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      const response = await fetch(`${API_BASE_URL}/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (response.ok) {
        const user = await response.json();
        return user;
      }
    } catch (error) {
      console.error('Backend face recognition error:', error);
    }

    return null;
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        setStatus('LOADING');

        await tf.ready();
        const [bfModel, cocoModel, flModel] = await Promise.all([
          blazeface.load(),
          cocoSsd.load(),
          faceLandmarksDetection.createDetector(
            faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            { runtime: 'tfjs', maxFaces: 10, refineLandmarks: true }
          )
        ]);
        modelRef.current = { blazeface: bfModel, cocoSsd: cocoModel, faceLandmarks: flModel };

        try {
          await loadFaceRecognitionModels();
          faceMatcherRef.current = createFaceMatcher(registeredUsers);

          // Debug: Log registered users with descriptors
          const usersWithDescriptors = registeredUsers.filter(u => u.faceDescriptor && u.faceDescriptor.length === 128);
          console.log(`[Monitoring] Loaded ${usersWithDescriptors.length} registered users with face descriptors:`);
          usersWithDescriptors.forEach(u => {
            console.log(`  - ${u.name} (${u.type}): descriptor length ${u.faceDescriptor?.length}`);
          });

          if (usersWithDescriptors.length === 0) {
            console.warn('[Monitoring] WARNING: No registered users have face descriptors! Face recognition will not work.');
          }
        } catch (frErr) {
          console.warn('Face recognition models failed to load:', frErr);
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 30 },
            audio: true
          });
        } catch (mediaErr: any) {
          if (mediaErr?.name === 'NotFoundError' || mediaErr?.message?.includes('Requested device not found')) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (fallbackErr: any) {
              setErrorMsg('Camera or microphone not found. Close other apps using the camera (Zoom, Teams, etc.), check connections, and reload.');
              setStatus('ERROR');
              return;
            }
          } else {
            throw mediaErr;
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        setStatus('READY');
      } catch (err: any) {
        console.error('Initialization failed:', err);
        const msg = err?.message || '';
        if (msg.includes('Permission') || err?.name === 'NotAllowedError') {
          setErrorMsg('Camera/microphone access denied. Allow permissions in your browser and reload.');
        } else if (msg.includes('device not found') || err?.name === 'NotFoundError') {
          setErrorMsg('Camera or microphone not found. Close other apps using the camera (Zoom, Teams, etc.), check connections, and reload.');
        } else {
          setErrorMsg(msg || 'Camera or model initialization failed');
        }
        setStatus('ERROR');
      }
    };

    init();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [registeredUsers]);

  // --- SESSION TIMER ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(`${now.toDateString()} ${config.startTime}`);
      const end = new Date(`${now.toDateString()} ${config.endTime}`);

      if (now < start) {
        setSessionStatus('WAITING');
        const diff = start.getTime() - now.getTime();
        setTimeLeft(`Starts in ${Math.floor(diff / 60000)}m`);
      } else if (now > end) {
        setSessionStatus('EXPIRED');
        setTimeLeft('Session Ended');
      } else {
        setSessionStatus('ACTIVE');
        const diff = end.getTime() - now.getTime();
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config]);

  // --- PROCESSING LOOP ---
  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const level = Math.round((average / 255) * 100);

    let status: AudioState['status'] = 'SILENCE';
    if (level > 40) status = 'CHAOS';
    else if (level > 20) status = 'DISCUSSION';
    else if (level > 5) status = 'WHISPER';

    setAudioState({ level, status });
  }, []);

  const usedLandmarkIndicesRef = useRef<Set<number>>(new Set());

  const processDetections = useCallback(async (faces: any[], objects: any[], landmarks: any[]) => {
    usedLandmarkIndicesRef.current.clear();

    // Precompute phones in frame
    const phones = objects.filter((obj: any) => {
      const cls = (obj.class || '').toLowerCase();
      if (!cls.includes('cell') && !cls.includes('phone') && !cls.includes('mobile')) return false;
      const [, , pw, ph] = obj.bbox || [0, 0, 0, 0];
      const videoW = videoRef.current?.videoWidth || 640;
      const videoH = videoRef.current?.videoHeight || 480;
      const widthRatio = pw / videoW;
      const heightRatio = ph / videoH;
      if (widthRatio > 0.4 || heightRatio > 0.5) return false;
      const aspectRatio = pw / ph;
      if (aspectRatio > 1.8) return false;
      return true;
    });

    const newDetections: DetectionData[] = faces.map((face, idx) => {
      const [x1, y1] = face.topLeft;
      const [x2, y2] = face.bottomRight;
      const box: BoundingBox = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };

      // Match landmarks to face
      const faceCx = (x1 + x2) / 2;
      const faceCy = (y1 + y2) / 2;
      const videoW = videoRef.current?.videoWidth || 1280;
      const videoH = videoRef.current?.videoHeight || 720;
      const used = usedLandmarkIndicesRef.current;
      let faceLandmarks: { keypoints: any[] } | undefined;
      let bestDist = Infinity;
      let bestIdx = -1;
      landmarks.forEach((l: any, li: number) => {
        if (used.has(li)) return;
        const lBox = l.box || l.boundingBox;
        if (!lBox) return;
        const xMin = lBox.xMin ?? lBox.left ?? 0;
        const yMin = lBox.yMin ?? lBox.top ?? 0;
        const w = lBox.width ?? ((lBox.xMax ?? lBox.right ?? 0) - xMin);
        const h = lBox.height ?? ((lBox.yMax ?? lBox.bottom ?? 0) - yMin);
        let lx = xMin + w / 2;
        let ly = yMin + h / 2;
        if (lx <= 1 && ly <= 1) {
          lx *= videoW;
          ly *= videoH;
        }
        const d = (lx - faceCx) ** 2 + (ly - faceCy) ** 2;
        if (d < bestDist) {
          bestDist = d;
          faceLandmarks = l;
          bestIdx = li;
        }
      });
      if (bestIdx >= 0) used.add(bestIdx);
      if (!faceLandmarks && idx < landmarks.length) faceLandmarks = landmarks[idx];

      // Face recognition - try local matcher first, then fallback to backend
      const matchEntry = faceMatchRef.current.get(idx);
      let matchedUser = matchEntry?.user;
      let isRegistered = !!matchedUser;
      let id = isRegistered ? matchedUser.id : `guest-${idx}`;
      let type = isRegistered ? matchedUser.type : PersonType.GUEST;
      let name = isRegistered ? matchedUser.name : `Guest #${idx + 1}`;
      let rollNo = isRegistered ? matchedUser.rollNo : undefined;
      let email = isRegistered ? matchedUser.email : undefined;

      // If no local match, try backend recognition
      if (!isRegistered && faces.length > 0) {
        // Note: Backend recognition is called less frequently to avoid overloading
        // This is handled in the main loop
      }

      const prevDet = detections.find(d => d.id === id);

      // Emotion
      const now0 = Date.now();
      let rawEmotion = emotionRef.current.get(idx) || prevDet?.emotion || EMOTIONS[0];
      if (type === PersonType.TEACHER) {
        const teacherEmotionMap: Record<string, string> = {
          Cry: 'Tired', Dull: 'Tired', Confused: 'Serious',
          Sad: 'Serious', Angry: 'Serious',
        };
        rawEmotion = teacherEmotionMap[rawEmotion] || rawEmotion;
        const TEACHER_ALLOWED = ['Happy', 'Neutral', 'Focused', 'Confident', 'Engaged', 'Tired', 'Serious', 'Angry'];
        if (!TEACHER_ALLOWED.includes(rawEmotion)) rawEmotion = 'Neutral';
      }
      const prevEmotionDisplay = displayEmotionRef.current[id];
      let emotion: string;
      if (!prevEmotionDisplay || now0 - prevEmotionDisplay.updatedAt >= DISPLAY_COOLDOWN_MS) {
        emotion = rawEmotion;
        displayEmotionRef.current[id] = { value: rawEmotion, updatedAt: now0 };
      } else {
        emotion = prevEmotionDisplay.value;
      }

      // Action
      const apiLandmarks = actionLandmarksRef.current.get(idx);
      const keypoints = faceLandmarks?.keypoints;
      let rawAction: string;
      if (apiLandmarks) {
        rawAction = inferActionFrom68Landmarks(apiLandmarks, prevDet?.action);
      } else if (keypoints && keypoints.length >= 400) {
        rawAction = inferActionFromLandmarks(keypoints, prevDet?.action);
      } else {
        rawAction = prevDet?.action || 'Watching';
      }
      if (type === PersonType.TEACHER) {
        if (rawAction === 'Watching') rawAction = 'Teaching';
        else if (rawAction === 'Reading') rawAction = 'Reading';
        else if (rawAction === 'Writing') rawAction = 'Writing on board';
        else if (rawAction === 'Playing') rawAction = 'Engaging with students';
        else if (rawAction === 'Eating') rawAction = 'Eating';
        else if (rawAction === 'Sleeping') rawAction = 'Sleeping';
      }
      const prevActionDisplay = displayActionRef.current[id];
      let action: string;
      if (!prevActionDisplay || now0 - prevActionDisplay.updatedAt >= DISPLAY_COOLDOWN_MS) {
        action = rawAction;
        displayActionRef.current[id] = { value: rawAction, updatedAt: now0 };
      } else {
        action = prevActionDisplay.value;
      }

      // Phone detection
      const faceMargin = 160;
      let phoneInFrame = false;
      for (const obj of phones) {
        const [px, py, pw, ph] = obj.bbox || [0, 0, 0, 0];
        const phoneCenterX = px + pw / 2;
        const phoneCenterY = py + ph / 2;
        const inExpanded = phoneCenterX >= x1 - faceMargin && phoneCenterX <= x2 + faceMargin &&
          phoneCenterY >= y1 - faceMargin && phoneCenterY <= y2 + faceMargin;
        if (inExpanded) {
          phoneInFrame = true;
          break;
        }
      }

      if (!phoneBufferRef.current[id]) phoneBufferRef.current[id] = [];
      phoneBufferRef.current[id].push(phoneInFrame);
      if (phoneBufferRef.current[id].length > 12) phoneBufferRef.current[id].shift();
      const phoneDetected = phoneBufferRef.current[id].filter(v => v).length >= 7;

      // Engagement tracking
      const PHONE_INCIDENT_DURATION_MS = 3000;
      const PHONE_ALERT_COOLDOWN_MS = 8000;
      const now = Date.now();

      if (phoneDetected) {
        if (!phoneStartTimeRef.current[id]) phoneStartTimeRef.current[id] = now;
      } else {
        phoneStartTimeRef.current[id] = 0;
      }
      const phoneHeldMs = phoneStartTimeRef.current[id] ? now - phoneStartTimeRef.current[id] : 0;
      const sustainedPhoneUse = phoneHeldMs >= PHONE_INCIDENT_DURATION_MS;
      const cooldownPassed = !alertCooldownRef.current[id] || now - alertCooldownRef.current[id] > PHONE_ALERT_COOLDOWN_MS;
      const isNewIncident = sustainedPhoneUse && cooldownPassed;
      if (isNewIncident) {
        alertCooldownRef.current[id] = now;
        sessionAlertCountRef.current[id] = (sessionAlertCountRef.current[id] || 0) + 1;
      }
      const sessionAlertCount = sessionAlertCountRef.current[id] || 0;

      const actionEng = action.includes('Listening') || action.includes('Writing') || action.includes('Teaching') || action.includes('Presenting') || action.includes('Explaining') ? 90 : 60;
      const emotionEng = emotion.includes('Focused') || emotion.includes('Happy') ? 90 : 50;
      const baseEng = 50;
      const phonePenalty = (phoneDetected ? -30 : 0) - (sessionAlertCount * 10);

      let rawScore = (actionEng * 0.4) + (emotionEng * 0.4) + (baseEng * 0.2) + phonePenalty;
      rawScore = Math.max(0, Math.min(100, rawScore));

      const prevScore = prevDet?.engagementScore || 50;
      const engagementScore = Math.round(prevScore * 0.75 + rawScore * 0.25);
      const engagementStatus = engagementScore > 80 ? 'HIGH' : engagementScore > 50 ? 'MEDIUM' : 'LOW';

      let engagementStreak = (prevDet?.engagementStreak || 0);
      if (engagementScore > 80) engagementStreak += 1;
      else engagementStreak = 0;

      const historyEntry: MetricHistory = {
        timestamp: now,
        timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        engagement: engagementScore,
        emotion,
        action,
        phone: phoneDetected,
        engagementStatus
      };

      return {
        id,
        name,
        type,
        box,
        emotion,
        action,
        engagementScore,
        engagementStatus,
        phoneDetected,
        phoneUsageDuration: phoneHeldMs,
        phoneIncident: isNewIncident,
        phoneSustained: sustainedPhoneUse,
        sessionAlertCount,
        engagementStreak,
        attendanceStatus: isRegistered ? 'PRESENT' : undefined,
        rollNo,
        email,
        history: [...(prevDet?.history || []).slice(-19), historyEntry]
      };
    });

    // Update Heatmap
    const zones = Array.from({ length: 9 }, (_, i) => ({ id: i, count: 0, engagement: 0 }));
    newDetections.forEach(d => {
      const gridX = Math.min(2, Math.floor((d.box.x / (videoRef.current?.videoWidth || 1280)) * 3));
      const gridY = Math.min(2, Math.floor((d.box.y / (videoRef.current?.videoHeight || 720)) * 3));
      const zoneIdx = gridY * 3 + gridX;
      if (zoneIdx >= 0 && zoneIdx < 9) {
        const z = zones[zoneIdx];
        z.count++;
        z.engagement = z.count === 1 ? (d.engagementScore ?? 0) : Math.round((z.engagement * (z.count - 1) + (d.engagementScore ?? 0)) / z.count);
      }
    });
    setHeatmap(zones);

    // Update Session Data
    setSessionData(prev => {
      const next = { ...prev };
      newDetections.forEach(d => {
        if (d.type === PersonType.STUDENT && next[d.id]) {
          const current = next[d.id];
          current.attendanceStatus = 'PRESENT';
          current.avgEngagement = current.avgEngagement === 0 ? d.engagementScore : (current.avgEngagement! + d.engagementScore!) / 2;
          current.topEmotion = d.emotion;
          current.topAction = d.action;
          current.phoneViolations = d.sessionAlertCount ?? 0;
        } else if (d.type === PersonType.STUDENT && !next[d.id]) {
          // New student detected that wasn't in initial list
          next[d.id] = {
            id: d.id,
            name: d.name,
            rollNo: d.rollNo || '',
            email: d.email,
            attendanceStatus: 'PRESENT',
            avgEngagement: d.engagementScore,
            phoneViolations: d.sessionAlertCount ?? 0,
            topEmotion: d.emotion,
            topAction: d.action,
            attendanceScore: d.engagementScore
          };
        }
      });
      return next;
    });

    latestDetectionsRef.current = newDetections;
    setDetections(newDetections);
  }, [registeredUsers, detections]);

  const loop = useCallback(async () => {
    if (status !== 'READY' || !videoRef.current || !canvasRef.current || !modelRef.current.blazeface || isProcessingRef.current) {
      if (!isProcessingRef.current) requestRef.current = requestAnimationFrame(loop);
      return;
    }

    if (!videoRef.current || videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      requestRef.current = requestAnimationFrame(loop);
      return;
    }

    isProcessingRef.current = true;

    if (canvasRef.current && videoRef.current) {
      if (canvasRef.current.width !== videoRef.current.videoWidth || canvasRef.current.height !== videoRef.current.videoHeight) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }
    }

    tf.engine().startScope();
    try {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        // 1. Face Detection
        const faces = await modelRef.current.blazeface!.estimateFaces(videoRef.current, false);

        // 2. Face Recognition - every 6 frames for local, every 30 frames for backend
        recognitionFrameCounterRef.current += 1;

        if (faces.length === 0) {
          const now2 = Date.now();
          if (lastFaceSeenAtRef.current && now2 - lastFaceSeenAtRef.current > 2000) {
            faceMatchRef.current = new Map();
            emotionRef.current = new Map();
            actionLandmarksRef.current = new Map();
          }
        } else {
          lastFaceSeenAtRef.current = Date.now();
        }

        // Local face recognition (every 6 frames)
        if (faces.length > 0 && recognitionFrameCounterRef.current % 6 === 0) {
          console.log(`[Monitoring] Processing local face recognition for ${faces.length} faces, frame ${recognitionFrameCounterRef.current}`);

          try {
            const descriptorResults = await getDescriptorsFromVideo(videoRef.current!, faces);

            if (descriptorResults && descriptorResults.length > 0) {
              const now = Date.now();
              const nextMatches = new Map<number, { user: RegisteredUser; updatedAt: number }>();

              for (const result of descriptorResults) {
                const { descriptor, index, emotion, landmarks } = result;

                if (descriptor && faceMatcherRef.current) {
                  const match = matchDescriptorToUser(descriptor, faceMatcherRef.current);

                  if (match) {
                    const user = registeredUsers.find((u) => u.id === match.userId);
                    if (user) {
                      nextMatches.set(index, { user, updatedAt: now });
                      console.log(`✅ [Monitoring] Local match: ${user.name} (${user.type}) at index ${index}, distance: ${match.distance.toFixed(4)}`);

                      if (user.type === PersonType.STUDENT) {
                        setSessionData(prev => {
                          const updated = { ...prev };
                          if (updated[user.id]) {
                            updated[user.id]!.attendanceStatus = 'PRESENT';
                          }
                          return updated;
                        });
                      }
                    }
                  }
                }

                if (emotion) {
                  emotionRef.current.set(index, emotion);
                }

                if (landmarks) {
                  actionLandmarksRef.current.set(index, landmarks);
                }
              }

              // Sticky identity
              const currentMatches = faceMatchRef.current;
              for (let i = 0; i < faces.length; i++) {
                if (!nextMatches.has(i)) {
                  const prev = currentMatches.get(i);
                  if (prev && now - prev.updatedAt < STICKY_IDENTITY_MS) {
                    nextMatches.set(i, prev);
                    console.log(`🔄 [Monitoring] Sticky identity kept for index ${i}: ${prev.user.name}`);
                  }
                }
              }

              faceMatchRef.current = nextMatches;
              console.log(`[Monitoring] FaceMatchRef now has ${faceMatchRef.current.size} matches`);
            }
          } catch (err) {
            console.error('[Monitoring] Local face recognition error:', err);
          }
        }

        // Backend face recognition fallback (every 30 frames)
        if (faces.length > 0 && recognitionFrameCounterRef.current % 30 === 0) {
          try {
            const backendUser = await recognizeFacesWithBackend(faces);
            if (backendUser && backendUser.id) {
              const existingUser = registeredUsers.find(u => u.id === backendUser.id);
              if (existingUser && !faceMatchRef.current.has(0)) {
                faceMatchRef.current.set(0, { user: existingUser, updatedAt: Date.now() });
                console.log(`✅ [Monitoring] Backend match: ${existingUser.name}`);

                if (existingUser.type === PersonType.STUDENT) {
                  setSessionData(prev => {
                    const updated = { ...prev };
                    if (updated[existingUser.id]) {
                      updated[existingUser.id]!.attendanceStatus = 'PRESENT';
                    }
                    return updated;
                  });
                }
              }
            }
          } catch (err) {
            console.error('[Monitoring] Backend face recognition error:', err);
          }
        }

        // 3. Face Landmarks
        let landmarks: any[] = [];
        if (modelRef.current.faceLandmarks) {
          landmarks = await modelRef.current.faceLandmarks.estimateFaces(videoRef.current, {
            flipHorizontal: false
          });
        }

        // 4. Object Detection
        const now = Date.now();
        if (now - lastObjectDetectionRef.current > 300 && modelRef.current.cocoSsd) {
          const detected = await modelRef.current.cocoSsd.detect(
            videoRef.current,
            20,
            0.55
          );
          lastObjectsRef.current = detected;
          lastObjectDetectionRef.current = now;
        }
        const objects = lastObjectsRef.current;

        // 5. Audio Processing
        processAudio();

        // 6. Process Results
        await processDetections(faces, objects, landmarks);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('backend') && !err.message.includes('null')) {
        console.warn('Detection loop error:', err);
      }
    } finally {
      tf.engine().endScope();
      isProcessingRef.current = false;
    }

    // Draw Overlays
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        const toDraw = latestDetectionsRef.current;
        toDraw.forEach(det => {
          if (det.type === PersonType.TEACHER && isTeacherInvisible) return;

          const { x, y, w: width, h: height } = det.box;
          const color = TYPE_COLORS[det.type];

          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = color;
          const cornerSize = 15;
          ctx.fillRect(x - 2, y - 2, cornerSize, 4);
          ctx.fillRect(x - 2, y - 2, 4, cornerSize);
          ctx.fillRect(x + width - cornerSize + 2, y - 2, cornerSize, 4);
          ctx.fillRect(x + width - 2, y - 2, 4, cornerSize);
          ctx.fillRect(x - 2, y + height - cornerSize + 2, 4, cornerSize);
          ctx.fillRect(x - 2, y + height - 2, cornerSize, 4);
          ctx.fillRect(x + width - 2, y + height - cornerSize + 2, 4, cornerSize);
          ctx.fillRect(x + width - cornerSize + 2, y + height - 2, cornerSize, 4);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x, y - 85, width, 80);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y - 85, width, 80);

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px monospace';
          const nameText = det.name?.toUpperCase() || 'UNKNOWN';
          ctx.fillText(nameText, x + 10, y - 65);

          if (det.engagementStreak && det.engagementStreak > 10) {
            ctx.fillStyle = '#ff4e00';
            ctx.fillText('🔥', x + width - 25, y - 65);
          }

          ctx.font = '10px monospace';
          ctx.fillStyle = color;
          ctx.fillText(`${det.type} | ${det.rollNo || 'ID: ' + det.id.slice(0, 5)}`, x + 10, y - 50);

          ctx.fillStyle = '#fff';
          ctx.fillText(`EMOTION: ${EMOTION_EMOJI[det.emotion!] || ''} ${det.emotion}`, x + 10, y - 35);

          const engWidth = (width - 20) * (det.engagementScore! / 100);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(x + 10, y - 12, width - 20, 4);
          ctx.fillStyle = det.engagementScore! > 50 ? '#00ff41' : '#ff003c';
          ctx.fillRect(x + 10, y - 12, engWidth, 4);

          const alertCount = det.sessionAlertCount ?? 0;
          if (det.phoneDetected) {
            ctx.fillStyle = '#ff003c';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`⚠️ PHONE DETECTED${alertCount > 0 ? ` (${alertCount} total)` : ''}`, x + 10, y + height + 20);
          } else if (alertCount > 0) {
            ctx.fillStyle = '#ff8c00';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(`⚠️ ${alertCount} alert(s) this session`, x + 10, y + height + 20);
          }
        });
      }
    }

    requestRef.current = requestAnimationFrame(loop);
  }, [status, detections, isTeacherInvisible, processAudio, processDetections, heatmap, registeredUsers, recognizeFacesWithBackend]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  // --- ACTIONS ---
  const handleStop = () => {
    const studentSummaries: StudentSummary[] = Object.values(sessionData) as StudentSummary[];
    const guests = detections.filter(d => d.type === PersonType.GUEST);
    const guestSummaries: GuestSummary[] = guests.map(d => {
      const hist = d.history || [];
      const avgEng = hist.length > 0
        ? Math.round(hist.reduce((a, h) => a + h.engagement, 0) / hist.length)
        : (d.engagementScore ?? 50);
      const modeOf = (arr: string[]) => {
        const counts: Record<string, number> = {};
        arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
      };
      const emotions = hist.map(h => h.emotion).filter(Boolean);
      const actions = hist.map(h => h.action).filter(Boolean);
      return {
        id: d.id,
        name: d.name,
        avgEngagement: avgEng,
        phoneViolations: d.sessionAlertCount ?? 0,
        topEmotion: modeOf(emotions.length ? emotions : [d.emotion || 'Neutral']),
        topAction: modeOf(actions.length ? actions : [d.action || 'Sitting'])
      };
    });

    const stats: SessionStats = {
      startTime: config.startTime,
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationString: '60m',
      totalStudents: registeredUsers.filter(u => u.type === PersonType.STUDENT).length,
      presentCount: studentSummaries.filter(s => s.attendanceStatus === 'PRESENT').length,
      absentCount: studentSummaries.filter(s => s.attendanceStatus === 'ABSENT').length,
      bunkCount: 0,
      lateCount: 0,
      avgEngagement: studentSummaries.length > 0 ? Math.round(studentSummaries.reduce((a, b) => a + (b.avgEngagement || 0), 0) / studentSummaries.length) : 0,
      phoneIncidents: studentSummaries.reduce((a, b) => a + (b.phoneViolations || 0), 0),
      totalTeachers: registeredUsers.filter(u => u.type === PersonType.TEACHER).length,
      totalGuests: guests.length,
      studentSummaries,
      guestSummaries,
      heatmap
    };

    onStop(stats);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // --- RENDER ---
  if (status === 'LOADING') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-hud-black text-hud-cyan font-mono">
        <Activity className="w-16 h-16 animate-spin mb-4" />
        <h2 className="text-2xl tracking-widest animate-pulse">INITIALIZING SENTINEL CORE...</h2>
        <div className="mt-8 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-hud-cyan animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <p className="mt-4 text-xs text-gray-500">LOADING TENSORFLOW MODELS, FACE RECOGNITION & CAMERA</p>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-hud-black text-hud-red font-mono p-8 text-center">
        <AlertCircle className="w-20 h-20 mb-6" />
        <h2 className="text-3xl font-bold mb-4">SYSTEM CRITICAL ERROR</h2>
        <p className="max-w-md text-lg mb-4">{errorMsg}</p>
        <p className="max-w-md text-sm text-gray-500 mb-8">
          Use <code className="bg-gray-800 px-1 rounded">http://localhost:3000</code> on this machine, or HTTPS when accessing from another device.
        </p>
        <div className="flex gap-4">
          {onBack && <Button variant="secondary" onClick={onBack}>BACK</Button>}
          <Button variant="danger" onClick={() => window.location.reload()}>RELOAD</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden font-mono select-none">
      {/* Main Video Feed */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-60" muted playsInline />
      <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full object-cover z-10" />

      {/* Phone Alert Banners */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
        {detections.filter(d => d.phoneSustained).map(d => (
          <div key={d.id} className="bg-red-600 text-white px-6 py-3 rounded-full flex items-center gap-3 animate-bounce shadow-[0_0_20px_rgba(255,0,0,0.5)] border-2 border-white/20">
            <Smartphone className="animate-pulse" />
            <span className="font-bold tracking-widest">🚨 PHONE USAGE DETECTED: {d.name?.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* HUD Overlays */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,3px_100%] pointer-events-none"></div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-8 pointer-events-auto">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-hud-cyan tracking-tighter flex items-center gap-2">
                <Shield className="w-6 h-6" /> SENTINEL <span className="text-white font-light">AI MONITOR</span>
              </h1>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> SYSTEM ONLINE</span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span>SUBJECT: {config.subject.toUpperCase()}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeLeft}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <div className="text-[10px] text-gray-500 uppercase">Audio Level</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`w-1 h-4 rounded-full ${i < audioState.level / 10 ? (i > 7 ? 'bg-red-500' : 'bg-hud-cyan') : 'bg-gray-800'}`}></div>
                  ))}
                </div>
                <span className="text-xs font-bold text-white w-8">{audioState.level}%</span>
              </div>
            </div>
            <Button variant="secondary" onClick={() => { setAuthError(''); setShowAuthModal(true); }} icon={<LayoutGrid size={18} />}>CLASS VIEW</Button>
            <Button variant="secondary" onClick={() => setShowGuestDashboard(true)} icon={<Users size={18} />}>GUEST VIEW</Button>
            <Button variant="danger" onClick={handleStop} icon={<Square size={18} />}>STOP ATTENDANCE</Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between px-8 pointer-events-auto">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-400">DETECTED: <span className="text-white font-bold">{detections.length}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-hud-cyan" />
              <span className="text-gray-400">STUDENTS: <span className="text-white font-bold">{detections.filter(d => d.type === PersonType.STUDENT).length}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-hud-red" />
              <span className="text-gray-400">ALERTS: <span className="text-hud-red font-bold">{detections.reduce((a, d) => a + (d.sessionAlertCount ?? 0), 0)}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsTeacherInvisible(!isTeacherInvisible)} className="p-2 text-gray-400 hover:text-white transition-colors">
              {isTeacherInvisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-white transition-colors">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <div className="text-[10px] text-gray-500 font-mono">VER 3.4.2 // BUILD_STABLE</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDashboard && (
        <Dashboard
          students={detections}
          onClose={() => setShowDashboard(false)}
          isTeacherInvisible={isTeacherInvisible}
          toggleTeacherInvisibility={() => setIsTeacherInvisible(!isTeacherInvisible)}
          audioState={audioState}
          heatmap={heatmap}
          registeredUsers={registeredUsers}
          sessionHistory={sessionHistory}
        />
      )}

      {showGuestDashboard && (
        <GuestDashboard
          students={detections}
          audioState={audioState}
          heatmap={heatmap}
          registeredUsers={registeredUsers}
          sessionHistory={sessionHistory}
          onClose={() => setShowGuestDashboard(false)}
        />
      )}

      {/* Teacher Authentication Modal */}
      {showAuthModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div style={{ backgroundColor: '#0f0f0f', border: '1px solid #374151', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '28rem', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '4rem', height: '4rem', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <LayoutGrid size={28} color="#00f0ff" />
              </div>
              <h2 style={{ color: 'white', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>TEACHER AUTHENTICATION REQUIRED</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Admin Dashboard is restricted to registered teachers only. Stand in front of the camera to verify.</p>
            </div>

            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ color: '#9ca3af', fontSize: '0.7rem', fontFamily: 'monospace', marginBottom: '0.5rem' }}>HOW TO ACCESS</div>
              {[
                '1. Make sure your face is clearly visible in the camera',
                '2. Ensure you are registered as a Teacher (not Student/Guest)',
                '3. Click the Verify button below',
              ].map((s, i) => (
                <div key={i} style={{ color: '#d1d5db', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{s}</div>
              ))}
            </div>

            <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#9ca3af' }}>Faces detected in camera:</span>
                <span style={{ color: 'white', fontWeight: 'bold' }}>{detections.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Registered teachers in frame:</span>
                <span style={{ color: detections.filter(d => d.type === PersonType.TEACHER).length > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                  {detections.filter(d => d.type === PersonType.TEACHER).length}
                  {detections.filter(d => d.type === PersonType.TEACHER).length > 0
                    ? ` — ${detections.filter(d => d.type === PersonType.TEACHER).map(d => d.name).join(', ')}`
                    : ' — none'}
                </span>
              </div>
            </div>

            {authError && (
              <div style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.8rem', textAlign: 'center' }}>
                ⚠ {authError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  const teacherInFrame = detections.some(d => d.type === PersonType.TEACHER);
                  if (teacherInFrame) {
                    setShowAuthModal(false);
                    setAuthError('');
                    setShowDashboard(true);
                  } else {
                    setAuthError('Access denied — no registered teacher detected. Make sure you are registered as a Teacher and your face is visible in the camera.');
                  }
                }}
                style={{ flex: 1, padding: '0.75rem', background: '#00f0ff', color: 'black', fontWeight: 'bold', fontFamily: 'monospace', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <LayoutGrid size={16} /> Verify &amp; Open Admin Dashboard
              </button>
              <button
                onClick={() => { setShowAuthModal(false); setAuthError(''); }}
                style={{ padding: '0.75rem 1rem', background: '#374151', color: '#d1d5db', fontFamily: 'monospace', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>

            <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '0.7rem', marginTop: '1rem', fontFamily: 'monospace' }}>
              ACCESS LEVEL: TEACHER ONLY • FACE RECOGNITION ACTIVE
            </p>
          </div>
        </div>
      )}
    </div>
  );
};