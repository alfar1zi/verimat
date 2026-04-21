import { ChartIcon, CpuIcon, ShieldCheckIcon, UploadIcon, CheckIcon, XIcon, AlertIcon } from "./icons";

const steps = [
  { icon: UploadIcon, title: "Upload Dokumen", body: "Staf upload foto atau scan Surat Jalan, CoA, dan dokumen halal" },
  { icon: CpuIcon, title: "Ekstraksi AI", body: "Azure AI Document Intelligence membaca dan mengekstrak field kunci" },
  { icon: ShieldCheckIcon, title: "Validasi Rules Engine", body: "Rules engine deterministik bandingkan dengan data PO internal" },
  { icon: ChartIcon, title: "Hasil & Audit Trail", body: "Status PASS/MISMATCH/INCOMPLETE instan + log otomatis tersimpan" },
];

// Total cycle duration & per-step timing
const CYCLE = 16; // seconds (slowed down by 2x)
const STEP_COUNT = steps.length;
const STEP_WINDOW = CYCLE / STEP_COUNT; // 4s per step

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="container">
        <div className="reveal max-w-3xl mx-auto text-center">
          <span className="inline-block rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            CARA KERJA
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Dari Dokumen ke Keputusan dalam <span className="text-primary">4 Langkah</span>
          </h2>
        </div>

        {/* Stepper */}
        <div className="reveal relative mt-20 mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="hidden md:block absolute left-[12.5%] right-[12.5%] top-7 h-[2px] pointer-events-none rounded-full bg-primary/15"
            style={{ borderTop: '2px dashed #2DD4BF' }}
          >
            <div className="hiw-progress h-full w-0 rounded-full bg-primary" />
          </div>

          {steps.map((s, i) => {
            const Icon = s.icon;
            const stepDelay = `${i * STEP_WINDOW}s`;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Icon with splash */}
                <div className="relative h-14 w-14">
                  {/* Splash ring */}
                  <span
                    className="hiw-splash absolute inset-0 rounded-2xl bg-primary/30"
                    style={{ animationDelay: stepDelay }}
                  />
                  {/* Icon container */}
                  <div
                    className="hiw-icon relative grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift z-10"
                    style={{ animationDelay: stepDelay }}
                  >
                    <Icon className="h-6 w-6" />
                    {/* Active pulse dot */}
                    <span
                      className="hiw-pulse absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-accent-teal"
                      style={{ animationDelay: stepDelay }}
                    />
                  </div>
                </div>

                {/* Text — tampil permanen, tidak ikut loop */}
                <div className="mt-5">
                  <h3 className="font-display text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-[220px] mx-auto">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status badges */}
        <div className="reveal-stagger mt-20 flex flex-wrap items-center justify-center gap-3">
          <StatusPill tone="success" icon={<CheckIcon className="h-4 w-4" strokeWidth={3} />} label="PASS" />
          <StatusPill tone="destructive" icon={<XIcon className="h-4 w-4" strokeWidth={3} />} label="MISMATCH" />
          <StatusPill tone="warning" icon={<AlertIcon className="h-4 w-4" strokeWidth={2.5} />} label="INCOMPLETE" />
        </div>
      </div>

      <style>{`
        /* Icon pop with splash */
        @keyframes hiw-icon-pop {
          0%, 2%       { opacity: 0.35; transform: scale(0.7); }
          5%           { opacity: 1; transform: scale(1.15); }
          9%           { transform: scale(1); }
          85%, 100%    { opacity: 1; transform: scale(1); }
        }
        .hiw-icon {
          opacity: 0;
          transform: scale(0.7);
          animation: hiw-icon-pop ${CYCLE}s var(--ease-out) infinite both;
        }

        @keyframes hiw-splash-ring {
          0%, 2%   { opacity: 0; transform: scale(0.7); }
          6%       { opacity: 0.8; transform: scale(1); }
          18%      { opacity: 0; transform: scale(1.8); }
          100%     { opacity: 0; transform: scale(1.8); }
        }
        .hiw-splash {
          opacity: 0;
          animation: hiw-splash-ring ${CYCLE}s var(--ease-out) infinite both;
        }

        /* Description fade-in after icon pop */
        @keyframes hiw-text-rise {
          0%, 5%    { opacity: 0; transform: translateY(10px); }
          12%, 100% { opacity: 1; transform: translateY(0); }
        }
        .hiw-text {
          opacity: 0;
          transform: translateY(10px);
          animation: hiw-text-rise ${CYCLE}s var(--ease-out) infinite both;
        }

        /* Active pulse on the currently-processing step */
        @keyframes hiw-active-pulse {
          0%, 3%   { opacity: 0; transform: translateX(-50%) scale(0.6); }
          8%, 22%  { opacity: 1; transform: translateX(-50%) scale(1); }
          28%, 100%{ opacity: 0; transform: translateX(-50%) scale(0.6); }
        }
        .hiw-pulse {
          opacity: 0;
          animation: hiw-active-pulse ${CYCLE}s var(--ease-in-out) infinite both;
          box-shadow: 0 0 0 0 hsl(var(--accent-teal) / 0.6);
        }

        /* Connector progress line fills step-by-step across the row */
        @keyframes hiw-progress-fill {
          0%   { width: 0%; }
          12%  { width: 0%; }      /* step 1 popping */
          25%  { width: 33.33%; }  /* moves to step 2 */
          50%  { width: 66.66%; }  /* step 3 */
          75%  { width: 100%; }    /* step 4 */
          100% { width: 100%; }
        }
        .hiw-progress {
          animation: hiw-progress-fill ${CYCLE}s var(--ease-in-out) infinite both;
        }
      `}</style>
    </section>
  );
}

function StatusPill({ tone, icon, label }: { tone: "success" | "destructive" | "warning"; icon: React.ReactNode; label: string }) {
  const styles = {
    success: "bg-success/12 text-success border-success/30",
    destructive: "bg-destructive/12 text-destructive border-destructive/30",
    warning: "bg-warning/15 text-[hsl(28_90%_38%)] border-warning/30",
  }[tone];

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${styles}`}>
      {icon}
      {label}
    </div>
  );
}
