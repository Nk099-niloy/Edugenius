import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MODEL,
  GeminiServiceError,
  SUPPORTED_MODELS,
  generateExplanation,
  generateQuiz,
  isGeminiConfigured,
  sendTutorChat,
  testGeminiConnection,
} from "./server/geminiService.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === "production";

  app.use(express.json({ limit: "1mb" }));

  // Health & API Configuration status (never exposes raw API keys)
  app.get("/api/gemini/status", (_req, res) => {
    res.json({
      configured: isGeminiConfigured(),
      defaultModel: DEFAULT_MODEL,
      supportedModels: SUPPORTED_MODELS,
    });
  });

  app.post("/api/gemini/test-connection", async (req, res) => {
    try {
      const result = await testGeminiConnection(req.body?.model);
      res.json(result);
    } catch (error) {
      const err = error instanceof GeminiServiceError
        ? error
        : new GeminiServiceError("Failed to verify Gemini API connection.", 500);
      res.status(err.statusCode).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/gemini/explain", async (req, res) => {
    try {
      const result = await generateExplanation({
        subject: req.body?.subject,
        level: req.body?.level,
        topic: req.body?.topic,
        style: req.body?.style,
        language: req.body?.language,
        model: req.body?.model,
        temperature: req.body?.temperature,
      });
      res.json(result);
    } catch (error) {
      const err = error instanceof GeminiServiceError
        ? error
        : new GeminiServiceError("Failed to generate topic explanation.", 500);
      res.status(err.statusCode).json({ error: err.message });
    }
  });

  app.post("/api/gemini/quiz", async (req, res) => {
    try {
      const result = await generateQuiz({
        topic: req.body?.topic,
        subject: req.body?.subject,
        level: req.body?.level,
        count: Number(req.body?.count),
        difficulty: req.body?.difficulty,
        language: req.body?.language,
        model: req.body?.model,
        temperature: req.body?.temperature,
      });
      res.json(result);
    } catch (error) {
      const err = error instanceof GeminiServiceError
        ? error
        : new GeminiServiceError("Failed to generate MCQ quiz.", 500);
      res.status(err.statusCode).json({ error: err.message });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const result = await sendTutorChat({
        messages: req.body?.messages,
        language: req.body?.language,
        model: req.body?.model,
        temperature: req.body?.temperature,
      });
      res.json(result);
    } catch (error) {
      const err = error instanceof GeminiServiceError
        ? error
        : new GeminiServiceError("Failed to get a response from the AI Tutor.", 500);
      res.status(err.statusCode).json({ error: err.message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`EduGenius AI server running on http://0.0.0.0:${port}`);
  });
}

createServer().catch((err) => {
  console.error("Failed to start EduGenius AI server:", err);
  process.exit(1);
});
