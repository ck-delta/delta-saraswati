import { create } from 'zustand';

// ---------------------------------------------------------------------------
// UI Store — sidebar state, mobile menu, hydration
// Dark mode only — no theme toggling.
// ---------------------------------------------------------------------------

interface UIState {
  theme: 'dark';
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  hydrated: boolean;
}

interface UIActions {
  toggleTheme: () => void;
  setTheme: (theme: 'dark') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'delta-saraswati-ui';

function persistUI(state: Pick<UIState, 'sidebarCollapsed'>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sidebarCollapsed: state.sidebarCollapsed }),
    );
  } catch {
    // localStorage may be unavailable
  }
}

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  // ---------- State ----------
  theme: 'dark',
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  hydrated: false,

  // ---------- Actions ----------
  // Theme is always dark — these are no-ops retained for API compatibility
  toggleTheme: () => {},
  setTheme: () => {},

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    persistUI({ sidebarCollapsed: next });
    set({ sidebarCollapsed: next });
  },

  setSidebarCollapsed: (collapsed) => {
    persistUI({ sidebarCollapsed: collapsed });
    set({ sidebarCollapsed: collapsed });
  },

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Pick<UIState, 'sidebarCollapsed'>>;
        const sidebarCollapsed = parsed.sidebarCollapsed ?? false;
        set({ sidebarCollapsed, hydrated: true });
        return;
      }
    } catch {
      // Ignore corrupt data
    }
    set({ hydrated: true });
  },
}));
