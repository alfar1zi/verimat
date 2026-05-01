# VeriMat
### Stop Bahan Baku Salah Sebelum Masuk Gudang.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-verimat.vercel.app-0D4B3B?style=for-the-badge&logo=vercel)](https://verimat.vercel.app)
[![Azure](https://img.shields.io/badge/Powered%20by-Microsoft%20Azure-0078D4?style=for-the-badge&logo=microsoftazure)](https://azure.microsoft.com)
[![License](https://img.shields.io/badge/Hackathon-AI%20Impact%20Challenge%202026-2DD4BF?style=for-the-badge)](https://www.dicoding.com/challenges/971)

---

## Tentang VeriMat

VeriMat adalah sistem verifikasi otomatis dokumen penerimaan bahan baku farmasi berbasis AI. Dibangun untuk menjawab tantangan nyata di industri farmasi Indonesia: proses verifikasi dokumen yang masih manual, memakan 15-20 menit per pengiriman, dan sepenuhnya bergantung pada ketelitian manusia.

> *"Bagus dan sangat mempercepat proses verifikasi kedatangan bahan baku."*
> - Apt. Anera Raihana Romli, S.Farm., PT Ikapharmindo Putramas Tbk

Staf warehouse cukup upload dokumen. VeriMat mengekstrak field kunci, membandingkan dengan data Purchase Order internal, dan menghasilkan keputusan **PASS**, **MISMATCH**, atau **INCOMPLETE** dalam kurang dari 30 detik, lengkap dengan penjelasan dalam bahasa Indonesia dan audit trail digital otomatis.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Ekstraksi Dokumen Otomatis** | Azure AI Document Intelligence membaca Surat Jalan, CoA, Faktur, dan dokumen halal secara terstruktur |
| **Validation Engine Deterministik** | Rules engine berbasis domain farmasi, bukan AI, hasilnya transparan dan dapat diaudit |
| **Multi-Document Upload** | Upload hingga 4 jenis dokumen dalam satu sesi verifikasi |
| **Audit Trail Otomatis** | Setiap verifikasi tersimpan dengan timestamp dan identitas verifikator untuk kepatuhan CPOB |
| **Camera Capture** | Foto dokumen langsung dari browser tanpa perlu scan terpisah |
| **Dashboard Monitoring** | Statistik verifikasi real-time untuk supervisor QC |

---

## Demo

**URL:** https://verimat.vercel.app

**Credentials:** `admin` / `admin` 

### Alur Penggunaan
Login → Isi Informasi Pengiriman → Upload Dokumen → Lihat Hasil Verifikasi → Audit Trail

### Contoh Output Sistem
STATUS: MISMATCH
Field yang tidak sesuai:

Nomor Batch: Surat Jalan (BTX-2024-091) ≠ CoA (BTX-2024-092)

Rekomendasi: Harap konfirmasi ke supplier sebelum barang diterima.
Log deviasi telah tersimpan otomatis.

---

## Tech Stack

### Microsoft Azure Services
| Service | Fungsi |
|---|---|
| Azure AI Document Intelligence | Ekstraksi field terstruktur dari dokumen farmasi |
| Azure OpenAI GPT-4o | Generate penjelasan mismatch dalam bahasa Indonesia |
| Azure App Service | Hosting cloud backend |
| Azure SQL Database | Penyimpanan audit trail (roadmap) |

### Application Stack
| Layer | Teknologi |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Python Flask |
| Database | SQLite (development) |
| Deployment | Vercel (frontend) + PythonAnywhere (backend) |

---

**Alur Data:**
1. Staf upload dokumen melalui antarmuka web React
2. File dikirim ke Flask backend via HTTP POST
3. Backend meneruskan file ke Azure AI Document Intelligence
4. Field diekstrak dan divalidasi oleh rules engine deterministik
5. Azure OpenAI generate penjelasan mismatch dalam bahasa Indonesia
6. Hasil + audit trail disimpan ke database dan ditampilkan ke pengguna

**Validation Rules Engine** (`backend/utils/validation_engine.py`):
```python
# Contoh rule yang diimplementasi:
- Nomor batch Surat Jalan HARUS identik dengan nomor batch CoA
- Tanggal kedaluwarsa (ED) HARUS minimal 30 hari dari tanggal verifikasi
- Kuantitas HARUS sesuai dengan data PO internal (toleransi ±0)
- Nomor referensi PO HARUS ditemukan di database internal
- Validitas sertifikat halal HARUS masih berlaku
```

---

## Validasi Domain

Konsep dan workflow VeriMat divalidasi oleh dua praktisi industri farmasi Indonesia:

**Apt. Anera Raihana Romli, S.Farm.**
PT Ikapharmindo Putramas Tbk, Pulogadung, Jakarta Timur
> Mengkonfirmasi proses verifikasi saat ini masih manual 15-20 menit/pengiriman. Setelah melihat prototype: *"Bagus dan sangat mempercepat proses verifikasi kedatangan bahan baku."*

**Iza Amelia**
Institut Sains dan Teknologi Nasional
> Mengkonfirmasi bahwa kesalahan paling sering mencakup nomor batch tidak sesuai, jumlah barang keliru, dan dokumen belum lengkap. Menekankan pentingnya pencatatan Expired Date untuk sistem FEFO/FIFO sesuai standar CPOB.

**Referensi Regulasi:**
PerBPOM No. 7 Tahun 2024 tentang Standar CPOB sebagaimana diubah PerBPOM No. 7 Tahun 2025.

---

## Cara Menjalankan Lokal

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend (Flask)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Backend berjalan di `http://localhost:5000` 

### Frontend (React)

```bash
# Di root project
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173` 

### Environment Variables

Buat file `.env` di root project:

```env
VITE_API_URL=http://localhost:5000
```

Untuk integrasi Azure (opsional untuk development):

```env
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
AZURE_DOC_INTELLIGENCE_KEY=your-key-here
```

> Tanpa Azure credentials, sistem akan menggunakan mock extractor untuk development.

---

## Tim

| Nama | Peran | Kontribusi |
|---|---|---|
| **Aldi Syarif Alhakim** | Frontend Developer | UI/UX, React, Landing Page, User Experience |
| **Fadhlurrahman Alfarisi** | Product & Research | Domain Research Farmasi, Proposal, QA |
| **Muhammad Regno Schefendi** | Lead Developer | Backend Flask, Azure Integration, Validation Engine |

---

## Roadmap

- [x] Multi-step verification form
- [x] Azure AI Document Intelligence integration  
- [x] Deterministic rules engine
- [x] Audit trail digital otomatis
- [x] Camera capture dari browser
- [x] Multi-document upload (Surat Jalan, CoA, Faktur, Halal)
- [ ] Kode bahan baku dengan auto-fill referensi
- [ ] Dropdown vendor dari database transaksi
- [ ] Expired Date tracking untuk FEFO/FIFO
- [ ] Integrasi ERP via API
- [ ] Multi-user dengan role QA/Warehouse/Admin
- [ ] Notifikasi supervisor saat MISMATCH
- [ ] Export laporan untuk audit CPOB
- [ ] Azure SQL Database untuk production

---

**AI Impact Challenge - Microsoft Elevate Training Center 2026**

- **Tema:** Proses Verifikasi Material - Pharma/Health
