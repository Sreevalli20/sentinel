# SENTINEL App

**AI-Powered Intelligent Real-Time Attendance, Emotion & Engagement Monitoring Platform**

This is the consolidated working application. All features from sentinel-ai-monitor (with face recognition) and reusable components are included here.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Features

- **User Registration** – Teacher, Student, Guest with photo + face recognition
- **Face-to-User Matching** – Real face recognition (not index-based)
- **Live Monitoring** – BlazeFace, COCO-SSD, Face Mesh, audio analysis
- **Dashboards** – Class View, Guest Dashboard, Teacher Dashboard
- **Session Reports** – Attendance, engagement, CSV export

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript check |

## Folder Structure

```
sentinel-app/          ← RUN THIS FOLDER (consolidated working app)
sentinel-ai-monitor/   ← Original (unchanged, for reference)
eeatsys/               ← Original (unchanged, has issues)
```

**Use only `sentinel-app`** – it contains all working code. The other folders are left untouched.
