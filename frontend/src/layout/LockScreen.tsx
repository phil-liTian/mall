import { useState } from 'react'
import { Input, Button, Avatar, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LockState {
  locked: boolean
  lock: () => void
  unlock: () => void
}

export const useLockStore = create<LockState>()(
  persist(
    (set) => ({
      locked: false,
      lock: () => set({ locked: true }),
      unlock: () => set({ locked: false }),
    }),
    { name: 'mall_admin_lock' },
  ),
)

// mock 环境解锁口令，与登录密码一致
const UNLOCK_PASSWORD = 'macro123'

export default function LockScreen({ username }: { username: string }) {
  const locked = useLockStore((s) => s.locked)
  const unlock = useLockStore((s) => s.unlock)
  const [pwd, setPwd] = useState('')

  if (!locked) return null

  const handleUnlock = () => {
    if (pwd === UNLOCK_PASSWORD) {
      setPwd('')
      unlock()
    } else {
      message.error('密码错误')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}
    >
      <Avatar size={72} icon={<UserOutlined />} />
      <div style={{ margin: '16px 0 4px', fontSize: 18, fontWeight: 600 }}>{username || 'admin'}</div>
      <div style={{ opacity: 0.6, marginBottom: 24 }}>屏幕已锁定</div>
      <div style={{ width: 280, display: 'flex', gap: 8 }}>
        <Input.Password
          autoFocus
          size="large"
          prefix={<LockOutlined />}
          placeholder="输入密码解锁"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onPressEnter={handleUnlock}
        />
        <Button type="primary" size="large" onClick={handleUnlock}>
          解锁
        </Button>
      </div>
      <div style={{ opacity: 0.4, fontSize: 12, marginTop: 12 }}>提示：解锁密码为登录密码 macro123</div>
    </div>
  )
}
