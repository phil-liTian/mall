import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dialog, Toast } from 'antd-mobile'
import { generateConfirmOrderAPI, generateOrderAPI } from '@/api/order'
import type { CartPromotionItem, CalcAmount, ConfirmOrderResult } from '@/types/order'
import type { MemberReceiveAddress } from '@/types/address'
import { NavBarCustom } from '@/components/NavBarCustom'
import { formatPrice } from '@/utils/format'
import './index.css'

export default function CreateOrder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const cartIdsParam = searchParams.get('cartIds') || '[]'
  const cartIds: number[] = (() => {
    try {
      return JSON.parse(cartIdsParam)
    } catch {
      return []
    }
  })()

  const [addressList, setAddressList] = useState<MemberReceiveAddress[]>([])
  const [currentAddress, setCurrentAddress] = useState<MemberReceiveAddress | null>(null)
  const [cartPromotionItemList, setCartPromotionItemList] = useState<CartPromotionItem[]>([])
  const [calcAmount, setCalcAmount] = useState<CalcAmount>({} as CalcAmount)
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (cartIds.length === 0) return
    try {
      const data: ConfirmOrderResult = await generateConfirmOrderAPI(cartIds)
      setAddressList(data.memberReceiveAddressList || [])
      setCurrentAddress(getDefaultAddress(data.memberReceiveAddressList || []))
      setCartPromotionItemList(data.cartPromotionItemList || [])
      setCalcAmount(data.calcAmount)
    } catch (e) {
      console.error('加载确认单失败', e)
    } finally {
      setLoading(false)
    }
  }, [cartIds])

  const getDefaultAddress = (list: MemberReceiveAddress[]): MemberReceiveAddress | null => {
    for (const item of list) {
      if (item.defaultStatus === 1) return item
    }
    return list.length > 0 ? list[0] : null
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  // 从地址选择页返回时刷新当前地址
  useEffect(() => {
    const selectedId = sessionStorage.getItem('mall_h5_selected_address_id')
    if (selectedId && addressList.length > 0) {
      const found = addressList.find((a) => String(a.id) === selectedId)
      if (found) {
        setCurrentAddress(found)
        sessionStorage.removeItem('mall_h5_selected_address_id')
      }
    }
  }, [addressList])

  const formatProductAttr = (jsonAttr: string) => {
    if (!jsonAttr) return ''
    try {
      const arr = JSON.parse(jsonAttr)
      return arr.map((a: any) => `${a.key}:${a.value}`).join('; ')
    } catch {
      return jsonAttr
    }
  }

  const handleSubmit = async () => {
    if (!currentAddress?.id) {
      Toast.show({ content: '请选择收货地址' })
      return
    }
    try {
      const res = await generateOrderAPI({
        payType: 0,
        cartIds: cartIds.map(Number),
        memberReceiveAddressId: currentAddress.id,
        useIntegration: 0,
      })
      const orderId = res.order.id
      const ok = await Dialog.confirm({
        content: '订单创建成功，是否要立即支付？',
        confirmText: '去支付',
        cancelText: '取消',
      })
      if (ok) {
        navigate(`/money/pay?orderId=${orderId}`, { replace: true })
      } else {
        navigate('/order/list?status=0', { replace: true })
      }
    } catch (e) {
      console.error('提交订单失败', e)
    }
  }

  if (loading) {
    return (
      <div className="create-order-page">
        <NavBarCustom title="确认订单" />
        <div className="create-order__loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="create-order-page">
      <NavBarCustom title="确认订单" />

      {/* 收货地址 */}
      <div
        className="co-address"
        onClick={() => navigate('/address/list?source=1')}
      >
        {currentAddress ? (
          <div className="co-address__content">
            <span className="co-address__icon">📍</span>
            <div className="co-address__cen">
              <div className="co-address__top">
                <span className="co-address__name">{currentAddress.name}</span>
                <span className="co-address__mobile">{currentAddress.phoneNumber}</span>
              </div>
              <span className="co-address__text">
                {currentAddress.province} {currentAddress.city} {currentAddress.region}{' '}
                {currentAddress.detailAddress}
              </span>
            </div>
            <span className="co-address__arrow">›</span>
          </div>
        ) : (
          <div className="co-address__empty">
            <span>请添加收货地址</span>
            <span className="co-address__arrow">›</span>
          </div>
        )}
        <div className="co-address__bg" />
      </div>

      {/* 商品信息 */}
      <div className="co-goods">
        <div className="co-goods__header">商品信息</div>
        {cartPromotionItemList.map((item) => (
          <div className="co-goods__item" key={item.id}>
            <img src={item.productPic} alt={item.productName} />
            <div className="co-goods__right">
              <p className="co-goods__title ellipsis">{item.productName}</p>
              <p className="co-goods__spec ellipsis">{formatProductAttr(item.productAttr)}</p>
              {item.promotionMessage && (
                <p className="co-goods__promo ellipsis">{item.promotionMessage}</p>
              )}
              <div className="co-goods__price-box">
                <span className="price">
                  <span className="price-symbol">¥</span>
                  {formatPrice(item.price, false)}
                </span>
                <span className="co-goods__number">x {item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 金额明细 */}
      <div className="co-list">
        <div className="co-list__row">
          <span className="co-list__tit">商品合计</span>
          <span className="co-list__val">¥{formatPrice(calcAmount.totalAmount, false)}</span>
        </div>
        <div className="co-list__row">
          <span className="co-list__tit">运费</span>
          <span className="co-list__val">¥{formatPrice(calcAmount.freightAmount, false)}</span>
        </div>
        <div className="co-list__row">
          <span className="co-list__tit">活动优惠</span>
          <span className="co-list__val red">
            -¥{formatPrice(calcAmount.promotionAmount, false)}
          </span>
        </div>
        <div className="co-list__row desc-row">
          <span className="co-list__tit">备注</span>
          <input
            className="co-list__desc"
            type="text"
            value={desc}
            placeholder="请填写备注信息"
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      </div>

      {/* 底部提交栏 */}
      <div className="co-footer">
        <div className="co-footer__price">
          <span>实付款</span>
          <span className="price">
            <span className="price-symbol">¥</span>
            {formatPrice(calcAmount.payAmount, false)}
          </span>
        </div>
        <button className="co-footer__submit" onClick={handleSubmit}>
          提交订单
        </button>
      </div>
    </div>
  )
}
