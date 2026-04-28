// services/faceRecognition.ts

import * as faceapi from "@vladmandic/face-api";
import type { RegisteredUser } from "../types";

// API endpoint
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

// Thresholds
export const MATCH_THRESHOLD = 0.45; // For live monitoring (more strict for production)
export const REGISTRATION_DUPLICATE_THRESHOLD = 0.35; // Strict for duplicate detection
const STICKY_IDENTITY_MS = 4000; // Keep identity during occlusion

let modelsLoaded = false;
let ssdModelLoaded = false;
let faceMatcherCache: faceapi.FaceMatcher | null = null;
let lastFaceMatchUpdate = 0;
let pendingFaceMatches = new Map<
  number,
  { user: RegisteredUser; updatedAt: number }
>();

/** Load face-api models */
export async function loadFaceRecognitionModels(): Promise<void> {
  if (modelsLoaded) return;

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
  console.log("[FaceRecognition] Models loaded");
}

/** Load SSD model for registration (more accurate) */
async function loadSsdForRegistration(): Promise<void> {
  if (ssdModelLoaded) return;
  await loadFaceRecognitionModels();
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  ssdModelLoaded = true;
  console.log("[FaceRecognition] SSD model loaded");
}

/**
 * Extract face descriptor from image using backend API
 * This ensures consistency between frontend and backend
 */
export async function getDescriptorFromBackend(
  imageBase64: string
): Promise<Float32Array | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/extract-descriptor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.descriptor) {
      return new Float32Array(data.descriptor);
    }
    return null;
  } catch (error) {
    console.error("[FaceRecognition] Backend extraction failed:", error);
    // Fallback to local extraction
    return getDescriptorFromImageLocal(imageBase64);
  }
}

/**
 * Local face descriptor extraction (fallback)
 */
export async function getDescriptorFromImageLocal(
  input: HTMLImageElement | HTMLCanvasElement | string
): Promise<Float32Array | null> {
  await loadSsdForRegistration();

  let img: HTMLImageElement | HTMLCanvasElement;
  if (typeof input === "string") {
    img = await faceapi.fetchImage(input);
  } else {
    img = input;
  }

  const detection = await faceapi
    .detectSingleFace(
      img,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    )
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  return detection?.descriptor ?? null;
}

// Alias for backward compatibility
export const getDescriptorFromImage = getDescriptorFromBackend;

/** Vertical expansion factor for better detection */
const FACE_BOX_VERTICAL_EXPAND = 0.5;
const FACE_BOX_HORIZONTAL_EXPAND = 0.2;

function blazefaceBoxToRect(face: {
  topLeft: [number, number];
  bottomRight: [number, number];
}) {
  const [x1, y1] = face.topLeft;
  const [x2, y2] = face.bottomRight;
  const w = x2 - x1;
  const h = y2 - y1;
  const newW = w * (1 + FACE_BOX_HORIZONTAL_EXPAND);
  const newH = h * (1 + FACE_BOX_VERTICAL_EXPAND);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const x = Math.max(0, cx - newW / 2);
  const y = Math.max(0, cy - newH / 2);
  return new faceapi.Rect(x, y, newW, newH);
}

/** Map face-api expressions to client emotions */
function mapExpressionToEmotion(expressions: {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}): string {
  const sorted = (
    [
      "neutral",
      "happy",
      "sad",
      "angry",
      "fearful",
      "disgusted",
      "surprised",
    ] as const
  )
    .map((k) => ({ k, v: expressions[k] }))
    .sort((a, b) => b.v - a.v);
  const top = sorted[0];
  if (!top || top.v < 0.3) return "Neutral";
  switch (top.k) {
    case "neutral":
      return "Neutral";
    case "happy":
      return "Happy";
    case "sad":
      return top.v > 0.7 ? "Cry" : "Sad";
    case "angry":
      return "Angry";
    case "fearful":
      return "Confused";
    case "disgusted":
      return "Dull";
    case "surprised":
      return "Focused";
    default:
      return "Neutral";
  }
}

/**
 * Extract face data from video frame with batching for performance
 */
export async function getDescriptorsFromVideo(
  video: HTMLVideoElement,
  blazefaceFaces: Array<{
    topLeft: [number, number];
    bottomRight: [number, number];
  }>
): Promise<
  Array<{
    descriptor: Float32Array;
    index: number;
    emotion?: string;
    landmarks?: any;
  }>
