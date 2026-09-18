import { useEffect, useMemo, useState } from 'react'
import { Modal, Input, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { menuConfig } from '@/router/menuConfig'

interface FlatItem {
  key: string
  label: string
  group: string
}

// 把菜单拍平成可搜索的叶子项（带父级分组名）
function flattenMenu(): FlatItem[] {
  const out: FlatItem[] = []
  for (const top of menuConfig) {
    if (top.children) {
      for (const c of top.children) out.push({ key: c.key, label: c.label, group: top.label })
    } else {
      out.push({ key: top.key, label: top.label, group: '导航' })
    }
  }
  return out
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [kw, setKw] = useState('')
  const [active, setActive] = useState(0)
  const all = useMemo(flattenMenu, [])

  const results = useMemo(() => {
    const q = kw.trim().toLowerCase()
    if (!q) return all
    return all.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q))
  }, [kw, all])

  useEffect(() => {
    if (open) {
      setKw('')
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [kw])

  const go = (key: string) => {
    navigate(key)
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active].key)
    }
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={560} styles={{ body: { padding: 0 } }}>
      <Input
        size="large"
        autoFocus
        variant="borderless"
        prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
        placeholder="搜索菜单，回车跳转"
        value={kw}
        onChange={(e) => setKw(e.target.value)}
        onKeyDown={onKeyDown}
        style={{ padding: '14px 16px' }}
      />
      <div className="thin-scroll" style={{ borderTop: '1px solid var(--ant-color-border-secondary)', maxHeight: 360, overflowY: 'auto', padding: 8 }}>
        {results.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配菜单" style={{ padding: 24 }} />
        ) : (
          results.map((it, idx) => (
            <div
              key={it.key}
              onMouseEnter={() => setActive(idx)}
              onClick={() => go(it.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: idx === active ? 'var(--ant-color-primary)' : 'transparent',
                color: idx === active ? '#fff' : 'inherit',
              }}
            >
              <span>{it.label}</span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{it.group}</span>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}
