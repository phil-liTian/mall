import { useEffect, useState, type ReactNode } from 'react'
import { ConfigProvider, theme as antdTheme, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { usePrefStore, resolveIsDark, systemPrefersDark } from '@/store/pref'

// 根据偏好设置动态提供 antd 主题；auto 模式监听系统深浅色变化
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = usePrefStore((s) => s.mode)
  const primaryColor = usePrefStore((s) => s.primaryColor)
  const [sysDark, setSysDark] = useState(systemPrefersDark())

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSysDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark = mode === 'auto' ? sysDark : resolveIsDark(mode)

  // 同步一个 class 到 html，供全局 css 微调
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
          borderRadius: 8,
        },
        cssVar: true,
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}
