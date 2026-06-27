import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  isAuthenticated: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false, error: error.message, isAuthenticated: false });
      return;
    }
    set({ isLoading: false, isAuthenticated: true, error: null });
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ isLoading: false, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
