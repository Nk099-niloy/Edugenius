import { useState } from "react";
import type { PageId } from "../types/edugenius";

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

const LOGO_SRC = "/assets/aistudio/Screenshot_2026-11-14_103447_f48fdfe2.png";

export function Footer({ onNavigate }: FooterProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  const handleNav = (page: PageId) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div>
              {!logoFailed ? (
                <img
                  src={LOGO_SRC}
                  alt="EduGenius AI"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="h-11 w-auto max-w-[210px] object-contain"
                />
              ) : (
                <span className="text-base font-bold text-[#1E1B4B]">EduGenius AI</span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              আরও স্মার্ট শিখুন। ভালোভাবে ভাবুন। আরও বেশি অর্জন করুন।
            </p>
            <p className="text-xs text-slate-500">
              অ্যাপেক্স এডুটেক ল্যাবস · বাংলা ও ইংরেজি এআই শিক্ষা প্ল্যাটফর্ম
            </p>
          </div>

          <nav aria-label="ফুটার নেভিগেশন" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            <button type="button" onClick={() => handleNav("home")} className="hover:text-[#4338CA] transition-colors">
              হোম
            </button>
            <button type="button" onClick={() => handleNav("study-hub")} className="hover:text-[#4338CA] transition-colors">
              এআই স্টাডি হাব
            </button>
            <button type="button" onClick={() => handleNav("quiz")} className="hover:text-[#4338CA] transition-colors">
              স্মার্ট কুইজ
            </button>
            <button type="button" onClick={() => handleNav("tutor")} className="hover:text-[#4338CA] transition-colors">
              লাইভ টিউটর
            </button>
            <button type="button" onClick={() => handleNav("settings")} className="hover:text-[#4338CA] transition-colors">
              সেটিংস
            </button>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} অ্যাপেক্স এডুটেক ল্যাবস। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>নিরাপদ সার্ভার-সাইড Google Gemini AI দ্বারা পরিচালিত।</p>
        </div>
      </div>
    </footer>
  );
}