> {
  if (blazefaceFaces.length === 0) return [];

  await loadFaceRecognitionModels();

  const rects = blazefaceFaces.map((f) => blazefaceBoxToRect(f));
  const faceCanvases = await faceapi.extractFaces(video, rects);

  const results: Array<{
    descriptor: Float32Array;
    index: number;
    emotion?: string;
    landmarks?: any;
  }> = [];

  // Process faces in parallel for better performance
  const processPromises = faceCanvases.map(async (canvas, i) => {
    try {
      const [descriptor, expressions, landmarks] = await Promise.all([
        faceapi.computeFaceDescriptor(canvas),
        faceapi.recognizeFaceExpressions(canvas),
        faceapi.detectFaceLandmarksTiny(canvas),
      ]);

      const desc = Array.isArray(descriptor) ? descriptor[0] : descriptor;
      const expr = Array.isArray(expressions) ? expressions[0] : expressions;
      const emotion = expr ? mapExpressionToEmotion(expr as any) : undefined;
      const lm = Array.isArray(landmarks) ? landmarks[0] : landmarks;

      if (desc) {
        return {
          descriptor: desc,
          index: i,
          emotion,
          landmarks: lm ?? undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const processed = await Promise.all(processPromises);
  for (const result of processed) {
    if (result) results.push(result);
  }

  return results;
}

/**
 * Create FaceMatcher from registered users
 */
export function createFaceMatcher(
  users: RegisteredUser[],
  threshold = MATCH_THRESHOLD
): faceapi.FaceMatcher | null {
  const usersWithDescriptors = users.filter(
    (u) => u.faceDescriptor && u.faceDescriptor.length === 128
  );
  if (usersWithDescriptors.length === 0) return null;

  const labeledDescriptors = usersWithDescriptors.map(
    (u) =>
      new faceapi.LabeledFaceDescriptors(u.id, [
        new Float32Array(u.faceDescriptor!),
      ])
  );
  return new faceapi.FaceMatcher(labeledDescriptors, threshold);
}

/**
 * Match descriptor to user with confidence
 */
export function matchDescriptorToUser(
  descriptor: Float32Array,
  faceMatcher: faceapi.FaceMatcher | null
): { userId: string; distance: number; confidence: number } | null {
  if (!faceMatcher) return null;

  const match = faceMatcher.findBestMatch(descriptor);
  if (match.label === "unknown") return null;

  // Convert distance to confidence (distance is Euclidean, lower is better)
  const confidence = Math.max(
    0,
    Math.min(1, 1 - match.distance / MATCH_THRESHOLD)
  );

  return {
    userId: match.label,
    distance: match.distance,
    confidence,
  };
}

/**
 * Find existing user by face (for duplicate detection)
 */
export function findExistingUserByFace(
  descriptor: Float32Array,
  users: RegisteredUser[]
): RegisteredUser | null {
  const matcher = createFaceMatcher(users, REGISTRATION_DUPLICATE_THRESHOLD);
  const match = matchDescriptorToUser(descriptor, matcher);
  if (!match) return null;
  return users.find((u) => u.id === match.userId) ?? null;
}

/**
 * Sticky face matching cache - maintains identity during occlusion
 */
export class StickyFaceMatcher {
  private faceMatches = new Map<
    number,
    {
      userId: string;
      name: string;
      type: string;
      updatedAt: number;
      confidence: number;
    }
  >();
  private faceMatcher: faceapi.FaceMatcher | null = null;
  private users: RegisteredUser[] = [];

  updateUsers(users: RegisteredUser[]) {
    this.users = users;
    this.faceMatcher = createFaceMatcher(users);
  }

  async matchFaces(
    video: HTMLVideoElement,
    blazefaceFaces: any[]
  ): Promise<
    Map<
      number,
      { userId: string; name: string; type: string; confidence: number }
    >
  > {
    const results = await getDescriptorsFromVideo(video, blazefaceFaces);
    const now = Date.now();
    const newMatches = new Map<
      number,
      { userId: string; name: string; type: string; confidence: number }
    >();

    for (const { descriptor, index, emotion, landmarks } of results) {
      const match = this.faceMatcher
        ? matchDescriptorToUser(descriptor, this.faceMatcher)
        : null;

      if (match && match.confidence > 0.6) {
        const user = this.users.find((u) => u.id === match.userId);
        if (user) {
          newMatches.set(index, {
            userId: user.id,
            name: user.name,
            type: user.type,
            confidence: match.confidence,
          });
        }
      }
    }

    // Apply sticky identity - keep matches for faces that disappeared
    for (const [index, match] of this.faceMatches) {
      if (
        !newMatches.has(index) &&
        now - match.updatedAt < STICKY_IDENTITY_MS
      ) {
        newMatches.set(index, match);
      }
    }

    // Update timestamps for existing matches
    for (const [index, match] of newMatches) {
      const existing = this.faceMatches.get(index);
      newMatches.set(index, {
        ...match,
        updatedAt: now,
        confidence: existing?.confidence || match.confidence,
      });
    }

    this.faceMatches = newMatches;
    return newMatches;
  }

  clear() {
    this.faceMatches.clear();
  }
}

/** Serialize Float32Array to number[] */
export function descriptorToArray(desc: Float32Array): number[] {
  return Array.from(desc);
}

export async function registerUser(userData: any): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Server error: ${response.status}`,
      };
    }

    return {
      success: true,
      userId: result.userId || result.id,
    };
  } catch (error: any) {
    console.error("[FaceRecognition] Registration API error:", error);
    return {
      success: false,
      error:
        error.message ||
        "Network error. Please check if backend server is running on port 5000.",
    };
  }
}
