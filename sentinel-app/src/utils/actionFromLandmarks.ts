/**
 * Infer action from face landmarks (MediaPipe Face Mesh keypoints).
 * Simple rule-based: Watching default. Only switch when clear evidence.
 * - Lips (mouth open): Sleeping (eyes closed) or Eating (eyes open)
 * - Head down: Reading (slight) or Writing (clearly down)
 * - Head left/right: Playing
 */
import { ACTIONS } from '../constants';

interface Keypoint {
  x: number;
  y: number;
  z?: number;
}

/** Analyze head pose and facial features from keypoints. */
function analyzeHeadPose(keypoints: Keypoint[]): {
  pitchRatio: number;
  yawRatio: number;
  mouthRatio: number;
  eyeOpenness: number;
} {
  if (!keypoints || keypoints.length < 400) {
    return { pitchRatio: 0.5, yawRatio: 0.5, mouthRatio: 0, eyeOpenness: 0.15 };
  }

  const nose = keypoints[4] || keypoints[1];
  const leftEye = keypoints[33];
  const rightEye = keypoints[263];
  const leftMouth = keypoints[61];
  const rightMouth = keypoints[291];
  const topLip = keypoints[13];
  const bottomLip = keypoints[14];
  const leftEyeIndices = [33, 133, 160, 159, 158, 157, 173];
  const rightEyeIndices = [362, 263, 385, 386, 387, 388];

  if (!nose || !leftEye || !rightEye || !leftMouth || !rightMouth) {
    return { pitchRatio: 0.5, yawRatio: 0.5, mouthRatio: 0, eyeOpenness: 0.15 };
  }

  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const mouthCenterY = (leftMouth.y + rightMouth.y) / 2;
  const faceHeight = Math.abs(mouthCenterY - eyeCenterY) || 1;
  const noseOffset = nose.y - eyeCenterY;
  const pitchRatio = noseOffset / faceHeight;

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeWidth = Math.abs(leftEye.x - rightEye.x) || 1;
  const yawRatio = (nose.x - eyeCenterX) / eyeWidth;

  let mouthRatio = 0;
  if (topLip && bottomLip) {
    const mouthHeight = Math.abs(bottomLip.y - topLip.y);
    mouthRatio = mouthHeight / faceHeight;
  }

  let eyeOpenness = 0.15;
  const leftEyeYs = leftEyeIndices.map(i => keypoints[i]?.y).filter((y): y is number => y != null);
  const rightEyeYs = rightEyeIndices.map(i => keypoints[i]?.y).filter((y): y is number => y != null);
  if (leftEyeYs.length >= 2 && rightEyeYs.length >= 2) {
    const leftSpan = Math.max(...leftEyeYs) - Math.min(...leftEyeYs);
    const rightSpan = Math.max(...rightEyeYs) - Math.min(...rightEyeYs);
    eyeOpenness = Math.min(leftSpan, rightSpan) / faceHeight;
  }

  return { pitchRatio, yawRatio, mouthRatio, eyeOpenness };
}

/** Infer action from landmark-derived features. Simple thresholds, Watching default. */
export function inferActionFromLandmarks(
  keypoints: Keypoint[] | undefined,
  prevAction?: string
): string {
  if (!keypoints || keypoints.length < 400) {
    return prevAction || ACTIONS[5]; // Watching (default)
  }

  const { pitchRatio, yawRatio, mouthRatio, eyeOpenness } = analyzeHeadPose(keypoints);

  // Watching is default. Only switch when we have clear evidence (strict thresholds).
  // Order: Sleeping → Eating (lips) → Writing → Reading (head) → Playing (head) → Watching

  // 1. Lips: Sleeping (eyes closed) or Eating (eyes open)
  if (mouthRatio > 0.22) {
    if (eyeOpenness < 0.04) return 'Sleeping';
    return 'Eating';
  }

  // 2. Head down: Writing (clearly down) or Reading (slightly down)
  if (pitchRatio > 0.26) {
    return pitchRatio > 0.36 ? 'Writing' : 'Reading';
  }

  // 3. Head left/right: Playing
  if (Math.abs(yawRatio) > 0.45) return 'Playing';

  // 4. Watching: default
  return 'Watching';
}
