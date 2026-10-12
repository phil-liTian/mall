import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from 'antd-mobile'
import {
  CloseCircleFill,
  CloseOutline,
  DeleteOutline,
  LeftOutline,
  SearchOutline,
} from 'antd-mobile-icons'
import { useSearchStore } from '@/store/search'
import { useGoBack } from '@/hooks/useGoBack'
import { Empty } from '@/components/Empty'
import './index.css'

export default function ProductSearch() {
  const navigate = useNavigate()
  const goBack = useGoBack()
  const searchStore = useSearchStore()
  const [keyword, setKeyword] = useState('')

  const handleSearch = () => {
    const trimmed = keyword.trim()
    if (trimmed) {
      searchStore.addKeyword(trimmed)
      navigate(`/product/list?keyword=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/product/list')
    }
  }

  const handleHistoryClick = (item: string) => {
    setKeyword(item)
    searchStore.addKeyword(item)
    navigate(`/product/list?keyword=${encodeURIComponent(item)}`)
  }

  const handleClearHistory = async () => {
    const confirm = await Dialog.confirm({ content: '确定清空搜索历史？' })
    if (confirm) {
      searchStore.clearHistory()
    }
  }

  const handleDeleteHistory = (item: string, e: MouseEvent) => {
    e.stopPropagation()
    searchStore.removeKeyword(item)
  }

  return (
    <div className="search-page">
      {/* 搜索栏 */}
      <div className="search-bar">
        <span className="search-back" onClick={goBack} role="button" aria-label="返回">
          <LeftOutline />
        </span>
        <div className="search-input-wrap">
          <span className="search-icon">
            <SearchOutline />
          </span>
          <input
            className="search-input"
            type="text"
            value={keyword}
            placeholder="请输入商品 如：手机"
            autoFocus
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {keyword && (
            <span className="clear-btn" onClick={() => setKeyword('')}>
              <CloseCircleFill />
            </span>
          )}
        </div>
        <span className="search-action-btn" onClick={handleSearch}>
          搜索
        </span>
      </div>

      {/* 搜索历史 */}
      {searchStore.historyList.length > 0 ? (
        <div className="history-section">
          <div className="section-header">
            <span className="section-title">搜索历史</span>
            <span className="clear-icon" onClick={handleClearHistory}>
              <DeleteOutline />
            </span>
          </div>
          <div className="history-list">
            {searchStore.historyList.map((item, index) => (
              <div
                key={index}
                className="history-item"
                onClick={() => handleHistoryClick(item)}
              >
                <span className="history-text">{item}</span>
                <span className="delete-icon" onClick={(e) => handleDeleteHistory(item, e)}>
                  <CloseOutline />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-section">
          <Empty text="暂无搜索记录" />
        </div>
      )}
    </div>
  )
}
