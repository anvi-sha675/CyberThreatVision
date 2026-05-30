import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      // 🔥 ADD THIS
      _hasHydrated: false,

      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "ctv-auth",

      partialize: (s) => ({
        token: s.token,
        user: s.user,
      }),

      // 🔥 ADD THIS BLOCK
      onRehydrateStorage: () => (state) => {
        state._hasHydrated = true;
      },
    }
  )
);

export const useThreatStore = create((set) => ({
  feed: [],
  alerts: [],
  connected: false,
  stats: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
  addThreat: (t) =>
    set((s) => {
      const feed = [t, ...s.feed].slice(0, 200);
      const sev = t.severity || "low";
      return {
        feed,
        stats: {
          ...s.stats,
          [sev]: (s.stats[sev] || 0) + 1,
          total: s.stats.total + 1,
        },
      };
    }),
  addAlert: (a) => set((s) => ({ alerts: [a, ...s.alerts].slice(0, 100) })),
  setConnected: (v) => set({ connected: v }),
  clearFeed: () =>
    set({
      feed: [],
      stats: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    }),
}));

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      offlineMode: true,
      soundEnabled: false,
      demoApiMode: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setOfflineMode: (v) => set({ offlineMode: v }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setDemoApiMode: (v) => set({ demoApiMode: v }),
    }),
    {
      name: "ctv-ui",
      partialize: (s) => ({
        offlineMode: s.offlineMode,
        soundEnabled: s.soundEnabled,
        demoApiMode: s.demoApiMode,
      }),
    },
  ),
);

export const useScanStore = create((set) => ({
  history: [],
  addScan: (scan) =>
    set((s) => ({
      history: [{ ...scan, id: Date.now() }, ...s.history].slice(0, 50),
    })),
  clearHistory: () => set({ history: [] }),
}));
