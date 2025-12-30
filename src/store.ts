import { create } from 'zustand'

interface AppState {
  // UI state
  highlightedSetIndex: number | null
  setHighlightedSetIndex: (index: number | null) => void
  
  // Settings
  settings: {
    showAllBoxes: boolean
    confidenceThreshold: number
  }
  updateSettings: (settings: Partial<AppState['settings']>) => void
}

export const useStore = create<AppState>((set) => ({
  // UI state
  highlightedSetIndex: null,
  setHighlightedSetIndex: (index) => set({ highlightedSetIndex: index }),
  
  // Settings
  settings: {
    showAllBoxes: true,
    confidenceThreshold: 0.5,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}))
