import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Breadcrumb } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { menuConfig, type MenuItem } from '@/router/menuConfig'
import { useAuthStore, clearToken } from '@/store/auth'

const { Header, Sider, Content } = AntLayout

function toAntdMenu(items: MenuItem[]): any[] {
  return items.map((it) => ({
    key: it.key,
    label: it.label,
    icon: it.icon,
    children: it.children ? toAntdMenu(it.children) : undefined,
  }))
}

// 根据 path 找到菜单标题链，用于面包屑
function findLabelChain(path: string): string[] {
  for (const top of menuConfig) {
    if (top.key === path) return [top.label]
    if (top.children) {
      const child = top.children.find((c) => c.key === path)
      if (child) return [top.label, child.label]
    }
  }
  return ['首页']
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const info = useAuthStore((s) => s.info)
  const setInfo = useAuthStore((s) => s.setInfo)

  // 用一级路径匹配高亮（详情页归属到列表菜单）
  const seg = '/' + location.pathname.split('/').slice(1, 3).join('/')
  const openKey = '/' + location.pathname.split('/')[1]

  const chain = findLabelChain(seg)

  const onLogout = () => {
    clearToken()
    setInfo(null)
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 56,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: collapsed ? 14 : 18,
          }}
        >
          {collapsed ? 'MALL' : 'MALL 后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[seg]}
          defaultOpenKeys={[openKey]}
          items={toAntdMenu(menuConfig)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{ fontSize: 18, cursor: 'pointer' }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <Dropdown
            menu={{
              items: [
                { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: onLogout },
              ],
            }}
          >
            <span style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>{info?.username || 'admin'}</span>
            </span>
          </Dropdown>
        </Header>
        <Breadcrumb
          style={{ margin: '12px 16px' }}
          items={chain.map((t) => ({ title: t }))}
        />
        <Content
          style={{
            margin: '0 16px 16px',
            padding: 16,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
