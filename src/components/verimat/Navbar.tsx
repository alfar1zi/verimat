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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        setIsMobile(window.innerWidth <= 768);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-3 animate-slide-down">
      <nav
        className={`glass flex items-center rounded-full border border-white/5 transition-all duration-500 ${
          scrolled
            ? "bg-surface-dark/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]"
            : "bg-surface-dark"
        }`}
        style={{
          gap: isMobile ? '4px' : '8px',
          padding: isMobile ? '6px 8px' : '8px 12px',
        }}
      >
        {/* Logo */}
        <a
          href="#top"
          onClick={(e) => handleNavClick(e, 'top')}
          className="flex items-center gap-1.5 pl-1 pr-1"
          aria-label="Kunjungi halaman beranda VeriMat"
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal/15 text-teal flex-shrink-0">
            <MedicineLogo size={14} color="#2DD4BF" />
          </span>
          {/* Sembunyikan teks "VeriMat" di layar sangat kecil agar nav links muat */}
          <span
            className="font-bold tracking-tight text-white"
            style={{ display: isMobile ? 'none' : 'inline', fontSize: '14px' }}
          >
            VeriMat
          </span>
        </a>

        {/* Nav links — desktop: flex dengan gap besar, mobile: flex dengan gap kecil */}
        <div className="flex items-center" style={{ gap: isMobile ? '2px' : '4px' }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => handleNavClick(e, l.href.substring(1))}
              className="rounded-full text-white/70 transition-colors hover:text-white hover:bg-white/5 whitespace-nowrap"
              style={{
                padding: isMobile ? '4px 8px' : '6px 12px',
                fontSize: isMobile ? '11px' : '14px',
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          to="/login"
          className="rounded-full bg-teal font-semibold text-surface-deep transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] flex-shrink-0"
          style={{
            padding: isMobile ? '5px 10px' : '8px 18px',
            fontSize: isMobile ? '12px' : '14px',
            marginLeft: isMobile ? '2px' : '4px',
          }}
        >
          {isMobile ? 'Masuk' : 'Masuk ke Sistem'}
        </Link>
      </nav>
    </header>
  );
}
