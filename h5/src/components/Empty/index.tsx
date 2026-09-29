import type { ReactNode } from 'react'
import './index.css'

interface EmptyProps {
  text?: string
  icon?: ReactNode
}

export const Empty = ({ text = '暂无数据', icon }: EmptyProps) => {
  return (
    <div className="empty">
      <div className="empty__icon">{icon ?? <span className="empty__default-icon">🗂️</span>}</div>
      <p className="empty__text">{text}</p>
    </div>
  )
}
