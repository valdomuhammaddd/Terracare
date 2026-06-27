import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/supabase';

/** Normalized app role used for routing (admin vs standard user). */
export type AppRole = 'admin' | 'user';

interface AuthState {
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  userRole: AppRole | null;
  profile: Profile | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

function normalizeAppRole(role: UserRole): AppRole {
  return role === 'admin' ? 'admin' : 'user';
}

async function fetchProfileForUser(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: false,
  isAuthReady: false,
  isAuthenticated: false,
  userRole: null,
  profile: null,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      set({
        isLoading: false,
        error: error?.message ?? 'Login gagal',
        isAuthenticated: false,
        userRole: null,
        profile: null,
      });
      return;
    }

    const profile = await fetchProfileForUser(data.user.id);
    const appRole = profile ? normalizeAppRole(profile.role) : 'user';

    set({
      isLoading: false,
      isAuthenticated: true,
      userRole: appRole,
      profile,
      error: null,
    });
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({
      isLoading: false,
      isAuthenticated: false,
      isAuthReady: true,
      userRole: null,
      profile: null,
      error: null,
    });
  },

  initializeAuth: async () => {
    if (get().isAuthReady) return;

    set({ isLoading: true });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await fetchProfileForUser(session.user.id);
      const appRole = profile ? normalizeAppRole(profile.role) : 'user';

      set({
        isAuthenticated: true,
        userRole: appRole,
        profile,
        isAuthReady: true,
        isLoading: false,
      });
    } else {
      set({
        isAuthenticated: false,
        userRole: null,
        profile: null,
        isAuthReady: true,
        isLoading: false,
      });
    }

    supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user) {
        const profile = await fetchProfileForUser(nextSession.user.id);
        const appRole = profile ? normalizeAppRole(profile.role) : 'user';
        set({
          isAuthenticated: true,
          userRole: appRole,
          profile,
        });
      } else {
        set({
          isAuthenticated: false,
          userRole: null,
          profile: null,
        });
      }
    });
  },

  clearError: () => set({ error: null }),
}));
