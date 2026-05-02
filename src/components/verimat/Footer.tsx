import { Link } from "react-router-dom";
import { ShieldIcon } from "./icons";

export default function Footer() {
  return (
    <footer className="bg-surface-deep text-white/70 py-14">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/15 text-teal">
              <ShieldIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-base font-bold text-white">VeriMat</div>
              <div className="text-xs text-white/50">Verifikasi dokumen bahan baku farmasi dengan AI</div>
            </div>
          </div>

          <div className="text-xs text-white/50">
            © 2026 VeriMat · AI Impact Challenge · Microsoft Elevate Training Center ·{" "}
            <Link
              to="/privacy"
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
