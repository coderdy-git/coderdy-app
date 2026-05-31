# Coderdy Attendance 🚀

**A modern, blazing fast, offline-first attendance tracking system built for both Web and Mobile.**

Coderdy Attendance is a hybrid web and mobile application designed to seamlessly track employee check-ins, check-outs, and leaves. Built with an architecture that gracefully handles network drops, it caches data locally and synchronizes with the cloud once the connection is restored. 

## ✨ Key Features

- **Hybrid Architecture:** Write once, run everywhere. Optimized for both modern web browsers (via Vite) and native mobile apps (via Capacitor Android/iOS).
- **Offline-First Synchronization:** Uses robust local SQLite (on native) and LocalStorage (on web) to store punches when offline, then automatically syncs to **Supabase** in the background when online.
- **Passkey Authentication:** Cutting-edge, passwordless login support using biometric passkeys, alongside traditional Google OAuth.
- **Dynamic Role Management:** Intelligent UI that adapts to the user. Admins and Testers get specialized badges and developer tooling directly in the app.
- **Smart Reporting:** Automatically generates grouped attendance reports by day, calculating In/Out pairs and leaves into beautiful, easy-to-read UI cards.
- **Modern UI/UX:** A sleek, flexbox-powered design system with micro-animations, glassmorphism elements, and a premium color palette.

## 🛠️ Technology Stack

- **Frontend:** Vanilla JS + HTML5 + CSS3 (Zero heavy UI frameworks for maximum speed)
- **Build Tool:** Vite
- **Mobile Runtime:** Capacitor JS
- **Database (Cloud):** Supabase (PostgreSQL)
- **Database (Local):** Capacitor-Community SQLite (Native) & LocalStorage (Web fallback)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase Project (for backend services)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/coderdy-git/coderdy-app.git
   cd coderdy-app/my-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Supabase:**
   Set up your `URL` and `ANON_KEY` in `src/js/supabase.js`.

4. **Run for Web (Development):**
   ```bash
   npm run start
   ```

5. **Build for Mobile (Capacitor):**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

## 🔐 Role-Based Access
- **DEVELOPER:** Logging in with `admin.coderdy@gmail.com` grants access to developer tools (e.g., injecting dummy data, clearing local DB) and displays the `[DEVELOPER]` badge.
- **TESTER:** Any email containing the word `tester` will automatically receive the `[TESTER]` badge on the dashboard.

## 📄 License
This project is proprietary and built for Coderdy. All rights reserved.
