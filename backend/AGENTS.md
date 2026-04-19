# Backend Rules

- Framework: Flask dengan virtual environment di backend/venv
- Database: SQLite file di backend/verimat.db
- Semua route prefix dengan /api/
- CORS sudah dikonfigurasi untuk localhost:3000
- Validation engine di backend/utils/validation_engine.py adalah DETERMINISTIC
  Jangan ubah logic ini menjadi AI-based
- Mock document extractor di backend/utils/document_extractor.py
  akan diganti Azure Document Intelligence setelah akun terverifikasi