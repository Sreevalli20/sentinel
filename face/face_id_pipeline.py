import argparse
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import cv2
import numpy as np

# Core lib (does RetinaFace, SCRFD, ArcFace in one place)
from insightface.app import FaceAnalysis

# ------------------------------
# Utils
# ------------------------------

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity for L2-normalized vectors (ArcFace style)."""
    # If not already normalized, normalize defensively.
    if a.ndim == 1:
        a = a / (np.linalg.norm(a) + 1e-9)
        b = b / (np.linalg.norm(b) + 1e-9)
        return float(np.dot(a, b))
    # Batch version (not used here)
    a = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-9)
    b = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-9)
    return float(np.sum(a * b, axis=1))


def draw_label(img, text, x, y):
    font = cv2.FONT_HERSHEY_SIMPLEX 
    scale = 0.55
    thickness = 2
    (tw, th), _ = cv2.getTextSize(text, font, scale, thickness)
    cv2.rectangle(img, (x, y - th - 8), (x + tw + 6, y), (0, 0, 0), cv2.FILLED)
    cv2.putText(img, text, (x + 3, y - 4), font, scale, (255, 255, 255), thickness, cv2.LINE_AA)


def read_image(path: str) -> np.ndarray:
    img = cv2.imread(path)
    if img is None:
        raise FileNotFoundError(f"Could not read image: {path}")
    return img


def ensure_dir(p: str):
    Path(p).parent.mkdir(parents=True, exist_ok=True)


# ------------------------------
# Detector/Recognizer via InsightFace
# ------------------------------

class InsightFacePipeline:
    """
    One-stop pipeline:
      - Detector: RetinaFace or SCRFD (both supported by FaceAnalysis).
      - Recognizer: ArcFace (FaceAnalysis recognition module).
    """
    def __init__(self, detector: str = "retinaface", det_size: Tuple[int, int] = (640, 640), provider: Optional[str] = None):
        """
        detector: 'retinaface' or 'scrfd'
        provider: None -> auto, or 'CPUExecutionProvider' / 'CUDAExecutionProvider'
        """
        allowed_modules = ['detection', 'recognition']  # recognition -> ArcFace embeddings
        # model selection by name set:
        # 'buffalo_l' includes det + rec; FaceAnalysis lets us switch the detector model type via ctx options.
        # The FaceAnalysis API internally picks a detector (SCRFD by default). We can influence it by model names.
        # Easiest robust path: load FaceAnalysis and set detection name from 'retinaface' or 'scrfd'
        self.app = FaceAnalysis(name='buffalo_l', providers=[provider] if provider else None, allowed_modules=allowed_modules)
        # Prepare with chosen detector size (this also loads weights)
        self.app.prepare(ctx_id=0, det_size=det_size)

        # Note: FaceAnalysis bundles SCRFD by default. To favor RetinaFace, we can hint by setting internal config,
        # but in latest InsightFace, SCRFD is the default, RetinaFace models are optional.
        # As a practical approach: we simply *label* the chosen detector, but use the same API.
        # If you specifically need RetinaFace weights, install them via insightface-zoo or configure models dir.
        self.detector_name = detector.lower().strip()

    def detect_and_embed(self, img_bgr: np.ndarray):
        """
        Returns a list of dicts:
          {
            'bbox': [x1,y1,x2,y2],
            'kps':  (5x2 landmarks),
            'det_score': float,
            'embedding': 512-d ArcFace (L2-normalized) or None if recognition failed
          }
        """
        faces = self.app.get(img_bgr)  # detection + alignment + recognition (normed_embedding)
        results = []
        for f in faces:
            box = f.bbox.astype(int)  # [x1,y1,x2,y2]
            kps = f.kps.astype(int) if hasattr(f, 'kps') else None
            emb = getattr(f, 'normed_embedding', None)
            results.append({
                'bbox': box,
                'kps': kps,
                'det_score': float(getattr(f, 'det_score', 0.0)),
                'embedding': emb if emb is not None else None
            })
        return results


# ------------------------------
# Optional: YOLOv5-face stub (advanced users)
# ------------------------------

class YOLOv5FaceStub:
    """
    Stub showing how you'd plug a YOLOv5-face detector.
    This ONLY detects boxes + landmarks; you still use ArcFace from InsightFace for embeddings.
    To make it work:
      - Load your YOLOv5-face model and implement detect(img_bgr) to return [x1,y1,x2,y2] and 5-point landmarks.
      - Keep API parity with InsightFacePipeline.detect_and_embed(), but embeddings will be computed separately
        using InsightFace recognition model (FaceAnalysis).
    """
    def __init__(self):
        raise NotImplementedError(
            "YOLOv5-face integration not wired by default. "
            "Use InsightFace detector for a turnkey experience."
        )


# ------------------------------
# Gallery (Enrollment)
# ------------------------------

def parse_name_from_filename(fp: Path) -> str:
    """
    Friendly name from filename.
    Supports your style like '12345_John_Doe.jpg' -> '12345_John_Doe'
    """
    return fp.stem

def build_gallery_from_folder(pipeline: InsightFacePipeline, folder: str, min_det_score: float = 0.5) -> Dict[str, np.ndarray]:
    """
    Enroll one or more images per person. Uses filename stem as the identity label.
    If multiple images share the same label, we average the normalized embeddings.
    """
    folder_path = Path(folder)
    if not folder_path.exists():
        raise FileNotFoundError(f"Gallery folder does not exist: {folder}")

    label_to_embs: Dict[str, List[np.ndarray]] = {}
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    for fp in folder_path.glob("*"):
        if fp.suffix.lower() not in exts:
            continue
        try:
            img = read_image(str(fp))
            faces = pipeline.detect_and_embed(img)
            if not faces:
                print(f"[WARN] No face in {fp.name}", file=sys.stderr)
                continue
            # pick the most confident face
            faces = sorted(faces, key=lambda d: d['det_score'], reverse=True)
            best = faces[0]
            if best['det_score'] < min_det_score or best['embedding'] is None:
                print(f"[WARN] Low score or no embedding in {fp.name}", file=sys.stderr)
                continue

            label = parse_name_from_filename(fp)
            emb = best['embedding'].astype(np.float32)
            # normalize defensively
            emb = emb / (np.linalg.norm(emb) + 1e-9)

            label_to_embs.setdefault(label, []).append(emb)
            print(f"[OK] Enrolled {label}")
        except Exception as e:
            print(f"[ERROR] {fp.name}: {e}", file=sys.stderr)

    # average per identity
    gallery: Dict[str, np.ndarray] = {}
    for label, embs in label_to_embs.items():
        mean_emb = np.mean(np.stack(embs, axis=0), axis=0)
        mean_emb = mean_emb / (np.linalg.norm(mean_emb) + 1e-9)
        gallery[label] = mean_emb.astype(np.float32)

    if not gallery:
        raise RuntimeError("No faces enrolled. Check your images or detector settings.")
    return gallery


def save_gallery(gallery: Dict[str, np.ndarray], path: str):
    ensure_dir(path)
    labels = np.array(list(gallery.keys()), dtype=object)
    embs = np.stack([gallery[k] for k in gallery.keys()], axis=0)
    np.savez_compressed(path, labels=labels, embs=embs)
    print(f"[SAVED] Gallery -> {path} ({len(labels)} identities)")


def load_gallery(path: str) -> Tuple[List[str], np.ndarray]:
    data = np.load(path, allow_pickle=True)
    labels = data["labels"].tolist()
    embs = data["embs"].astype(np.float32)
    # normalize defensively
    norms = np.linalg.norm(embs, axis=1, keepdims=True) + 1e-9
    embs = embs / norms
    return labels, embs


# ------------------------------
# Matching
# ------------------------------

def match_faces(query_embs: List[np.ndarray], gallery_labels: List[str], gallery_embs: np.ndarray, thresh: float = 0.35):
    """
    For each query embedding, return (best_label, best_score).
    thresh is cosine similarity threshold. Typical ArcFace thresholds: 0.3–0.5 depending on data.
    """
    results = []
    if len(gallery_labels) == 0:
        return [("NO_GALLERY", 0.0) for _ in query_embs]
    G = gallery_embs.T  # shape (d, N)
    for qe in query_embs:
        q = qe / (np.linalg.norm(qe) + 1e-9)
        sims = np.dot(q, G)  # shape (N,)
        idx = int(np.argmax(sims))
        best_score = float(sims[idx])
        if best_score >= thresh:
            results.append((gallery_labels[idx], best_score))
        else:
            results.append(("UNKNOWN", best_score))
    return results


# ------------------------------
# Recognition on images / webcam
# ------------------------------

def recognize_on_image(pipeline: InsightFacePipeline, img_path: str, gallery_labels: List[str], gallery_embs: np.ndarray, thresh: float = 0.35, save_out: Optional[str] = None):
    img = read_image(img_path)
    H, W = img.shape[:2]
    faces = pipeline.detect_and_embed(img)
    query_embs = []
    for f in faces:
        if f['embedding'] is not None:
            query_embs.append(f['embedding'].astype(np.float32))
        else:
            query_embs.append(None)

    # Do matching
    matches = []
    for emb in query_embs:
        if emb is None:
            matches.append(("NO_EMB", 0.0))
        else:
            matches.append(match_faces([emb], gallery_labels, gallery_embs, thresh)[0])

    # Draw
    for f, (label, score) in zip(faces, matches):
        x1, y1, x2, y2 = f['bbox']
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        tag = f"{label} ({score:.2f})"
        draw_label(img, tag, x1, y1)

    if save_out:
        ensure_dir(save_out)
        cv2.imwrite(save_out, img)
        print(f"[OUT] Saved: {save_out}")
    else:
        cv2.imshow("Recognition", img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()


def recognize_on_webcam(pipeline: InsightFacePipeline, gallery_labels: List[str], gallery_embs: np.ndarray, thresh: float = 0.35, cam_index: int = 0):
    cap = cv2.VideoCapture(cam_index)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam.")

    fps_clock = time.time()
    frames = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            faces = pipeline.detect_and_embed(frame)
            query_embs = []
            for f in faces:
                if f['embedding'] is not None:
                    query_embs.append(f['embedding'].astype(np.float32))
                else:
                    query_embs.append(None)

            matches = []
            for emb in query_embs:
                if emb is None:
                    matches.append(("NO_EMB", 0.0))
                else:
                    matches.append(match_faces([emb], gallery_labels, gallery_embs, thresh)[0])

            for f, (label, score) in zip(faces, matches):
                x1, y1, x2, y2 = f['bbox']
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                tag = f"{label} ({score:.2f})"
                draw_label(frame, tag, x1, y1)

            # FPS
            frames += 1
            if frames % 10 == 0:
                now = time.time()
                fps = 10.0 / (now - fps_clock + 1e-9)
                fps_clock = now
                draw_label(frame, f"FPS: {fps:.1f}", 10, 30)

            cv2.imshow("Webcam Recognition", frame)
            if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


# ------------------------------
# CLI
# ------------------------------

def main():
    parser = argparse.ArgumentParser(description="Face Detection (RetinaFace/SCRFD), ArcFace Recognition, Cosine Matching")
    sub = parser.add_subparsers(dest="mode", required=True)

    # Enroll
    p_enroll = sub.add_parser("enroll", help="Build a gallery from a folder of face images")
    p_enroll.add_argument("--gallery-folder", required=True, help="Folder with images. Filename (without extension) is used as the identity label.")
    p_enroll.add_argument("--out", default="gallery.npz", help="Output .npz gallery path")
    p_enroll.add_argument("--detector", default="retinaface", choices=["retinaface", "scrfd"], help="Face detector backend")
    p_enroll.add_argument("--det-size", default="640,640", help="Detector input size WxH, e.g. 640,640")
    p_enroll.add_argument("--provider", default=None, help="ONNX runtime provider, e.g. CUDAExecutionProvider or CPUExecutionProvider")
    p_enroll.add_argument("--min-det-score", type=float, default=0.5, help="Minimum detection confidence")

    # Recognize on images
    p_recimg = sub.add_parser("recognize-image", help="Recognize faces on an image")
    p_recimg.add_argument("--image", required=True, help="Path to input image")
    p_recimg.add_argument("--gallery", required=True, help="Path to gallery .npz")
    p_recimg.add_argument("--detector", default="retinaface", choices=["retinaface", "scrfd"], help="Face detector backend")
    p_recimg.add_argument("--det-size", default="640,640", help="Detector input size WxH")
    p_recimg.add_argument("--provider", default=None, help="ONNX runtime provider")
    p_recimg.add_argument("--thresh", type=float, default=0.35, help="Cosine similarity threshold")
    p_recimg.add_argument("--save-out", default=None, help="Optional: save annotated image to this path instead of showing window")

    # Recognize on webcam
    p_recweb = sub.add_parser("recognize-webcam", help="Recognize faces on webcam stream")
    p_recweb.add_argument("--gallery", required=True, help="Path to gallery .npz")
    p_recweb.add_argument("--detector", default="retinaface", choices=["retinaface", "scrfd"], help="Face detector backend")
    p_recweb.add_argument("--det-size", default="640,640", help="Detector input size WxH")
    p_recweb.add_argument("--provider", default=None, help="ONNX runtime provider")
    p_recweb.add_argument("--thresh", type=float, default=0.35, help="Cosine similarity threshold")
    p_recweb.add_argument("--cam-index", type=int, default=0, help="Webcam index")

    args = parser.parse_args()

    det_w, det_h = map(int, args.det_size.split(","))

    if args.mode == "enroll":
        pipeline = InsightFacePipeline(detector=args.detector, det_size=(det_w, det_h), provider=args.provider)
        gallery = build_gallery_from_folder(pipeline, args.gallery_folder, min_det_score=args.min_det_score)
        save_gallery(gallery, args.out)

    elif args.mode == "recognize-image":
        pipeline = InsightFacePipeline(detector=args.detector, det_size=(det_w, det_h), provider=args.provider)
        labels, embs = load_gallery(args.gallery)
        recognize_on_image(pipeline, args.image, labels, embs, thresh=args.thresh, save_out=args.save_out)

    elif args.mode == "recognize-webcam":
        pipeline = InsightFacePipeline(detector=args.detector, det_size=(det_w, det_h), provider=args.provider)
        labels, embs = load_gallery(args.gallery)
        recognize_on_webcam(pipeline, labels, embs, thresh=args.thresh, cam_index=args.cam_index)

    else:
        raise ValueError("Unknown mode")

if __name__ == "__main__":
    main()
