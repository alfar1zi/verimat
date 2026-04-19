import { BrainIcon, ChatIcon, CloudIcon, DatabaseIcon } from "./icons";

const stack = [
  { icon: BrainIcon, name: "Azure AI Document Intelligence", desc: "Ekstraksi field dari dokumen tidak terstruktur" },
  { icon: ChatIcon, name: "Azure OpenAI GPT-4o", desc: "Penjelasan natural language untuk mismatch" },
  { icon: DatabaseIcon, name: "Azure SQL Database", desc: "Penyimpanan audit trail yang aman & terstruktur" },
  { icon: CloudIcon, name: "Azure App Service", desc: "Hosting cloud yang scalable & high-availability" },
];

export default function Technology() {
  return (
    <section id="teknologi" className="relative bg-surface-deep text-primary-foreground py-24 sm:py-32 overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-60"
           style={{ background: "radial-gradient(ellipse at 50% 100%, hsl(172 66% 50% / 0.18), transparent 60%)" }} />

      <div className="container relative">
        <div className="reveal max-w-3xl">
          <span className="inline-block rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold tracking-wider text-teal uppercase">
            TEKNOLOGI
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Ditenagai <span className="text-gradient-teal">Microsoft Azure</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl">
            Stack enterprise-grade yang siap menangani volume produksi pharma — dari ekstraksi hingga audit trail.
          </p>
        </div>

        <div className="reveal-stagger mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl">
          {stack.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 hover:border-teal/50 hover:bg-white/[0.05] hover:shadow-[0_0_0_1px_hsl(172_66%_50%_/_0.4),0_20px_40px_-12px_hsl(172_66%_50%_/_0.3)]"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal/15 text-teal transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white">{s.name}</h3>
                    <p className="mt-1.5 text-sm text-white/60">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="reveal mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-white/50">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-transparent to-teal/60" />
            <span className="font-semibold tracking-wider text-white/80" style={{ textShadow: "0 0 24px hsl(172 66% 50% / 0.5)" }}>
              Powered by Microsoft Azure
            </span>
            <span className="h-1 w-8 rounded-full bg-gradient-to-l from-transparent to-teal/60" />
          </div>
        </div>
      </div>
    </section>
  );
}
