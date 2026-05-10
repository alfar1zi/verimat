import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BoltIcon, FolderIcon, SearchIcon } from "./icons";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: SearchIcon, title: "Ekstraksi Dokumen Otomatis", body: "Baca dan ekstrak field kunci dari Surat Jalan, CoA, dan sertifikat halal — termasuk dokumen scan dengan kualitas variatif.", tag: "Azure AI Document Intelligence" },
  { icon: BoltIcon, title: "Validasi Rules Engine", body: "Logika deterministik membandingkan data ekstraksi dengan PO internal. Hasil konsisten, dapat diaudit, tidak ada zona abu-abu.", tag: "Deterministic Logic" },
  { icon: FolderIcon, title: "Audit Trail Digital Otomatis", body: "Setiap verifikasi tersimpan lengkap dengan timestamp, dokumen sumber, dan keputusan. Siap audit BPOM kapan saja.", tag: "Azure SQL Database" },
];

export default function Features() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".ft-head > *", { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.fromTo(".ft-card", { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: "expo.out",
        scrollTrigger: { trigger: ".ft-grid", start: "top 80%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="fitur" ref={root} className="relative bg-background py-24 sm:py-32">
      <div className="container">
        <div className="ft-head max-w-3xl">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            FITUR UTAMA
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Satu Upload. <span className="font-serif-display italic font-normal text-primary">Keputusan Instan.</span>
          </h2>
        </div>

        <div className="ft-grid mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="ft-card group relative rounded-2xl border border-foreground/8 bg-card p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary hover:shadow-lift overflow-hidden">
                <div aria-hidden className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-teal/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-5 font-display text-xl font-bold text-foreground">{f.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                  {f.tag}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
