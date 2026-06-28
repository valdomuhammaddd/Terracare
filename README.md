<p align="center">
  <strong>TerraCare</strong><br/>
  <em>Enterprise IoT Health Monitoring &amp; Fall Detection for Elderly Care</em>
</p>

<p align="center">
  <strong>PT TERRA DIGITAL SYSTEM</strong> · Thesis / Production MVP · Edge → Cloud → Mobile
</p>

<p align="center">
  <a href="#-gambaran-umum">Gambaran Umum</a> ·
  <a href="#-fitur-utama">Fitur</a> ·
  <a href="#-arsitektur-sistem">Arsitektur</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-struktur-repository">Struktur Repo</a> ·
  <a href="#-setup--instalasi">Setup</a> ·
  <a href="#-demo-mode">Demo Mode</a> ·
  <a href="#-keamanan">Keamanan</a> ·
  <a href="#-troubleshooting">Troubleshooting</a>
</p>

---

## Daftar Isi

1. [Gambaran Umum](#-gambaran-umum)
2. [Masalah & Solusi](#-masalah--solusi)
3. [Fitur Utama](#-fitur-utama)
4. [Arsitektur Sistem](#-arsitektur-sistem)
5. [Algoritma Edge (ESP32)](#-algoritma-edge-esp32)
6. [Tech Stack](#-tech-stack)
7. [Skema Database (Supabase)](#-skema-database-supabase)
8. [Aplikasi Mobile](#-aplikasi-mobile)
9. [Struktur Repository](#-struktur-repository)
10. [Prasyarat](#-prasyarat)
11. [Setup & Instalasi](#-setup--instalasi)
12. [Variabel Lingkungan](#-variabel-lingkungan)
13. [Demo Mode (Sidang / Presentasi)](#-demo-mode-sidang--presentasi)
14. [Simulator ESP32 (Tanpa Hardware)](#-simulator-esp32-tanpa-hardware)
15. [Firmware ESP32](#-firmware-esp32)
16. [Keamanan & Privasi Data](#-keamanan--privasi-data)
17. [Alur Demo Sidang Skripsi](#-alur-demo-sidang-skripsi)
18. [Troubleshooting](#-troubleshooting)
19. [Roadmap](#-roadmap)
20. [Dokumentasi Terkait](#-dokumentasi-terkait)
21. [Lisensi](#-lisensi)

---

## Gambaran Umum

**TerraCare** adalah ekosistem *health-tech* IoT end-to-end yang dirancang untuk **pemantauan kesehatan lansia** dan **deteksi jatuh (*fall detection*)** secara real-time. Platform ini menggabungkan:

| Lapisan | Peran |
|---------|--------|
| **Edge (ESP32)** | Sensor IMU + oximeter, deteksi jatuh on-device, oximetry event-triggered |
| **Cloud (Supabase)** | PostgreSQL, Auth, Realtime WebSocket, Row-Level Security |
| **Mobile (React Native)** | Dashboard caregiver, emergency overlay, riwayat, konfigurasi perangkat |

Proyek ini dikembangkan sebagai **MVP produksi** oleh **PT TERRA DIGITAL SYSTEM** dan artefak penelitian skripsi (*Sidang Skripsi*), dengan fokus pada:

- **Event-Triggered Oximetry** — SpO₂ dan detak jantung di-sampling hanya setelah heuristik jatuh terkonfirmasi, menghemat baterai wearable.
- **Multi-Stage Thresholding** — Klasifikasi *hard fall*, *soft fall*, dan gerakan benign sebelum alert ke caregiver.
- **UX kelas produk** — Antarmuka NativeWind/Tailwind, haptic feedback, skeleton loaders, bottom sheets, dan aksesibilitas untuk pengguna lanjut usia.

> **Status:** Feature-complete (Edge → Cloud → Mobile). Siap demo sidang dengan **Demo Mode** bila hardware belum terhubung.

---

## Masalah & Solusi

### Masalah

| Pain Point | Dampak |
|------------|--------|
| Pemantauan manual (kunjungan / telepon) | Latency respons insiden diukur menit–jam |
| Data vital intermiten | BPM/SpO₂ pasca-jatuh sering tidak terekam |
| Wearable always-on PPG | Baterai cepat habis, noise data tinggi |
| Pengawasan 24 jam | Tidak skalabel untuk rumah tangga maupun panti jompo |

### Solusi TerraCare

```
Lansia memakai wearable ESP32
        ↓
IMU mendeteksi impact + imobilitas (FSM non-blocking)
        ↓
Oximeter MAX30102 "bangun" → sample 8 detik → upload vital
        ↓
Supabase Realtime push ke app caregiver (< 1 detik)
        ↓
Emergency Overlay full-screen + SOS FAB + kontak darurat
```

---

## Fitur Utama

### IoT Edge (Firmware)

- Finite State Machine non-blocking (`millis()`, tanpa `delay()` di loop utama)
- **SVM (Sum Vector Magnitude)** untuk deteksi impact: \(\sqrt{a_x^2 + a_y^2 + a_z^2}\)
- *Hard fall* dan *soft fall* (impact + konfirmasi imobilitas 3 detik)
- **Event-triggered oximetry** — MAX30102 idle sampai insiden
- Heartbeat 30 detik + sinkronisasi threshold dari cloud (`fall_threshold_g`, `angle_threshold_deg`)
- Ingest HTTPS ke `vital_logs` dan `emergency_events`

### Cloud (Supabase)

- PostgreSQL dengan migrasi versioned (`supabase/migrations/`)
- **Row-Level Security (RLS)** pada semua tabel klinis
- **RBAC** — `admin`, `caregiver`, `elder`, `user`
- **Supabase Realtime** — `postgres_changes` untuk vitals & emergency push
- Auth JWT + auto-provision `profiles` via trigger

### Mobile (Expo / React Native)

| Modul | Deskripsi |
|-------|-----------|
| **Monitoring** | Live BPM, SpO₂, baterai, status koneksi, Panggil Bantuan |
| **Insights** | Rata-rata vital, chart tren, insight kesehatan |
| **Activity** | Riwayat insiden darurat & pemeriksaan vital |
| **Care** | Menu pintasan (Emergency, Vitals, Track, Medicine, dll.) |
| **Settings** | Kontak darurat, kalibrasi sensor, profil akun |
| **Emergency Overlay** | Modal full-screen saat `emergency_events` INSERT |
| **SOS FAB** | Tombol darurat global + bottom sheet konfirmasi |
| **Admin Dashboard** | Oversight multi-user untuk role `admin` |
| **Demo Mode** | Mock data realistis saat offline / tanpa ESP32 |

### UX & Polish (Thesis-Ready)

- **Haptics** (`expo-haptics`) — error pada SOS/overlay, light pada tab, medium pada save
- **Skeleton loaders** — Monitoring & Activity (bukan spinner kosong)
- **Empty states** — Pesan reassuring dengan ikon shield
- **Gorhom Bottom Sheet** — Konfirmasi SOS, logout, sukses simpan (bukan system Alert)
- **ErrorBoundary** — Crash ditangkap dengan UI ramah pengguna
- **Auth-aware splash** — Session dicek sebelum render (tanpa flash login)

---

## Arsitektur Sistem

### Diagram Lapisan

```mermaid
flowchart TB
    subgraph Edge["IoT Edge — ESP32"]
        IMU["MPU6050 / LSM6DS3<br/>Accelerometer 50 Hz"]
        PPG["MAX30102<br/>SpO₂ + HR (event-triggered)"]
        FSM["Non-blocking FSM<br/>Fall Detection Engine"]
        IMU --> FSM
        FSM -->|"Wake on fall"| PPG
    end

    subgraph Cloud["Supabase Cloud"]
        REST["REST API / Edge Functions"]
        PG[("PostgreSQL 15+<br/>RLS + RBAC")]
        RT["Realtime WebSocket"]
        AUTH["Auth (JWT)"]
        REST --> PG
        PG --> RT
        AUTH --> REST
    end

    subgraph Mobile["React Native — Expo SDK 56"]
        APP["TerraCare Mobile"]
        ZST["Zustand Auth Store"]
        DEMO["MockDataService<br/>(Demo Mode)"]
        APP --> ZST
        APP -.-> DEMO
    end

    FSM -->|"HTTPS POST"| REST
    RT -->|"postgres_changes"| APP
    APP -->|"signIn / session"| AUTH
```

### Alur Data End-to-End

1. **ESP32** menjalankan pipeline deteksi jatuh + oximetry terpicu event.
2. Payload terstruktur di-**POST** ke Supabase (`vital_logs`, `emergency_events`, heartbeat `devices`).
3. **PostgreSQL** menyimpan dengan ACID; **Realtime** menyiarkan `INSERT`/`UPDATE`.
4. **Mobile app** (authenticated) subscribe per `user_id` / `device_id`.
5. **Emergency Overlay** terbuka otomatis saat `handled_status = pending`.
6. Caregiver menindaklanjuti → update `handled_status` → audit trail.

### Sequence: Fall → Emergency Overlay

```mermaid
sequenceDiagram
    participant ESP as ESP32
    participant SB as Supabase PostgreSQL
    participant RT as Supabase Realtime
    participant APP as React Native App

    ESP->>ESP: SVM exceeds threshold
    ESP->>ESP: Wake MAX30102, sample vitals 8s
    ESP->>SB: INSERT emergency_events (pending)
    ESP->>SB: INSERT vital_logs (post-fall)
    SB->>RT: Broadcast INSERT
    RT->>APP: postgres_changes
    APP->>APP: EmergencyOverlay + haptic error
    APP->>SB: UPDATE handled_status = resolved
```

---

## Algoritma Edge (ESP32)

### State Machine

```
IDLE → IMPACT_DETECTED → IMMOBILITY_CHECK → FALL_DETECTED
     → READING_VITALS → SENDING_DATA → IDLE
```

### Tahap Deteksi

| Tahap | Kondisi | Default |
|-------|---------|---------|
| **1. Impact** | SVM ≥ threshold | Hard: ≥ 2.5g · Soft: ≥ 1.6g (64% × threshold) |
| **2. Immobility** | SVM < 0.25g selama 3 detik | Mengurangi false positive |
| **3. Oximetry** | Sample HR + SpO₂ | 8 detik, interval 500 ms |
| **4. Cloud ingest** | REST INSERT | `emergency_events` + `vital_logs` |

Threshold dapat dikonfigurasi dari app **Settings → Kalibrasi Perangkat** dan di-pull firmware setiap heartbeat (30 detik).

Implementasi: [`firmware/main.ino`](firmware/main.ino)

---

## Tech Stack

| Lapisan | Teknologi | Versi / Catatan |
|---------|-----------|-----------------|
| **Mobile runtime** | React Native | 0.85.x |
| **Mobile framework** | Expo SDK | 56 |
| **Bahasa** | TypeScript | Strict mode |
| **Routing** | Expo Router | File-based, typed routes |
| **Styling** | NativeWind | Tailwind CSS v3 + design tokens |
| **State** | Zustand | Auth session + profile |
| **Backend** | Supabase | PostgreSQL, Auth, Realtime |
| **IoT MCU** | ESP32 | Arduino-ESP32 core |
| **Sensor IMU** | MPU6050 / LSM6DS3 | I2C @ 50 Hz |
| **Sensor PPG** | MAX30102 | Event-triggered |
| **Haptics** | expo-haptics | SOS, tab, form submit |
| **Bottom sheets** | @gorhom/bottom-sheet | Konfirmasi & info |
| **Animasi** | react-native-reanimated | Skeleton pulse |
| **Font** | Hanken Grotesk | Google Fonts via Expo |
| **Simulator QA** | Node.js + @supabase/supabase-js | `scripts/simulate_esp32.js` |

---

## Skema Database (Supabase)

Migrasi: [`supabase/migrations/`](supabase/migrations/)

| Migrasi | Isi |
|---------|-----|
| `00001_initial_schema.sql` | Tabel, ENUM, trigger `profiles`, RLS dasar |
| `00002_rbac_policies.sql` | `is_admin()`, policies RBAC |
| `00003_settings_schema.sql` | Kolom kalibrasi sensor di `devices` |

### Tabel Inti

#### `profiles`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `full_name` | `text` | Nama tampilan |
| `email` | `text` | Lowercase enforced |
| `role` | `user_role` | `admin` \| `caregiver` \| `elder` \| `user` |
| `phone` | `text` | Opsional |
| `emergency_contact_1/2` | `text` | Kontak darurat |
| `avatar_url` | `text` | URL foto profil |

#### `devices`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | Pemilik |
| `mac_address` | `text` UNIQUE | MAC ESP32 |
| `name` | `text` | Contoh: `Hub-Alpha-01` |
| `battery_level` | `smallint` | 0–100 |
| `status` | `device_status` | `online` \| `offline` \| `low_battery` \| `error` |
| `fall_threshold_g` | `float` | Sensitivitas benturan |
| `angle_threshold_deg` | `float` | Batas kemiringan |
| `last_seen_at` | `timestamptz` | Heartbeat terakhir |

#### `vital_logs`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `device_id` | `uuid` FK | Sumber perangkat |
| `user_id` | `uuid` FK | Subjek pemantauan |
| `heart_rate_bpm` | `smallint` | BPM |
| `spo2_percent` | `smallint` | SpO₂ % |
| `recorded_at` | `timestamptz` | Timestamp sensor |

#### `emergency_events`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `fall_type` | `fall_type` | `hard` \| `soft` |
| `classification` | `event_classification` | `confirmed_fall`, `suspected_fall`, dll. |
| `handled_status` | `handled_status` | `pending` → `resolved` workflow |
| `triggered_at` | `timestamptz` | Waktu insiden |

TypeScript mirror: [`mobile-app/src/types/supabase.ts`](mobile-app/src/types/supabase.ts)

### RBAC Ringkas

| Role | Akses Mobile |
|------|--------------|
| `admin` | Admin Dashboard — semua device & emergency |
| `user`, `caregiver`, `elder` | Monitoring personal, history, settings |

---

## Aplikasi Mobile

### Navigasi (Expo Router)

```
src/app/
├── _layout.tsx          # Root: splash, fonts, EmergencyOverlay, providers
├── index.tsx            # Auth gate → SplashAuth / Admin / tabs
├── settings.tsx         # Pengaturan & akun
├── history.tsx          # Riwayat full-screen
└── (tabs)/
    ├── monitoring.tsx   # Dashboard live vitals
    ├── insights.tsx     # Analytics & chart
    ├── activity.tsx     # Riwayat detail (embedded HistoryScreen)
    └── care.tsx         # Menu pintasan caregiver
```

### Atomic Design

```
src/components/
├── atoms/       Button, TextInput, Skeleton, BrandLogo, ShieldIcon, GlassCard
├── molecules/   EmptyState, ConfirmBottomSheet, MonitoringSkeleton, AuthFormField
├── organisms/   AppHeader, SosFab, EmergencyOverlay, CustomTabBar, AuthForm
└── providers/   AppProviders (GestureHandler + BottomSheet + ErrorBoundary)
```

### Layar Utama

| Screen | File | Fungsi |
|--------|------|--------|
| Splash + Auth | `SplashAuthScreen.tsx` | Login / register, brand card UI |
| Monitoring | `DashboardScreen.tsx` | Live BPM, SpO₂, aktivitas, Panggil Bantuan |
| Insights | `InsightsScreen.tsx` | Rata-rata vital, tren 24 jam |
| Activity | `HistoryScreen.tsx` | Timeline insiden & vital |
| Care | `CareScreen.tsx` | Grid 4×2 quick actions |
| Settings | `SettingsScreen.tsx` | Profil, kontak darurat, kalibrasi |
| Admin | `AdminDashboardScreen.tsx` | Multi-tenant oversight |

---

## Struktur Repository

```
Terracare/
├── README.md                          # Dokumentasi utama (file ini)
├── FINAL_TECHNICAL_SUMMARY.md         # Ringkasan teknis sidang skripsi
├── desainapp.md                       # Design system UI/UX (referensi)
│
├── mobile-app/                        # Aplikasi React Native (Expo)
│   ├── src/
│   │   ├── app/                       # Expo Router routes
│   │   ├── components/                # Atomic design components
│   │   ├── constants/                 # Theme, demo-config, auth-theme
│   │   ├── hooks/                     # useDemoData, color scheme
│   │   ├── lib/supabase.ts            # Supabase client (SecureStore)
│   │   ├── screens/                   # Screen compositions
│   │   ├── services/MockDataService.ts
│   │   ├── store/auth-store.ts        # Zustand auth + RBAC routing
│   │   ├── types/supabase.ts          # Database TypeScript types
│   │   └── utils/                     # haptics, greeting
│   ├── babel.config.js                # NativeWind + Reanimated
│   ├── metro.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
│
├── supabase/
│   ├── migrations/                    # SQL migrations (00001–00003)
│   └── reset_manual.sql               # Reset manual (SQL Editor only)
│
├── firmware/
│   └── main.ino                       # ESP32 firmware (FSM + Supabase ingest)
│
└── scripts/
    ├── simulate_esp32.js              # Hardware-less integration test
    └── .env.example
```

---

## Prasyarat

### Umum

- **Node.js** 20 LTS atau lebih baru
- **npm** 10+ (atau pnpm/yarn)
- Akun **Supabase** (cloud) — [supabase.com](https://supabase.com)
- **Git**

### Mobile Development

- [Expo CLI](https://docs.expo.dev/get-started/installation/) via `npx expo`
- **Expo Go** SDK 56 di perangkat fisik ([expo.dev/go](https://expo.dev/go?sdkVersion=56)) *atau* iOS Simulator / Android Emulator
- Perangkat dan komputer dev di **WiFi yang sama** (atau gunakan `--tunnel`)

### Firmware (Opsional)

- **Arduino IDE** atau **PlatformIO**
- Board **ESP32** + sensor MPU6050 + MAX30102
- Kabel USB + driver CH340/CP2102

### Supabase Lokal (Opsional)

- **Docker Desktop** (untuk `supabase start` lokal)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## Setup & Instalasi

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/valdomuhammaddd/Terracare.git
cd Terracare
```

### Langkah 2 — Supabase Cloud (Disarankan untuk Sidang)

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor** → jalankan migrasi berurutan:
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rbac_policies.sql`
   - `supabase/migrations/00003_settings_schema.sql`
3. Salin **Project URL** dan **anon public key** dari **Settings → API**.
4. *(Opsional)* Matikan **Confirm email** di **Authentication → Providers → Email** agar registrasi langsung bisa login.

### Langkah 3 — Mobile App

```bash
cd mobile-app
npm install
cp .env.example .env
```

Edit `mobile-app/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_DEMO_MODE=true
```

Jalankan:

```bash
npx expo start -c
```

| Platform | Perintah |
|----------|----------|
| iOS Simulator | Tekan `i` |
| Android Emulator | Tekan `a` |
| Perangkat fisik | Scan QR dengan Expo Go SDK 56 |

Type-check:

```bash
npx tsc --noEmit
```

### Langkah 4 — Buat Akun Pengguna

1. Buka app → **Daftar sekarang**
2. Isi nama, email, password (min. 6 karakter)
3. Login → redirect ke tab **Monitoring**

Atau buat user manual di Supabase Dashboard → **Authentication → Users → Add user** (centang **Auto Confirm**).

### Langkah 5 — Supabase Lokal (Alternatif)

```bash
# Dari root repo, jika Supabase CLI terpasang:
supabase init          # first time only
supabase start
supabase db reset      # apply migrations
```

| Service | URL |
|---------|-----|
| API | `http://127.0.0.1:54321` |
| Studio | `http://127.0.0.1:54323` |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

---

## Variabel Lingkungan

### Mobile (`mobile-app/.env`)

| Variabel | Wajib | Deskripsi |
|----------|-------|-----------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | URL project Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon/public key (aman di client) |
| `EXPO_PUBLIC_DEMO_MODE` | ❌ | `true` (default) = mock data saat offline; `false` = matikan |

> **Jangan** commit file `.env` — sudah tercantum di `.gitignore`.

### Simulator (`scripts/.env`)

| Variabel | Deskripsi |
|----------|-----------|
| `SUPABASE_URL` | URL Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key (**server only**) |
| `TEST_USER_ID` | UUID user untuk simulasi |
| `TEST_DEVICE_MAC` | MAC address device (default `AA:BB:CC:DD:EE:01`) |

---

## Demo Mode (Sidang / Presentasi)

Saat **ESP32 belum terhubung** atau database kosong, app otomatis menampilkan data realistis:

| Data Mock | Nilai |
|-----------|-------|
| Detak jantung | 78 BPM |
| SpO₂ | 98% |
| Status device | Online |
| Device | Hub-Alpha-01 |
| Activity logs | Sistem Terhubung, Deteksi Normal, Mode Pantauan Aktif |

**Aktifkan:** `EXPO_PUBLIC_DEMO_MODE=true` (default)  
**Nonaktifkan:** `EXPO_PUBLIC_DEMO_MODE=false`

Implementasi:

- [`mobile-app/src/constants/demo-config.ts`](mobile-app/src/constants/demo-config.ts)
- [`mobile-app/src/services/MockDataService.ts`](mobile-app/src/services/MockDataService.ts)
- [`mobile-app/src/hooks/useDemoData.ts`](mobile-app/src/hooks/useDemoData.ts)

Data real dari Supabase **tetap diprioritaskan** jika tersedia.

---

## Simulator ESP32 (Tanpa Hardware)

```bash
cd scripts
cp .env.example .env
# Isi SUPABASE_URL, SUPABASE_SERVICE_KEY, TEST_USER_ID
npm install
node simulate_esp32.js
```

Simulator akan:

1. Register/update device di Supabase
2. Stream `vital_logs` setiap 3 detik
3. Trigger `emergency_events` setelah ~15 detik (untuk test overlay)

---

## Firmware ESP32

1. Buka [`firmware/main.ino`](firmware/main.ino)
2. Set WiFi credentials, `SUPABASE_URL`, device UUID, user UUID, MAC address
3. Flash ke ESP32 via Arduino IDE
4. Pastikan row `devices` ada di Supabase dengan `mac_address` yang cocok

> **Production:** Jangan embed `service_role` key di firmware. Gunakan Supabase Edge Function sebagai proxy ingest.

---

## Keamanan & Privasi Data

| Kontrol | Status |
|---------|--------|
| Row-Level Security (RLS) | ✅ Semua tabel klinis |
| JWT Auth (Supabase Auth) | ✅ Mobile client |
| Session storage | ✅ Expo SecureStore (native) |
| HTTPS only | ✅ ESP32 WiFiClientSecure |
| Audit trail emergency | ✅ `handled_status` workflow |
| Service role di firmware | ⚠️ Lab/thesis only — gunakan Edge Function di produksi |

Kebijakan akses:

- Caregiver hanya membaca device & vitals miliknya (RLS `auth.uid()`)
- Admin via fungsi `is_admin()` SECURITY DEFINER
- Kontak darurat hanya editable oleh pemilik profil

---

## Alur Demo Sidang Skripsi

| # | Aksi | Hasil yang Diharapkan |
|---|------|------------------------|
| 1 | Cold start app | Splash → login (atau langsung tabs jika session ada) |
| 2 | Login / Register | Kartu auth TerraCare → tab Monitoring |
| 3 | Tab Monitoring | **LIVE CONNECTED**, 78 BPM, 98% SpO₂, activity logs |
| 4 | Tab Insights | Rata-rata vital + chart tren 24 jam |
| 5 | Tab Activity | 3 riwayat pemeriksaan vital |
| 6 | Tab Care → Track | Bottom sheet lokasi simulasi (bukan error GPS) |
| 7 | SOS FAB | Haptic error + bottom sheet konfirmasi 119 |
| 8 | Settings | Menu informatif + simpan kontak darurat |
| 9 | *(Opsional)* Simulator | Emergency overlay dari `simulate_esp32.js` |

---

## Troubleshooting

### App tampil tanpa styling (teks polos)

NativeWind membutuhkan `babel.config.js`. Restart dengan cache clear:

```bash
cd mobile-app && npx expo start -c
```

### Status OFFLINE / data `--`

- Pastikan `EXPO_PUBLIC_DEMO_MODE=true`
- Atau jalankan `scripts/simulate_esp32.js`
- Atau daftarkan device di Supabase + flash ESP32

### "Cannot connect to Expo CLI"

Warning dev server — bukan bug app. Solusi:

- HP dan laptop **WiFi sama**
- Atau: `npx expo start --tunnel`
- Warning di-suppress via `LogBox` di production demo

### Expo Go tidak kompatibel

TerraCare memakai **Expo SDK 56**. Install Expo Go versi 56 dari [expo.dev/go](https://expo.dev/go?sdkVersion=56).

### Login gagal / email not confirmed

Supabase Dashboard → Authentication → Providers → Email → nonaktifkan **Confirm email**, atau konfirmasi email user.

### Migrasi SQL error 42P01

Jalankan migrasi **berurutan** (00001 → 00002 → 00003). Gunakan `supabase/reset_manual.sql` hanya di SQL Editor untuk reset dev.

---

## Roadmap

| Fase | Fitur |
|------|-------|
| **v1.0** ✅ | Fall detection, realtime vitals, emergency workflow, demo mode |
| **v1.1** | Predictive analytics (ML risk score) |
| **v1.2** | FHIR/EMR integration (SIMRS) |
| **v1.3** | BLE beacon indoor positioning |

---

## Dokumentasi Terkait

| Dokumen | Lokasi |
|---------|--------|
| Ringkasan teknis sidang | [`FINAL_TECHNICAL_SUMMARY.md`](FINAL_TECHNICAL_SUMMARY.md) |
| Design system UI | [`desainapp.md`](desainapp.md) |
| Mobile app quick start | [`mobile-app/README.md`](mobile-app/README.md) |
| Database types | [`mobile-app/src/types/supabase.ts`](mobile-app/src/types/supabase.ts) |

---

## Lisensi

Lihat [`mobile-app/LICENSE`](mobile-app/LICENSE).

---

<p align="center">
  <strong>TerraCare</strong> — <em>Empathetic Precision for Elder Care</em><br/>
  Dikembangkan oleh <strong>PT TERRA DIGITAL SYSTEM</strong>
</p>
