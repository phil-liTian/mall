import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, theme, App, Popover, Tooltip } from 'antd'
import { UserOutlined, LockOutlined, ShoppingOutlined, SunOutlined, MoonOutlined, BgColorsOutlined, CheckOutlined } from '@ant-design/icons'
import { login } from '@/api/admin'
import { setToken, useAuthStore } from '@/store/auth'
import { usePrefStore, resolveIsDark, presetColors } from '@/store/pref'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setInfo = useAuthStore((s) => s.setInfo)
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const mode = usePrefStore((s) => s.mode)
  const isDark = resolveIsDark(mode)
  const primaryColor = usePrefStore((s) => s.primaryColor)
  const setMode = usePrefStore((s) => s.setMode)
  const setPrimaryColor = usePrefStore((s) => s.setPrimaryColor)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await login(values)
      setToken(res.token)
      setInfo({ username: values.username })
      message.success('登录成功')
      navigate('/home')
    } catch {
      // 拦截器已提示
    } finally {
      setLoading(false)
    }
  }

  const colorSwatch = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: 148 }}>
      {presetColors.map((c) => {
        const active = primaryColor === c.color
        return (
          <Tooltip title={c.name} key={c.color}>
            <span
              onClick={() => setPrimaryColor(c.color)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: c.color,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: active ? `2px solid ${c.color}` : 'none',
                outlineOffset: 2,
              }}
            >
              {active && <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />}
            </span>
          </Tooltip>
        )
      })}
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', background: token.colorBgContainer, position: 'relative' }}>
      {/* 右上角主题切换 */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 2, display: 'flex', gap: 8 }}>
        <Popover content={colorSwatch} title="主题色" trigger="click" placement="bottomRight">
          <Button shape="circle" icon={<BgColorsOutlined />} />
        </Popover>
        <Tooltip title={isDark ? '切换到浅色' : '切换到深色'}>
          <Button
            shape="circle"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={() => setMode(isDark ? 'light' : 'dark')}
          />
        </Tooltip>
      </div>

      {/* 左侧品牌展示区，窄屏隐藏 */}
      <div className="login-brand">
        <div className="login-brand-bg" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(255,255,255,.18)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}
            >
              <ShoppingOutlined />
            </span>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>MALL 后台</span>
          </div>
          <h1 style={{ fontSize: 40, lineHeight: 1.2, margin: '0 0 16px', fontWeight: 700 }}>
            电商运营
            <br />
            尽在掌控
          </h1>
          <p style={{ fontSize: 15, opacity: 0.75, maxWidth: 360, margin: 0 }}>
            商品、订单、营销、权限一站式管理，为你的电商业务提供高效顺手的后台支撑。
          </p>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="login-form-wrap">
        <div style={{ width: 340 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: token.colorText }}>
            欢迎回来 👋
          </h2>
          <p style={{ color: token.colorTextSecondary, margin: '0 0 32px' }}>
            请登录你的管理员账号
          </p>
          <Form
            layout="vertical"
            initialValues={{ username: 'admin', password: 'macro123' }}
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                登 录
              </Button>
            </Form.Item>
          </Form>
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 12,
              background: isDark ? 'rgba(255,255,255,.06)' : token.colorFillQuaternary,
              color: token.colorTextSecondary,
            }}
          >
            演示账号：admin / macro123
          </div>
        </div>
      </div>
    </div>
  )
}
