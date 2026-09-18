import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'auto'

// vben 内置主色板
export const presetColors: { name: string; color: string }[] = [
  { name: '默认', color: '#1677ff' },
  { name: '紫罗兰', color: '#8b5cf6' },
  { name: '樱花粉', color: '#ee4f80' },
  { name: '柠檬黄', color: '#f0c752' },
  { name: '天蓝色', color: '#3b82f6' },
  { name: '浅绿色', color: '#10b981' },
  { name: '锌色灰', color: '#6b7280' },
  { name: '深绿色', color: '#0f9d8c' },
  { name: '深蓝色', color: '#0958d9' },
  { name: '橙黄色', color: '#e8590c' },
  { name: '玫瑰红', color: '#c81e1e' },
  { name: '中性色', color: '#52525b' },
]

interface PrefState {
  mode: ThemeMode
  primaryColor: string
  darkSider: boolean
  showTabs: boolean
  setMode: (mode: ThemeMode) => void
  setPrimaryColor: (color: string) => void
  setDarkSider: (v: boolean) => void
  setShowTabs: (v: boolean) => void
  reset: () => void
}

const defaults = {
  mode: 'dark' as ThemeMode,
  primaryColor: '#1677ff',
  darkSider: true,
  showTabs: true,
}

export const usePrefStore = create<PrefState>()(
  persist(
    (set) => ({
      ...defaults,
      setMode: (mode) => set({ mode }),
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
      setDarkSider: (darkSider) => set({ darkSider }),
      setShowTabs: (showTabs) => set({ showTabs }),
      reset: () => set({ ...defaults }),
    }),
    { name: 'mall_admin_pref' },
  ),
)

// 系统是否处于深色偏好
export function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

// 解析当前实际是否深色（auto 跟随系统）
export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'auto') return systemPrefersDark()
  return mode === 'dark'
}
