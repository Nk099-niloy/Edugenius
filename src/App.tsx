import { useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { QuizPage } from "./pages/QuizPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudyHubPage } from "./pages/StudyHubPage";
import { TutorPage } from "./pages/TutorPage";
import type {
  AppSettings,
  ChatMessage,
  PageId,
  QuizAttemptSummary,
  QuizPrefill,
  StudyNote,
  StudyPrefill,
} from "./types/edugenius";

const SETTINGS_STORAGE_KEY = "edugenius_settings_v1";
const NOTES_STORAGE_KEY = "edugenius_study_notes_v1";
const QUIZ_HISTORY_KEY = "edugenius_quiz_history_v1";
const TUTOR_CHAT_KEY = "edugenius_tutor_chat_v1";

const DEFAULT_SETTINGS: AppSettings = {
  model: "gemini-4-hydrogen",
  temperature: 0.4,
  defaultLevel: "HSC",
  defaultLanguage: "Bengali",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("home");
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage<AppSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS)
  );
  const [notesHistory, setNotesHistory] = useState<StudyNote[]>(() =>
    loadFromStorage<StudyNote[]>(NOTES_STORAGE_KEY, [])
  );
  const [quizHistory, setQuizHistory] = useState<QuizAttemptSummary[]>(() =>
    loadFromStorage<QuizAttemptSummary[]>(QUIZ_HISTORY_KEY, [])
  );
  const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>(() =>
    loadFromStorage<ChatMessage[]>(TUTOR_CHAT_KEY, [])
  );

  const [studyPrefill, setStudyPrefill] = useState<StudyPrefill | null>(null);
  const [quizPrefill, setQuizPrefill] = useState<QuizPrefill | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesHistory));
    } catch {
      // Ignore storage quota errors
    }
  }, [notesHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(quizHistory));
    } catch {
      // Ignore storage quota errors
    }
  }, [quizHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(TUTOR_CHAT_KEY, JSON.stringify(tutorMessages));
    } catch {
      // Ignore storage quota errors
    }
  }, [tutorMessages]);

  const handleStartStudy = (prefill: StudyPrefill) => {
    setStudyPrefill(prefill);
    setActivePage("study-hub");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateQuizFromTopic = (prefill: QuizPrefill) => {
    setQuizPrefill(prefill);
    setActivePage("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveNote = (note: StudyNote) => {
    setNotesHistory((prev) => [note, ...prev].slice(0, 20));
  };

  const handleDeleteNote = (id: string) => {
    setNotesHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveQuizAttempt = (attempt: QuizAttemptSummary) => {
    setQuizHistory((prev) => [attempt, ...prev].slice(0, 20));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E1B4B]">
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      <main className="flex-1">
        {activePage === "home" && (
          <HomePage onNavigate={setActivePage} onStartStudy={handleStartStudy} />
        )}

        {activePage === "study-hub" && (
          <StudyHubPage
            settings={settings}
            prefill={studyPrefill}
            onClearPrefill={() => setStudyPrefill(null)}
            notesHistory={notesHistory}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onCreateQuizFromTopic={handleCreateQuizFromTopic}
          />
        )}

        {activePage === "quiz" && (
          <QuizPage
            settings={settings}
            prefill={quizPrefill}
            onClearPrefill={() => setQuizPrefill(null)}
            quizHistory={quizHistory}
            onSaveAttempt={handleSaveQuizAttempt}
          />
        )}

        {activePage === "tutor" && (
          <TutorPage
            settings={settings}
            messages={tutorMessages}
            onUpdateMessages={setTutorMessages}
          />
        )}

        {activePage === "settings" && (
          <SettingsPage
            settings={settings}
            onSaveSettings={setSettings}
            onClearStudyHistory={() => setNotesHistory([])}
            onClearQuizHistory={() => setQuizHistory([])}
            studyCount={notesHistory.length}
            quizCount={quizHistory.length}
          />
        )}
      </main>

      <Footer onNavigate={setActivePage} />
    </div>
  );
}
