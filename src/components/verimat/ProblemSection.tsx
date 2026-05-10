import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertIcon, ClockIcon, WarningIcon } from "./icons";

gsap.registerPlugin(ScrollTrigger);

const problems = [
  { icon: WarningIcon, title: "Human Error Tak Terhindarkan", body: "Pencocokan dokumen manual memakan 15-20 menit per pengiriman. Satu kelelahan bisa meloloskan bahan baku yang salah." },
  { icon: ClockIcon, title: "Tidak Ada Audit Trail Konsisten", body: "Dokumentasi manual tidak terstandarisasi, mempersulit penelusuran saat audit BPOM mendadak." },
  { icon: AlertIcon, title: "Risiko Langsung ke Kualitas Produk", body: "Bahan baku yang lolos dengan dokumen tidak sesuai berdampak langsung pada kualitas obat yang sampai ke konsumen." },
];

export default function ProblemSection() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".prob-head > *", { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.fromTo(".prob-card", { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: "expo.out",
        scrollTrigger: { trigger: ".prob-grid", start: "top 80%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative bg-primary text-primary-foreground py-24 sm:py-32 overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-40"
           style={{ background: "radial-gradient(circle at 80% 20%, hsl(0 75% 55% / 0.18), transparent 50%)" }} />

      <div className="container relative">
        <div className="prob-head max-w-3xl">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-teal uppercase">
            MENGAPA INI PENTING
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            Verifikasi Manual Adalah <span className="font-serif-display italic font-normal text-teal">Celah Paling Berbahaya</span>
          </h2>
        </div>

        <div className="prob-grid mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="prob-card group rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.07] hover:border-teal/30">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal/15 text-teal transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">{p.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
