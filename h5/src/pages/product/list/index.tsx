import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SpinLoading } from 'antd-mobile'
import { searchProductListAPI, getCategoryTreeAPI } from '@/api/product'
import type { PmsProduct, CategoryTreeNode, ProductListParam } from '@/types/product'
import { ProductCard } from '@/components/ProductCard'
import { Empty } from '@/components/Empty'
import './index.css'

export default function ProductList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  const sid = searchParams.get('sid')

  const [productList, setProductList] = useState<PmsProduct[]>([])
  const [cateList, setCateList] = useState<CategoryTreeNode[]>([])
  const [filterIndex, setFilterIndex] = useState(0) // 0 综合 1 销量 2 价格
  const [priceOrder, setPriceOrder] = useState(0) // 1 升序 2 降序
  const [loadingType, setLoadingType] = useState<'more' | 'loading' | 'nomore'>('more')
  const [cateMaskVisible, setCateMaskVisible] = useState(false)
  const [categoryId, setCategoryId] = useState<number | undefined>(sid ? Number(sid) : undefined)

  const pageRef = useRef<ProductListParam>({
    pageNum: 1,
    pageSize: 6,
    sort: 0,
    keyword: keyword || undefined,
    productCategoryId: sid ? Number(sid) : undefined,
  })

  const loadCateList = async () => {
    try {
      const res = await getCategoryTreeAPI()
      setCateList(res)
    } catch (e) {
      console.error('加载分类树失败', e)
    }
  }

  const loadData = useCallback(
    async (type: 'refresh' | 'add' = 'add') => {
      if (type === 'add' && loadingType === 'nomore') return
      setLoadingType(type === 'add' ? 'loading' : 'more')

      if (type === 'refresh') {
        pageRef.current.pageNum = 1
      }

      // 设置排序参数
      if (filterIndex === 0) pageRef.current.sort = 0
      else if (filterIndex === 1) pageRef.current.sort = 2
      else pageRef.current.sort = priceOrder === 1 ? 3 : 4

      try {
        const res = await searchProductListAPI(pageRef.current)
        const list = res.list
        if (list.length === 0 || list.length < pageRef.current.pageSize) {
          setLoadingType('nomore')
        } else {
          setLoadingType('more')
        }
        setProductList((prev) => (type === 'refresh' ? list : [...prev, ...list]))
      } catch (e) {
        console.error('加载商品列表失败', e)
        setLoadingType('more')
      }
    },
    [filterIndex, priceOrder, loadingType],
  )

  useEffect(() => {
    loadCateList()
    loadData('refresh')
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 滚动加载
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

  const handleTabClick = (index: number) => {
    if (filterIndex === index && index !== 2) return
    setFilterIndex(index)
    if (index === 2) {
      setPriceOrder((prev) => (prev === 1 ? 2 : 1))
    } else {
      setPriceOrder(0)
    }
    window.scrollTo(0, 0)
    setTimeout(() => loadData('refresh'), 0)
  }

  const handleCateChange = (item: CategoryTreeNode) => {
    setCategoryId(item.id)
    pageRef.current.productCategoryId = item.id
    setCateMaskVisible(false)
    window.scrollTo(0, 0)
    setTimeout(() => loadData('refresh'), 0)
  }

  const handleClearCate = () => {
    setCategoryId(undefined)
    pageRef.current.productCategoryId = undefined
    setCateMaskVisible(false)
    window.scrollTo(0, 0)
    setTimeout(() => loadData('refresh'), 0)
  }

  return (
    <div className="product-list-page">
      {/* 搜索栏 */}
      <div className="pl-search-bar">
        <div className="pl-search-input" onClick={() => navigate('/product/search')}>
          <span className="pl-search-icon">🔍</span>
          <span className="pl-search-text">{keyword || '请输入商品 如：手机'}</span>
        </div>
        <span className="pl-cate-btn" onClick={() => setCateMaskVisible(true)}>
          🗂️
        </span>
      </div>

      {/* 筛选导航栏 */}
      <div className="pl-navbar">
        <div
          className={`pl-nav-item ${filterIndex === 0 ? 'current' : ''}`}
          onClick={() => handleTabClick(0)}
        >
          综合排序
        </div>
        <div
          className={`pl-nav-item ${filterIndex === 1 ? 'current' : ''}`}
          onClick={() => handleTabClick(1)}
        >
          销量优先
        </div>
        <div
          className={`pl-nav-item ${filterIndex === 2 ? 'current' : ''}`}
          onClick={() => handleTabClick(2)}
        >
          <span>价格</span>
          <div className="pl-p-box">
            <span className={priceOrder === 1 && filterIndex === 2 ? 'active' : ''}>▲</span>
            <span className={`pl-p-down ${priceOrder === 2 && filterIndex === 2 ? 'active' : ''}`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="pl-goods-list">
        {productList.map((item) => (
          <ProductCard key={item.id} product={item} layout="grid" />
        ))}
      </div>

      {/* 加载状态 */}
      <div className="pl-loading-more">
        {loadingType === 'loading' && <SpinLoading color="primary" />}
        {loadingType === 'nomore' && <span>没有更多了</span>}
        {productList.length === 0 && loadingType !== 'loading' && (
          <Empty text="暂无商品" icon={<span className="pl-empty-icon">📦</span>} />
        )}
      </div>

      {/* 分类筛选面板 */}
      {cateMaskVisible && (
        <div className="pl-cate-mask show" onClick={() => setCateMaskVisible(false)}>
          <div className="pl-cate-content" onClick={(e) => e.stopPropagation()}>
            <div className="pl-cate-header">
              <span className="pl-cate-title">分类筛选</span>
              {categoryId && (
                <span className="pl-cate-clear" onClick={handleClearCate}>
                  清空
                </span>
              )}
            </div>
            <div className="pl-cate-list">
              {cateList.map((item) => (
                <div key={item.id}>
                  <div className="pl-cate-item two">{item.name}</div>
                  {item.children?.map((tItem) => (
                    <div
                      key={tItem.id}
                      className={`pl-cate-item ${tItem.id === categoryId ? 'active' : ''}`}
                      onClick={() => handleCateChange(tItem)}
                    >
                      {tItem.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
