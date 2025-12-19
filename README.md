# Pelajaran GW - AI Learning Companion

**Pelajaran GW** adalah aplikasi web berbasis AI yang dirancang untuk membantu pelajar, mahasiswa, dan pembelajar mandiri dalam mengelola materi pelajaran mereka secara efisien. Aplikasi ini memanfaatkan kekuatan **Google Gemini AI** untuk secara otomatis mengubah materi mentah (dokumen, teks, atau video) menjadi ringkasan terstruktur, kuis interaktif, dan kartu hafalan (flashcards).

## 🚀 Fitur Utama

- **Dashboard Belajar**: Pantau kemajuan belajar Anda dengan statistik aktivitas, grafik tren, dan ringkasan progres harian.
- **Generasi Konten AI**:
  - **Ringkasan Otomatis**: Ubah dokumen panjang atau transkrip video menjadi ringkasan yang mudah dipahami ala buku pelajaran.
  - **Kuis Instan**: Buat kuis pilihan ganda secara otomatis dari materi Anda untuk menguji pemahaman.
  - **Flashcards Otomatis**: Hasilkan kartu hafalan siap pakai untuk membantu retensi ingatan jangka panjang.
- **Dukungan Teks & Media**:
  - Upload file materi (PDF, DOCX, dll).
  - Input link video YouTube untuk mendapatkan transkrip dan ringkasan otomatis.
- **Editor Catatan Canggih**: Tulis dan edit catatan dengan editor kaya fitur (Rich Text Editor) yang mendukung format teks lengkap.
- **Asisten Chat AI**: Ngobrol dengan AI yang memiliki konteks penuh terhadap catatan Anda untuk bertanya lebih dalam tentang materi.
- **Manajemen Materi**: Organisasi catatan, filter favorit, dan pencarian cepat.
- **Penyimpanan Lokal**: Data tersimpan aman di browser Anda (Local Storage), menjaga privasi dan kecepatan akses.

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan tumpukan teknologi web modern untuk performa dan pengalaman pengguna terbaik:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library UI**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Komponen UI**: [Shadcn UI](https://ui.shadcn.com/) & [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **AI Integration**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai) (Gemini)
- **Editor**: [Tiptap](https://tiptap.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 📦 Panduan Instalasi & Menjalankan Aplikasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di komputer lokal Anda.

### Prasyarat
Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 18 atau lebih baru).

### 1. Clone Repository
```bash
git clone https://github.com/username/pelajaran-gw.git
cd pelajaran-gw
```

### 2. Instalasi Dependencies
Jalankan perintah berikut untuk mengunduh semua library yang dibutuhkan:
```bash
npm install
# atau
pnpm install
# atau
yarn install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di root direktori proyek. Anda memerlukan API Key dari Google Gemini AI.

```env
NEXT_PUBLIC_GEMINI_API_KEY=masukkan_api_key_gemini_anda_disini
```
> **Catatan**: Anda bisa mendapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/).

### 4. Jalankan Server Development
Mulai aplikasi dalam mode development:
```bash
npm run dev
```

Buka browser Anda dan navigasi ke `http://localhost:3000`. Aplikasi siap digunakan!

## 📂 Struktur Proyek

```
pelajaran-gw/
├── app/                 # Halaman dan routing Next.js (App Router)
├── components/          # Komponen UI yang dapat digunakan kembali
│   ├── ui/              # Komponen dasar (Button, Card, Input, dll)
│   └── ...              # Komponen fitur spesifik (Sidebar, NoteEditor, dll)
├── lib/                 # Utilitas, konfigurasi, dan logika bisnis
│   ├── ai-service.ts    # Integrasi dengan Google Gemini AI
│   ├── store.ts         # Global state management dengan Zustand
│   └── ...
├── public/              # Aset statis (gambar, icon, dll)
└── styles/              # Global styles
```

## 📝 Lisensi

[MIT License](LICENSE)
