import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SearchState {
  historyList: string[]
  addKeyword: (keyword: string) => void
  removeKeyword: (keyword: string) => void
  clearHistory: () => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      historyList: [],
      addKeyword: (keyword) => {
        const trimmed = keyword.trim()
        if (!trimmed) return
        set((state) => {
          const list = state.historyList.filter((item) => item !== trimmed)
          list.unshift(trimmed)
          return { historyList: list.slice(0, 10) }
        })
      },
      removeKeyword: (keyword) =>
        set((state) => ({ historyList: state.historyList.filter((item) => item !== keyword) })),
      clearHistory: () => set({ historyList: [] }),
    }),
    { name: 'mall_h5_search' },
  ),
)
