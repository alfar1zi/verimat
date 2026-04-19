import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldIcon } from "./icons";

const links = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
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

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 animate-slide-down">
      <nav
        className={`glass flex items-center gap-2 sm:gap-6 rounded-full border border-white/5 px-3 py-2 transition-all duration-500 ${
          scrolled
            ? "bg-surface-dark/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]"
            : "bg-surface-dark"
        }`}
      >
        <a href="#top" className="flex items-center gap-2 pl-2 pr-1 sm:pr-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal/15 text-teal">
            <ShieldIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold tracking-tight text-white">VeriMat</span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          to="/login"
          className="ml-1 rounded-full bg-teal px-4 py-2 text-xs sm:text-sm font-semibold text-surface-deep transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
        >
          Masuk ke Sistem
        </Link>
      </nav>
    </header>
  );
}
