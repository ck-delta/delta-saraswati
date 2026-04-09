import { create } from 'zustand';

// ---------------------------------------------------------------------------
// UI Store — theme, sidebar collapsed state, hydration from localStorage
// ---------------------------------------------------------------------------

interface UIState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  hydrated: boolean;
}

interface UIActions {
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'delta-saraswati-ui';

function applyThemeToDOM(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
}

function persistUI(state: Pick<UIState, 'theme' | 'sidebarCollapsed'>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
    );
  } catch {
    // localStorage may be unavailable (e.g. private browsing quota exceeded)
  }
}

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  // ---------- State ----------
  theme: 'dark',
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  hydrated: false,

  // ---------- Actions ----------
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyThemeToDOM(next);
    persistUI({ theme: next, sidebarCollapsed: get().sidebarCollapsed });
    set({ theme: next });
  },

  setTheme: (theme) => {
    applyThemeToDOM(theme);
    persistUI({ theme, sidebarCollapsed: get().sidebarCollapsed });
    set({ theme });
  },

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    persistUI({ theme: get().theme, sidebarCollapsed: next });
    set({ sidebarCollapsed: next });
  },

  setSidebarCollapsed: (collapsed) => {
    persistUI({ theme: get().theme, sidebarCollapsed: collapsed });
    set({ sidebarCollapsed: collapsed });
  },

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Pick<UIState, 'theme' | 'sidebarCollapsed'>>;
        const theme = parsed.theme === 'light' ? 'light' : 'dark';
        const sidebarCollapsed = parsed.sidebarCollapsed ?? false;
        applyThemeToDOM(theme);
        set({ theme, sidebarCollapsed, hydrated: true });
        return;
      }
    } catch {
      // Ignore corrupt data
    }
    // Default: dark mode, sidebar expanded
    applyThemeToDOM('dark');
    set({ hydrated: true });
  },
}));
