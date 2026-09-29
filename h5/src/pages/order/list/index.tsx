import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dialog, Toast, SpinLoading } from 'antd-mobile'
import {
  getOrderListAPI,
  cancelUserOrderAPI,
  confirmReceiveOrderAPI,
  deleteOrderAPI,
} from '@/api/order'
import type { OmsOrderDetail } from '@/types/order'
import { NavBarCustom } from '@/components/NavBarCustom'
import { Empty } from '@/components/Empty'
import { formatPrice } from '@/utils/format'
import { formatDate } from '@/utils/date'
import './index.css'

// 顶部 Tab 导航：-1全部 / 0待付款 / 2待收货 / 3已完成 / 4已取消
const navList = [
  { state: -1, text: '全部' },
  { state: 0, text: '待付款' },
  { state: 2, text: '待收货' },
  { state: 3, text: '已完成' },
  { state: 4, text: '已取消' },
]

// 订单状态文案
const formatStatus = (status: number): string => {
  const map: Record<number, string> = {
    0: '等待付款',
    1: '等待发货',
    2: '等待收货',
    3: '交易完成',
    4: '交易关闭',
  }
  return map[status] || ''
}

// 解析商品销售属性 JSON
const formatProductAttr = (jsonAttr: string): string => {
  if (!jsonAttr) return ''
  try {
    const arr = JSON.parse(jsonAttr) as { key: string; value: string }[]
    return arr.map((a) => `${a.key}:${a.value}`).join('; ')
  } catch {
    return jsonAttr
  }
}

// 计算订单商品总数量
const calcTotalQuantity = (order: OmsOrderDetail): number => {
  if (!order.orderItemList) return 0
  return order.orderItemList.reduce((sum, item) => sum + item.productQuantity, 0)
}

