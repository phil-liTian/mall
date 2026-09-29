import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Toast } from 'antd-mobile'
import { getOrderDetailAPI, payOrderSuccessAPI } from '@/api/order'
import type { OmsOrderDetail } from '@/types/order'
import { NavBarCustom } from '@/components/NavBarCustom'
import { formatPrice } from '@/utils/format'
import './index.css'

export default function Pay() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = Number(searchParams.get('orderId'))
  // 支付方式：1->支付宝；2->微信
  const [payType, setPayType] = useState(1)
  const [orderInfo, setOrderInfo] = useState<Partial<OmsOrderDetail>>({})
  const [paying, setPaying] = useState(false)

  const loadData = useCallback(async () => {
    if (!orderId) return
    try {
      const data = await getOrderDetailAPI(orderId)
      setOrderInfo(data)
    } catch (e) {
      console.error('加载订单详情失败', e)
    }
  }, [orderId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleChangePayType = (type: number) => {
    setPayType(type)
  }

  const handleConfirmPay = async () => {
    // Mock 模式下直接走支付成功回调
    setPaying(true)
    try {
      await payOrderSuccessAPI({ orderId, payType })
      navigate('/money/paySuccess', { replace: true })
    } catch (e) {
      console.error('支付失败', e)
      setPaying(false)
      Toast.show({ content: '支付失败，请重试' })
    }
  }

  return (
    <div className="pay-page">
      <NavBarCustom title="收银台" />

      {/* 支付金额 */}
      <div className="pay-page__price-box">
        <span className="pay-page__label">支付金额</span>
        <span className="pay-page__price">
          <span className="price-symbol">¥</span>
          {formatPrice(orderInfo.payAmount ?? 0, false)}
        </span>
      </div>

      {/* 支付方式 */}
      <div className="pay-page__type-list">
        <div
          className={`pay-page__type-item ${payType === 1 ? 'active' : ''}`}
          onClick={() => handleChangePayType(1)}
        >
          <span className="pay-page__type-icon alipay">💰</span>
          <div className="pay-page__type-con">
            <span className="pay-page__type-tit">支付宝支付</span>
            <span className="pay-page__type-desc">推荐使用支付宝支付</span>
          </div>
          <span className={`pay-page__radio ${payType === 1 ? 'checked' : ''}`} />
        </div>
        <div
          className={`pay-page__type-item ${payType === 2 ? 'active' : ''}`}
          onClick={() => handleChangePayType(2)}
        >
          <span className="pay-page__type-icon wechat">💚</span>
          <div className="pay-page__type-con">
            <span className="pay-page__type-tit">微信支付</span>
          </div>
          <span className={`pay-page__radio ${payType === 2 ? 'checked' : ''}`} />
        </div>
      </div>

      <button
        className="pay-page__confirm-btn"
        disabled={paying || !orderInfo.payAmount}
        onClick={handleConfirmPay}
      >
        {paying ? '支付中...' : '确认支付'}
      </button>
    </div>
  )
}
