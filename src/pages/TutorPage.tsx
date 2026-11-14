import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Loader2,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { requestTutorReply } from "../services/aiClient";
import type {
  AppSettings,
  ChatMessage,
  LanguagePreference,
} from "../types/edugenius";
import { LANGUAGE_LABELS } from "../utils/bnLabels";

interface TutorPageProps {
  settings: AppSettings;
  messages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
}

const QUICK_PROMPTS = [
  "এই অনুচ্ছেদটি সহজভাবে বুঝিয়ে দাও।",
  "গণিতের গুরুত্বপূর্ণ সূত্রগুলো মনে রাখার কৌশল বলো।",
  "IELTS রাইটিং ভালো করার কার্যকর টিপস দাও।",
  "বিজ্ঞানের একটি কঠিন বিষয় সহজ উদাহরণসহ ব্যাখ্যা করো।",
  "আমার পরীক্ষার জন্য একটি বাস্তবসম্মত স্টাডি প্ল্যান তৈরি করে দাও।",
];

const LANGUAGES: LanguagePreference[] = ["Bengali", "Auto", "English"];

export function TutorPage({
  settings,
  messages,
  onUpdateMessages,
}: TutorPageProps) {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<LanguagePreference>(settings.defaultLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMsg];
    onUpdateMessages(updatedHistory);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await requestTutorReply({
        messages: updatedHistory.map((m) => ({ role: m.role, text: m.text })),
        language,
        model: settings.model,
        temperature: settings.temperature,
      });

      const tutorMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        text: res.reply,
        timestamp: new Date().toISOString(),
      };

      onUpdateMessages([...updatedHistory, tutorMsg]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "এই মুহূর্তে এআই টিউটরের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (prompt === "এই অনুচ্ছেদটি সহজভাবে বুঝিয়ে দাও।") {
      setInput("অনুগ্রহ করে এই অনুচ্ছেদটি সহজভাবে বুঝিয়ে দাও:\n\n");
      inputRef.current?.focus();
      return;
    }
    void sendMessage(prompt);
  };

  const handleClearChat = () => {
    onUpdateMessages([]);
    setError("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
            ২৪/৭ এআই লাইভ টিউটর
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            কথোপকথনের ধারাবাহিকতা বজায় রেখে বাংলা ও ইংরেজিতে ধাপে ধাপে একাডেমিক দিকনির্দেশনা নিন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            aria-label="টিউটরের উত্তরের ভাষা"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguagePreference)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#1E1B4B] focus:border-[#4338CA] focus:outline-none"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0 && !error}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>চ্যাট মুছুন</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Quick Prompt Suggestions */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 lg:self-start">
          <h2 className="text-sm font-bold text-[#1E1B4B]">দ্রুত প্রশ্ন সাজেশন</h2>
          <p className="mt-1 text-xs text-slate-500">
            শেখা শুরু করতে বা চালিয়ে যেতে নিচের যেকোনো একটি প্রশ্নে ক্লিক করুন।
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => handleQuickPrompt(prompt)}
                className="min-h-[42px] rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-left text-xs font-medium text-[#1E1B4B] transition-colors hover:border-[#4338CA]/50 hover:bg-[#4338CA]/5 hover:text-[#4338CA] disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1.5">
            <p className="font-semibold text-[#1E1B4B]">সক্রিয় টিউটর সুবিধা</p>
            <p>চলমান কথোপকথনের আগের বার্তাগুলো মনে রাখে।</p>
            <p>গণিতের সূত্র, বিজ্ঞান, প্রোগ্রামিং ও IELTS প্রস্তুতিতে বাংলা ও ইংরেজি সহায়তা দেয়।</p>
          </div>
        </aside>

        {/* Main Chat Interface */}
        <section
          aria-label="লাইভ টিউটর কথোপকথন"
          className="flex h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8"
        >
          {/* Chat Messages History */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4338CA] to-[#7C3AED] text-white shadow-sm">
                  <Bot className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-[#1E1B4B]">
                  স্বাগতম! আমি আপনার EduGenius AI টিউটর
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  গণিতের সূত্র, বিজ্ঞানের কঠিন বিষয়, প্রোগ্রামিং বা ইংরেজি গ্রামার—যেকোনো প্রশ্ন বাংলা বা ইংরেজিতে জিজ্ঞাসা করুন। আমি ধাপে ধাপে সাহায্য করব।
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4338CA] to-[#7C3AED] text-white">
                        <Bot className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[78%] ${
                        isUser
                          ? "bg-[#4338CA] text-white"
                          : "border border-slate-200 bg-white text-[#1E1B4B]"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1E1B4B] text-white">
                        <User className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4338CA] to-[#7C3AED] text-white">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-[#4338CA]" aria-hidden="true" />
                  <span>আপনার প্রশ্নের উত্তর তৈরি হচ্ছে...</span>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Composer */}
          <form
            onSubmit={handleFormSubmit}
            className="border-t border-slate-200 bg-white p-3 sm:p-4"
          >
            <div className="flex items-end gap-3">
              <label htmlFor="tutor-chat-input" className="sr-only">
                আপনার এআই টিউটরকে প্রশ্ন করুন
              </label>
              <textarea
                id="tutor-chat-input"
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="বাংলা বা ইংরেজিতে আপনার প্রশ্ন লিখুন... (পাঠাতে Enter চাপুন)"
                className="max-h-36 min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:border-[#4338CA] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="বার্তা পাঠান"
                className="inline-flex h-12 min-w-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">পাঠান</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
