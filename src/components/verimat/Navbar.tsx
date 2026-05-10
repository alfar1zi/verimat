import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import MedicineLogo from "@/components/MedicineLogo";

const links = [
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#teknologi", label: "Teknologi" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".nav-shell",
      { y: -32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, delay: 3.6, ease: "expo.out" }
    );
  }, []);

  return (
    <header className="fixed top-2 sm:top-5 left-0 right-0 z-50 flex justify-center px-2 sm:px-3">
      <nav
        className={`nav-shell glass flex items-center gap-0.5 sm:gap-2 rounded-full border border-white/10 px-1.5 py-1.5 sm:px-3 sm:py-2 max-w-[calc(100vw-1rem)] transition-all duration-500 ${
          scrolled ? "bg-surface-dark/85 shadow-lift" : "bg-surface-dark/95"
        }`}
      >
        <a href="#top" className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1 sm:pr-2 shrink-0" aria-label="VeriMat">
          <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg bg-teal/15 text-teal">
            <MedicineLogo size={14} color="#2DD4BF" />
          </span>
          <span className="hidden [@media(min-width:380px)]:inline font-bold tracking-tight text-white text-xs sm:text-sm">
            VeriMat
          </span>
        </a>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-1.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm text-white/70 transition-colors hover:text-white hover:bg-white/5 whitespace-nowrap"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          to="/login"
          className="ml-0.5 sm:ml-1 rounded-full bg-teal px-2.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold text-surface-deep transition-all duration-300 hover:brightness-110 hover:scale-[1.03] shrink-0"
        >
          Masuk
        </Link>
      </nav>
    </header>
  );
}
