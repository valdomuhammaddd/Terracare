/**
 * TerraCare Supabase database schema — strict TypeScript interfaces.
 * Mirrors PostgreSQL tables: profiles, devices, vital_logs, emergency_events.
 */

// ---------------------------------------------------------------------------
// Enums & union types
// ---------------------------------------------------------------------------

export type UserRole = 'caregiver' | 'elder' | 'admin';

export type DeviceStatus = 'online' | 'offline' | 'low_battery' | 'error';

export type FallType = 'hard' | 'soft';

export type EventClassification =
  | 'confirmed_fall'
  | 'suspected_fall'
  | 'false_positive'
  | 'manual_trigger';

export type HandledStatus = 'pending' | 'acknowledged' | 'resolved' | 'escalated';

// ---------------------------------------------------------------------------
// Row interfaces
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  mac_address: string;
  name: string;
  battery_level: number;
  status: DeviceStatus;
  firmware_version: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VitalLog {
  id: string;
  device_id: string;
  user_id: string;
  heart_rate_bpm: number;
  spo2_percent: number;
  recorded_at: string;
  created_at: string;
}

export interface EmergencyEvent {
  id: string;
  device_id: string;
  user_id: string;
  fall_type: FallType;
  classification: EventClassification;
  handled_status: HandledStatus;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  triggered_at: string;
  handled_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Insert / Update helpers (omit server-generated fields)
// ---------------------------------------------------------------------------

export type ProfileInsert = Pick<Profile, 'id' | 'full_name' | 'email'> &
  Partial<Pick<Profile, 'phone' | 'avatar_url' | 'role'>>;

export type ProfileUpdate = Partial<
  Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'role'>
>;

export type DeviceInsert = Pick<
  Device,
  'user_id' | 'mac_address' | 'name' | 'battery_level' | 'status'
> &
  Partial<Pick<Device, 'firmware_version' | 'last_seen_at'>>;

export type DeviceUpdate = Partial<
  Pick<Device, 'name' | 'battery_level' | 'status' | 'firmware_version' | 'last_seen_at'>
>;

export type VitalLogInsert = Pick<
  VitalLog,
  'device_id' | 'user_id' | 'heart_rate_bpm' | 'spo2_percent' | 'recorded_at'
>;

export type EmergencyEventInsert = Pick<
  EmergencyEvent,
  'device_id' | 'user_id' | 'fall_type' | 'classification' | 'triggered_at'
> &
  Partial<
    Pick<EmergencyEvent, 'handled_status' | 'latitude' | 'longitude' | 'notes'>
  >;

export type EmergencyEventUpdate = Partial<
  Pick<EmergencyEvent, 'classification' | 'handled_status' | 'handled_at' | 'notes'>
>;

// ---------------------------------------------------------------------------
// Supabase Database generic (for typed client)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      devices: {
        Row: Device;
        Insert: DeviceInsert;
        Update: DeviceUpdate;
        Relationships: [];
      };
      vital_logs: {
        Row: VitalLog;
        Insert: VitalLogInsert;
        Update: Partial<VitalLogInsert>;
        Relationships: [];
      };
      emergency_events: {
        Row: EmergencyEvent;
        Insert: EmergencyEventInsert;
        Update: EmergencyEventUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
