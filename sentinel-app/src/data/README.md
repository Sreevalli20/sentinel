# Action Exemplars

Action detection uses **similarity scoring** against trained exemplars in `actionExemplars.json`.

## How it works

1. Face landmarks (MediaPipe) are converted to 4 features: `pitchRatio`, `yawRatio`, `mouthRatio`, `eyeOpenness`
2. Each exemplar has a centroid vector for one action
3. Weighted Euclidean distance is computed between current features and each exemplar
4. The action with the **lowest distance** (most similar) is returned

## Training / Adding data

To improve detection, add or edit exemplars in `actionExemplars.json`:

- **Add more samples per action** – include multiple exemplars for the same action to capture variation
- **Adjust centroid values** – based on observed feature ranges when performing each action
- **Tune weights** – in `actionFromLandmarks.ts`, the `weights` object (pitch, yaw, mouth, eye) controls feature importance. Higher weight = that feature matters more for matching.

### Feature ranges (typical)

| Action   | pitchRatio | yawRatio | mouthRatio | eyeOpenness |
|----------|------------|----------|------------|-------------|
| Sleeping | 0.1–0.3    | 0        | 0.01–0.03  | 0.003–0.01  |
| Eating   | 0.05–0.15  | 0        | 0.12–0.25  | 0.08–0.15   |
| Reading  | 0.25–0.4   | 0        | 0.03–0.06  | 0.08–0.12   |
| Writing  | 0.35–0.5   | 0        | 0.02–0.05  | 0.07–0.11   |
| Playing  | 0.05–0.2   | 0.5–0.9  | 0.03–0.06  | 0.1–0.15    |
| Watching | 0–0.1      | 0        | 0.03–0.06  | 0.1–0.18    |

To collect real data: log `analyzeHeadPose()` output while performing each action, then use the median or mean as exemplar values.
