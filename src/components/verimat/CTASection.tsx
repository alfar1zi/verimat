import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./icons";

export default function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="container">
        <div
          className="reveal relative rounded-3xl px-8 py-16 sm:px-16 sm:py-24 text-center overflow-hidden"
          style={{ background: "var(--gradient-teal)" }}
        >
          {/* Decorative glow */}
          <div aria-hidden className="absolute inset-0 opacity-50"
               style={{ background: "radial-gradient(circle at 50% 50%, hsl(172 66% 70% / 0.3), transparent 60%)" }} />
          <div aria-hidden className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl" />

          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
              Siap Menghilangkan <br className="hidden sm:block" />Human Error?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto">
              Mulai verifikasi dokumen secara otomatis sekarang.
            </p>
            <Link
              to="/login"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-primary shadow-lift transition-all duration-300 hover:scale-[1.04] hover:brightness-105"
            >
              Masuk ke Sistem
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
