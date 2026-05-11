import { useEffect, useRef } from "react";
import { gsap } from "gsap";

import { ArrowRightIcon } from "./icons";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 2.5, defaults: { ease: "expo.out" } });

      tl.fromTo(
          ".hero-line span",
          { yPercent: 110, opacity: 0, rotate: 4 },
          { yPercent: 0, opacity: 1, rotate: 0, duration: 0.8, stagger: 0.06 }
        )
        .fromTo(".hero-sub", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
        .fromTo(".hero-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, "-=0.35")
        .fromTo(".hero-compliance", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.2")
        .fromTo(
          ".stat-card",
          { y: 60, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: "expo.out" },
          "-=0.3"
        )
        .fromTo(
          ".hero-orb",
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1, ease: "power3.out" },
          "<"
        );

      // Count up (once per element, starts from 1)
      document.querySelectorAll<HTMLElement>(".count-up").forEach((el) => {
        const target = Number(el.dataset.target ?? 0);
        const obj = { v: 1 };
        gsap.to(obj, {
          v: target,
          duration: 1.2,
          ease: "power3.out",
          delay: 3.2,
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toString();
          },
        });
      });

      // Parallax dots
      const onMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 18;
        const y = (e.clientY / window.innerHeight - 0.5) * 18;
        gsap.to(".hero-grid", { x, y, duration: 0.8, ease: "power3.out" });
        gsap.to(".hero-orb", { x: x * -0.6, y: y * -0.6, duration: 1.1, ease: "power3.out" });
      };
      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    }, root);

    return () => ctx.revert();
  }, []);

  const line1 = ["Stop", "Bahan", "Baku", "Salah"];
  const line2 = ["Sebelum", "Masuk", "Gudang."];

  return (
    <section
      id="top"
      ref={root}
      className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <div className="hero-grid absolute -inset-24 grid-bg opacity-70" aria-hidden
           style={{ maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
                    WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)" }} />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[600px] pointer-events-none"
           style={{ background: "var(--gradient-glow)" }} />
      <div aria-hidden className="hero-orb absolute -top-40 left-1/2 -translate-x-1/2 h-[640px] w-[640px] rounded-full opacity-40"
           style={{ background: "radial-gradient(circle, hsl(172 66% 50% / 0.45), transparent 60%)" }} />

      <div className="container relative">
        <h1 className="mx-auto mt-4 max-w-5xl text-center font-display font-extrabold"
            style={{ fontSize: "clamp(2rem, 7vw, 5rem)", lineHeight: 1.02, letterSpacing: "-0.025em" }}>
          <span className="hero-line block overflow-hidden">
            {line1.map((w, i) => (
              <span key={i} className="inline-block mr-[0.25em]">{w}</span>
            ))}
          </span>
          <span className="hero-line block overflow-hidden text-primary">
            {line2.map((w, i) => (
              <span key={i} className="inline-block mr-[0.25em]">
                {i === line2.length - 1 ? (
                  <span className="font-serif-display italic font-normal">{w}</span>
                ) : w}
              </span>
            ))}
          </span>
        </h1>

        <p className="hero-sub mx-auto mt-7 max-w-2xl text-center text-base sm:text-lg text-muted-foreground">
          Verifikasi otomatis Surat Jalan, Certificate of Analysis, dan dokumen halal.
          Ditenagai Microsoft Azure AI, dari <b>20 menit</b> menjadi <b>kurang dari 30 detik</b>.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/login"
             className="hero-cta group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-all duration-300 hover:scale-[1.04] hover:brightness-110">
            Masuk ke Sistem
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="#cara-kerja"
             className="hero-cta inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-white px-6 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary hover:text-primary">
            Lihat Cara Kerja
          </a>
        </div>

        <div className="hero-compliance mx-auto mt-7 flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 glass shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.18)]">
          <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-[0.22em] text-primary uppercase whitespace-nowrap">
            Regulasi
          </span>
          <span aria-hidden className="h-3 w-px bg-foreground/15" />
          <span className="text-[11px] sm:text-xs font-semibold text-foreground/80 tracking-tight whitespace-nowrap">
            Standar CPOB <span className="text-foreground/30 mx-1">·</span> PerBPOM No. 7/2025
          </span>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          <StatCard tone="dark" valuePrefix="" countTo={20} suffix="-25 menit" label="Waktu verifikasi manual" sub="Per pengiriman" />
          <StatCard tone="white" valuePrefix="< " countTo={30} suffix=" detik" label="Verifikasi dengan VeriMat" badge="↓95% lebih cepat" featured />
          <StatCard tone="green" valuePrefix="" countTo={100} suffix="%" label="Audit trail tersimpan" sub="Otomatis & terstruktur" />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  tone, countTo, valuePrefix = "", suffix = "", label, sub, badge, featured,
}: {
  tone: "dark" | "white" | "green";
  countTo: number;
  valuePrefix?: string;
  suffix?: string;
  label: string;
  sub?: string;
  badge?: string;
  featured?: boolean;
}) {
  const styles = {
    dark: "bg-primary text-primary-foreground border-transparent",
    white: "bg-card text-foreground border-foreground/10 shadow-card",
    green: "bg-[hsl(95_50%_85%)] text-foreground border-transparent",
  }[tone];

  return (
    <div className={`stat-card group relative rounded-3xl border p-6 sm:p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift ${styles} ${
      featured ? "md:-translate-y-3 md:hover:-translate-y-5" : ""
    }`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          {valuePrefix}<span className="count-up" data-target={countTo}>1</span>{suffix}
        </div>
        {badge && (
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-[hsl(142_70%_32%)] whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <div className={`mt-3 text-sm font-medium ${tone === "dark" ? "text-primary-foreground/80" : "text-foreground/70"}`}>
        {label}
      </div>
      {sub && (
        <div className={`mt-1 text-xs ${tone === "dark" ? "text-primary-foreground/70" : "text-foreground/60"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
