import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { requestQuizGeneration } from "../services/aiClient";
import type {
  AppSettings,
  LanguagePreference,
  QuizAttemptSummary,
  QuizDifficulty,
  QuizPrefill,
  QuizQuestion,
  QuizQuestionCount,
  StudentLevel,
  SubjectOption,
} from "../types/edugenius";
import {
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  LEVEL_LABELS,
  SUBJECT_LABELS,
} from "../utils/bnLabels";

interface QuizPageProps {
  settings: AppSettings;
  prefill: QuizPrefill | null;
  onClearPrefill: () => void;
  quizHistory: QuizAttemptSummary[];
  onSaveAttempt: (attempt: QuizAttemptSummary) => void;
}

const SUBJECTS: SubjectOption[] = [
  "Science",
  "Mathematics",
  "English",
  "General Knowledge",
  "Programming",
  "Other",
];

const LEVELS: StudentLevel[] = [
  "Beginner",
  "SSC",
  "HSC",
  "University",
  "Job Preparation",
];

const QUESTION_COUNTS: QuizQuestionCount[] = [5, 10, 15, 20];
const DIFFICULTIES: QuizDifficulty[] = ["Easy", "Medium", "Hard"];
const LANGUAGES: LanguagePreference[] = ["Bengali", "Auto", "English"];
const OPTION_KEYS = ["A", "B", "C", "D"] as const;

type QuizPhase = "configure" | "active" | "results";

