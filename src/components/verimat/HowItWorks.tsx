import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChartIcon, CpuIcon, ShieldCheckIcon, UploadIcon, CheckIcon, XIcon, AlertIcon } from "./icons";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { icon: UploadIcon, title: "Upload Dokumen", body: "Staf upload foto atau scan Surat Jalan, CoA, dan dokumen halal." },
  { icon: CpuIcon, title: "Ekstraksi AI", body: "Azure AI Document Intelligence membaca dan mengekstrak field kunci." },
  { icon: ShieldCheckIcon, title: "Validasi Rules Engine", body: "Rules engine deterministik bandingkan dengan data PO internal." },
  { icon: ChartIcon, title: "Hasil & Audit Trail", body: "Status PASS / MISMATCH / INCOMPLETE instan + log otomatis tersimpan." },
];

export default function HowItWorks() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hiw-head > *", { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      gsap.fromTo(".hiw-step", { y: 60, opacity: 0, scale: 0.9 }, {
        y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.18, ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".hiw-grid", start: "top 75%" },
      });

      gsap.fromTo(".hiw-progress", { scaleX: 0 }, {
        scaleX: 1, duration: 1.6, ease: "power3.inOut",
        scrollTrigger: { trigger: ".hiw-grid", start: "top 70%" },
      });

      gsap.fromTo(".hiw-pill", { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: ".hiw-pills", start: "top 90%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="cara-kerja" ref={root} className="relative py-24 sm:py-32 overflow-hidden">
      <div className="container">
        <div className="hiw-head max-w-3xl mx-auto text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            CARA KERJA
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Dari Dokumen ke Keputusan dalam <span className="font-serif-display italic font-normal text-primary">4 Langkah</span>
          </h2>
        </div>

        <div className="hiw-grid relative mt-20 mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4">
          <div aria-hidden className="hidden md:block absolute left-[12.5%] right-[12.5%] top-7 h-[2px] pointer-events-none"
               style={{ borderTop: '2px dashed hsl(var(--primary) / 0.25)' }}>
            <div className="hiw-progress h-full origin-left rounded-full bg-primary" />
          </div>

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="hiw-step relative flex flex-col items-center text-center">
                <div className="relative h-14 w-14">
                  <span className="absolute -inset-2 rounded-3xl bg-primary/10 blur-md" />
                  <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-teal text-[11px] font-extrabold text-surface-deep ring-2 ring-background">
                    {i + 1}
                  </span>
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-[220px] mx-auto">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hiw-pills mt-20 flex flex-wrap items-center justify-center gap-3">
          <Pill tone="success" icon={<CheckIcon className="h-4 w-4" strokeWidth={3} />} label="PASS" />
          <Pill tone="destructive" icon={<XIcon className="h-4 w-4" strokeWidth={3} />} label="MISMATCH" />
          <Pill tone="warning" icon={<AlertIcon className="h-4 w-4" strokeWidth={2.5} />} label="INCOMPLETE" />
        </div>
      </div>
    </section>
  );
}

function Pill({ tone, icon, label }: { tone: "success" | "destructive" | "warning"; icon: React.ReactNode; label: string }) {
  const styles = {
    success: "bg-success/12 text-[hsl(142_70%_32%)] border-success/30",
    destructive: "bg-destructive/12 text-[hsl(0_75%_45%)] border-destructive/30",
    warning: "bg-warning/15 text-[hsl(28_90%_32%)] border-warning/30",
  }[tone];
  return (
    <div className={`hiw-pill inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${styles}`}>
      {icon}{label}
    </div>
  );
}
