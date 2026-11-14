import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export const SUPPORTED_MODELS = [
  {
    id: "gemini-4-hydrogen",
    label: "Gemini 4 Hydrogen",
    description:
      "দ্রুত বাংলা ও ইংরেজি ব্যাখ্যা, কাঠামোবদ্ধ কুইজ এবং লাইভ টিউটরিংয়ের জন্য সুপারিশকৃত ডিফল্ট মডেল।",
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    description:
      "তাৎক্ষণিক উত্তর এবং দ্রুত অনুশীলন ড্রিলের জন্য হালকা ও দ্রুতগতির মডেল।",
  },
] as const;

export type SupportedModelId = (typeof SUPPORTED_MODELS)[number]["id"];

export const DEFAULT_MODEL: SupportedModelId = "gemini-4-hydrogen";

export const EDUGENIUS_SYSTEM_INSTRUCTION = `You are EduGenius AI, an elite educational mentor and adaptive tutor.

Target: Bengali and English-speaking students, including SSC, HSC, University, IELTS, and Job Exam candidates.

Tone: Highly encouraging, clear, structured, and educationally appropriate.

For explanations:
Break down complex topics into three levels:
1. Concept Definition
2. Real-World Analogy
3. Practical Example

For quizzes:
Return structured questions with:
- Question
- Options [A, B, C, D]
- Correct Answer
- In-depth Explanation

Avoid hallucination. If unsure, politely ask for clarification.

Maintain proper Bengali and English typography.

Always prioritize learning, understanding, and educational value.`;

export class GeminiServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "GeminiServiceError";
    this.statusCode = statusCode;
  }
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === "string" && key.trim().length > 0 && key.trim() !== "MY_GEMINI_API_KEY";
}

