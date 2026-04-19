import { ChartIcon, CpuIcon, ShieldCheckIcon, UploadIcon, CheckIcon, XIcon, AlertIcon } from "./icons";

const steps = [
  { icon: UploadIcon, title: "Upload Dokumen", body: "Staf upload foto atau scan Surat Jalan, CoA, dan dokumen halal" },
  { icon: CpuIcon, title: "Ekstraksi AI", body: "Azure AI Document Intelligence membaca dan mengekstrak field kunci" },
  { icon: ShieldCheckIcon, title: "Validasi Rules Engine", body: "Rules engine deterministik bandingkan dengan data PO internal" },
  { icon: ChartIcon, title: "Hasil & Audit Trail", body: "Status PASS/MISMATCH/INCOMPLETE instan + log otomatis tersimpan" },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="container">
        <div className="reveal max-w-3xl">
          <span className="inline-block rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            CARA KERJA
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Dari Dokumen ke Keputusan dalam <span className="text-primary">4 Langkah</span>
          </h2>
        </div>

        {/* Stepper */}
        <div className="reveal-stagger relative mt-20 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
          {/* Connector line (desktop) */}
          <svg
            aria-hidden
            className="hidden md:block absolute left-[12.5%] right-[12.5%] top-7 h-2 pointer-events-none"
            viewBox="0 0 1000 8"
            preserveAspectRatio="none"
          >
            <line
              x1="0" y1="4" x2="1000" y2="4"
              stroke="hsl(var(--primary) / 0.15)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <line
              className="connector-draw"
              x1="0" y1="4" x2="1000" y2="4"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="1000"
              strokeDashoffset="1000"
            />
          </svg>

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift relative z-10">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-teal text-[11px] font-bold text-surface-deep border-2 border-background">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-[220px]">{s.body}</p>
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
        .reveal-stagger.in-view .connector-draw {
          animation: draw-line 1.6s var(--ease-out) 200ms forwards;
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
