# 💖 Chana — Premium Social Discovery & Matching Platform

Chana is a state-of-the-art social matching and discovery platform designed for modern mobile and web experiences. Built using a high-performance stack, it features realtime websocket synchronization, a stunning premium user interface, and robust cloud services.

## 🚀 Repository Structure

This is a monorepo containing all the core components of the Chana platform:

- **`/mobile`**: The iOS & Android mobile application built with **React Native**, **Expo Router**, **Zustand**, and **Supabase Client**.
- **`/dashboard`**: The administrator management console built with **React** for user, safety, and system reporting.
- **`/supabase`**: Database migrations, edge functions, triggers, and configuration schemas for **Supabase / PostgreSQL**.

---

## 🛠️ Technology Stack

### Mobile Frontend
- **Framework:** Expo (React Native) with File-based routing (Expo Router)
- **State Management:** Zustand (for reactive caching and badge handling)
- **Styling:** Premium themed colors, HSL tailored palettes, and safe container offsets
- **Database Connection:** Supabase SDK with realtime socket replication

### Backend & Database
- **Provider:** Supabase
- **Database:** PostgreSQL (with Row Level Security (RLS) policies)
- **Realtime Broadcasts:** Enabled via Postgres Replication Publications (`supabase_realtime`)
- **Server-side Logic:** Custom database triggers, PL/pgSQL triggers, and Deno Edge Functions

---

## 🏁 Getting Started

### 📱 1. Running the Mobile App
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```

### 🖥️ 2. Running the Admin Dashboard
1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm run dev
   ```

---

## 🛡️ Safety & Quality Guidelines

Chana is engineered with a strict focus on privacy and user safety. Key implemented policies include:
- **Encrypted authentication tokens** via `SecureStore`.
- **Row Level Security (RLS)** protecting active profiles and private swipes.
- **In-app Safety Guidelines** designed to educate and protect users.
- **Realtime push alerts** for instant user matches.

---

## ⚖️ License
All rights reserved. © 2026 Chana.
