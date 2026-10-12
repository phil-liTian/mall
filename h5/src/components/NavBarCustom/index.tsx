import { NavBar, type NavBarProps } from 'antd-mobile'
import { useGoBack } from '@/hooks/useGoBack'
import './index.css'

interface NavBarCustomProps extends Omit<NavBarProps, 'onBack'> {
  showBack?: boolean
  /** 标题。NavBar 本身没有 title 属性，这里转成 children 渲染 */
  title?: React.ReactNode
  /** 没有站内历史可退时（直接打开链接、刷新）回退到哪个页面 */
  fallback?: string
}

/** 通用顶部导航栏，统一返回逻辑 */
export const NavBarCustom = ({
  showBack = true,
  fallback = '/',
  title,
  children,
  ...rest
}: NavBarCustomProps) => {
  const goBack = useGoBack(fallback)
  return (
    <NavBar
      className="navbar-custom"
      onBack={goBack}
      backIcon={showBack}
      // back 不为 null 时 NavBar 总会渲染一块绑着 onBack 的返回区域，
      // 所以隐藏返回时要显式传 null，否则左上角留着一个看不见却能点的热区
      back={showBack ? undefined : null}
      {...rest}
    >
      {children ?? title}
    </NavBar>
  )
}
