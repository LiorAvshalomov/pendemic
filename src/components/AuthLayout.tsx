import type { ReactNode } from "react";
import "@/styles/auth.css";
import FloatingStationery from "@/components/FloatingStationery";
import AnimatedIntro from "@/components/AnimatedIntro";

type Mode = "login" | "signup" | "forgot" | "reset";
type Feature = { emoji: string; text: string };

const COPY: Record<Mode, { headline: string; tagline: string; features?: Feature[] }> = {
  login: {
    headline: "נעים לראות אותך שוב",
    tagline: "שנמשיך מהמקום שהפסקת בו?",
    features: [
      { emoji: "📓", text: "המחברת שלך ממתינה" },
      { emoji: "🖋️", text: "כל מה שכתבת נשמר" },
      { emoji: "✨", text: "פותחים דף וממשיכים" },
    ],
  },
  signup: {
    headline: "ברוכים הבאים לטיוטה",
    tagline: "המקום לכל הגרסאות שלך, הראשונות והאחרונות.",
    features: [
      { emoji: "✍️", text: "כתיבה חופשית" },
      { emoji: "📖", text: "פרסם סיפורים, פריקות ורגעים" },
      { emoji: "🕊️", text: "הדף שלך, הקול שלך" },
    ],
  },
  forgot: {
    headline: "שניה אחת",
    tagline: "נשלח לך קישור לאיפוס סיסמה ישירות למייל.",
  },
  reset: {
    headline: "פרק חדש",
    tagline: "בחר/י סיסמה חדשה כדי להמשיך לכתוב.",
  },
};

export default function AuthLayout({
  children,
  mode,
}: {
  children: ReactNode;
  mode: Mode;
}) {
  // IMPORTANT:
  // Global SiteHeader sits above auth pages. We size the shell to
  // (viewport - header) to prevent scroll of ~header-height.
  // Adjust 72px if the header height changes.
  const headerH = 72;
  const copy = COPY[mode];

  return (
    <div
      className="pd-auth-shell pd-force-light relative w-full overflow-hidden"
      dir="rtl"
      style={{
        height: `calc(100dvh - ${headerH}px)`,
        minHeight: `calc(100dvh - ${headerH}px)`,
      }}
    >
      {/* Edge vignette overlay */}
      <div className="pd-auth-noise" aria-hidden="true" />

      {/* Atmospheric background elements */}
      <FloatingStationery />

      <main className="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-[1000px]">

          {/* Session-gated cinematic intro — plays once per session */}
          <AnimatedIntro />

          {/* Desktop: copy on LEFT, form on RIGHT (RTL grid via dir="ltr") */}
          <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.06fr]" dir="ltr">

            {/* ── Copy panel ── (hidden on mobile, visible lg+) */}
            <section
              dir="rtl"
              className="pd-intro-stagger hidden lg:flex lg:flex-col lg:justify-center px-8 py-10 gap-5"
            >
              {/* Brand pill — self-start prevents flex column from stretching it full-width */}
              <div className="self-start inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/50 px-3 py-[0.3rem] text-[0.72rem] font-semibold tracking-wide text-black/52 backdrop-blur-sm shadow-sm select-none">
                <span aria-hidden="true">✍️</span>
                <span>Tyuta - המקום לכל הגרסאות שלך</span>
              </div>

              {/* Headline */}
              <h1 className="pd-auth-title text-[2.55rem] font-black leading-[1.1] tracking-tight">
                {copy.headline}
              </h1>

              {/* Tagline */}
              <p className="text-[0.975rem] leading-[1.8] text-black/50 font-normal">
                {copy.tagline}
              </p>

              {/* Feature list — emoji bullets, warm and human */}
              {copy.features && (
                <ul className="space-y-2.5 text-sm text-black/52">
                  {copy.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5">
                      <span className="text-base leading-none" aria-hidden="true">{f.emoji}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Bottom ornament rule */}
              <div className="mt-1 h-px w-10 bg-black/14" />
            </section>

            {/* ── Form card ── */}
            <section dir="rtl" className="pd-auth-card pd-intro rounded-2xl p-6 sm:p-8">
              {children}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
