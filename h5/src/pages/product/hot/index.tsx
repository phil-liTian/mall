import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpinLoading } from 'antd-mobile'
import { getHotProductListAPI } from '@/api/home'
import type { PmsProduct } from '@/types/product'
import { ProductCard } from '@/components/ProductCard'
import { Empty } from '@/components/Empty'
import './index.css'

export default function HotProductList() {
  const navigate = useNavigate()
  const [productList, setProductList] = useState<PmsProduct[]>([])
  const [loadingType, setLoadingType] = useState<'more' | 'loading' | 'nomore'>('more')
  const pageRef = useRef({ pageNum: 1, pageSize: 6 })

  const loadData = useCallback(
    async (type: 'refresh' | 'add' = 'add') => {
      if (type === 'add' && loadingType === 'nomore') return
      setLoadingType(type === 'add' ? 'loading' : 'more')
      if (type === 'refresh') pageRef.current.pageNum = 1
      try {
        const response = await getHotProductListAPI(pageRef.current)
        // 确保返回值是数组类型，防止接口返回非数组导致报错
        const list = Array.isArray(response) ? response : []
        if (list.length === 0 || list.length < pageRef.current.pageSize) {
          setLoadingType('nomore')
        } else {
          setLoadingType('more')
        }
        setProductList((prev) => (type === 'refresh' ? list : [...prev, ...list]))
      } catch (e) {
        console.error('加载人气推荐失败', e)
        setLoadingType('more')
      }
    },
    [loadingType],
  )

  useEffect(() => {
    loadData('refresh')
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollHeight - scrollTop - clientHeight < 100 && loadingType === 'more') {
        pageRef.current.pageNum++
        loadData('add')
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingType, loadData])

  return (
    <div className="hot-page">
      <div className="hot-page__banner" onClick={() => navigate(-1)}>
        <span className="hot-page__back">‹</span>
        <div className="hot-page__banner-img">🔥 人气推荐</div>
      </div>
      <div className="hot-page__tit">相关商品</div>
      <div className="hot-page__list">
        {(Array.isArray(productList) ? productList : []).map((item) => (
          <ProductCard key={item.id} product={item} layout="grid" />
        ))}
      </div>
      <div className="hot-page__loading">
        {loadingType === 'loading' && <SpinLoading color="primary" />}
        {productList.length === 0 && loadingType !== 'loading' ? (
          <Empty text="暂无商品" icon={<span className="hot-page__empty">📦</span>} />
        ) : loadingType === 'nomore' ? (
          <span>没有更多了</span>
        ) : null}
      </div>
    </div>
  )
}
