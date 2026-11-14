import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { PageId } from "../types/edugenius";

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const LOGO_SRC = "/assets/aistudio/Screenshot_2026-11-14_103447_f48fdfe2.png";

const NAV_ITEMS: Array<{ id: PageId; label: string }> = [
  { id: "home", label: "হোম" },
  { id: "study-hub", label: "এআই স্টাডি হাব" },
  { id: "quiz", label: "স্মার্ট কুইজ" },
  { id: "tutor", label: "লাইভ টিউটর" },
  { id: "settings", label: "সেটিংস" },
];

export function Navbar({ activePage, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleSelectPage = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand mark */}
        <button
          type="button"
          onClick={() => handleSelectPage("home")}
          aria-label="EduGenius AI হোম পেজে যান"
          className="flex items-center whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA] rounded-lg"
        >
          {!logoFailed ? (
            <img
              src={LOGO_SRC}
              alt="EduGenius AI"
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
              className="h-11 w-auto max-w-[210px] object-contain"
            />
          ) : (
            <span className="text-lg font-bold tracking-tight text-[#1E1B4B]">
              EduGenius AI
            </span>
          )}
        </button>

        {/* Zone 2: Primary navigation links (desktop) */}
        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPage(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4338CA] ${
                  isActive
                    ? "text-[#4338CA] font-semibold"
                    : "text-slate-600 hover:text-[#1E1B4B]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#4338CA] to-[#7C3AED]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectPage("study-hub")}
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-95 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
          >
            ফ্রি শুরু করুন
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1E1B4B] transition-colors hover:bg-slate-50 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="মোবাইল নেভিগেশন"
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPage(item.id)}
                  className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#4338CA]/10 text-[#4338CA] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="text-xs font-semibold text-[#7C3AED]">সক্রিয়</span>
                  )}
                </button>
              );
            })}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSelectPage("study-hub")}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                ফ্রি শুরু করুন
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
