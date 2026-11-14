# EduGenius AI — Next-Gen AI Learning Platform

**Tagline:** Learn Smarter. Think Better. Achieve More.  
**Organization:** Apex Edutech Labs

EduGenius AI is a full-stack, responsive educational web application built with React, TypeScript, Tailwind CSS, Express, and the official Google `@google/genai` SDK. It helps Bengali and English-speaking students (Class 9–12, SSC, HSC, University, IELTS, and Job Exam candidates) master complex topics, practice smart MCQ quizzes, and get 24/7 personalized tutoring.

---

## Key Features

1. **Landing Page & Interactive Hero**
   - Direct hero question/topic input with subject selection that launches directly into the AI Study Hub.
   - Quick-start academic tracks and editable reference benchmarks.
2. **AI Study Hub & Topic Explainer**
   - Bilingual (Bengali & English) structured explanations broken into:
     1. Concept Definition
     2. Real-World Analogy
     3. Practical Example
   - Supports Simple Summary, Detailed Explanation with Examples, and Flashcard Points.
   - Includes Copy to Clipboard, Download Notes (`.md`), Regenerate Answer, and recent saved study notes.
3. **Smart AI Quiz & Practice Engine**
   - Generates 5, 10, 15, or 20 MCQs with 4 options (`A`, `B`, `C`, `D`) across Easy, Medium, and Hard difficulties.
   - Instant visual feedback, submission locking, question navigator, explanations, and full Results Dashboard.
4. **24/7 AI Live Tutor Chat**
   - Multi-turn conversational tutoring with persistent session context, quick prompt suggestions, Markdown code/table support, and auto-scroll.
5. **Settings & AI Configuration**
   - Server-side Gemini API connection diagnostics (`Test API Connection`), active Gemini model selection (`gemini-4-hydrogen`, `gemini-3.1-flash-lite`), response variation control (`0.2`–`0.7`), and learning defaults.

---

## Architecture & Security

- **Server-Side Gemini Proxy (`/server.ts` & `/server/geminiService.ts`)**: All calls to Google Gemini use `@google/genai` on the Node.js/Express backend. `GEMINI_API_KEY` is read strictly from server environment variables and is never stored in browser `localStorage` or exposed in frontend bundles.

---

## Local Setup Instructions

### Prerequisites
- Node.js 20+
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your server-side Gemini API key:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3. Run Development Server
```bash
npm run dev
```
The Express + Vite full-stack server runs on `http://localhost:3000`.

### 4. Type Check & Production Build
```bash
npm run lint
npm run build
```

---

## Deployment Instructions

### Cloud Run / Node.js Hosting (Render, Railway, Fly.io, Cloud Run)
1. Set `GEMINI_API_KEY` and `NODE_ENV=production` in your hosting environment variables/secrets.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start` (runs `tsx server.ts` on `process.env.PORT || 3000`).

### Vercel / Netlify
When deploying to serverless platforms like Vercel or Netlify, expose the Express endpoints in `/server/geminiService.ts` as serverless API functions (`/api/gemini/*`), configure `GEMINI_API_KEY` in the provider's Environment Variables dashboard, and set the build output directory to `dist` (`npm run build`).
