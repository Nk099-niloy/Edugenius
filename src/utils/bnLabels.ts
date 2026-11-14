import type {
  ExplanationStyle,
  LanguagePreference,
  QuizDifficulty,
  StudentLevel,
  SubjectOption,
} from "../types/edugenius";

export const SUBJECT_LABELS: Record<SubjectOption, string> = {
  Science: "বিজ্ঞান (Science)",
  Mathematics: "গণিত (Mathematics)",
  English: "ইংরেজি (English)",
  "General Knowledge": "সাধারণ জ্ঞান",
  Programming: "প্রোগ্রামিং",
  Other: "অন্যান্য",
};

export const LEVEL_LABELS: Record<StudentLevel, string> = {
  Beginner: "প্রাথমিক (Beginner)",
  SSC: "এসএসসি (SSC)",
  HSC: "এইচএসসি (HSC)",
  University: "বিশ্ববিদ্যালয়",
  "Job Preparation": "চাকরি ও ভর্তি প্রস্তুতি",
};

export const STYLE_LABELS: Record<ExplanationStyle, string> = {
  "Simple Summary": "সহজ সারসংক্ষেপ",
  "Detailed Explanation with Examples": "উদাহরণসহ বিস্তারিত ব্যাখ্যা",
  "Flashcard Points": "ফ্ল্যাশকার্ড পয়েন্ট",
};

export const DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  Easy: "সহজ",
  Medium: "মাঝারি",
  Hard: "কঠিন",
};

export const LANGUAGE_LABELS: Record<LanguagePreference, string> = {
  Bengali: "বাংলা (নির্ধারিত)",
  Auto: "স্বয়ংক্রিয় (প্রশ্ন অনুযায়ী)",
  English: "English (ইংরেজি)",
};