export function QuizPage({
  settings,
  prefill,
  onClearPrefill,
  quizHistory,
  onSaveAttempt,
}: QuizPageProps) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState<SubjectOption>("Science");
  const [level, setLevel] = useState<StudentLevel>(settings.defaultLevel);
  const [count, setCount] = useState<QuizQuestionCount>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("Medium");
  const [language, setLanguage] = useState<LanguagePreference>(settings.defaultLanguage);

  const [phase, setPhase] = useState<QuizPhase>("configure");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [attemptRecorded, setAttemptRecorded] = useState(false);

  useEffect(() => {
    if (prefill) {
      setSubject(prefill.subject);
      setLevel(prefill.level);
      setTopic(prefill.topic);
      setPhase("configure");
      onClearPrefill();
    }
  }, [prefill, onClearPrefill]);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (trimmed.length < 2) {
      setError("অনুগ্রহ করে কুইজের জন্য একটি অধ্যায় বা টপিক লিখুন।");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await requestQuizGeneration({
        topic: trimmed,
        subject,
        level,
        count,
        difficulty,
        language,
        model: settings.model,
        temperature: settings.temperature,
      });

      setQuizTitle(res.quizTitle);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setAnswers({});
      setAttemptRecorded(false);
      setPhase("active");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "এই মুহূর্তে কুইজ তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, option: "A" | "B" | "C" | "D") => {
    if (answers[questionId] !== undefined) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const correctCount = questions.reduce((acc, q) => {
    return answers[q.id] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  const answeredCount = Object.keys(answers).length;
  const scorePercent =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const handleFinishQuiz = () => {
    if (!attemptRecorded && questions.length > 0) {
      const finalCorrect = questions.reduce(
        (acc, q) => (answers[q.id] === q.correctAnswer ? acc + 1 : acc),
        0
      );
      const finalPercent = Math.round((finalCorrect / questions.length) * 100);
      onSaveAttempt({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        quizTitle: quizTitle || topic,
        subject,
        level,
        difficulty,
        totalQuestions: questions.length,
        correctCount: finalCorrect,
        scorePercent: finalPercent,
        completedAt: new Date().toISOString(),
      });
      setAttemptRecorded(true);
    }
    setPhase("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetryQuiz = () => {
    setAnswers({});
    setCurrentIndex(0);
    setAttemptRecorded(false);
    setPhase("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPerformanceSummary = (percent: number) => {
    if (percent >= 85) {
      return "অসাধারণ ফলাফল! এই অধ্যায়টির ওপর আপনার খুব ভালো দখল রয়েছে।";
    }
    if (percent >= 65) {
      return "খুব ভালো অগ্রগতি! নিচের ভুল উত্তরগুলোর ব্যাখ্যা দেখে আরও শক্তিশালী প্রস্তুতি নিন।";
    }
    if (percent >= 40) {
      return "ভালো শুরু! আবার চেষ্টা করার আগে এআই স্টাডি হাব থেকে মূল ধারণাগুলো ঝালিয়ে নিতে পারেন।";
    }
    return "অনুশীলন চালিয়ে যান! স্টাডি হাব থেকে সহজ ব্যাখ্যা পড়ে পুনরায় কুইজ দিন।";
  };

  const activeQuestion = questions[currentIndex];
  const selectedAnswer = activeQuestion ? answers[activeQuestion.id] : undefined;
  const isAnswered = selectedAnswer !== undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
            স্মার্ট এআই কুইজ ও অনুশীলন ইঞ্জিন
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
            পাঠ্যক্রম অনুযায়ী MCQ প্রশ্ন তৈরি করুন—তাৎক্ষণিক সঠিক উত্তর যাচাই ও বিস্তারিত ব্যাখ্যাসহ।
          </p>
        </div>

        {phase !== "configure" && (
          <button
            type="button"
            onClick={() => setPhase("configure")}
            className="inline-flex min-h-[42px] items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            নতুন কুইজ সেটআপ
          </button>
        )}
      </div>

      {/* PHASE 1: CONFIGURATION */}
      {phase === "configure" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <form
            onSubmit={handleGenerateQuiz}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7"
          >
            <h2 className="text-lg font-bold text-[#1E1B4B]">আপনার কুইজ কনফিগার করুন</h2>
            <p className="mt-1 text-sm text-slate-500">
              যেকোনো অধ্যায় বা টপিকের নাম বাংলা বা ইংরেজিতে লিখুন।
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="quiz-topic"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  অধ্যায় বা টপিক
                </label>
                <input
                  id="quiz-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="যেমন: গতির সূত্র, ত্রিকোণমিতি, বাংলাদেশের মুক্তিযুদ্ধ বা Tense & Modals"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:border-[#4338CA] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="quiz-subject"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    বিষয়
                  </label>
                  <select
                    id="quiz-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as SubjectOption)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:bg-white focus:outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {SUBJECT_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="quiz-level"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    শিক্ষার্থীর স্তর
                  </label>
                  <select
                    id="quiz-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as StudentLevel)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:bg-white focus:outline-none"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {LEVEL_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    প্রশ্নের সংখ্যা
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {QUESTION_COUNTS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={`h-11 rounded-xl border text-sm font-semibold tabular-nums transition-colors ${
                          count === n
                            ? "border-[#4338CA] bg-[#4338CA] text-white"
                            : "border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] hover:bg-slate-100"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    কঠিনতার মাত্রা
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTIES.map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
                          difficulty === diff
                            ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                            : "border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] hover:bg-slate-100"
                        }`}
                      >
                        {DIFFICULTY_LABELS[diff]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="quiz-language"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  কুইজের ভাষা
                </label>
                <select
                  id="quiz-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguagePreference)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:bg-white focus:outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{count}টি প্রশ্ন তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    <span>কুইজ তৈরি করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Past Attempts Sidebar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
            <h2 className="text-lg font-bold text-[#1E1B4B]">সাম্প্রতিক কুইজের ফলাফল</h2>
            <p className="mt-1 text-sm text-slate-500">
              আপনার ডিভাইসে সংরক্ষিত সাম্প্রতিক অনুশীলনের স্কোরসমূহ।
            </p>

            {quizHistory.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-[#F8FAFC] p-6 text-center">
                <p className="text-sm font-medium text-slate-600">
                  এখনো কোনো কুইজ সম্পন্ন হয়নি।
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  বাম পাশ থেকে একটি টপিক নির্বাচন করে &ldquo;কুইজ তৈরি করুন&rdquo; বাটনে ক্লিক করুন।
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {quizHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1E1B4B]">
                        {item.quizTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {SUBJECT_LABELS[item.subject]} · {LEVEL_LABELS[item.level]} ·{" "}
                        {DIFFICULTY_LABELS[item.difficulty]}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-lg font-bold tabular-nums ${
                          item.scorePercent >= 70
                            ? "text-[#10B981]"
                            : item.scorePercent >= 40
                              ? "text-[#4338CA]"
                              : "text-red-600"
                        }`}
                      >
                        {item.scorePercent}%
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {item.correctCount}/{item.totalQuestions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 2: ACTIVE QUIZ */}
      {phase === "active" && activeQuestion && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#4338CA]">
                  {SUBJECT_LABELS[subject]} · {LEVEL_LABELS[level]} · {DIFFICULTY_LABELS[difficulty]}
                </p>
                <h2 className="mt-0.5 text-base font-bold text-[#1E1B4B] sm:text-lg">
                  {quizTitle}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1E1B4B] tabular-nums">
                  প্রশ্ন {currentIndex + 1} / {questions.length}
                </p>
                <p className="text-xs text-slate-500 tabular-nums">
                  উত্তর দিয়েছেন: {answeredCount}/{questions.length} · সঠিক: {correctCount}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={answeredCount}
              aria-valuemin={0}
              aria-valuemax={questions.length}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4338CA] to-[#7C3AED] transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Navigation Strip */}
            <div className="mt-4 flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isRight = ans !== undefined && ans === q.correctAnswer;
                const isWrong = ans !== undefined && ans !== q.correctAnswer;

                let btnStyle = "border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-slate-100";
                if (isRight) {
                  btnStyle = "border-[#10B981] bg-[#10B981]/15 text-[#065F46]";
                } else if (isWrong) {
                  btnStyle = "border-red-300 bg-red-50 text-red-700";
                }
                if (isCurrent) {
                  btnStyle += " ring-2 ring-[#4338CA] ring-offset-1 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`প্রশ্ন ${idx + 1}-এ যান`}
                    className={`h-9 min-w-[36px] rounded-lg border px-2 text-xs font-semibold tabular-nums transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold leading-snug text-[#1E1B4B] sm:text-xl">
              <span className="mr-2 text-[#4338CA] tabular-nums">প্রশ্ন {currentIndex + 1}.</span>
              {activeQuestion.question}
            </h3>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {OPTION_KEYS.map((key) => {
                const optionText = activeQuestion.options[key];
                const isThisSelected = selectedAnswer === key;
                const isThisCorrect = activeQuestion.correctAnswer === key;

                let cardStyle =
                  "border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] hover:border-[#4338CA]/50 hover:bg-white";
                let badgeStyle = "bg-white border-slate-300 text-slate-700";

                if (isAnswered) {
                  if (isThisCorrect) {
                    cardStyle = "border-[#10B981] bg-[#10B981]/10 text-[#065F46]";
                    badgeStyle = "bg-[#10B981] border-[#10B981] text-white";
                  } else if (isThisSelected) {
                    cardStyle = "border-red-500 bg-red-50 text-red-900";
                    badgeStyle = "bg-red-600 border-red-600 text-white";
                  } else {
                    cardStyle = "border-slate-200 bg-slate-50/70 text-slate-500";
                    badgeStyle = "bg-white border-slate-200 text-slate-400";
                  }
                }

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(activeQuestion.id, key)}
                    className={`flex min-h-[54px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${cardStyle} ${
                      isAnswered ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${badgeStyle}`}
                      >
                        {key}
                      </span>
                      <span className="text-sm font-medium sm:text-base">{optionText}</span>
                    </div>

                    {isAnswered && isThisCorrect && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#065F46] shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                        <span>সঠিক</span>
                      </span>
                    )}
                    {isAnswered && isThisSelected && !isThisCorrect && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 shrink-0">
                        <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                        <span>ভুল</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Immediate Explanation after Answering */}
            {isAnswered && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold text-[#4338CA]">
                  সঠিক উত্তর: অপশন {activeQuestion.correctAnswer}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {activeQuestion.explanation}
                </p>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>পূর্ববর্তী</span>
              </button>

              <div className="flex items-center gap-3">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                  >
                    <span>পরবর্তী প্রশ্ন</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishQuiz}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#10B981] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                  >
                    <Award className="h-4 w-4" aria-hidden="true" />
                    <span>কুইজের ফলাফল দেখুন</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: RESULTS DASHBOARD */}
      {phase === "results" && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#4338CA]">
                  কুইজ সম্পন্ন · {SUBJECT_LABELS[subject]} · {LEVEL_LABELS[level]}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#1E1B4B]">{quizTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                  {getPerformanceSummary(scorePercent)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleRetryQuiz}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#1E1B4B] hover:bg-slate-100"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>পুনরায় কুইজ দিন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("configure")}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                >
                  <span>নতুন কুইজ তৈরি করুন</span>
                </button>
              </div>
            </div>

            {/* 4 Metric Tiles */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold text-slate-500">মোট প্রশ্ন</p>
                <p className="mt-1 text-2xl font-bold text-[#1E1B4B] tabular-nums">
                  {questions.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold text-slate-500">সঠিক উত্তর</p>
                <p className="mt-1 text-2xl font-bold text-[#10B981] tabular-nums">
                  {correctCount}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold text-slate-500">ভুল উত্তর</p>
                <p className="mt-1 text-2xl font-bold text-red-600 tabular-nums">
                  {questions.length - correctCount}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold text-slate-500">স্কোর শতাংশ</p>
                <p className="mt-1 text-2xl font-bold text-[#4338CA] tabular-nums">
                  {scorePercent}%
                </p>
              </div>
            </div>
          </div>

          {/* Question-by-Question Review */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold text-[#1E1B4B]">উত্তর পর্যালোচনা</h3>
            <div className="mt-5 space-y-4">
              {questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-bold text-[#1E1B4B] sm:text-base">
                        <span className="mr-1.5 text-[#4338CA] tabular-nums">{idx + 1}.</span>
                        {q.question}
                      </p>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#065F46]">
                          <CheckCircle2 className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                          <span>সঠিক</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                          <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                          <span>{userAns ? `আপনার উত্তর: ${userAns}` : "উত্তর দেওয়া হয়নি"}</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-[#065F46]">
                      সঠিক উত্তর: {q.correctAnswer}. {q.options[q.correctAnswer]}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-600">{q.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
