import { Drawer, Divider, Switch, Tooltip, Button, App } from 'antd'
import { CheckOutlined, SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons'
import { usePrefStore, presetColors, type ThemeMode } from '@/store/pref'

const modeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: '浅色', icon: <SunOutlined /> },
  { value: 'dark', label: '深色', icon: <MoonOutlined /> },
  { value: 'auto', label: '跟随系统', icon: <DesktopOutlined /> },
]

export default function PrefDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp()
  const mode = usePrefStore((s) => s.mode)
  const primaryColor = usePrefStore((s) => s.primaryColor)
  const darkSider = usePrefStore((s) => s.darkSider)
  const showTabs = usePrefStore((s) => s.showTabs)
  const setMode = usePrefStore((s) => s.setMode)
  const setPrimaryColor = usePrefStore((s) => s.setPrimaryColor)
  const setDarkSider = usePrefStore((s) => s.setDarkSider)
  const setShowTabs = usePrefStore((s) => s.setShowTabs)
  const reset = usePrefStore((s) => s.reset)

  const sectionTitle = (t: string) => (
    <div style={{ fontWeight: 600, fontSize: 14, margin: '4px 0 12px' }}>{t}</div>
  )

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  }

  return (
    <Drawer
      title="偏好设置"
      open={open}
      onClose={onClose}
      width={320}
      footer={
        <Button
          block
          onClick={() => {
            reset()
            message.success('已恢复默认设置')
          }}
        >
          恢复默认
        </Button>
      }
    >
      {sectionTitle('主题')}
      <div style={{ display: 'flex', gap: 12 }}>
        {modeOptions.map((opt) => {
          const active = mode === opt.value
          return (
            <div
              key={opt.value}
              onClick={() => setMode(opt.value)}
              style={{
                flex: 1,
                cursor: 'pointer',
                border: `2px solid ${active ? primaryColor : 'var(--ant-color-border)'}`,
                borderRadius: 8,
                padding: '16px 0',
                textAlign: 'center',
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 20 }}>{opt.icon}</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>{opt.label}</div>
            </div>
          )
        })}
      </div>

      <Divider />
      {sectionTitle('内置主题')}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {presetColors.map((c) => {
          const active = primaryColor === c.color
          return (
            <Tooltip title={c.name} key={c.color}>
              <div
                onClick={() => setPrimaryColor(c.color)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: c.color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: active ? `2px solid ${c.color}` : 'none',
                  outlineOffset: 2,
                }}
              >
                {active && <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />}
              </div>
            </Tooltip>
          )
        })}
      </div>

      <Divider />
      {sectionTitle('界面显示')}
      <div style={rowStyle}>
        <span>深色侧边栏</span>
        <Switch checked={darkSider} onChange={setDarkSider} />
      </div>
      <div style={rowStyle}>
        <span>标签页</span>
        <Switch checked={showTabs} onChange={setShowTabs} />
      </div>
    </Drawer>
  )
}
