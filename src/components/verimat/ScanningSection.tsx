import { CheckIcon } from "./icons";

/**
 * Continuous-loop scanning animation. Pure CSS via inline <style>.
 * The cycle is 7s long; phases use animation-delay keyframes within one timeline.
 */
export default function ScanningSection() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 sm:py-32">
      {/* Subtle radial glow */}
      <div aria-hidden className="absolute inset-0 opacity-50"
           style={{ background: "radial-gradient(circle at 50% 0%, hsl(172 66% 50% / 0.25), transparent 60%)" }} />

      <div className="container relative">
        <div className="reveal text-center mx-auto max-w-2xl">
          <span className="inline-block rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold tracking-wider text-teal uppercase">
            DEMO LIVE
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            Verifikasi dalam <span className="text-teal">&lt; 30 Detik</span>
          </h2>
          <p className="mt-4 text-primary-foreground/70 text-lg">
            Upload. Scan. Validasi. Selesai.
          </p>
        </div>

        <div className="reveal mt-16 mx-auto max-w-3xl">
          <div className="scan-stage relative aspect-[4/3] sm:aspect-[16/10] rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden p-6 sm:p-10">
            {/* Document */}
            <div className="scan-doc absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] sm:w-[70%] aspect-[4/5] rounded-xl bg-white text-foreground shadow-2xl overflow-hidden">
              {/* Doc header */}
              <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-3">
                <div className="text-[10px] font-bold tracking-wider text-foreground/60">CERTIFICATE OF ANALYSIS</div>
                <div className="text-[10px] text-foreground/40">PT KIMIA FARMA</div>
              </div>

              {/* Doc body — fields */}
              <div className="px-5 py-5 space-y-3 text-xs sm:text-sm">
                <Field label="Batch No" value="BTX-2024-091" delay="1.4s" />
                <Field label="Exp Date" value="2026-03-15" delay="2.0s" />
                <Field label="Supplier" value="PT Kimia Farma" delay="2.6s" />
                <Field label="Material" value="Paracetamol 99.8%" delay="3.2s" />

                {/* placeholder lines */}
                <div className="space-y-2 pt-2">
                  <div className="h-1.5 rounded bg-foreground/8" />
                  <div className="h-1.5 w-4/5 rounded bg-foreground/8" />
                  <div className="h-1.5 w-3/5 rounded bg-foreground/8" />
                </div>
              </div>

              {/* Scan line */}
              <div className="scan-line absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-teal to-transparent shadow-[0_0_24px_4px_hsl(172_66%_50%_/_0.7)]" />
              <div className="scan-glow absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-teal/20 to-transparent" />
            </div>

            {/* Validation checks panel — appears after scan */}
            <div className="scan-validation absolute right-4 sm:right-6 top-4 sm:top-6 w-48 sm:w-60 rounded-xl border border-teal/30 bg-surface-deep p-3 sm:p-4 opacity-0 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold tracking-wider text-teal">VALIDASI PO</div>
                <div className="processing-dot flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" style={{ animation: "loading-dot 1.2s ease-in-out infinite", animationDelay: "0s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" style={{ animation: "loading-dot 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" style={{ animation: "loading-dot 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
                </div>
              </div>
              {/* Progress bar */}
              <div className="processing-bar mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-teal to-transparent" style={{ animation: "progress-sweep 1.4s ease-in-out infinite" }} />
              </div>
              <CheckRow label="Batch valid" delay="0.0s" />
              <CheckRow label="Exp date OK" delay="0.3s" />
              <CheckRow label="Supplier match" delay="0.6s" />
              <CheckRow label="Halal verified" delay="0.9s" />
            </div>


            {/* Final PASS badge */}
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

        .scan-line {
          animation: scan-sweep var(--cycle) linear infinite;
        }
        .scan-glow {
          animation: scan-sweep var(--cycle) linear infinite;
        }

        @keyframes field-reveal {
          0%, 15% { opacity: 0; transform: translateX(-6px); }
          20%, 70% { opacity: 1; transform: translateX(0); }
          78%, 100% { opacity: 1; }
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

        @keyframes check-pop {
          0%, 60% { opacity: 0; transform: scale(0.6); }
          68%, 90% { opacity: 1; transform: scale(1); }
          95%, 100% { opacity: 0; }
        }
        .check-row { animation: check-pop var(--cycle) ease-out infinite both; }

        /* Loading dots inside processing panel */
        @keyframes loading-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }

        /* Sweeping progress bar */
        @keyframes progress-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Each row: spinner first, then check.
           Timeline (of 7s cycle): 0-55% panel hidden, 60% panel in,
           62-75% spinner spinning, 75-88% check shown, 95% panel out. */
        @keyframes spinner-to-check {
          0%, 58%   { opacity: 0; }
          62%, 74%  { opacity: 1; }   /* spinner visible & spinning */
          78%, 100% { opacity: 0; }   /* spinner fades, check takes over */
        }
        @keyframes check-fade-in {
          0%, 74%   { opacity: 0; transform: scale(0.6); }
          78%, 90%  { opacity: 1; transform: scale(1); }
          95%, 100% { opacity: 0; transform: scale(0.9); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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
        <div
          className="row-spinner absolute inset-0 grid place-items-center"
          style={{ animationDelay: delay }}
        >
          <div className="row-spinner-icon h-3.5 w-3.5 rounded-full border-2 border-white/15 border-t-teal" />
        </div>
        <div
          className="row-check absolute inset-0 grid place-items-center rounded-full bg-success"
          style={{ animationDelay: delay }}
        >
          <CheckIcon className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      </div>
      <span className="text-[11px] sm:text-xs text-white/85">{label}</span>
    </div>
  );
}
