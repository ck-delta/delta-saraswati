import { create } from "zustand";

interface AppState {
  selectedToken: string | null;
  setSelectedToken: (symbol: string) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  tradeModalOpen: boolean;
  tradeModalToken: string | null;
  openTradeModal: (symbol: string) => void;
  closeTradeModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedToken: null,
  setSelectedToken: (symbol) => set({ selectedToken: symbol }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  tradeModalOpen: false,
  tradeModalToken: null,
  openTradeModal: (symbol) => set({ tradeModalOpen: true, tradeModalToken: symbol }),
  closeTradeModal: () => set({ tradeModalOpen: false, tradeModalToken: null }),
}));