function getClient(): GoogleGenAI {
  if (!isGeminiConfigured()) {
    throw new GeminiServiceError(
      "সার্ভারে Gemini API কী কনফিগার করা নেই। অনুগ্রহ করে Secrets প্যানেলে GEMINI_API_KEY যুক্ত করুন।",
      503
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export function normalizeModel(model?: string): SupportedModelId {
  if (model === "gemini-3.1-flash-lite") {
    return "gemini-3.1-flash-lite";
  }
  return "gemini-4-hydrogen";
}

export function clampVariation(value?: number): number {
  const num = Number(value);
  if (Number.isNaN(num)) return 0.4;
  return Math.min(0.7, Math.max(0.2, Math.round(num * 100) / 100));
}

function buildModelTuningConfig(model: SupportedModelId, variation: number) {
  if (model === "gemini-4-hydrogen") {
    const thinkingLevel =
      variation <= 0.3
        ? ThinkingLevel.LOW
        : variation <= 0.55
          ? ThinkingLevel.MEDIUM
          : ThinkingLevel.HIGH;
    return {
      thinkingConfig: { thinkingLevel },
    };
  }

  return {
    temperature: variation,
  };
}

function buildVariationGuidance(variation: number): string {
  if (variation <= 0.3) {
    return "Style precision: Be concise, direct, and strictly textbook-aligned with minimal embellishment.";
  }
  if (variation >= 0.55) {
    return "Style precision: Include vivid, memorable real-world analogies and creative illustrative examples while staying factually rigorous.";
  }
  return "Style precision: Balance clear academic precision with relatable everyday analogies.";
}

function mapApiError(error: unknown): GeminiServiceError {
  if (error instanceof GeminiServiceError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("permission_denied") ||
    lower.includes("403") ||
    lower.includes("401")
  ) {
    return new GeminiServiceError(
      "আপনার Gemini API কী-টি সঠিক নয় বা অনুমোদিত নয়। অনুগ্রহ করে Secrets প্যানেলে GEMINI_API_KEY যাচাই করুন।",
      401
    );
  }

  if (lower.includes("resource_exhausted") || lower.includes("429") || lower.includes("quota")) {
    return new GeminiServiceError(
      "এআই সেবার অনুরোধ সীমা অতিক্রম করেছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।",
      429
    );
  }

  if (lower.includes("not_found") || lower.includes("404")) {
    return new GeminiServiceError(
      "নির্বাচিত Gemini মডেলটি পাওয়া যায়নি। সেটিংস থেকে Gemini 4 Hydrogen নির্বাচন করুন।",
      404
    );
  }

  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("econnreset")) {
    return new GeminiServiceError(
      "Gemini AI-এর সাথে নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      502
    );
  }

  return new GeminiServiceError(
    "এই মুহূর্তে আপনার এআই অনুরোধটি সম্পন্ন করা যায়নি। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।",
    500
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
      const isTransient =
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("econnreset") ||
        msg.includes("timeout");

      if (!isTransient || attempt === maxRetries) {
        throw mapApiError(error);
      }

      const delayMs = 450 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw mapApiError(lastError);
}

export async function testGeminiConnection(requestedModel?: string) {
  const model = normalizeModel(requestedModel);
  const ai = getClient();
  const startedAt = Date.now();

  const response = await withRetry(() =>
    ai.models.generateContent({
      model,
      contents: "Reply with the exact word: READY",
      config: {
        systemInstruction: "Respond concisely with READY.",
        ...(model === "gemini-4-hydrogen"
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
      },
    })
  );

  const latencyMs = Date.now() - startedAt;
  const reply = (response.text ?? "").trim();

  if (!reply) {
    throw new GeminiServiceError("সংযোগ পরীক্ষার সময় Gemini থেকে কোনো উত্তর পাওয়া যায়নি।", 502);
  }

  return {
    ok: true,
    model,
    latencyMs,
    reply,
  };
}

export interface ExplainRequest {
  subject: string;
  level: string;
  topic: string;
  style: string;
  language: string;
  model?: string;
  temperature?: number;
}

export async function generateExplanation(input: ExplainRequest) {
  const topic = (input.topic ?? "").trim();
  if (topic.length < 2) {
    throw new GeminiServiceError("অনুগ্রহ করে কমপক্ষে ২ অক্ষরের একটি টপিক বা প্রশ্ন লিখুন।", 400);
  }

  const model = normalizeModel(input.model);
  const variation = clampVariation(input.temperature);
  const ai = getClient();

  const language = input.language || "Bengali";
  const isBangla = language === "Bengali";

  const languageDirective =
    language === "English"
      ? "Write the entire explanation in clear, engaging English."
      : language === "Auto"
        ? "Detect the language of the student's topic. If the topic is written in Bengali script or asks for Bengali, respond in natural standard Bengali (বাংলা) with Bengali section headings; otherwise respond in clear English."
        : "Write the entire explanation in natural, clear standard Bengali (বাংলা), keeping essential technical terms or formulas accompanied by Bengali explanations.";

  const headingsDirective = isBangla
    ? [
        "Required structure (use Markdown headings in Bengali):",
        "## ১. ধারণার সংজ্ঞা (Concept Definition)",
        "## ২. বাস্তব জীবনের উপমা (Real-World Analogy)",
        "## ৩. ব্যবহারিক উদাহরণ (Practical Example)",
        "## মূল শিক্ষণীয় বিষয় ও স্টাডি নোট",
      ]
    : [
        "Required structure (use Markdown headings):",
        "## 1. Concept Definition",
        "## 2. Real-World Analogy",
        "## 3. Practical Example",
        "## Key Takeaways & Study Notes",
      ];

  const styleDirective =
    input.style === "Simple Summary"
      ? "Keep the explanation concise, crystal clear, and beginner-friendly using short paragraphs and key bullet points."
      : input.style === "Flashcard Points"
        ? "Format the response into crisp, high-retention study flashcards and numbered revision points after covering the 3 core explanation sections."
        : "Provide a comprehensive, well-structured explanation with step-by-step reasoning, clear examples, formulas or code blocks where relevant, and important exam tips.";

  const prompt = [
    `Subject: ${input.subject || "General"}`,
    `Student Level: ${input.level || "HSC"}`,
    `Explanation Style: ${input.style || "Detailed Explanation with Examples"}`,
    `Topic / Question: ${topic}`,
    "",
    ...headingsDirective,
    "",
    styleDirective,
    languageDirective,
    buildVariationGuidance(variation),
  ].join("\n");

  const response = await withRetry(() =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: EDUGENIUS_SYSTEM_INSTRUCTION,
        ...buildModelTuningConfig(model, variation),
      },
    })
  );

  const explanation = (response.text ?? "").trim();
  if (!explanation) {
    throw new GeminiServiceError("ব্যাখ্যা তৈরি করা যায়নি। অনুগ্রহ করে টপিকটি স্পষ্ট করে আবার লিখুন।", 502);
  }

  return {
    explanation,
    modelUsed: model,
  };
}

export interface QuizRequest {
  topic: string;
  subject: string;
  level: string;
  count: number;
  difficulty: string;
  language: string;
  model?: string;
  temperature?: number;
}

export interface GeneratedQuizQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export async function generateQuiz(input: QuizRequest) {
  const topic = (input.topic ?? "").trim();
  if (topic.length < 2) {
    throw new GeminiServiceError("অনুগ্রহ করে কুইজের জন্য একটি অধ্যায় বা টপিক লিখুন।", 400);
  }

  const allowedCounts = [5, 10, 15, 20];
  const count = allowedCounts.includes(Number(input.count)) ? Number(input.count) : 5;
  const model = normalizeModel(input.model);
  const variation = clampVariation(input.temperature);
  const ai = getClient();

  const language = input.language || "Bengali";
  const languageDirective =
    language === "English"
      ? "Write all questions, options (A, B, C, D), and explanations in clear English."
      : language === "Auto"
        ? "Match the language of the topic (Bengali if the topic is in Bengali, otherwise English)."
        : "Write the quiz title, all questions, all options (A, B, C, D), and all explanations in natural standard Bengali (বাংলা). Keep essential mathematical symbols or English technical terms in parentheses if helpful.";

  const prompt = [
    `Create an educational multiple-choice quiz with exactly ${count} questions.`,
    `Topic / Chapter: ${topic}`,
    `Subject: ${input.subject || "General"}`,
    `Student Level: ${input.level || "HSC"}`,
    `Difficulty: ${input.difficulty || "Medium"}`,
    languageDirective,
    "Rules:",
    "- Every question must have exactly 4 distinct options labeled A, B, C, and D.",
    "- Only ONE option is unambiguously correct.",
    "- Provide a helpful, educational in-depth explanation for why the correct answer is right.",
    "- Avoid trick ambiguity or unverified facts.",
    buildVariationGuidance(variation),
  ].join("\n");

  const response = await withRetry(() =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: EDUGENIUS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: {
              type: Type.STRING,
              description: "A concise title for the generated quiz.",
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: "The MCQ question stem.",
                  },
                  options: {
                    type: Type.OBJECT,
                    properties: {
                      A: { type: Type.STRING },
                      B: { type: Type.STRING },
                      C: { type: Type.STRING },
                      D: { type: Type.STRING },
                    },
                    required: ["A", "B", "C", "D"],
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "Must be exactly one of A, B, C, or D.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Clear educational explanation of the correct answer.",
                  },
                },
                required: ["question", "options", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["quizTitle", "questions"],
        },
        ...buildModelTuningConfig(model, variation),
      },
    })
  );

  const rawJson = (response.text ?? "").trim();
  if (!rawJson) {
    throw new GeminiServiceError("কুইজের প্রশ্ন তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", 502);
  }

  let parsed: { quizTitle?: string; questions?: Array<Record<string, unknown>> };
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new GeminiServiceError("এআই থেকে প্রাপ্ত কুইজ ডেটা সঠিকভাবে ফরম্যাট হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।", 502);
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new GeminiServiceError("বৈধ কোনো প্রশ্ন তৈরি হয়নি। অনুগ্রহ করে আরও স্পষ্ট টপিক দিন।", 502);
  }

  const validKeys = ["A", "B", "C", "D"] as const;
  const validatedQuestions: GeneratedQuizQuestion[] = [];

  for (let i = 0; i < parsed.questions.length; i++) {
    const item = parsed.questions[i];
    const qText = typeof item?.question === "string" ? item.question.trim() : "";
    const opts = item?.options as Record<string, unknown> | undefined;
    const rawCorrect = typeof item?.correctAnswer === "string" ? item.correctAnswer.trim().toUpperCase() : "";
    const explanation = typeof item?.explanation === "string" ? item.explanation.trim() : "";

    const optionA = typeof opts?.A === "string" ? opts.A.trim() : "";
    const optionB = typeof opts?.B === "string" ? opts.B.trim() : "";
    const optionC = typeof opts?.C === "string" ? opts.C.trim() : "";
    const optionD = typeof opts?.D === "string" ? opts.D.trim() : "";

    const normalizedCorrect =
      validKeys.find(
        (k) => rawCorrect === k || rawCorrect.startsWith(`${k}.`) || rawCorrect.startsWith(`${k})`)
      ) ?? "A";

    if (qText && optionA && optionB && optionC && optionD) {
      validatedQuestions.push({
        id: validatedQuestions.length + 1,
        question: qText,
        options: { A: optionA, B: optionB, C: optionC, D: optionD },
        correctAnswer: normalizedCorrect,
        explanation:
          explanation ||
          `পাঠ্যক্রম অনুযায়ী অপশন ${normalizedCorrect} সঠিক উত্তর।`,
      });
    }
  }

  if (validatedQuestions.length === 0) {
    throw new GeminiServiceError("তৈরিকৃত প্রশ্নগুলো যাচাইকরণে উত্তীর্ণ হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", 502);
  }

  return {
    quizTitle:
      typeof parsed.quizTitle === "string" && parsed.quizTitle.trim()
        ? parsed.quizTitle.trim()
        : topic,
    questions: validatedQuestions,
    modelUsed: model,
  };
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface ChatRequest {
  messages: ChatTurn[];
  language: string;
  model?: string;
  temperature?: number;
}

