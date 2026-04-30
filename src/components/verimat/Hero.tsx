import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./icons";

const headlineWords = [
  { text: "Stop", color: "fg" },
  { text: "Bahan", color: "fg" },
  { text: "Baku", color: "fg" },
  { text: "Salah", color: "fg" },
  { text: "Sebelum", color: "teal" },
  { text: "Masuk", color: "teal" },
  { text: "Gudang.", color: "teal" },
] as const;

function useCountUp(target: number, duration = 1400, start: boolean, loop = false, pause = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const run = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        if (cancelled) return;
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.max(1, Math.round(target * eased)));
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else if (loop) {
          timeoutId = setTimeout(() => {
            if (cancelled) return;
            setVal(0);
            run();
          }, pause);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [target, duration, start, loop, pause]);
  return val;
}

export default function Hero() {
  const dotRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [statsIn, setStatsIn] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const el = dotRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            setStatsIn(true);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const c1 = useCountUp(20, 1800, statsIn, false, 2000);
  const c2 = useCountUp(30, 1800, statsIn, false, 2000);
  const c3 = useCountUp(100, 1800, statsIn, false, 2000);

  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Animated dot grid */}
      <div
        ref={dotRef}
        aria-hidden
        className="dot-grid absolute -inset-12 opacity-70 transition-transform duration-300 ease-out"
        style={{
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
        }}
      />
      {/* Glow */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[500px] pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <div className="container relative">
        {/* Badge */}
        <div className="flex justify-center animate-fade-up -mt-2" style={{ animationDelay: "100ms" }}>
          <div className="glass flex items-center gap-2 rounded-full border border-foreground/10 bg-white/60 px-4 py-1.5 text-xs font-medium text-foreground/60 whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-pulse-dot rounded-full bg-success" />
              <span className="relative h-2 w-2 rounded-full bg-success" />
            </span>
            Sesuai Standar CPOB · PerBPOM No. 7/2025
          </div>
        </div>

        {/* Headline */}
        <h1 className="mx-auto mt-7 max-w-5xl w-full text-center font-display font-extrabold"
            style={{ fontSize: isMobile ? "clamp(1.875rem, 7.5vw, 2.75rem)" : "clamp(2.75rem, 6.5vw, 4.5rem)", letterSpacing: "-0.01em", lineHeight: 1.05 }}>
          <span className="block">
            {headlineWords.slice(0, 4).map((w, i) => (
              <span
                key={i}
                className="inline-block opacity-0"
                style={{ animation: `word-rise 0.8s var(--ease-out) ${300 + i * 90}ms forwards`, marginRight: "0.25em" }}
              >
                {w.text}
              </span>
            ))}
          </span>
          <span className="block text-primary">
            {headlineWords.slice(4).map((w, i) => (
              <span
                key={i}
                className="inline-block opacity-0"
                style={{ animation: `word-rise 0.8s var(--ease-out) ${700 + i * 90}ms forwards`, marginRight: "0.25em" }}
              >
                {w.text}
              </span>
            ))}
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-center text-base sm:text-lg text-muted-foreground animate-fade-up"
           style={{ animationDelay: "1100ms" }}>
          Verifikasi otomatis Surat Jalan, Certificate of Analysis, dan dokumen halal —
          ditenagai Microsoft Azure AI. Dari 20 menit menjadi kurang dari 30 detik.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
             style={{ animationDelay: "1300ms" }}>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
          >
            Masuk ke Sistem
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#cara-kerja"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-white px-6 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary hover:text-primary"
          >
            Lihat Cara Kerja
          </a>
        </div>

        {/* Stats cards */}
        <div ref={statsRef} className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          <StatCard
            tone="dark"
            value={`${c1}-${c1 + 5} menit`}
            label="Waktu verifikasi manual"
            sub="Per pengiriman"
            delay={1500}
          />
          <StatCard
            tone="white"
            value={`< ${c2} detik`}
            label="Verifikasi dengan VeriMat"
            badge="↓95% lebih cepat"
            delay={1650}
            featured
          />
          <StatCard
            tone="green"
            value={`${c3}%`}
            label="Audit trail tersimpan"
            sub="Otomatis & terstruktur"
            delay={1800}
          />
        </div>
      </div>
    </section>
  );
}

type StatProps = {
  tone: "dark" | "white" | "green";
  value: string;
  label: string;
  sub?: string;
  badge?: string;
  delay?: number;
  featured?: boolean;
};

function StatCard({ tone, value, label, sub, badge, delay = 0, featured }: StatProps) {
  const styles = {
    dark: "bg-primary text-primary-foreground border-transparent",
    white: "bg-card text-foreground border-foreground/8 shadow-card",
    green: "bg-[hsl(95_50%_85%)] text-foreground border-transparent",
  }[tone];

  return (
    <div
      className={`group relative rounded-3xl border p-6 sm:p-7 opacity-0 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift ${styles} ${
        featured ? "md:-translate-y-3 md:hover:-translate-y-5" : ""
      }`}
      style={{ animation: `fade-up 0.8s var(--ease-out) ${delay}ms forwards` }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          {value}
        </div>
        {badge && (
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <div className={`mt-3 text-sm font-medium ${tone === "dark" ? "text-primary-foreground/80" : "text-foreground/70"}`}>
        {label}
      </div>
      {sub && (
        <div className={`mt-1 text-xs ${tone === "dark" ? "text-primary-foreground/55" : "text-foreground/50"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
