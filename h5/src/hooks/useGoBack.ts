import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * 统一的返回逻辑。
 *
 * 直接打开链接、扫码进来或刷新页面时，history 里并没有站内的上一页，
 * 此时 navigate(-1) 会退出站点或原地不动 —— 返回按钮看着在、点了没反应。
 * 所以先判断有没有可退的站内历史，没有就回兜底页。
 *
 * @param fallback 没有站内历史可退时去哪，默认首页
 */
export const useGoBack = (fallback = '/') => {
  const navigate = useNavigate()

  return useCallback(() => {
    // react-router v6 在 history.state 上维护自增的 idx，
    // idx > 0 说明这个页面不是本次会话里的第一个站内页面
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
    } else {
      navigate(fallback, { replace: true })
    }
  }, [navigate, fallback])
}
