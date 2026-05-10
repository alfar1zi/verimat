import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon } from "./icons";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".cta-card", { y: 80, opacity: 0, scale: 0.95 }, {
        y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
      gsap.fromTo(".cta-card > * > *", { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative py-24 sm:py-32 overflow-hidden">
      <div className="container">
        <div className="cta-card relative rounded-[1.5rem] sm:rounded-[2rem] px-5 py-12 sm:px-16 sm:py-24 text-center overflow-hidden noise"
             style={{ background: "var(--gradient-teal)" }}>
          <div aria-hidden className="absolute inset-0 opacity-50"
               style={{ background: "radial-gradient(circle at 50% 50%, hsl(172 66% 70% / 0.3), transparent 60%)" }} />
          <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />

          <div className="relative">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white/80 uppercase">
                Mulai Sekarang
              </span>
              <h2 className="mt-5 font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
                Siap Menghilangkan <br className="hidden sm:block" />
                <span className="font-serif-display italic font-normal text-teal">Human Error?</span>
              </h2>
              <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto">
                Mulai verifikasi dokumen secara otomatis sekarang.
              </p>
              <Link
                to="/login"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-primary shadow-lift transition-all duration-300 hover:scale-[1.04] hover:brightness-105"
              >
                Masuk ke Sistem <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
