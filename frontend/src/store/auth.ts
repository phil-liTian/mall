import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TOKEN_KEY = 'mall_admin_token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

interface AdminInfo {
  username: string
  nickName?: string
  icon?: string
  menus?: unknown[]
  roles?: string[]
}

interface AuthState {
  info: AdminInfo | null
  setInfo: (info: AdminInfo | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      info: null,
      setInfo: (info) => set({ info }),
    }),
    { name: 'mall_admin_info' },
  ),
)
