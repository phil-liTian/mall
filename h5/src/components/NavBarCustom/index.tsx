import { useNavigate } from 'react-router-dom'
import { NavBar, type NavBarProps } from 'antd-mobile'
import './index.css'

interface NavBarCustomProps extends Omit<NavBarProps, 'onBack'> {
  showBack?: boolean
}

/** 通用顶部导航栏，统一返回逻辑 */
export const NavBarCustom = ({ showBack = true, ...rest }: NavBarCustomProps) => {
  const navigate = useNavigate()
  return (
    <NavBar
      className="navbar-custom"
      onBack={() => navigate(-1)}
      backArrow={showBack}
      {...rest}
    />
  )
}
