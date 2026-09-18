import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Breadcrumb, Tooltip, Badge, theme } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  BellOutlined,
  LockOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import { menuConfig, findLabelChain, type MenuItem } from '@/router/menuConfig'
import { useAuthStore, clearToken } from '@/store/auth'
import { usePrefStore, resolveIsDark } from '@/store/pref'
import PrefDrawer from './PrefDrawer'
import LayoutTabs from './LayoutTabs'
import SearchModal from './SearchModal'
import LockScreen, { useLockStore } from './LockScreen'

const { Header, Sider, Content } = AntLayout

function toAntdMenu(items: MenuItem[]): any[] {
  return items.map((it) => ({
    key: it.key,
    label: it.label,
    icon: it.icon,
    children: it.children ? toAntdMenu(it.children) : undefined,
  }))
}

// 顶栏图标按钮
function IconButton({ title, onClick, children }: { title: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Tooltip title={title}>
      <span
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          fontSize: 18,
          cursor: 'pointer',
          borderRadius: 8,
        }}
        className="topbar-icon-btn"
      >
        {children}
      </span>
    </Tooltip>
  )
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [prefOpen, setPrefOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const lock = useLockStore((s) => s.lock)
  const navigate = useNavigate()
  const location = useLocation()
  const info = useAuthStore((s) => s.info)
  const setInfo = useAuthStore((s) => s.setInfo)

  const mode = usePrefStore((s) => s.mode)
  const setMode = usePrefStore((s) => s.setMode)
  const darkSider = usePrefStore((s) => s.darkSider)
  const showTabs = usePrefStore((s) => s.showTabs)
  const isDark = resolveIsDark(mode)

  const { token } = theme.useToken()

  const seg = '/' + location.pathname.split('/').slice(1, 3).join('/')
  const openKey = '/' + location.pathname.split('/')[1]
  const chain = findLabelChain(seg)

  // 受控展开：路由变化时确保当前一级菜单展开（搜索跳转后也生效），保留用户已展开的其它项
  const [openKeys, setOpenKeys] = useState<string[]>(openKey ? [openKey] : [])
  useEffect(() => {
    setOpenKeys((prev) => (prev.includes(openKey) ? prev : [...prev, openKey]))
  }, [openKey])

  const onLogout = () => {
    clearToken()
    setInfo(null)
    navigate('/login')
  }

  // ⌘K / Ctrl+K 唤起搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  // 侧边栏是否用深色皮肤：整体深色时始终深，浅色时看 darkSider 开关
  const siderDark = isDark || darkSider

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme={siderDark ? 'dark' : 'light'}>
        <div
          style={{
            height: 56,
            color: siderDark ? '#fff' : token.colorText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            letterSpacing: 1,
            fontSize: collapsed ? 14 : 18,
          }}
        >
          {collapsed ? 'MALL' : 'MALL 后台'}
        </div>
        <Menu
          theme={siderDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[seg]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setOpenKeys}
          items={toAntdMenu(menuConfig)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 12px 0 0',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconButton title={collapsed ? '展开菜单' : '收起菜单'} onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </IconButton>
            <Breadcrumb style={{ marginLeft: 8 }} items={chain.map((t) => ({ title: t }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton title="搜索 (⌘K)" onClick={() => setSearchOpen(true)}>
              <SearchOutlined />
            </IconButton>
            <IconButton title={fullscreen ? '退出全屏' : '全屏'} onClick={toggleFullscreen}>
              {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </IconButton>
            <IconButton title="刷新页面" onClick={() => window.location.reload()}>
              <ReloadOutlined />
            </IconButton>
            <IconButton
              title={isDark ? '切换到浅色' : '切换到深色'}
              onClick={() => setMode(isDark ? 'light' : 'dark')}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </IconButton>
            <IconButton title="通知">
              <Badge dot offset={[-2, 2]}>
                <BellOutlined />
              </Badge>
            </IconButton>
            <IconButton title="锁定屏幕" onClick={lock}>
              <LockOutlined />
            </IconButton>
            <IconButton title="偏好设置" onClick={() => setPrefOpen(true)}>
              <SettingOutlined />
            </IconButton>
            <Dropdown
              menu={{
                items: [
                  { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: onLogout },
                ],
              }}
            >
              <span style={{ cursor: 'pointer', padding: '0 8px', display: 'inline-flex', alignItems: 'center' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span style={{ marginLeft: 8 }}>{info?.username || 'admin'}</span>
              </span>
            </Dropdown>
          </div>
        </Header>

        {showTabs && <LayoutTabs />}

        <Content
          style={{
            margin: 16,
            padding: 16,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>

      <PrefDrawer open={prefOpen} onClose={() => setPrefOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LockScreen username={info?.username || 'admin'} />
    </AntLayout>
  )
}
