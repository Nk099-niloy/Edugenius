import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  History,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { requestTopicExplanation } from "../services/aiClient";
import type {
  AppSettings,
  ExplanationStyle,
  LanguagePreference,
  QuizPrefill,
  StudentLevel,
  StudyNote,
  StudyPrefill,
  SubjectOption,
} from "../types/edugenius";
import {
  LANGUAGE_LABELS,
  LEVEL_LABELS,
  STYLE_LABELS,
  SUBJECT_LABELS,
} from "../utils/bnLabels";

interface StudyHubPageProps {
  settings: AppSettings;
  prefill: StudyPrefill | null;
  onClearPrefill: () => void;
  notesHistory: StudyNote[];
  onSaveNote: (note: StudyNote) => void;
  onDeleteNote: (id: string) => void;
  onCreateQuizFromTopic: (prefill: QuizPrefill) => void;
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

const STYLES: ExplanationStyle[] = [
  "Simple Summary",
  "Detailed Explanation with Examples",
  "Flashcard Points",
];

const LANGUAGES: LanguagePreference[] = ["Bengali", "Auto", "English"];

const SAMPLE_PROMPTS: Array<{
  label: string;
  subject: SubjectOption;
  level: StudentLevel;
  topic: string;
}> = [
  {
    label: "সালোকসংশ্লেষণ",
    subject: "Science",
    level: "SSC",
    topic: "সালোকসংশ্লেষণ প্রক্রিয়া এবং এর আলোক ও অন্ধকার পর্যায় সহজভাবে ব্যাখ্যা করো।",
  },
  {
    label: "দ্বিঘাত সমীকরণ",
    subject: "Mathematics",
    level: "HSC",
    topic: "দ্বিঘাত সমীকরণ সমাধানের সূত্র ও বর্গ পূর্ণ করার পদ্ধতি উদাহরণসহ বোঝাও।",
  },
  {
    label: "পাইথন রিকার্সন",
    subject: "Programming",
    level: "University",
    topic: "পাইথনে রিকার্সন (Recursion) ও বেস কেস ফ্যাক্টরিয়াল উদাহরণের মাধ্যমে বুঝিয়ে দাও।",
  },
  {
    label: "IELTS রাইটিং টিপস",
    subject: "English",
    level: "Job Preparation",
    topic: "IELTS Academic Writing Task 2-তে Cohesion ও Coherence ভালো করার কার্যকর উপায়গুলো কী?",
  },
];

export function StudyHubPage({
  settings,
  prefill,
  onClearPrefill,
  notesHistory,
  onSaveNote,
  onDeleteNote,
  onCreateQuizFromTopic,
}: StudyHubPageProps) {
  const [subject, setSubject] = useState<SubjectOption>("Science");
  const [level, setLevel] = useState<StudentLevel>(settings.defaultLevel);
  const [language, setLanguage] = useState<LanguagePreference>(settings.defaultLanguage);
  const [style, setStyle] = useState<ExplanationStyle>("Detailed Explanation with Examples");
  const [topic, setTopic] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [copied, setCopied] = useState(false);

  const autoRunConsumedRef = useRef(false);

  const runExplanation = async (params: {
    subject: SubjectOption;
    level: StudentLevel;
    language: LanguagePreference;
    style: ExplanationStyle;
    topic: string;
  }) => {
    const trimmed = params.topic.trim();
    if (trimmed.length < 2) {
      setError("অনুগ্রহ করে কমপক্ষে ২ অক্ষরের একটি টপিক বা প্রশ্ন লিখুন।");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await requestTopicExplanation({
        subject: params.subject,
        level: params.level,
        topic: trimmed,
        style: params.style,
        language: params.language,
        model: settings.model,
        temperature: settings.temperature,
      });

      const newNote: StudyNote = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        subject: params.subject,
        level: params.level,
        style: params.style,
        language: params.language,
        topic: trimmed,
        explanation: res.explanation,
        modelUsed: res.modelUsed,
        createdAt: new Date().toISOString(),
      };

      setActiveNote(newNote);
      onSaveNote(newNote);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "এই মুহূর্তে ব্যাখ্যা তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prefill && !autoRunConsumedRef.current) {
      autoRunConsumedRef.current = true;
      setSubject(prefill.subject);
      if (prefill.level) setLevel(prefill.level);
      setTopic(prefill.topic);

      if (prefill.autoRun && prefill.topic.trim().length >= 2) {
        void runExplanation({
          subject: prefill.subject,
          level: prefill.level ?? settings.defaultLevel,
          language,
          style,
          topic: prefill.topic,
        });
      }
      onClearPrefill();
    }
    return () => {
      autoRunConsumedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runExplanation({ subject, level, language, style, topic });
  };

  const handleRegenerate = () => {
    const targetTopic = activeNote?.topic || topic;
    if (!targetTopic.trim()) return;
    void runExplanation({
      subject: activeNote?.subject || subject,
      level: activeNote?.level || level,
      language: activeNote?.language || language,
      style: activeNote?.style || style,
      topic: targetTopic,
    });
  };

  const handleCopyNotes = async () => {
    if (!activeNote) return;
    const textToCopy = `# ${activeNote.topic}\nবিষয়: ${SUBJECT_LABELS[activeNote.subject]} | শ্রেণি/স্তর: ${LEVEL_LABELS[activeNote.level]}\n\n${activeNote.explanation}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("এই ব্রাউজারে ক্লিপবোর্ড অ্যাক্সেস করা যায়নি।");
    }
  };

  const handleDownloadNotes = () => {
    if (!activeNote) return;
    const safeSlug = activeNote.topic
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "edugenius-notes";
    const content = `# ${activeNote.topic}\n\n- **বিষয়:** ${SUBJECT_LABELS[activeNote.subject]}\n- **শিক্ষার্থীর স্তর:** ${LEVEL_LABELS[activeNote.level]}\n- **ব্যাখ্যার ধরন:** ${STYLE_LABELS[activeNote.style]}\n- **তৈরিকারক:** EduGenius AI\n\n---\n\n${activeNote.explanation}\n`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeSlug}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
          এআই স্টাডি হাব ও টপিক ব্যাখ্যাকারী
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          যেকোনো কঠিন একাডেমিক ধারণা সহজ সংজ্ঞা, বাস্তব উপমা ও ব্যবহারিক উদাহরণের মাধ্যমে বুঝে নিন।
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Control Form */}
        <div className="space-y-6 lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="study-subject"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    বিষয়
                  </label>
                  <select
                    id="study-subject"
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
                    htmlFor="study-level"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    শিক্ষার্থীর স্তর
                  </label>
                  <select
                    id="study-level"
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

              <div>
                <label
                  htmlFor="study-language"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  ব্যাখ্যার ভাষা
                </label>
                <select
                  id="study-language"
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

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  ব্যাখ্যার ধরন
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {STYLES.map((st) => {
                    const selected = style === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStyle(st)}
                        className={`flex min-h-[42px] items-center justify-between rounded-xl border px-3.5 py-2 text-left text-sm font-medium transition-colors ${
                          selected
                            ? "border-[#4338CA] bg-[#4338CA]/8 text-[#4338CA]"
                            : "border-slate-200 bg-[#F8FAFC] text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{STYLE_LABELS[st]}</span>
                        {selected && <Check className="h-4 w-4 text-[#4338CA]" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="study-topic"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  টপিক বা প্রশ্ন
                </label>
                <textarea
                  id="study-topic"
                  rows={5}
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="আপনি যেকোনো টপিক সম্পর্কে বুঝতে চান, তা এখানে লিখুন..."
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 text-sm leading-relaxed text-[#1E1B4B] placeholder:text-slate-400 focus:border-[#4338CA] focus:bg-white focus:outline-none"
                />
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
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>ব্যাখ্যা তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    <span>ব্যাখ্যা তৈরি করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Example Starters */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                একটি নমুনা টপিক বেছে নিন:
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setSubject(item.subject);
                      setLevel(item.level);
                      setTopic(item.topic);
                    }}
                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#4338CA]/40 hover:text-[#4338CA]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Saved Notes History */}
          {notesHistory.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-[#4338CA]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-[#1E1B4B]">
                  সাম্প্রতিক স্টাডি নোট ({notesHistory.length})
                </h2>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notesHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                      activeNote?.id === item.id
                        ? "border-[#4338CA]/50 bg-[#4338CA]/5"
                        : "border-slate-200 bg-[#F8FAFC] hover:bg-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNote(item);
                        setSubject(item.subject);
                        setLevel(item.level);
                        setStyle(item.style);
                        setLanguage(item.language);
                        setTopic(item.topic);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-xs font-semibold text-[#1E1B4B]">
                        {item.topic}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {SUBJECT_LABELS[item.subject]} · {LEVEL_LABELS[item.level]}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={`নোট মুছুন ${item.topic}`}
                      onClick={() => {
                        onDeleteNote(item.id);
                        if (activeNote?.id === item.id) {
                          setActiveNote(null);
                        }
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Reading Workspace */}
        <div className="lg:col-span-7">
          <div className="min-h-[540px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {loading ? (
              <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                <Loader2 className="h-9 w-9 animate-spin text-[#4338CA]" aria-hidden="true" />
                <p className="mt-4 text-base font-semibold text-[#1E1B4B]">
                  আপনার স্টাডি গাইড সাজানো হচ্ছে...
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  ধারণার সংজ্ঞা, বাস্তব জীবনের উপমা এবং ব্যবহারিক উদাহরণ তৈরি করা হচ্ছে।
                </p>
              </div>
            ) : activeNote ? (
              <div>
                {/* Header & Toolbar */}
                <div className="border-b border-slate-200 pb-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="font-semibold text-[#4338CA]">
                      {SUBJECT_LABELS[activeNote.subject]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{LEVEL_LABELS[activeNote.level]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{STYLE_LABELS[activeNote.style]}</span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                    {activeNote.topic}
                  </h2>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyNotes}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                          <span className="text-[#10B981]">ক্লিপবোর্ডে কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>কপি করুন</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadNotes}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>নোট ডাউনলোড করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>পুনরায় উত্তর তৈরি করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onCreateQuizFromTopic({
                          subject: activeNote.subject,
                          level: activeNote.level,
                          topic: activeNote.topic,
                        })
                      }
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#10B981]/12 px-3.5 py-2 text-xs font-semibold text-[#065F46] transition-colors hover:bg-[#10B981]/20 whitespace-nowrap shrink-0"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>এই বিষয়ে কুইজ দিন</span>
                    </button>
                  </div>
                </div>

                {/* Rendered Markdown Content */}
                <div className="mt-6">
                  <MarkdownRenderer content={activeNote.explanation} />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4338CA]/10 text-[#4338CA]">
                  <BookOpen className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-[#1E1B4B]">
                  যেকোনো টপিক বুঝতে প্রস্তুত
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  বাম পাশ থেকে আপনার বিষয়, শ্রেণি ও ব্যাখ্যার ধরন নির্বাচন করে টপিকটি লিখুন এবং সহজ বাংলায় বিস্তারিত নোট পান।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