export default function OrderList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // 通过 status 参数定位初始 Tab（来自"我的"页面的订单快捷入口）
  const initialStatus = Number(searchParams.get('status') ?? -1)
  const initialIndex = Math.max(
    navList.findIndex((n) => n.state === initialStatus),
    0,
  )

  const [tabIndex, setTabIndex] = useState(initialIndex)
  const [orderList, setOrderList] = useState<OmsOrderDetail[]>([])
  const [loadingType, setLoadingType] = useState<'more' | 'loading' | 'nomore'>('more')
  const searchParamRef = useRef<{ status: number; pageNum: number; pageSize: number }>({
    status: navList[initialIndex].state,
    pageNum: 1,
    pageSize: 5,
  })
  const tabIndexRef = useRef(initialIndex)

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
      searchParamRef.current.status = navList[tabIndexRef.current].state
      try {
        const res = await getOrderListAPI(searchParamRef.current)
        const list = res.list || []
        if (type === 'refresh') {
          setOrderList(list)
          setLoadingType(list.length < searchParamRef.current.pageSize ? 'nomore' : 'more')
        } else {
          if (list.length > 0) {
            setOrderList((prev) => [...prev, ...list])
            setLoadingType(list.length < searchParamRef.current.pageSize ? 'nomore' : 'more')
          } else {
            searchParamRef.current.pageNum--
            setLoadingType('nomore')
          }
        }
      } catch (e) {
        console.error('加载订单列表失败', e)
        setLoadingType('more')
      }
    },
    [loadingType],
  )

  // 切换 Tab
  const handleTabClick = (index: number) => {
    if (index === tabIndexRef.current) return
    tabIndexRef.current = index
    setTabIndex(index)
    setOrderList([])
    setLoadingType('more')
    loadData('refresh')
  }

  useEffect(() => {
    loadData('refresh')
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 滚动加载更多
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

  // 取消订单
  const handleCancelOrder = async (orderId: number) => {
    const confirm = await Dialog.confirm({ content: '是否要取消该订单？' })
    if (!confirm) return
    try {
      await cancelUserOrderAPI(orderId)
      Toast.show({ icon: 'success', content: '已取消' })
      loadData('refresh')
    } catch (e) {
      console.error('取消订单失败', e)
    }
  }

  // 立即付款
  const handlePayOrder = (orderId: number) => {
    navigate(`/money/pay?orderId=${orderId}`)
  }

  // 确认收货
  const handleReceiveOrder = async (orderId: number) => {
    const confirm = await Dialog.confirm({ content: '是否要确认收货？' })
    if (!confirm) return
    try {
      await confirmReceiveOrderAPI(orderId)
      Toast.show({ icon: 'success', content: '已确认收货' })
      loadData('refresh')
    } catch (e) {
      console.error('确认收货失败', e)
    }
  }

  // 删除订单（已完成/已关闭状态下可删除）
  const handleDeleteOrder = async (orderId: number) => {
    const confirm = await Dialog.confirm({ content: '是否要删除该订单？' })
    if (!confirm) return
    try {
      await deleteOrderAPI(orderId)
      Toast.show({ icon: 'success', content: '已删除' })
      loadData('refresh')
    } catch (e) {
      console.error('删除订单失败', e)
    }
  }

  return (
    <div className="order-list-page">
      <NavBarCustom title="我的订单" />
      {/* 顶部状态 Tab */}
      <div className="order-list__navbar">
        {navList.map((item, index) => (
          <div
            key={index}
            className={`order-list__nav-item ${tabIndex === index ? 'current' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="order-list__content">
        {orderList.map((order) => (
          <div className="order-item" key={order.id}>
            <div className="order-item__top">
              <span className="order-item__time">{formatDate(order.createTime)}</span>
              <span className="order-item__state">{formatStatus(order.status)}</span>
              {(order.status === 3 || order.status === 4) && (
                <span
                  className="order-item__del"
                  onClick={() => handleDeleteOrder(order.id)}
                >
                  删除
                </span>
              )}
            </div>

            {order.orderItemList?.map((item) => (
              <div
                className="order-item__goods"
                key={item.id}
                onClick={() => navigate(`/order/detail/${order.id}`)}
              >
                <img src={item.productPic} alt={item.productName} />
                <div className="order-item__right">
                  <p className="order-item__title ellipsis">{item.productName}</p>
                  <p className="order-item__attr ellipsis">
                    {formatProductAttr(item.productAttr)} x {item.productQuantity}
                  </p>
                  <span className="order-item__price">
                    <span className="price-symbol">¥</span>
                    {formatPrice(item.productPrice, false)}
                  </span>
                </div>
              </div>
            ))}

            <div className="order-item__price-box">
              共 <span className="num">{calcTotalQuantity(order)}</span> 件商品 实付款
              <span className="price">
                <span className="price-symbol">¥</span>
                {formatPrice(order.payAmount, false)}
              </span>
            </div>

            {order.status === 0 && (
              <div className="order-item__action">
                <button className="action-btn" onClick={() => handleCancelOrder(order.id)}>
                  取消订单
                </button>
                <button className="action-btn recom" onClick={() => handlePayOrder(order.id)}>
                  立即付款
                </button>
              </div>
            )}
            {order.status === 2 && (
              <div className="order-item__action">
                <button className="action-btn">查看物流</button>
                <button className="action-btn recom" onClick={() => handleReceiveOrder(order.id)}>
                  确认收货
                </button>
              </div>
            )}
            {order.status === 3 && (
              <div className="order-item__action">
                <button className="action-btn recom">评价商品</button>
              </div>
            )}
          </div>
        ))}

        <div className="order-list__loading">
          {loadingType === 'loading' && <SpinLoading color="primary" />}
          {loadingType === 'nomore' && orderList.length > 0 && <span>没有更多了</span>}
          {orderList.length === 0 && loadingType !== 'loading' && (
            <Empty text="暂无订单" icon={<span className="order-list__empty">📝</span>} />
          )}
        </div>
      </div>
    </div>
  )
}
