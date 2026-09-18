import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs } from 'antd'
import { findLabelChain } from '@/router/menuConfig'

interface TabItem {
  key: string
  label: string
}

// 内容区多标签：随路由新增，可关闭，点击切换
export default function LayoutTabs() {
  const location = useLocation()
  const navigate = useNavigate()
  const tabsRef = useRef<TabItem[]>([{ key: '/home', label: '首页' }])

  // 用一级+二级路径作为 tab key，详情页归到列表所属路径
  const seg = '/' + location.pathname.split('/').slice(1, 3).join('/')

  useEffect(() => {
    if (!tabsRef.current.some((t) => t.key === seg)) {
      const chain = findLabelChain(seg)
      tabsRef.current = [...tabsRef.current, { key: seg, label: chain[chain.length - 1] }]
    }
  }, [seg])

  const onEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action !== 'remove' || typeof targetKey !== 'string') return
    if (targetKey === '/home') return // 首页不可关闭
    const idx = tabsRef.current.findIndex((t) => t.key === targetKey)
    tabsRef.current = tabsRef.current.filter((t) => t.key !== targetKey)
    // 关闭当前激活项时跳到相邻标签
    if (targetKey === seg) {
      const next = tabsRef.current[idx - 1] ?? tabsRef.current[0]
      navigate(next.key)
    }
  }

  return (
    <Tabs
      hideAdd
      type="editable-card"
      size="small"
      activeKey={seg}
      onChange={navigate}
      onEdit={onEdit}
      items={tabsRef.current.map((t) => ({
        key: t.key,
        label: t.label,
        closable: t.key !== '/home',
      }))}
      style={{ margin: '8px 16px 0' }}
    />
  )
}
