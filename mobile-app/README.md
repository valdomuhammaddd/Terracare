# TerraCare Mobile App

<p align="center">
  <strong>React Native · Expo SDK 56 · Supabase · NativeWind</strong><br/>
  Caregiver dashboard untuk ekosistem TerraCare
</p>

> Dokumentasi lengkap monorepo: [`../README.md`](../README.md)

---

## Ringkasan

Aplikasi mobile TerraCare menyediakan antarmuka caregiver untuk:

- Pemantauan vital real-time (BPM, SpO₂, baterai device)
- Emergency overlay otomatis saat insiden jatuh terdeteksi
- Riwayat aktivitas & insights kesehatan
- Pengaturan kontak darurat dan kalibrasi sensor ESP32
- **Demo Mode** untuk presentasi sidang tanpa hardware

---

## Quick Start

```bash
cd mobile-app
npm install
cp .env.example .env
# Edit .env — isi SUPABASE_URL, ANON_KEY, DEMO_MODE=true
npx expo start -c
```

Scan QR dengan **Expo Go SDK 56** atau tekan `i` / `a` untuk simulator.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon public key |
| `EXPO_PUBLIC_DEMO_MODE` | `true` = mock data when offline (default) |

---

## Scripts

| Command | Action |
|---------|--------|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS |
| `npx tsc --noEmit` | TypeScript check |

---

## Struktur `src/`

```
src/
├── app/              Expo Router (tabs, auth gate, settings)
├── components/       atoms · molecules · organisms
├── constants/        demo-config, auth-theme, theme
├── hooks/            useDemoData, color scheme
├── lib/supabase.ts   Supabase client
├── screens/          Dashboard, History, Settings, ...
├── services/         MockDataService
├── store/            auth-store (Zustand)
├── types/            supabase.ts (DB types)
└── utils/            haptics, greeting
```

---

## Tab Navigation

| Tab | Screen | Route |
|-----|--------|-------|
| Monitoring | Live vitals dashboard | `/(tabs)/monitoring` |
| Insights | Analytics & charts | `/(tabs)/insights` |
| Activity | History timeline | `/(tabs)/activity` |
| Care | Quick action grid | `/(tabs)/care` |

Global **SOS FAB** tersedia di semua tab.

---

## Tech Highlights

- **NativeWind v4** + `babel.config.js` + `metro.config.js`
- **@gorhom/bottom-sheet** untuk konfirmasi (SOS, logout, info)
- **expo-haptics** untuk feedback taktil
- **Skeleton loaders** (Reanimated) menggantikan spinner
- **ErrorBoundary** untuk crash graceful
- **Auth-aware splash** via `expo-splash-screen` + Zustand

---

## Demo Mode

Saat device offline atau database kosong, app menampilkan:

- 78 BPM · 98% SpO₂ · status Online · Hub-Alpha-01
- Activity logs & history mock

Lihat [`src/services/MockDataService.ts`](src/services/MockDataService.ts).

---

## Lisensi

See [LICENSE](./LICENSE).
