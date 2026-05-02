import { Link } from "react-router-dom";
import MedicineLogo from "../components/app/MedicineLogo";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      {/* Simple navbar */}
      <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div style={{
              width: '28px', height: '28px', background: 'rgba(13,75,59,0.1)',
              borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MedicineLogo size={15} color="#0D4B3B" />
            </div>
            <span className="font-bold text-[16px] text-[#0D4B3B]">VeriMat</span>
          </Link>
          <Link
            to="/"
            className="text-[13px] text-[#4A5568] hover:text-[#0D4B3B] transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 sm:p-12">
          <h1 className="text-[28px] font-bold text-[#0F1A16] mb-2">
            Kebijakan Privasi
          </h1>
          <p className="text-[14px] text-[#9CA3AF] mb-8">
            Terakhir diperbarui: 1 Mei 2026
          </p>

          <div className="prose prose-slate max-w-none space-y-8">

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                1. Tentang VeriMat
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed">
                VeriMat adalah sistem verifikasi otomatis dokumen penerimaan bahan baku
                farmasi yang dikembangkan untuk mendukung kepatuhan standar CPOB
                (PerBPOM No. 7 Tahun 2024 sebagaimana diubah PerBPOM No. 7 Tahun 2025).
                Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan,
                dan melindungi data yang Anda masukkan ke dalam sistem.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                2. Data yang Kami Kumpulkan
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed mb-3">
                Dalam penggunaan VeriMat, sistem mengumpulkan data berikut:
              </p>
              <ul className="space-y-2">
                {[
                  "Informasi pengiriman: nomor referensi dokumen, nama vendor/supplier, nama bahan baku, kode bahan baku, nomor batch, jumlah, satuan, dan tanggal pengiriman",
                  "Data dokumen: file dokumen yang diunggah (Surat Jalan, CoA, Faktur, dan dokumen pendukung lainnya)",
                  "Hasil verifikasi: status PASS/MISMATCH/INCOMPLETE beserta detail ketidaksesuaian",
                  "Data kondisi: kondisi kemasan fisik, kondisi penyimpanan/suhu, dan expired date",
                  "Log audit: rekaman waktu, identitas verifikator, dan hasil setiap sesi verifikasi",
                  "Data akun: username administrator sistem",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-[#374151]">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0D4B3B] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                3. Bagaimana Data Digunakan
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed mb-3">
                Data yang dikumpulkan digunakan semata-mata untuk:
              </p>
              <ul className="space-y-2">
                {[
                  "Menjalankan proses verifikasi dokumen terhadap data Purchase Order internal",
                  "Menghasilkan laporan verifikasi dengan status PASS, MISMATCH, atau INCOMPLETE",
                  "Menyimpan audit trail digital untuk keperluan inspeksi dan kepatuhan regulasi CPOB",
                  "Menganalisis dokumen menggunakan Microsoft Azure AI Document Intelligence",
                  "Menghasilkan penjelasan ketidaksesuaian melalui Microsoft Azure OpenAI",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-[#374151]">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0D4B3B] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[15px] text-[#374151] leading-relaxed mt-3">
                Data Anda <strong>tidak</strong> digunakan untuk keperluan iklan, tidak
                dijual kepada pihak ketiga, dan tidak digunakan untuk tujuan selain
                operasional verifikasi dokumen farmasi.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                4. Penyimpanan Data
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed">
                Data verifikasi disimpan dalam database yang dihosting di infrastruktur
                Microsoft Azure. File dokumen yang diunggah diproses oleh Azure AI
                Document Intelligence dan tidak disimpan permanen setelah proses ekstraksi
                selesai. Log audit trail disimpan selama diperlukan untuk kepatuhan
                regulasi atau sampai administrator melakukan penghapusan data secara
                eksplisit melalui fitur Clear History.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                5. Keamanan Data
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed">
                VeriMat menerapkan langkah-langkah keamanan teknis berikut: transmisi
                data melalui HTTPS/TLS, autentikasi berbasis sesi dengan timeout otomatis,
                pembatasan percobaan login, dan header keamanan standar (X-Content-Type-Options,
                X-Frame-Options, X-XSS-Protection). Seluruh layanan cloud menggunakan
                infrastruktur Microsoft Azure yang memiliki sertifikasi keamanan ISO 27001.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                6. Layanan Pihak Ketiga
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed">
                VeriMat menggunakan layanan Microsoft Azure sebagai infrastruktur utama,
                termasuk Azure AI Document Intelligence untuk ekstraksi dokumen dan
                Azure OpenAI untuk penjelasan hasil verifikasi. Penggunaan layanan ini
                tunduk pada kebijakan privasi Microsoft yang dapat diakses di
                microsoft.com/privacy.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                7. Hak Pengguna
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed mb-3">
                Administrator sistem berhak untuk:
              </p>
              <ul className="space-y-2">
                {[
                  "Mengakses seluruh riwayat verifikasi melalui halaman Audit Trail",
                  "Menghapus riwayat verifikasi melalui fitur Clear History",
                  "Meminta penjelasan mengenai data yang tersimpan",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-[#374151]">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0D4B3B] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#0F1A16] mb-3">
                8. Kontak
              </h2>
              <p className="text-[15px] text-[#374151] leading-relaxed">
                Pertanyaan terkait kebijakan privasi ini dapat disampaikan kepada tim
                pengembang VeriMat melalui repositori GitHub:{" "}
                <a
                  href="https://github.com/alfar1zi/verimat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0D4B3B] underline hover:opacity-80"
                >
                  github.com/alfar1zi/verimat
                </a>
              </p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-[13px] text-[#9CA3AF]">
        © 2026 VeriMat · AI Impact Challenge · Microsoft Elevate Training Center
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
