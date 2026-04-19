# VeriMat Frontend - Lovable Codebase

## Stack
- TypeScript + Vite + React
- Tailwind CSS + shadcn/ui
- react-router-dom v6 untuk routing

## Backend
- Flask API berjalan di http://localhost:5000
- Semua endpoint prefix /api/
- CORS sudah dikonfigurasi

## Routing yang harus ada
- "/" → Landing page (sudah ada, JANGAN diubah)
- "/login" → Login page
- "/dashboard" → Dashboard (protected)
- "/verification/:id" → Verification Result (protected)
- "/audit" → Audit Trail (protected)

## Auth
- Login via POST /api/auth/login dengan {username, password}
- Simpan auth state di localStorage key "verimat_auth"
- Protected routes redirect ke /login kalau tidak auth

## Design System (WAJIB konsisten dengan landing page)
- Primary: #0D4B3B
- Accent: #2DD4BF
- Background: #F7F8F6
- Text dark: #0F1A16
- Font: Plus Jakarta Sans
- Card: bg white, border-radius 16px, border 1px solid #E5E7EB
- Gunakan Tailwind classes, BUKAN inline styles

## API Endpoints yang sudah ada di Flask
- POST /api/auth/login
- GET /api/po/list
- POST /api/upload/verify
- GET /api/verification/:session_id
- GET /api/audit/list

## Rules
- Jangan ubah apapun di src/components/verimat/ (landing page components)
- Semua halaman baru masuk ke src/pages/
- Semua komponen shared baru masuk ke src/components/app/
- Icons: gunakan heroicons inline SVG, JANGAN emoji