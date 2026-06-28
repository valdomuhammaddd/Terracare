export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function getHealthStatus(bpm: number | null, spo2: number | null): {
  label: string;
  isStable: boolean;
} {
  if (bpm === null || spo2 === null) {
    return { label: 'MENUNGGU', isStable: false };
  }
  if (bpm > 100 || spo2 < 92) {
    return { label: 'PERHATIAN', isStable: false };
  }
  return { label: 'STABIL', isStable: true };
}
