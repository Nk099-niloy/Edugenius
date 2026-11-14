import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  SlidersHorizontal,
} from "lucide-react";
import type { PageId, StudentLevel, StudyPrefill, SubjectOption } from "../types/edugenius";
import { SUBJECT_LABELS } from "../utils/bnLabels";

interface HomePageProps {
  onNavigate: (page: PageId) => void;
  onStartStudy: (prefill: StudyPrefill) => void;
}

const SUBJECTS: SubjectOption[] = [
  "Science",
  "Mathematics",
  "English",
  "General Knowledge",
  "Programming",
  "Other",
];

const HERO_IMAGE_SRC = "/src/assets/images/edugenius_hero_learning_1794630001009.jpg";

interface BenchmarkStats {
  questionsSolved: string;
  quizzesGenerated: string;
  satisfactionRating: string;
}

const DEFAULT_BENCHMARKS: BenchmarkStats = {
  questionsSolved: "৫০,০০০+",
  quizzesGenerated: "১০,০০০+",
  satisfactionRating: "৯৯.৪%",
};

export function HomePage({ onNavigate, onStartStudy }: HomePageProps) {
  const [heroSubject, setHeroSubject] = useState<SubjectOption>("Science");
  const [heroTopic, setHeroTopic] = useState("");
  const [heroError, setHeroError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const [benchmarks, setBenchmarks] = useState<BenchmarkStats>(DEFAULT_BENCHMARKS);
  const [editingStats, setEditingStats] = useState(false);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroTopic.trim();
    if (trimmed.length < 2) {
      setHeroError("এআই-কে জিজ্ঞাসা করতে অনুগ্রহ করে একটি বিষয় বা প্রশ্ন লিখুন।");
      return;
    }
    setHeroError("");
    onStartStudy({
      subject: heroSubject,
      topic: trimmed,
      autoRun: true,
    });
  };

  const handleTrackClick = (level: StudentLevel, subject: SubjectOption, sampleTopic: string) => {
    onStartStudy({
      subject,
      level,
      topic: sampleTopic,
      autoRun: false,
    });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section with Animated Ambient Gradient */}
      <section className="relative border-b border-slate-200/80 bg-[#F8FAFC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="hero-gradient-orb absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#4338CA]/12 blur-3xl" />
          <div className="hero-gradient-orb absolute right-0 top-12 h-[28rem] w-[28rem] rounded-full bg-[#7C3AED]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Headline, Copy & Interactive Ask AI Form */}
            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="mb-3 text-sm font-semibold text-[#4338CA]">
                অ্যাপেক্স এডুটেক ল্যাবস · বাংলা ও ইংরেজি এআই শিক্ষা সহায়ক
              </p>

              <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-[#1E1B4B] sm:text-4xl lg:text-5xl [text-wrap:balance] leading-[1.2]">
                এআই সহায়তায় যেকোনো বিষয় শিখুন ৩ গুণ দ্রুতগতিতে
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                আপনার ব্যক্তিগত এআই শিক্ষা সঙ্গী। কঠিন ধারণাগুলো সহজে বুঝুন, স্মার্ট কুইজ অনুশীলন করুন এবং একাডেমিক লক্ষ্য অর্জন করুন।
              </p>

              {/* Hero Topic Input Form */}
              <form
                onSubmit={handleHeroSubmit}
                className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="hero-subject"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      বিষয় নির্বাচন করুন
                    </label>
                    <select
                      id="hero-subject"
                      value={heroSubject}
                      onChange={(e) => setHeroSubject(e.target.value as SubjectOption)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-medium text-[#1E1B4B] transition-colors focus:border-[#4338CA] focus:bg-white focus:outline-none"
                    >
                      {SUBJECTS.map((subj) => (
                        <option key={subj} value={subj}>
                          {SUBJECT_LABELS[subj]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-8">
                    <label
                      htmlFor="hero-topic"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      টপিক বা প্রশ্ন লিখুন (বাংলা বা ইংরেজিতে)
                    </label>
                    <input
                      id="hero-topic"
                      type="text"
                      value={heroTopic}
                      onChange={(e) => {
                        setHeroTopic(e.target.value);
                        if (heroError) setHeroError("");
                      }}
                      placeholder="যেমন: নিউটনের দ্বিতীয় সূত্র ব্যাখ্যা করো অথবা সালোকসংশ্লেষণ কী?"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-[#1E1B4B] placeholder:text-slate-400 transition-colors focus:border-[#4338CA] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {heroError && (
                  <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                    {heroError}
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-95 active:scale-[0.98] whitespace-nowrap shrink-0"
                  >
                    <span>এআই-কে জিজ্ঞাসা করুন</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate("study-hub")}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    ফ্রি শুরু করুন
                  </button>

                  <span className="text-xs text-slate-500">
                    আরও স্মার্ট শিখুন। ভালোভাবে ভাবুন। আরও বেশি অর্জন করুন।
                  </span>
                </div>
              </form>
            </div>

            {/* Right Column: Hero Illustration */}
            <div className="flex items-stretch lg:col-span-5">
              <div className="relative flex w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {!imageFailed ? (
                  <img
                    src={HERO_IMAGE_SRC}
                    alt="EduGenius AI স্টাডি ওয়ার্কস্পেসের আধুনিক আইসোমেট্রিক ইলাস্ট্রেশন"
                    referrerPolicy="no-referrer"
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover aspect-[4/3] lg:aspect-auto"
                  />
                ) : (
                  <div className="flex min-h-[300px] w-full flex-col items-center justify-center bg-gradient-to-br from-[#1E1B4B] via-[#4338CA] to-[#7C3AED] p-8 text-center text-white">
                    <GraduationCap className="h-14 w-14 text-white/90" aria-hidden="true" />
                    <p className="mt-4 text-lg font-semibold">EduGenius AI ওয়ার্কস্পেস</p>
                    <p className="mt-1 max-w-xs text-sm text-indigo-100">
                      বিষয়ভিত্তিক ব্যাখ্যা, স্মার্ট কুইজ এবং ২৪/৭ বাংলা ও ইংরেজি টিউটর।
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl [text-wrap:balance]">
            কঠিন বিষয় আয়ত্ত করার জন্য প্রয়োজনীয় সবকিছু
          </h2>
          <p className="mt-2 text-base text-slate-600">
            নবম–দ্বাদশ শ্রেণি, এসএসসি, এইচএসসি, বিশ্ববিদ্যালয়, আইইএলটিএস এবং চাকরি পরীক্ষার প্রস্তুতির জন্য বিশেষভাবে তৈরি।
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Feature 1 */}
          <button
            type="button"
            onClick={() => onNavigate("study-hub")}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-150 hover:border-[#4338CA]/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4338CA]/10 text-[#4338CA]">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#1E1B4B]">
                তাৎক্ষণিক বিষয় ব্যাখ্যাকারী
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                জটিল ও কঠিন টপিকগুলোকে সহজ সংজ্ঞা, বাস্তব জীবনের উপমা এবং ব্যবহারিক উদাহরণের মাধ্যমে ধাপে ধাপে বুঝুন।
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4338CA] group-hover:translate-x-0.5 transition-transform">
              এআই স্টাডি হাব খুলুন
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>

          {/* Feature 2 */}
          <button
            type="button"
            onClick={() => onNavigate("quiz")}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-150 hover:border-[#7C3AED]/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED]">
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#1E1B4B]">
                এআই কুইজ জেনারেটর
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                মুহূর্তেই অধ্যায়ভিত্তিক ব্যক্তিগত MCQ প্রশ্ন তৈরি করুন—চারটি অপশন, তাৎক্ষণিক উত্তর যাচাই এবং গভীর ব্যাখ্যাসহ।
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C3AED] group-hover:translate-x-0.5 transition-transform">
              স্মার্ট কুইজ শুরু করুন
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>

          {/* Feature 3 */}
          <button
            type="button"
            onClick={() => onNavigate("tutor")}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-150 hover:border-[#10B981]/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10B981]/12 text-[#10B981]">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#1E1B4B]">
                ২৪/৭ ব্যক্তিগত এআই টিউটর
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                যেকোনো সময় বাংলা বা ইংরেজিতে একাডেমিক প্রশ্ন করুন এবং পূর্বের কথোপকথনের ধারাবাহিকতা বজায় রেখে উত্তর পান।
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#10B981] group-hover:translate-x-0.5 transition-transform">
              লাইভ টিউটরের সাথে চ্যাট করুন
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      </section>

      {/* Reference Statistics Section (Editable Marketing Content) */}
      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1E1B4B]">
                প্ল্যাটফর্ম রেফারেন্স পরিসংখ্যান
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                অ্যাপেক্স এডুটেক ল্যাবসের উদাহরণমূলক মার্কেটিং বেঞ্চমার্ক (সম্পাদনাযোগ্য রেফারেন্স তথ্য, যাচাইকৃত লাইভ ডেটা নয়)।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingStats((prev) => !prev)}
              className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#4338CA]" aria-hidden="true" />
              <span>{editingStats ? "সম্পাদনা সম্পন্ন" : "রেফারেন্স সংখ্যা সম্পাদনা করুন"}</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
              {editingStats ? (
                <input
                  type="text"
                  aria-label="সমাধানকৃত প্রশ্নের সংখ্যা"
                  value={benchmarks.questionsSolved}
                  onChange={(e) =>
                    setBenchmarks((b) => ({ ...b, questionsSolved: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-2xl font-bold text-[#4338CA] tabular-nums"
                />
              ) : (
                <p className="text-3xl font-bold tracking-tight text-[#4338CA] tabular-nums">
                  {benchmarks.questionsSolved}
                </p>
              )}
              <p className="mt-1.5 text-sm font-semibold text-[#1E1B4B]">
                সমাধানকৃত প্রশ্ন
              </p>
              <p className="mt-1 text-xs text-slate-500">
                রেফারেন্স লক্ষ্যমাত্রা
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
              {editingStats ? (
                <input
                  type="text"
                  aria-label="তৈরিকৃত কুইজের সংখ্যা"
                  value={benchmarks.quizzesGenerated}
                  onChange={(e) =>
                    setBenchmarks((b) => ({ ...b, quizzesGenerated: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-2xl font-bold text-[#7C3AED] tabular-nums"
                />
              ) : (
                <p className="text-3xl font-bold tracking-tight text-[#7C3AED] tabular-nums">
                  {benchmarks.quizzesGenerated}
                </p>
              )}
              <p className="mt-1.5 text-sm font-semibold text-[#1E1B4B]">
                তৈরিকৃত কুইজ
              </p>
              <p className="mt-1 text-xs text-slate-500">
                রেফারেন্স লক্ষ্যমাত্রা
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
              {editingStats ? (
                <input
                  type="text"
                  aria-label="শিক্ষার্থীদের সন্তুষ্টির হার"
                  value={benchmarks.satisfactionRating}
                  onChange={(e) =>
                    setBenchmarks((b) => ({ ...b, satisfactionRating: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-2xl font-bold text-[#10B981] tabular-nums"
                />
              ) : (
                <p className="text-3xl font-bold tracking-tight text-[#10B981] tabular-nums">
                  {benchmarks.satisfactionRating}
                </p>
              )}
              <p className="mt-1.5 text-sm font-semibold text-[#1E1B4B]">
                সন্তুষ্টির রেটিং
              </p>
              <p className="mt-1 text-xs text-slate-500">
                রেফারেন্স মানদণ্ড
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Academic Tracks */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#1E1B4B] p-8 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl [text-wrap:balance]">
                প্রতিটি একাডেমিক ধাপের জন্য উপযোগী
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-indigo-100 sm:text-base">
                আপনার শ্রেণি বা পরীক্ষার ধাপ বেছে নিয়ে সরাসরি এআই স্টাডি হাবে অনুশীলন শুরু করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("quiz")}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-[#1E1B4B] transition-opacity hover:opacity-95 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>স্মার্ট কুইজ অনুশীলন করুন</span>
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "এসএসসি ও নবম–দশম শ্রেণি",
                desc: "পদার্থবিজ্ঞান, রসায়ন, সাধারণ ও উচ্চতর গণিত",
                level: "SSC" as StudentLevel,
                subject: "Science" as SubjectOption,
                sample: "নিউটনের গতির দ্বিতীয় সূত্র সহজ উদাহরণসহ বোঝাও",
              },
              {
                title: "এইচএসসি ও কলেজ",
                desc: "জৈব রসায়ন, ক্যালকুলাস, আইসিটি ও জীববিজ্ঞান",
                level: "HSC" as StudentLevel,
                subject: "Mathematics" as SubjectOption,
                sample: "আংশিক যোগজীকরণ (Integration by Parts) ধাপে ধাপে উদাহরণসহ ব্যাখ্যা করো",
              },
              {
                title: "বিশ্ববিদ্যালয় ও প্রোগ্রামিং",
                desc: "অ্যালগরিদম, ডেটা স্ট্রাকচার এবং প্রকৌশল বিষয়",
                level: "University" as StudentLevel,
                subject: "Programming" as SubjectOption,
                sample: "পাইথনে রিকার্সন (Recursion) ও ডাইনামিক প্রোগ্রামিংয়ের পার্থক্য ব্যাখ্যা করো",
              },
              {
                title: "আইইএলটিএস (IELTS) প্রস্তুতি",
                desc: "রাইটিং টাস্ক ২, একাডেমিক ভোকাবুলারি ও গ্রামার",
                level: "Beginner" as StudentLevel,
                subject: "English" as SubjectOption,
                sample: "IELTS Academic Writing Task 2-তে ব্যান্ড ৮ পাওয়ার জন্য রচনার কাঠামো বাংলায় বুঝিয়ে দাও",
              },
              {
                title: "ভর্তি ও চাকরি পরীক্ষা",
                desc: "বিসিএস, ব্যাংক ও বিশ্ববিদ্যালয় ভর্তি সাধারণ জ্ঞান ও গণিত",
                level: "Job Preparation" as StudentLevel,
                subject: "General Knowledge" as SubjectOption,
                sample: "বাংলাদেশের সংবিধানের মূলনীতিগুলো সংক্ষেপে ব্যাখ্যা করো",
              },
              {
                title: "শিক্ষক ও কনটেন্ট নির্মাতা",
                desc: "কাঠামোবদ্ধ পাঠ পরিকল্পনা, উপমা ও কুইজ সেট তৈরি",
                level: "HSC" as StudentLevel,
                subject: "Other" as SubjectOption,
                sample: "জলবায়ু পরিবর্তন বিষয়ের ওপর শিক্ষার্থীদের জন্য ৩ ধাপের একটি পাঠ পরিকল্পনা তৈরি করো",
              },
            ].map((track) => (
              <button
                key={track.title}
                type="button"
                onClick={() => handleTrackClick(track.level, track.subject, track.sample)}
                className="flex flex-col items-start rounded-xl border border-white/15 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
              >
                <span className="text-sm font-bold text-white">{track.title}</span>
                <span className="mt-1 text-xs text-indigo-200">{track.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
