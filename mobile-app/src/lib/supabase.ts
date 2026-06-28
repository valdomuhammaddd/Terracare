import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** In-memory fallback for Expo web SSR in Node (no window/localStorage). */
const memoryStorage = new Map<string, string>();

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (hasBrowserStorage()) {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    if (Platform.OS !== 'web') {
      return SecureStore.getItemAsync(key);
    }
    return Promise.resolve(memoryStorage.get(key) ?? null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (hasBrowserStorage()) {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    if (Platform.OS !== 'web') {
      return SecureStore.setItemAsync(key, value);
    }
    memoryStorage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    if (hasBrowserStorage()) {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    if (Platform.OS !== 'web') {
      return SecureStore.deleteItemAsync(key);
    }
    memoryStorage.delete(key);
    return Promise.resolve();
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
