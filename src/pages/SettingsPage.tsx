import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Sliders,
  Trash2,
} from "lucide-react";
import {
  fetchGeminiStatus,
  testGeminiApiConnection,
  type GeminiStatusResponse,
} from "../services/aiClient";
import type {
  AppSettings,
  GeminiModelId,
  LanguagePreference,
  StudentLevel,
} from "../types/edugenius";
import { LANGUAGE_LABELS, LEVEL_LABELS } from "../utils/bnLabels";

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearStudyHistory: () => void;
  onClearQuizHistory: () => void;
  studyCount: number;
  quizCount: number;
}

const LEVELS: StudentLevel[] = [
  "Beginner",
  "SSC",
  "HSC",
  "University",
  "Job Preparation",
];

const LANGUAGES: LanguagePreference[] = ["Bengali", "Auto", "English"];

export function SettingsPage({
  settings,
  onSaveSettings,
  onClearStudyHistory,
  onClearQuizHistory,
  studyCount,
  quizCount,
}: SettingsPageProps) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const [serverStatus, setServerStatus] = useState<GeminiStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetchGeminiStatus()
      .then((res) => {
        if (active) setServerStatus(res);
      })
      .catch(() => {
        if (active) setServerStatus(null);
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiConnection(draft.model);
      setTestResult({
        ok: true,
        message: `${res.model} মডেলের সাথে সফলভাবে সংযোগ হয়েছে (${res.latencyMs} মিলিসেকেন্ড)।`,
      });
      setServerStatus((prev) => (prev ? { ...prev, configured: true } : prev));
    } catch (err) {
      setTestResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : "সংযোগ পরীক্ষা ব্যর্থ হয়েছে। অনুগ্রহ করে সার্ভার এনভায়রনমেন্ট কনফিগারেশন যাচাই করুন।",
      });
    } finally {
      setTesting(false);
    }
  };

  const models = serverStatus?.supportedModels ?? [
    {
      id: "gemini-4-hydrogen" as GeminiModelId,
      label: "Gemini 4 Hydrogen",
      description:
        "দ্রুত বাংলা ও ইংরেজি ব্যাখ্যা, কাঠামোবদ্ধ কুইজ এবং লাইভ টিউটরিংয়ের জন্য সুপারিশকৃত ডিফল্ট মডেল।",
    },
    {
      id: "gemini-3.1-flash-lite" as GeminiModelId,
      label: "Gemini 3.1 Flash Lite",
      description:
        "তাৎক্ষণিক উত্তর এবং দ্রুত অনুশীলন ড্রিলের জন্য হালকা ও দ্রুতগতির মডেল।",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
          সেটিংস ও এআই কনফিগারেশন
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          Gemini মডেল নির্বাচন, উত্তরের বৈচিত্র্য, শেখার ডিফল্ট ভাষা ও স্তর নির্ধারণ এবং সার্ভার সংযোগ পরীক্ষা করুন।
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: Server-Side Gemini Connection & Security */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4338CA]/10 text-[#4338CA]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1E1B4B]">
                  Google Gemini সার্ভার সংযোগ
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  সব এআই অনুরোধ নিরাপদ সার্ভার-সাইড এন্ডপয়েন্টের মাধ্যমে সম্পন্ন হয়। API কী নিরাপদে পরিবেশগত Secrets-এ সংরক্ষিত থাকে এবং ব্রাউজারে উন্মুক্ত হয় না।
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {statusLoading ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>অবস্থা যাচাই হচ্ছে...</span>
                </span>
              ) : serverStatus?.configured ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#065F46]">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                  <span>সার্ভার কী সক্রিয়</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <span>Secrets-এ কী প্রয়োজন</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs leading-relaxed text-slate-600 space-y-2">
            <p className="font-semibold text-[#1E1B4B]">নিরাপত্তা ও গোপনীয়তা নীতি</p>
            <p>
              আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে EduGenius AI কখনোই ব্রাউজারের <code className="font-mono text-[#4338CA]">localStorage</code> বা ফ্রন্টএন্ড কোডে কোনো API কী সংরক্ষণ করে না। সার্ভার এনভায়রনমেন্ট বা AI Studio Secrets প্যানেলে <code className="font-mono text-[#4338CA]">GEMINI_API_KEY</code> কনফিগার করা থাকে।
            </p>
            <p>
              অফিশিয়াল Gemini API ডকুমেন্টেশন ও কী ব্যবস্থাপনা:{" "}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#4338CA] hover:underline"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={testing}
              onClick={handleTestConnection}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#4338CA]" aria-hidden="true" />
                  <span>সংযোগ পরীক্ষা চলছে...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-[#4338CA]" aria-hidden="true" />
                  <span>API সংযোগ পরীক্ষা করুন</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                role="status"
                className={`flex items-center gap-2 text-xs font-semibold ${
                  testResult.ok ? "text-[#065F46]" : "text-red-700"
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Model Selection, Temperature Control & Defaults */}
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-7"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-[#7C3AED]" aria-hidden="true" />
              <h2 className="text-lg font-bold text-[#1E1B4B]">
                মডেল ও উত্তর কনফিগারেশন
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {models.map((m) => {
                const selected = draft.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, model: m.id }))}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-[#4338CA] bg-[#4338CA]/6"
                        : "border-slate-200 bg-[#F8FAFC] hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-bold text-[#1E1B4B]">{m.label}</span>
                      {selected && (
                        <CheckCircle2 className="h-4 w-4 text-[#4338CA]" aria-hidden="true" />
                      )}
                    </div>
                    <span className="mt-1 font-mono text-[11px] text-[#4338CA]">{m.id}</span>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature / Variation Slider */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <label
                htmlFor="temperature-slider"
                className="text-sm font-bold text-[#1E1B4B]"
              >
                প্রতিক্রিয়ার বৈচিত্র্য (Temperature)
              </label>
              <span className="rounded-lg bg-[#4338CA]/10 px-2.5 py-1 font-mono text-sm font-bold text-[#4338CA] tabular-nums">
                {draft.temperature.toFixed(2)}
              </span>
            </div>

            <input
              id="temperature-slider"
              type="range"
              min={0.2}
              max={0.7}
              step={0.05}
              value={draft.temperature}
              onChange={(e) =>
                setDraft((d) => ({ ...d, temperature: parseFloat(e.target.value) }))
              }
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#4338CA]"
            />

            <div className="mt-1.5 flex justify-between text-xs text-slate-500 tabular-nums">
              <span>০.২ (সুনির্দিষ্ট ও পাঠ্যবইনির্ভর)</span>
              <span>০.৪ (ভারসাম্যপূর্ণ ডিফল্ট)</span>
              <span>০.৭ (বৈচিত্র্যময় উপমা)</span>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
              উত্তরের বৈচিত্র্য নিয়ন্ত্রণ করে: কম মান দিলে উত্তর সংক্ষিপ্ত ও পাঠ্যবইয়ের সংজ্ঞায় সীমাবদ্ধ থাকে, আর বেশি মান দিলে বাস্তব জীবনের সৃজনশীল উপমা ও উদাহরণ যুক্ত হয়।
            </p>
          </div>

          {/* Learning Defaults */}
          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="default-level"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                ডিফল্ট শিক্ষার্থীর স্তর
              </label>
              <select
                id="default-level"
                value={draft.defaultLevel}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    defaultLevel: e.target.value as StudentLevel,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:bg-white focus:outline-none"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="default-language"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                ডিফল্ট ভাষা
              </label>
              <select
                id="default-language"
                value={draft.defaultLanguage}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    defaultLanguage: e.target.value as LanguagePreference,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:bg-white focus:outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>কনফিগারেশন সংরক্ষণ করুন</span>
              </button>

              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#065F46]">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                  <span>কনফিগারেশন সংরক্ষিত হয়েছে</span>
                </span>
              )}
            </div>
          </div>
        </form>

        {/* Section 3: Local Study Data Management */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-[#1E1B4B]">সংরক্ষিত নোট ও কুইজ ডেটা</h2>
          <p className="mt-1 text-sm text-slate-600">
            আপনার ব্রাউজারে সংরক্ষিত স্টাডি নোট ও কুইজের ইতিহাস পরিচালনা করুন।
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={studyCount === 0}
              onClick={onClearStudyHistory}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#1E1B4B] hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>স্টাডি নোট মুছুন ({studyCount})</span>
            </button>

            <button
              type="button"
              disabled={quizCount === 0}
              onClick={onClearQuizHistory}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#1E1B4B] hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>কুইজের ইতিহাস মুছুন ({quizCount})</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
