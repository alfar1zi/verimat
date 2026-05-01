import { BoltIcon, FolderIcon, SearchIcon } from "./icons";

const features = [
  {
    icon: SearchIcon,
    title: "Ekstraksi Dokumen Otomatis",
    body: "Baca dan ekstrak field kunci dari Surat Jalan, CoA, dan sertifikat halal, termasuk dokumen scan dengan kualitas variatif.",
    tag: "Azure AI Document Intelligence",
  },
  {
    icon: BoltIcon,
    title: "Validasi Rules Engine",
    body: "Logika deterministik membandingkan data ekstraksi dengan PO internal. Hasil konsisten, dapat diaudit, tidak ada zona abu-abu.",
    tag: "Deterministic Logic",
  },
  {
    icon: FolderIcon,
    title: "Audit Trail Digital Otomatis",
    body: "Setiap verifikasi tersimpan lengkap dengan timestamp, dokumen sumber, dan keputusan. Siap untuk audit BPOM kapan saja.",
    tag: "Azure SQL Database",
  },
];

export default function Features() {
  return (
    <section id="fitur" className="relative bg-background py-24 sm:py-32">
      <div className="container">
        <div className="reveal max-w-3xl">
          <span className="inline-block rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            FITUR UTAMA
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Satu Upload. <span className="text-primary">Keputusan Instan.</span>
          </h2>
        </div>

        <div className="reveal-stagger mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative rounded-2xl border border-foreground/8 bg-card p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary hover:shadow-lift"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/6 px-2.5 py-1 text-[11px] font-semibold text-primary">
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
