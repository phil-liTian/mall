import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginAPI, getMemberInfoAPI } from '@/api/member'
import type { MemberInfo } from '@/types/member'

const TOKEN_KEY = 'mall_h5_token'

interface MemberState {
  memberInfo: MemberInfo | null
  token: string
  hasLogin: boolean
  login: (username: string, password: string) => Promise<void>
  fetchMemberInfo: () => Promise<void>
  setMemberInfo: (info: MemberInfo | null) => void
  logout: () => void
}

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      memberInfo: null,
      token: '',
      hasLogin: false,
      login: async (username, password) => {
        const loginData = await loginAPI({ username, password })
        const token = `${loginData.tokenHead}${loginData.token}`
        localStorage.setItem(TOKEN_KEY, token)
        set({ token, hasLogin: true })
        await get().fetchMemberInfo()
      },
      fetchMemberInfo: async () => {
        const info = await getMemberInfoAPI()
        set({ memberInfo: info })
      },
      setMemberInfo: (info) => set({ memberInfo: info }),
      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        set({ memberInfo: null, token: '', hasLogin: false })
      },
    }),
    {
      name: 'mall_h5_member',
      partialize: (state) => ({ memberInfo: state.memberInfo, token: state.token, hasLogin: state.hasLogin }),
    },
  ),
)
