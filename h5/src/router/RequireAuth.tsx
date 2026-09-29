import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMemberStore } from '@/store/member'

/** 需要登录才能访问的路由守卫 */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const hasLogin = useMemberStore((state) => state.hasLogin)
  const location = useLocation()

  if (!hasLogin) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return <>{children}</>
}
