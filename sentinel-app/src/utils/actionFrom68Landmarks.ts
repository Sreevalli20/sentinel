/**
 * Infer action from face-api 68-point landmarks (FaceLandmarks68).
 * Uses getLeftEye, getRightEye, getMouth, getNose from face-api format.
 */
import { ACTIONS } from '../constants';

interface Point {
  x: number;
  y: number;
}

/** Infer action from face-api 68-point landmarks (positions array or { getLeftEye, getRightEye, getMouth, getNose }) */
export function inferActionFrom68Landmarks(
  landmarks: { positions: Point[] } | { getLeftEye: () => Point[]; getRightEye: () => Point[]; getMouth: () => Point[]; getNose: () => Point[] } | undefined,
  prevAction?: string
): string {
  if (!landmarks) return prevAction || ACTIONS[5]; // ACTIONS[5] = Watching (default)

  let leftEye: Point[], rightEye: Point[], mouth: Point[], nose: Point[];
  if ('getLeftEye' in landmarks && typeof landmarks.getLeftEye === 'function') {
    leftEye = landmarks.getLeftEye();
    rightEye = landmarks.getRightEye();
    mouth = landmarks.getMouth();
    
    nose = landmarks.getNose();
  } else if ('positions' in landmarks && Array.isArray(landmarks.positions)) {
    const p = landmarks.positions;
    leftEye = p.slice(36, 42);
    rightEye = p.slice(42, 48);
    mouth = p.slice(48, 68);
    nose = p.slice(27, 36);
  } else {
    return prevAction || ACTIONS[5];
  }

  if (leftEye.length < 2 || rightEye.length < 2 || mouth.length < 2 || nose.length < 2) {
    return prevAction || ACTIONS[5];
  }

  const eyeCenterY = (leftEye.reduce((a, p) => a + p.y, 0) / leftEye.length + rightEye.reduce((a, p) => a + p.y, 0) / rightEye.length) / 2;
  const eyeCenterX = (leftEye.reduce((a, p) => a + p.x, 0) / leftEye.length + rightEye.reduce((a, p) => a + p.x, 0) / rightEye.length) / 2;
  const leftEyeSpan = Math.max(...leftEye.map(p => p.y)) - Math.min(...leftEye.map(p => p.y));
  const rightEyeSpan = Math.max(...rightEye.map(p => p.y)) - Math.min(...rightEye.map(p => p.y));
  const eyeOpenness = Math.min(leftEyeSpan, rightEyeSpan);

  const mouthTop = Math.min(...mouth.map(p => p.y));
  const mouthBottom = Math.max(...mouth.map(p => p.y));
  const mouthHeight = mouthBottom - mouthTop;

  const noseTip = nose[Math.floor(nose.length / 2)] ?? nose[0];
  const faceHeight = Math.abs(mouthBottom - eyeCenterY) || 1;
  const pitchRatio = (noseTip.y - eyeCenterY) / faceHeight;
  const eyeWidth = Math.abs((leftEye[0]?.x ?? 0) - (rightEye[0]?.x ?? 0)) || 1;
  const yawRatio = (noseTip.x - eyeCenterX) / eyeWidth;

  const mouthRatio = mouthHeight / faceHeight;

  // Normalize eyeOpenness - 68-point model uses pixel coords in crop; use ratio
  const eyeOpennessRatio = eyeOpenness / faceHeight;

  // Watching is default. Only switch when clear evidence (strict thresholds).
  // Order: Sleeping → Eating (lips) → Writing → Reading (head) → Playing (head) → Watching

  // 1. Lips: Sleeping (eyes closed) or Eating (eyes open)
  if (mouthRatio > 0.26) {
    if (eyeOpennessRatio < 0.05) return 'Sleeping';
    return 'Eating';
  }

  // 2. Head down: Writing (clearly down) or Reading (slightly down)
  if (pitchRatio > 0.26) return pitchRatio > 0.36 ? 'Writing' : 'Reading';

  // 3. Head left/right: Playing
  if (Math.abs(yawRatio) > 0.5) return 'Playing';

  // 4. Watching: default
  return 'Watching';
}
