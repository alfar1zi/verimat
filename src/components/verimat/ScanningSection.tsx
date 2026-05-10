import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckIcon } from "./icons";

gsap.registerPlugin(ScrollTrigger);

export default function ScanningSection() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".scan-reveal",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "expo.out",
          stagger: 0.15,
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".scan-stage",
        { y: 80, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1, duration: 1.4, ease: "expo.out",
          scrollTrigger: { trigger: ".scan-stage", start: "top 80%" },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-primary text-primary-foreground py-24 sm:py-32">
      <div aria-hidden className="absolute inset-0 opacity-50"
           style={{ background: "radial-gradient(circle at 50% 0%, hsl(172 66% 50% / 0.25), transparent 60%)" }} />

      <div className="container relative">
        <div className="text-center mx-auto max-w-2xl">
          <span className="scan-reveal inline-block rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold tracking-wider text-teal uppercase">
            DEMO LIVE
          </span>
          <h2 className="scan-reveal mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            Verifikasi dalam <span className="font-serif-display italic font-normal text-teal">&lt; 30 Detik</span>
          </h2>
          <p className="scan-reveal mt-4 text-primary-foreground/70 text-lg">Upload. Scan. Validasi. Selesai.</p>
        </div>

        <div className="mt-16 mx-auto max-w-4xl">
          <div className="scan-stage relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent overflow-hidden px-6 sm:px-20 py-16 sm:py-24">
            <div aria-hidden className="absolute inset-0 opacity-60"
                 style={{ backgroundImage: "linear-gradient(hsl(0 0% 100% / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.05) 1px, transparent 1px)", backgroundSize: "32px 32px", maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)" }} />
            <div aria-hidden className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />
            <div aria-hidden className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-teal/10 blur-3xl" />
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/40 to-transparent" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
            {/* Corner brackets */}
            {[
              "top-4 left-4 border-t border-l",
              "top-4 right-4 border-t border-r",
              "bottom-4 left-4 border-b border-l",
              "bottom-4 right-4 border-b border-r",
            ].map((c, i) => (
              <div key={i} aria-hidden className={`absolute h-5 w-5 rounded-sm border-teal/50 ${c}`} />
            ))}
            <div className="relative flex justify-center">
              <div className="scan-doc relative w-full max-w-[26rem] rounded-xl bg-white text-foreground shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55),0_0_0_1px_hsl(0_0%_100%_/_0.06)] overflow-hidden">
                {/* Header */}
                <div className="relative border-b border-foreground/10 px-5 py-3.5 bg-gradient-to-br from-primary to-[hsl(168_65%_25%)] text-primary-foreground">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-white/15 backdrop-blur-sm border border-white/20">
                        <div className="h-3 w-3 rounded-sm bg-teal" />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold tracking-[0.18em] text-primary-foreground/70">CERTIFICATE OF ANALYSIS</div>
                        <div className="text-sm font-bold leading-tight">PT Kimia Farma Tbk.</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-semibold tracking-wider text-primary-foreground/60">DOC REF</div>
                      <div className="font-mono text-xs font-bold text-teal">COA/2024/091</div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-3 text-sm">
                  <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3.5 space-y-2">
                    <div className="text-[9px] font-bold tracking-[0.16em] text-foreground/45 mb-1">PRODUCT INFO</div>
                    <Field label="Material" value="Paracetamol 99.8%" delay="1.2s" />
                    <Field label="Batch No" value="BTX-2024-091" delay="1.7s" />
                  </div>

                  <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3.5 space-y-2">
                    <div className="text-[9px] font-bold tracking-[0.16em] text-foreground/45 mb-1">SUPPLIER & VENDOR</div>
                    <Field label="Supplier" value="PT Kimia Farma" delay="2.2s" />
                    <Field label="Vendor" value="Sinopharm Asia" delay="2.6s" />
                  </div>

                  <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3.5 space-y-2">
                    <div className="text-[9px] font-bold tracking-[0.16em] text-foreground/45 mb-1">VALIDITY</div>
                    <Field label="Exp Date" value="2026-03-15" delay="3.0s" />
                    <Field label="Issued" value="2024-09-12" delay="3.4s" />
                  </div>
                </div>

                <div className="scan-line absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-teal to-transparent shadow-[0_0_24px_4px_hsl(172_66%_50%_/_0.7)]" />
                <div className="scan-glow absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-teal/25 to-transparent" />
              </div>

              <div className="scan-validation absolute -right-4 sm:right-0 top-6 w-52 sm:w-60 rounded-xl border border-teal/30 bg-surface-deep p-4 opacity-0 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold tracking-wider text-teal">VALIDASI PO</div>
                  <div className="flex items-center gap-1">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-teal" style={{ animation: "loading-dot 1.2s ease-in-out infinite", animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
                <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-teal to-transparent" style={{ animation: "progress-sweep 1.4s ease-in-out infinite" }} />
                </div>
                <CheckRow label="Batch valid" delay="0.0s" />
                <CheckRow label="Exp date OK" delay="0.3s" />
                <CheckRow label="Supplier match" delay="0.6s" />
                <CheckRow label="Halal verified" delay="0.9s" />
              </div>
            </div>

            <div className="scan-pass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0">
              <div className="flex items-center gap-3 rounded-2xl bg-success px-7 py-4 shadow-[0_20px_60px_-10px_hsl(142_70%_42%_/_0.6)]">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white">
                  <CheckIcon className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-white/80">STATUS</div>
                  <div className="font-display text-2xl font-extrabold text-white">PASS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scan-stage { --cycle: 7s; }
        .scan-line, .scan-glow { animation: scan-sweep var(--cycle) linear infinite; }

        @keyframes field-reveal {
          0%, 15% { opacity: 0; transform: translateX(-6px); }
          20%, 78% { opacity: 1; transform: translateX(0); }
          85%, 100% { opacity: 1; }
        }
        @keyframes field-typewriter {
          0%, 18% { clip-path: inset(0 100% 0 0); }
          30%, 100% { clip-path: inset(0 0% 0 0); }
        }
        .field-row { animation: field-reveal var(--cycle) ease-out infinite both; }
        .field-value-wrap { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom; }
        .field-value { animation: field-typewriter var(--cycle) steps(20, end) infinite both; display: inline-block; clip-path: inset(0 100% 0 0); }

        @keyframes panel-reveal {
          0%, 55% { opacity: 0; transform: translateX(20px); }
          62%, 88% { opacity: 1; transform: translateX(0); }
          95%, 100% { opacity: 0; transform: translateX(20px); }
        }
        .scan-validation { animation: panel-reveal var(--cycle) ease-in-out infinite; }

        @keyframes loading-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes progress-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spinner-to-check {
          0%, 58%   { opacity: 0; }
          62%, 74%  { opacity: 1; }
          78%, 100% { opacity: 0; }
        }
        @keyframes check-fade-in {
          0%, 74%   { opacity: 0; transform: scale(0.6); }
          78%, 90%  { opacity: 1; transform: scale(1); }
          95%, 100% { opacity: 0; transform: scale(0.9); }
        }
        .row-spinner { animation: spinner-to-check var(--cycle) ease-out infinite both; }
        .row-spinner-icon { animation: spin 0.8s linear infinite; }
        .row-check { animation: check-fade-in var(--cycle) var(--ease-out) infinite both; }

        @keyframes pass-reveal {
          0%, 82% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          88%, 96% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        .scan-pass { animation: pass-reveal var(--cycle) var(--ease-out) infinite; }
      `}</style>
    </section>
  );
}

function Field({ label, value, delay }: { label: string; value: string; delay: string }) {
  return (
    <div className="field-row flex items-baseline justify-between gap-3" style={{ animationDelay: delay }}>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground/40">{label}</span>
      <span className="font-mono text-xs sm:text-sm font-semibold text-primary bg-teal/10 px-2 py-0.5 rounded">
        <span className="field-value-wrap">
          <span className="field-value" style={{ animationDelay: delay }}>{value}</span>
        </span>
      </span>
    </div>
  );
}

function CheckRow({ label, delay }: { label: string; delay: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="relative h-4 w-4 shrink-0">
        <div className="row-spinner absolute inset-0 grid place-items-center" style={{ animationDelay: delay }}>
          <div className="row-spinner-icon h-3.5 w-3.5 rounded-full border-2 border-white/15 border-t-teal" />
        </div>
        <div className="row-check absolute inset-0 grid place-items-center" style={{ animationDelay: delay }}>
          <CheckIcon className="h-3.5 w-3.5 text-teal" strokeWidth={3} />
        </div>
      </div>
      <span className="text-xs text-white/85">{label}</span>
    </div>
  );
}
