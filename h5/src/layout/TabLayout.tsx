import { useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import {
  AppOutline,
  UnorderedListOutline,
  ShopbagOutline,
  UserOutline,
} from 'antd-mobile-icons'
import { Outlet } from 'react-router-dom'
import './index.css'

const tabs = [
  { key: '/', title: '首页', icon: <AppOutline /> },
  { key: '/category', title: '分类', icon: <UnorderedListOutline /> },
  { key: '/cart', title: '购物车', icon: <ShopbagOutline /> },
  { key: '/user', title: '我的', icon: <UserOutline /> },
]

export const TabLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const activeKey =
    tabs.find((t) => t.key !== '/' && location.pathname.startsWith(t.key))?.key ?? '/'

  return (
    <div className="tab-layout">
      <div className="tab-layout__content">
        <Outlet />
      </div>
      <div className="tab-layout__bar">
        <TabBar
          activeKey={activeKey}
          onChange={(key) => navigate(key)}
          safeArea
        >
          {tabs.map((tab) => (
            <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
          ))}
        </TabBar>
      </div>
    </div>
  )
}
