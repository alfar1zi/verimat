import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import MedicineLogo from "@/components/MedicineLogo";

export default function SplashIntro({ onComplete }: { onComplete?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Lock scroll while splashing
      document.body.style.overflow = "hidden";

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          document.body.style.overflow = "";
          setDone(true);
          onComplete?.();
        },
      });

      tl.fromTo(
        ".splash-ring",
        { scale: 0.2, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: "expo.out" }
      )
        .fromTo(
          ".splash-logo",
          { scale: 0.4, opacity: 0, rotate: -25 },
          { scale: 1, opacity: 1, rotate: 0, duration: 0.8, ease: "back.out(1.6)" },
          "-=0.55"
        )
        .to(".splash-ring", { scale: 1.6, opacity: 0, duration: 0.7, ease: "power2.inOut" }, "+=0.15")
        .to(
          ".splash-logo-wrap",
          { y: -8, duration: 0.5 },
          "-=0.55"
        )
        // Letters slide out from logo
        .fromTo(
          ".splash-letter",
          { x: -40, opacity: 0, filter: "blur(8px)" },
          {
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.7,
            stagger: 0.06,
            ease: "expo.out",
          },
          "-=0.45"
        )
        .fromTo(
          ".splash-tagline",
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          "-=0.2"
        )
        .to({}, { duration: 0.5 })
        // Curtain reveal
        .to(".splash-mask", {
          scaleY: 0,
          duration: 1,
          ease: "expo.inOut",
          transformOrigin: "top center",
        })
        .to(
          ".splash-content",
          { opacity: 0, duration: 0.5, ease: "power2.in" },
          "-=0.85"
        )
        .set(root.current, { display: "none" });
    }, root);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  if (done) return null;
  const word = "VeriMat".split("");

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] pointer-events-none"
      aria-hidden
    >
      <div className="splash-mask absolute inset-0 bg-surface-deep" />
      <div className="splash-content absolute inset-0 flex flex-col items-center justify-center">
        <div className="splash-logo-wrap relative flex items-center gap-4">
          <div className="relative grid place-items-center">
            <span className="splash-ring absolute h-32 w-32 rounded-full border border-teal/40" />
            <span className="splash-ring absolute h-24 w-24 rounded-full border border-teal/30" />
            <span className="splash-ring absolute h-20 w-20 rounded-full bg-teal/10 blur-xl" />
            <div className="splash-logo relative grid h-16 w-16 place-items-center rounded-2xl bg-teal/15 ring-1 ring-teal/40">
              <MedicineLogo size={36} color="#5EEAD4" />
            </div>
          </div>
          <div className="flex overflow-hidden">
            {word.map((l, i) => (
              <span
                key={i}
                className="splash-letter inline-block font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-white"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="splash-tagline mt-8 text-xs sm:text-sm uppercase tracking-[0.4em] text-teal/70">
          Pharma Document Intelligence
        </div>
      </div>
    </div>
  );
}
