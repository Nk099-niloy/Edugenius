export type PageId = "home" | "study-hub" | "quiz" | "tutor" | "settings";

export type SubjectOption =
  | "Science"
  | "Mathematics"
  | "English"
  | "General Knowledge"
  | "Programming"
  | "Other";

export type StudentLevel =
  | "Beginner"
  | "SSC"
  | "HSC"
  | "University"
  | "Job Preparation";

export type ExplanationStyle =
  | "Simple Summary"
  | "Detailed Explanation with Examples"
  | "Flashcard Points";

export type LanguagePreference = "Auto" | "English" | "Bengali";

export type QuizDifficulty = "Easy" | "Medium" | "Hard";

export type QuizQuestionCount = 5 | 10 | 15 | 20;

export type GeminiModelId = "gemini-4-hydrogen" | "gemini-3.1-flash-lite";

export interface AppSettings {
  model: GeminiModelId;
  temperature: number;
  defaultLevel: StudentLevel;
  defaultLanguage: LanguagePreference;
}

export interface StudyNote {
  id: string;
  subject: SubjectOption;
  level: StudentLevel;
  style: ExplanationStyle;
  language: LanguagePreference;
  topic: string;
  explanation: string;
  modelUsed: string;
  createdAt: string;
}

export interface QuizQuestion {
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

export interface QuizAttemptSummary {
  id: string;
  quizTitle: string;
  subject: SubjectOption;
  level: StudentLevel;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  completedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface StudyPrefill {
  subject: SubjectOption;
  topic: string;
  level?: StudentLevel;
  autoRun?: boolean;
}

export interface QuizPrefill {
  subject: SubjectOption;
  topic: string;
  level: StudentLevel;
}