export async function sendTutorChat(input: ChatRequest) {
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const validMessages = messages.filter(
    (m) => (m.role === "user" || m.role === "model") && typeof m.text === "string" && m.text.trim().length > 0
  );

  if (validMessages.length === 0) {
    throw new GeminiServiceError("অনুগ্রহ করে আপনার এআই টিউটরের জন্য একটি বার্তা লিখুন।", 400);
  }

  const lastMessage = validMessages[validMessages.length - 1];
  if (lastMessage.role !== "user") {
    throw new GeminiServiceError("কথোপকথনের সর্বশেষ বার্তাটি শিক্ষার্থীর হতে হবে।", 400);
  }

  const model = normalizeModel(input.model);
  const variation = clampVariation(input.temperature);
  const ai = getClient();

  const history = validMessages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.text.trim() }],
  }));

  const language = input.language || "Bengali";
  const languageRule =
    language === "English"
      ? "Respond in clear, encouraging English."
      : language === "Auto"
        ? "Respond in the same language the student uses (Bengali or English)."
        : "Respond in natural, encouraging standard Bengali (বাংলা).";

  const systemInstruction = `${EDUGENIUS_SYSTEM_INSTRUCTION}\n\nConversation instructions:\n- Act as a 24/7 personal live academic tutor.\n- Explain step-by-step and ask a brief check-in or clarifying question when helpful.\n- ${languageRule}\n- ${buildVariationGuidance(variation)}`;

  const response = await withRetry(async () => {
    const chat = ai.chats.create({
      model,
      history,
      config: {
        systemInstruction,
        ...buildModelTuningConfig(model, variation),
      },
    });

    return chat.sendMessage({
      message: lastMessage.text.trim(),
    });
  });

  const reply = (response.text ?? "").trim();
  if (!reply) {
    throw new GeminiServiceError("টিউটর থেকে কোনো উত্তর আসেনি। অনুগ্রহ করে আবার প্রশ্ন করুন।", 502);
  }

  return {
    reply,
    modelUsed: model,
  };
}
