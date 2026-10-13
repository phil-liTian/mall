import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpinLoading } from 'antd-mobile'
import { getReturnApplyListAPI } from '@/api/aftersale'
import type { OmsOrderReturnApply } from '@/types/order'
import { NavBarCustom } from '@/components/NavBarCustom'
import { Empty } from '@/components/Empty'
import { formatPrice, formatProductAttr } from '@/utils/format'
import { formatDate } from '@/utils/date'
import './index.css'

// 顶部 Tab：-1全部 / 0待处理 / 1退货中 / 2已完成 / 3已拒绝
const navList = [
  { state: -1, text: '全部' },
  { state: 0, text: '待处理' },
  { state: 1, text: '退货中' },
  { state: 2, text: '已完成' },
  { state: 3, text: '已拒绝' },
]

const statusTextMap: Record<number, string> = {
  0: '待处理',
  1: '退货中',
  2: '已完成',
  3: '已拒绝',
}

export default function AftersaleList() {
  const navigate = useNavigate()
  const [tabIndex, setTabIndex] = useState(0)
  const [applyList, setApplyList] = useState<OmsOrderReturnApply[]>([])
  const [loadingType, setLoadingType] = useState<'more' | 'loading' | 'nomore'>('more')
  const searchParamRef = useRef({ pageNum: 1, pageSize: 5 })
  const tabIndexRef = useRef(0)

  const loadData = useCallback(
    async (type: 'refresh' | 'add' = 'refresh') => {
      if (type === 'add' && loadingType === 'nomore') return
      if (type === 'refresh') {
        searchParamRef.current.pageNum = 1
        setLoadingType('loading')
      } else {
        if (loadingType === 'loading') return
        searchParamRef.current.pageNum++
        setLoadingType('loading')
      }
      const status = navList[tabIndexRef.current].state
      try {
        const res = await getReturnApplyListAPI({
          ...searchParamRef.current,
          ...(status === -1 ? {} : { status }),
        })
        const list = res.list || []
        if (type === 'refresh') {
          setApplyList(list)
          setLoadingType(list.length < searchParamRef.current.pageSize ? 'nomore' : 'more')
        } else {
          if (list.length > 0) {
            setApplyList((prev) => [...prev, ...list])
            setLoadingType(list.length < searchParamRef.current.pageSize ? 'nomore' : 'more')
          } else {
            searchParamRef.current.pageNum--
            setLoadingType('nomore')
          }
        }
      } catch (e) {
        console.error('加载售后列表失败', e)
        setLoadingType('more')
      }
    },
    [loadingType],
  )

  const handleTabClick = (index: number) => {
    if (index === tabIndexRef.current) return
    tabIndexRef.current = index
    setTabIndex(index)
    setApplyList([])
    setLoadingType('more')
    loadData('refresh')
  }

  useEffect(() => {
    loadData('refresh')
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollHeight - scrollTop - clientHeight < 100 && loadingType === 'more') {
        loadData('add')
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingType, loadData])

  return (
    <div className="aftersale-list-page">
      <NavBarCustom title="退款/售后" fallback="/user" />

      <div className="asl__navbar">
        {navList.map((item, index) => (
          <div
            key={item.state}
            className={`asl__nav-item ${tabIndex === index ? 'current' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            {item.text}
          </div>
        ))}
      </div>

      <div className="asl__content">
        {applyList.map((apply) => (
          <div
            className="asl-item"
            key={apply.id}
            onClick={() => navigate(`/aftersale/detail/${apply.id}`)}
          >
            <div className="asl-item__top">
              <span className="asl-item__time">{formatDate(apply.createTime)}</span>
              <span className="asl-item__state">{statusTextMap[apply.status] || ''}</span>
            </div>
            <div className="asl-item__goods">
              <img src={apply.productPic} alt={apply.productName} />
              <div className="asl-item__right">
                <p className="asl-item__title ellipsis">{apply.productName}</p>
                <p className="asl-item__attr ellipsis">
                  {formatProductAttr(apply.productAttr)} x {apply.productCount}
                </p>
                <p className="asl-item__reason ellipsis">退货原因：{apply.reason}</p>
              </div>
            </div>
            <div className="asl-item__bottom">
              退款金额
              <span className="price">
                <span className="price-symbol">¥</span>
                {formatPrice(apply.returnAmount, false)}
              </span>
            </div>
          </div>
        ))}

        <div className="asl__loading">
          {loadingType === 'loading' && <SpinLoading color="primary" />}
          {loadingType === 'nomore' && applyList.length > 0 && <span>没有更多了</span>}
          {applyList.length === 0 && loadingType !== 'loading' && (
            <Empty text="暂无售后申请" icon={<span className="asl__empty">↩️</span>} />
          )}
        </div>
      </div>
    </div>
  )
}
