# CODERDY Attendance

Aplikasi absensi **offline-first** untuk karyawan. Bisa dipake di HP (Android) maupun web browser.

## Tentang Aplikasi

CODERDY Attendance adalah aplikasi pencatatan kehadiran yang:

- **Bisa offline** — absen tetap jalan meski gak ada internet. Data otomatis nyambung (sync) pas online lagi.
- **Multi-perangkat** — Hybrid app, jalan di Android (APK) dan browser web.
- **Login fleksibel** — Bisa pake Google OAuth atau Passkey (biometric/login tanpa password).
- **Multi-role** — Ada role Personal, Employee, Supervisor, Administrator, Developer. Tiap role punya tampilan dan fitur yang beda.
- **Catatan piutang** — Plus fitur pencatatan hutang piutang sama staff, lengkap dengan deposit dan histori.
- **Report harian** — Lihat rekap absensi per hari, lengkap dengan jam masuk, jam pulang, dan status izin/cuti.
- **Notifikasi realtime** — Dapet notifikasi langsung pas ada update absen atau info baru.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | Vanilla JS + HTML + CSS (gak pake framework berat) |
| Build | Vite |
| Mobile | Capacitor (Android) |
| Cloud DB | Supabase (PostgreSQL) |
| Local DB | SQLite (native) / LocalStorage (web fallback) |
| Auth | Google OAuth + Passkey (WebAuthn) |

## Cara Dapetin APK

APK terbaru bisa didownload dari **GitHub Releases**:

> https://github.com/coderdy-git/coderdy-attendance-app/releases

Download file `app-debug.apk`, install di HP Android. Pastikan izinkan instalasi dari sumber tidak dikenal.

> **Catatan:** APK ini di-sign dengan key debug yang konsisten, jadi update versi baru bisa langsung install di atas yang lama (tanpa perlu uninstall dulu).

## Struktur Project

```
├── src/              # Kode utama (web app)
│   ├── index.html
│   ├── js/
│   │   ├── app.js       # Logic utama
│   │   ├── api.js       # Service Supabase
│   │   ├── db.js        # SQLite local database
│   │   └── update.js    # Auto-update checker
│   └── css/
├── android/          # Native Android project (Capacitor)
├── dist/             # Hasil build web
└── .github/          # CI workflow (auto build APK tiap push ke main)
```
