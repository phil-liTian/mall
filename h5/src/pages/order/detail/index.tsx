import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Dialog, Toast } from 'antd-mobile'
import { getOrderDetailAPI, cancelUserOrderAPI, confirmReceiveOrderAPI } from '@/api/order'
import type { OmsOrderDetail } from '@/types/order'
import { NavBarCustom } from '@/components/NavBarCustom'
import { formatPrice } from '@/utils/format'
import { formatDate } from '@/utils/date'
import './index.css'

// 订单状态信息
const statusInfoMap: Record<number, { text: string; icon: string }> = {
  0: { text: '等待付款', icon: '💰' },
  1: { text: '等待发货', icon: '📦' },
  2: { text: '等待收货', icon: '🚚' },
  3: { text: '交易完成', icon: '✅' },
  4: { text: '交易关闭', icon: '❌' },
}

// 支付方式文案
const formatPayType = (payType: number): string => {
  const map: Record<number, string> = {
    0: '未支付',
    1: '支付宝支付',
    2: '微信支付',
  }
  return map[payType] || ''
}

// 解析商品销售属性
const formatProductAttr = (jsonAttr: string): string => {
  if (!jsonAttr) return ''
  try {
    const arr = JSON.parse(jsonAttr) as { key: string; value: string }[]
    return arr.map((a) => `${a.key}:${a.value}`).join('; ')
  } catch {
    return jsonAttr
  }
}

export default function OrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const orderId = Number(id)
  const [order, setOrder] = useState<OmsOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!orderId) return
    try {
      const data = await getOrderDetailAPI(orderId)
      setOrder(data)
    } catch (e) {
      console.error('加载订单详情失败', e)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadData()
    window.scrollTo(0, 0)
  }, [loadData])

  const handleCancelOrder = async () => {
    const confirm = await Dialog.confirm({ content: '是否要取消该订单？' })
    if (!confirm) return
    try {
      await cancelUserOrderAPI(orderId)
      Toast.show({ icon: 'success', content: '已取消' })
      loadData()
    } catch (e) {
      console.error('取消订单失败', e)
    }
  }

  const handlePayOrder = () => {
    navigate(`/money/pay?orderId=${orderId}`)
  }

  const handleReceiveOrder = async () => {
    const confirm = await Dialog.confirm({ content: '是否要确认收货？' })
    if (!confirm) return
    try {
      await confirmReceiveOrderAPI(orderId)
      Toast.show({ icon: 'success', content: '已确认收货' })
      loadData()
    } catch (e) {
      console.error('确认收货失败', e)
    }
  }

  if (loading) {
    return (
      <div className="order-detail-page">
        <NavBarCustom title="订单详情" />
        <div className="order-detail__loading">加载中...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <NavBarCustom title="订单详情" />
        <div className="order-detail__loading">订单不存在</div>
      </div>
    )
  }

  const statusInfo = statusInfoMap[order.status] || { text: '', icon: '' }
  const showPayAmount = order.status === 1 || order.status === 2 || order.status === 3

  return (
    <div className="order-detail-page">
      <NavBarCustom title="订单详情" />

      {/* 状态横幅 */}
      <div className="od-status">
        <span className="od-status__icon">{statusInfo.icon}</span>
        <span className="od-status__text">{statusInfo.text}</span>
      </div>

      {/* 收货地址 */}
      <div className="od-address">
        <span className="od-address__icon">📍</span>
        <div className="od-address__cen">
          <div className="od-address__top">
            <span className="od-address__name">{order.receiverName}</span>
            <span className="od-address__mobile">{order.receiverPhone}</span>
          </div>
          <span className="od-address__text">
            {order.receiverProvince} {order.receiverCity} {order.receiverRegion}{' '}
            {order.receiverDetailAddress}
          </span>
        </div>
      </div>

      {/* 商品信息 */}
      <div className="od-goods">
        <div className="od-goods__header">商品信息</div>
        {order.orderItemList?.map((item) => (
          <div className="od-goods__item" key={item.id}>
            <img src={item.productPic} alt={item.productName} />
            <div className="od-goods__right">
              <p className="od-goods__title ellipsis">{item.productName}</p>
              <p className="od-goods__spec ellipsis">{formatProductAttr(item.productAttr)}</p>
              {item.promotionName && (
                <p className="od-goods__promo ellipsis">{item.promotionName}</p>
              )}
              <div className="od-goods__price-box">
                <span className="price">
                  <span className="price-symbol">¥</span>
                  {formatPrice(item.productPrice, false)}
                </span>
                <span className="od-goods__number">x {item.productQuantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 金额明细 */}
      <div className="od-list">
        <div className="od-list__row">
          <span className="od-list__tit">商品合计</span>
          <span className="od-list__val">¥{formatPrice(order.totalAmount, false)}</span>
        </div>
        <div className="od-list__row">
          <span className="od-list__tit">运费</span>
          <span className="od-list__val">¥{formatPrice(order.freightAmount, false)}</span>
        </div>
        <div className="od-list__row">
          <span className="od-list__tit">活动优惠</span>
          <span className="od-list__val red">-¥{formatPrice(order.promotionAmount, false)}</span>
        </div>
        <div className="od-list__row">
          <span className="od-list__tit">优惠券</span>
          <span className="od-list__val red">-¥{formatPrice(order.couponAmount, false)}</span>
        </div>
        <div className="od-list__row">
          <span className="od-list__tit">积分抵扣</span>
          <span className="od-list__val red">-¥{formatPrice(order.integrationAmount, false)}</span>
        </div>
        <div className="od-list__row">
          <span className="od-list__tit">备注</span>
          <span className="od-list__val">{order.note || '无'}</span>
        </div>
      </div>

      {/* 订单信息 */}
      <div className="od-list">
        <div className="od-list__row">
          <span className="od-list__tit">订单编号</span>
          <span className="od-list__val">{order.orderSn}</span>
        </div>
        <div className="od-list__row">
          <span className="od-list__tit">提交时间</span>
          <span className="od-list__val">{formatDate(order.createTime)}</span>
        </div>
        <div className="od-list__row">
          <span className="od-list__tit">支付方式</span>
          <span className="od-list__val">{formatPayType(order.payType)}</span>
        </div>
        {showPayAmount && (
          <div className="od-list__row">
            <span className="od-list__tit">实付金额</span>
            <span className="od-list__val">¥{formatPrice(order.payAmount, false)}</span>
          </div>
        )}
        {showPayAmount && (
          <div className="od-list__row">
            <span className="od-list__tit">付款时间</span>
            <span className="od-list__val">{formatDate(order.paymentTime)}</span>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {(order.status === 0 || order.status === 2 || order.status === 3) && (
        <div className="od-footer">
          {order.status === 0 && (
            <div className="od-footer__action">
              <button className="action-btn" onClick={handleCancelOrder}>
                取消订单
              </button>
              <button className="action-btn recom" onClick={handlePayOrder}>
                立即付款
              </button>
            </div>
          )}
          {order.status === 2 && (
            <div className="od-footer__action">
              <button className="action-btn">查看物流</button>
              <button className="action-btn recom" onClick={handleReceiveOrder}>
                确认收货
              </button>
            </div>
          )}
          {order.status === 3 && (
            <div className="od-footer__action">
              <button className="action-btn">申请售后</button>
              <button className="action-btn recom">评价商品</button>
            </div>
          )}
          {order.status === 0 && (
            <div className="od-footer__price">
              <span>应付金额</span>
              <span className="price">
                <span className="price-symbol">¥</span>
                {formatPrice(order.payAmount, false)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
