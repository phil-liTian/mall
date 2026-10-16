import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dialog, Stepper, Toast } from 'antd-mobile'
import { getFlashRelationAPI, generateFlashOrderAPI } from '@/api/order'
import { getProductDetailAPI } from '@/api/product'
import { fetchAddressListAPI } from '@/api/address'
import type {
  FlashPromotionRelationDetail,
  FlashOrderParam,
} from '@/types/order'
import type { PmsPortalProductDetail, PmsSkuStock, PmsProduct } from '@/types/product'
import type { MemberReceiveAddress } from '@/types/address'
import { NavBarCustom } from '@/components/NavBarCustom'
import { formatPrice, formatProductAttr } from '@/utils/format'
import './index.css'

export default function FlashOrderCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const relationId = Number(searchParams.get('relationId') || 0)
  const skuId = Number(searchParams.get('skuId') || 0)
  const productId = Number(searchParams.get('productId') || 0)
  const initQuantity = Math.max(1, Number(searchParams.get('quantity') || 1))

  const [relation, setRelation] = useState<FlashPromotionRelationDetail | null>(null)
  const [product, setProduct] = useState<PmsProduct | null>(null)
  const [sku, setSku] = useState<PmsSkuStock | null>(null)
  const [currentAddress, setCurrentAddress] = useState<MemberReceiveAddress | null>(null)
  const [addressList, setAddressList] = useState<MemberReceiveAddress[]>([])
  const [quantity, setQuantity] = useState(initQuantity)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState('')

  /** 数量上限：min(每人限购, 秒杀配额) */
  const maxQuantity = useMemo(() => {
    if (!relation) return initQuantity
    const limit = relation.flashPromotionLimit > 0 ? relation.flashPromotionLimit : 1
    return Math.max(1, Math.min(limit, relation.flashPromotionCount || limit))
  }, [relation, initQuantity])

  const totalAmount = useMemo(() => {
    if (!relation) return 0
    return relation.flashPromotionPrice * quantity
  }, [relation, quantity])

  const loadData = useCallback(async () => {
    if (!productId || !skuId) {
      setInvalid('秒杀参数不完整')
      setLoading(false)
      return
    }
    try {
      const [rel, detail, addrList] = await Promise.all([
        getFlashRelationAPI(productId),
        getProductDetailAPI(productId),
        fetchAddressListAPI(),
      ])
      if (!rel) {
        setInvalid('该商品当前不在秒杀活动中')
        return
      }
      if (relationId && rel.id !== relationId) {
        setInvalid('秒杀活动已变更，请返回商品详情重新下单')
        return
      }
      setRelation(rel)

      const d = detail as PmsPortalProductDetail
      setProduct(d.product)
      const foundSku = (d.skuStockList || []).find((s) => s.id === skuId)
      if (!foundSku) {
        setInvalid('商品规格不存在')
        return
      }
      setSku(foundSku)

      const list = addrList || []
      setAddressList(list)
      const def = list.find((a) => a.defaultStatus === 1)
      setCurrentAddress(def || list[0] || null)
    } catch (e) {
      console.error('加载秒杀订单信息失败', e)
      setInvalid('加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [productId, skuId, relationId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 从地址选择页返回时回填选中地址
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

  const handleSubmit = async () => {
    if (!relation || !sku) return
    if (!currentAddress?.id) {
      Toast.show({ content: '请选择收货地址' })
      return
    }
    if (quantity > maxQuantity) {
      Toast.show({ content: `超出限购数量（限购${maxQuantity}件）` })
      return
    }
    try {
      const param: FlashOrderParam = {
        flashPromotionRelationId: relation.id,
        productSkuId: sku.id,
        quantity,
        memberReceiveAddressId: currentAddress.id,
        payType: 0,
      }
      const res = await generateFlashOrderAPI(param)
      const orderId = res.order.id
      const ok = await Dialog.confirm({
        content: '秒杀订单创建成功，是否要立即支付？',
        confirmText: '去支付',
        cancelText: '取消',
      })
      if (ok) {
        navigate(`/money/pay?orderId=${orderId}`, { replace: true })
      } else {
        navigate('/order/list?status=0', { replace: true })
      }
    } catch (e) {
      console.error('提交秒杀订单失败', e)
    }
  }

  if (loading) {
    return (
      <div className="flash-order-page">
        <NavBarCustom title="秒杀下单" />
        <div className="flash-order__loading">加载中...</div>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="flash-order-page">
        <NavBarCustom title="秒杀下单" />
        <div className="flash-order__invalid">
          <p>{invalid}</p>
          <button
            className="flash-order__back-btn"
            onClick={() => navigate(`/product/detail/${productId}`, { replace: true })}
          >
            返回商品详情
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flash-order-page">
      <NavBarCustom title="秒杀下单" />

      {/* 收货地址 */}
      <div className="fo-address" onClick={() => navigate('/address/list?source=1')}>
        {currentAddress ? (
          <div className="fo-address__content">
            <span className="fo-address__icon">📍</span>
            <div className="fo-address__cen">
              <div className="fo-address__top">
                <span className="fo-address__name">{currentAddress.name}</span>
                <span className="fo-address__mobile">{currentAddress.phoneNumber}</span>
              </div>
              <span className="fo-address__text">
                {currentAddress.province} {currentAddress.city} {currentAddress.region}{' '}
                {currentAddress.detailAddress}
              </span>
            </div>
            <span className="fo-address__arrow">›</span>
          </div>
        ) : (
          <div className="fo-address__empty">
            <span>请添加收货地址</span>
            <span className="fo-address__arrow">›</span>
          </div>
        )}
        <div className="fo-address__bg" />
      </div>

      {/* 商品信息 */}
      <div className="fo-goods">
        <div className="fo-goods__header">
          <span className="fo-goods__badge">秒杀</span>
          商品信息
        </div>
        {product && relation && (
          <div className="fo-goods__item">
            <img src={sku?.pic || product.pic} alt={product.name} />
            <div className="fo-goods__right">
              <p className="fo-goods__title ellipsis">{product.name}</p>
              {sku?.spData && (
                <p className="fo-goods__spec ellipsis">{formatProductAttr(sku.spData)}</p>
              )}
              <div className="fo-goods__price-box">
                <span className="price">
                  <span className="price-symbol">¥</span>
                  {formatPrice(relation.flashPromotionPrice, false)}
                </span>
                <span className="fo-goods__origin">
                  ¥{formatPrice(sku?.price ?? product.price, false)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 数量 */}
        <div className="fo-goods__quantity">
          <span className="fo-goods__qt">
            购买数量
            {relation && relation.flashPromotionLimit > 0 && (
              <span className="fo-goods__limit">（限购{relation.flashPromotionLimit}件）</span>
            )}
          </span>
          <Stepper
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(v) => setQuantity(Number(v) || 1)}
          />
        </div>
      </div>

      {/* 金额明细 */}
      <div className="fo-list">
        <div className="fo-list__row">
          <span className="fo-list__tit">秒杀单价</span>
          <span className="fo-list__val">
            ¥{formatPrice(relation?.flashPromotionPrice ?? 0, false)}
          </span>
        </div>
        <div className="fo-list__row">
          <span className="fo-list__tit">购买数量</span>
          <span className="fo-list__val">x {quantity}</span>
        </div>
        <div className="fo-list__row">
          <span className="fo-list__tit">运费</span>
          <span className="fo-list__val">¥{formatPrice(0, false)}</span>
        </div>
      </div>

      {/* 底部提交栏 */}
      <div className="fo-footer">
        <div className="fo-footer__price">
          <span>实付款</span>
          <span className="price">
            <span className="price-symbol">¥</span>
            {formatPrice(totalAmount, false)}
          </span>
        </div>
        <button className="fo-footer__submit" onClick={handleSubmit}>
          提交秒杀订单
        </button>
      </div>
    </div>
  )
}