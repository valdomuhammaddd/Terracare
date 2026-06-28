<div align="center">

# 🌿 TerraCare Mobile

### *Dashboard caregiver — jaga keluarga dari genggaman*

<img src="https://img.shields.io/badge/Expo_SDK-56-000020?style=for-the-badge&logo=expo" />
<img src="https://img.shields.io/badge/Demo_Mode-ON-006948?style=for-the-badge&labelColor=85f8c4" />
<img src="https://img.shields.io/badge/Family_SOS-Ready-ba1a1a?style=for-the-badge&labelColor=ffdad6" />

<br/>

📖 Dokumentasi lengkap: [`../README.md`](../README.md)

</div>

---

## 👨‍👩‍👧 Simulasi 2 Menit (Sidang)

```
1. npx expo start -c          → Scan QR
2. Daftar / Login             → Tab Monitoring (78 BPM · 98% SpO₂)
3. Settings → Hubungkan       → TC-ALPHA-01 → Hubungkan ✅
4. Tap SOS FAB merah          → Konfirmasi → Overlay keluarga
5. Settings → Keluar          → Login screen bersih (no red overlay)
```

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Isi SUPABASE_URL · ANON_KEY · DEMO_MODE=true
npx expo start -c
```

---

## 🎨 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 💓 **Monitoring** | Live vitals · Panggil Bantuan · Notifikasi |
| 🆘 **SOS FAB** | Haptic → Confirm → Family overlay → Supabase |
| 🔗 **Device Claim** | Serial `TC-ALPHA-01` — tanpa BLE |
| 🛡 **Demo Mode** | Mock data · silent errors · sidang-safe |
| 📋 **Care Grid** | 8 pintasan · Coming Soon sheets |
| ⚙️ **Settings** | Kontak darurat · logout · kebijakan privasi |

---

## 📁 Struktur `src/`

```
src/
├── app/           Expo Router (tabs · auth · settings)
├── components/    atoms · molecules · organisms
├── screens/       Dashboard · Care · History · Settings
├── services/      emergency-service · device-claim · MockData
├── store/         auth-store · emergency-ui-store
└── constants/     demo-config · auth-theme
```

---

## 🔧 Scripts

| Command | Action |
|---------|--------|
| `npx expo start -c` | Dev server (cache clear) |
| `npx tsc --noEmit` | TypeScript check |
| `npm run ios` | iOS simulator |
| `npm run android` | Android emulator |

---

## 🛡 Kill Switches (Defense-Ready)

| # | Proteksi |
|---|----------|
| 1 | SOS manual ≠ overlay jatuh (`manual_trigger` filtered) |
| 2 | Logout reset emergency UI state |
| 3 | Demo mode = no Alert popups on Supabase errors |

---

<div align="center">

**🌿 TerraCare Mobile** · PT TERRA DIGITAL SYSTEM

*Made with 💚 for families who care*

</div>
