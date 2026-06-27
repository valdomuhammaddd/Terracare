# TerraCare

**Enterprise IoT Health Monitoring & Fall Detection for Elderly Care**

TerraCare is a production-grade platform that combines ESP32 wearable sensors, cloud-backed vital sign analytics, and a React Native caregiver dashboard. The system delivers **Event-Triggered Oximetry** (SpO₂ sampling only when motion or fall heuristics fire, preserving battery and reducing noise) and **Multi-stage Thresholding** (layered accelerometer + posture classifiers that distinguish hard falls, soft falls, and benign motion before escalating alerts).

---

## Executive Summary

| Capability | Description |
|---|---|
| **Event-Triggered Oximetry** | SpO₂ and heart-rate bursts are scheduled on-device only after IMU pre-thresholds or anomaly scores cross configured gates—avoiding continuous PPG drain. |
| **Multi-stage Thresholding** | Stage 1: high-pass jerk detection → Stage 2: orientation change & stillness window → Stage 3: optional oximetry confirmation → Stage 4: caregiver notification with severity tier. |
| **Real-time Care Loop** | ESP32 → Supabase (PostgreSQL + Realtime) → React Native app with sub-second vital streaming and emergency event push. |
| **Gojek-style UX** | High-contrast, rounded-corner mobile UI built with NativeWind; optimized for elderly caregivers and family members. |

---

## Architecture

```mermaid
flowchart TB
    subgraph Edge["Edge Layer (ESP32)"]
        IMU["IMU / Accelerometer"]
        PPG["PPG Oximeter"]
        ALG["Multi-stage Threshold Engine"]
        IMU --> ALG
        ALG -->|"Event-Triggered"| PPG
    end

    subgraph Cloud["Supabase Cloud"]
        REST["REST / Edge Functions"]
        PG[("PostgreSQL")]
        RT["Realtime Channels"]
        AUTH["Auth (JWT)"]
        REST --> PG
        PG --> RT
        AUTH --> REST
    end

    subgraph Client["React Native (Expo)"]
        APP["TerraCare Mobile App"]
        ZST["Zustand Auth Store"]
        APP --> ZST
    end

    ALG -->|"HTTPS POST vital_logs, emergency_events"| REST
    RT -->|"WebSocket subscription"| APP
    APP -->|"Sign in / session"| AUTH
```

**Data flow**

1. ESP32 firmware runs fall-detection and event-triggered oximetry locally, then POSTs structured payloads to Supabase (service role or device-scoped key).
2. Rows land in `vital_logs` and `emergency_events`; Supabase Realtime broadcasts `INSERT`/`UPDATE` to subscribed clients.
3. The React Native app authenticates via Supabase Auth, subscribes to device channels, and renders live vitals plus emergency workflows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Mobile** | React Native (Expo SDK 56), TypeScript (strict), Expo Router |
| **Styling** | Tailwind CSS via NativeWind (design tokens from `desainapp.md`) |
| **Backend** | Supabase — PostgreSQL, Auth, Realtime, Row Level Security |
| **State** | Zustand (lightweight session + UI state) |
| **IoT** | ESP32 (Wi-Fi), MAX30102 / MPU6050 class sensors |
| **Tooling** | Supabase CLI, TypeScript, EAS Build (optional) |

---

## Supabase Database Schema Overview

### `profiles`

Extends `auth.users` with caregiver/elder metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `full_name` | `text` | Display name |
| `role` | `text` | `caregiver` \| `elder` \| `admin` |
| `phone` | `text` | Optional contact |
| `avatar_url` | `text` | Storage URL |

### `devices`

Registered ESP32 hubs linked to a profile.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | Owner profile |
| `mac_address` | `text` UNIQUE | ESP32 MAC |
| `name` | `text` | e.g. `Hub-Alpha-01` |
| `battery_level` | `smallint` | 0–100 |
| `status` | `text` | `online` \| `offline` \| `low_battery` \| `error` |
| `last_seen_at` | `timestamptz` | Heartbeat |

### `vital_logs`

Time-series vitals from event-triggered oximetry windows.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `device_id` | `uuid` FK | Source device |
| `user_id` | `uuid` FK | Monitored elder |
| `heart_rate_bpm` | `smallint` | BPM |
| `spo2_percent` | `smallint` | SpO₂ % |
| `recorded_at` | `timestamptz` | Sensor timestamp |

### `emergency_events`

Fall and manual SOS events with handling workflow.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `device_id` | `uuid` FK | |
| `user_id` | `uuid` FK | |
| `fall_type` | `text` | `hard` \| `soft` |
| `classification` | `text` | `confirmed_fall` \| `suspected_fall` \| `false_positive` \| `manual_trigger` |
| `handled_status` | `text` | `pending` \| `acknowledged` \| `resolved` \| `escalated` |
| `triggered_at` | `timestamptz` | Event time |

TypeScript interfaces live in `mobile-app/src/types/supabase.ts`.

---

## Repository Structure

```
Terracare/
├── README.md                 # This file
├── desainapp.md              # UI/UX design system (60 atomic components)
├── mobile-app/               # Expo React Native application
│   ├── src/
│   │   ├── app/              # Expo Router entry points
│   │   ├── components/
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   └── organisms/
│   │   ├── lib/supabase.ts   # Supabase client
│   │   ├── screens/          # Screen-level compositions
│   │   ├── store/            # Zustand stores
│   │   └── types/supabase.ts # Database types
│   └── supabase/             # Migrations (via Supabase CLI)
└── firmware/                 # ESP32 (future)
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local Supabase stack)

### 1. Clone & install mobile app

```bash
git clone <repository-url> Terracare
cd Terracare/mobile-app
npm install
```

### 2. Environment variables

Create `mobile-app/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Copy keys from `supabase status` after starting local Supabase.

### 3. Start Supabase locally

```bash
cd mobile-app
npx supabase init          # first time only
npx supabase start
npx supabase db reset      # applies migrations + seed
```

Local services:

| Service | URL |
|---|---|
| API | `http://127.0.0.1:54321` |
| Studio | `http://127.0.0.1:54323` |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

### 4. Run the Expo app

```bash
cd mobile-app
npx expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go.

### 5. Type checking

```bash
cd mobile-app
npx tsc --noEmit
```

---

## Security Notes

- Enable **Row Level Security** on all public tables; caregivers may only read devices and vitals for linked elders.
- ESP32 devices should use scoped API keys or Edge Functions—never embed the service role key in firmware.
- All mobile ↔ Supabase traffic uses HTTPS and short-lived JWTs from Supabase Auth.

---

## License

See [mobile-app/LICENSE](mobile-app/LICENSE).
