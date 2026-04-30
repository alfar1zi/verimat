import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MedicineLogo from "../app/MedicineLogo";

const links = [
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#teknologi", label: "Teknologi" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isVerySmall, setIsVerySmall] = useState(window.innerWidth <= 380);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsVerySmall(window.innerWidth <= 380);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 animate-slide-down">
      <nav
        className={`glass flex items-center gap-1 sm:gap-6 w-auto rounded-full border border-white/5 px-3 py-2 transition-all duration-500 ${
          scrolled
            ? "bg-surface-dark/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]"
            : "bg-surface-dark"
        }`}
      >
        <a href="#top" onClick={(e) => handleNavClick(e, 'top')} className="flex items-center gap-2 pl-2 pr-1 sm:pr-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal/15 text-teal">
            <MedicineLogo size={16} color="#2DD4BF" />
          </span>
          <span className="text-sm font-bold tracking-tight text-white" style={{ display: isVerySmall ? 'none' : 'inline' }}>VeriMat</span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => handleNavClick(e, l.href.substring(1))}
              className="rounded-full px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          to="/login"
          className="ml-1 rounded-full bg-teal font-semibold text-surface-deep transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
          style={{
            padding: isVerySmall ? '5px 10px' : isMobile ? '6px 14px' : '8px 18px',
            fontSize: isVerySmall ? '12px' : isMobile ? '13px' : '14px',
          }}
        >
          {isMobile ? 'Masuk' : 'Masuk ke Sistem'}
        </Link>
      </nav>
    </header>
  );
}
