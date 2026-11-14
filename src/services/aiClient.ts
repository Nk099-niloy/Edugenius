import type {
  ChatMessage,
  ExplanationStyle,
  GeminiModelId,
  LanguagePreference,
  QuizDifficulty,
  QuizQuestion,
  QuizQuestionCount,
  StudentLevel,
  SubjectOption,
} from "../types/edugenius";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("সার্ভার থেকে সঠিক উত্তর পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
  }

  if (!response.ok) {
    const errMsg =
      typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `অনুরোধ ব্যর্থ হয়েছে (স্ট্যাটাস ${response.status})।`;
    throw new Error(errMsg);
  }

  return data as T;
}

export interface GeminiStatusResponse {
  configured: boolean;
  defaultModel: GeminiModelId;
  supportedModels: Array<{
    id: GeminiModelId;
    label: string;
    description: string;
  }>;
}

export async function fetchGeminiStatus(): Promise<GeminiStatusResponse> {
  const response = await fetch("/api/gemini/status");
  return parseJsonResponse<GeminiStatusResponse>(response);
}

export async function testGeminiApiConnection(model: GeminiModelId) {
  const response = await fetch("/api/gemini/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  return parseJsonResponse<{
    ok: boolean;
    model: string;
    latencyMs: number;
    reply: string;
  }>(response);
}

export async function requestTopicExplanation(params: {
  subject: SubjectOption;
  level: StudentLevel;
  topic: string;
  style: ExplanationStyle;
  language: LanguagePreference;
  model: GeminiModelId;
  temperature: number;
}) {
  const response = await fetch("/api/gemini/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return parseJsonResponse<{
    explanation: string;
    modelUsed: string;
  }>(response);
}

export async function requestQuizGeneration(params: {
  topic: string;
  subject: SubjectOption;
  level: StudentLevel;
  count: QuizQuestionCount;
  difficulty: QuizDifficulty;
  language: LanguagePreference;
  model: GeminiModelId;
  temperature: number;
}) {
  const response = await fetch("/api/gemini/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return parseJsonResponse<{
    quizTitle: string;
    questions: QuizQuestion[];
    modelUsed: string;
  }>(response);
}

export async function requestTutorReply(params: {
  messages: Array<Pick<ChatMessage, "role" | "text">>;
  language: LanguagePreference;
  model: GeminiModelId;
  temperature: number;
}) {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return parseJsonResponse<{
    reply: string;
    modelUsed: string;
  }>(response);
}
