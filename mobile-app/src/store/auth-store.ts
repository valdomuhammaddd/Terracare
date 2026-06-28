import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/supabase';
import { useEmergencyUiStore } from '@/store/emergency-ui-store';

/** Normalized app role used for routing (admin vs standard user). */
export type AppRole = 'admin' | 'user';

interface AuthState {
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  profile: Profile | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
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

let bootstrapPromise: Promise<void> | null = null;
let authListenerRegistered = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthReady: false,
  isAuthenticated: false,
  user: null,
  session: null,
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
        user: null,
        session: null,
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
      user: data.user,
      session: data.session,
      userRole: appRole,
      profile,
      error: null,
    });
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error || !data.user) {
      set({
        isLoading: false,
        error: error?.message ?? 'Pendaftaran gagal',
        isAuthenticated: false,
        user: null,
        session: null,
        userRole: null,
        profile: null,
      });
      return;
    }

    if (!data.session) {
      set({
        isLoading: false,
        error: 'Akun dibuat. Periksa email Anda untuk verifikasi, lalu masuk.',
        isAuthenticated: false,
        user: null,
        session: null,
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
      user: data.user,
      session: data.session,
      userRole: appRole,
      profile,
      error: null,
    });
  },

  signOut: async () => {
    set({ isLoading: true });
    useEmergencyUiStore.getState().reset();
    await supabase.auth.signOut();
    set({
      isLoading: false,
      isAuthenticated: false,
      isAuthReady: true,
      user: null,
      session: null,
      userRole: null,
      profile: null,
      error: null,
    });
  },

  initializeAuth: async () => {
    if (get().isAuthReady) return;
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
      set({ isLoading: true });

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchProfileForUser(session.user.id);
          const appRole = profile ? normalizeAppRole(profile.role) : 'user';

          set({
            isAuthenticated: true,
            user: session.user,
            session,
            userRole: appRole,
            profile,
          });
        } else {
          set({
            isAuthenticated: false,
            user: null,
            session: null,
            userRole: null,
            profile: null,
          });
        }
      } finally {
        set({ isAuthReady: true, isLoading: false });
      }

      if (!authListenerRegistered) {
        authListenerRegistered = true;

        supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          if (nextSession?.user) {
            const profile = await fetchProfileForUser(nextSession.user.id);
            const appRole = profile ? normalizeAppRole(profile.role) : 'user';
            set({
              isAuthenticated: true,
              user: nextSession.user,
              session: nextSession,
              userRole: appRole,
              profile,
            });
          } else {
            set({
              isAuthenticated: false,
              user: null,
              session: null,
              userRole: null,
              profile: null,
            });
          }
        });
      }
    })();

    return bootstrapPromise;
  },

  clearError: () => set({ error: null }),
}));
