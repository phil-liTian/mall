import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Toast, Picker, ImageUploader, type ImageUploadItem } from 'antd-mobile'
import { getOrderDetailAPI } from '@/api/order'
import { createReturnApplyAPI, getReturnReasonListAPI } from '@/api/aftersale'
import { uploadImageAPI } from '@/api/upload'
import type { OmsOrderDetail, OmsOrderItem } from '@/types/order'
import { NavBarCustom } from '@/components/NavBarCustom'
import { formatPrice, formatProductAttr } from '@/utils/format'
import './index.css'

const MAX_PICS = 5
const MAX_DESC_LENGTH = 500

export default function AftersaleApply() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = Number(searchParams.get('orderId') ?? 0)
  // 订单内只有一件商品时无需选择，支持从订单详情直接带上目标商品
  const presetItemId = Number(searchParams.get('orderItemId') ?? 0)

  const [order, setOrder] = useState<OmsOrderDetail | null>(null)
  const [reasonOptions, setReasonOptions] = useState<{ label: string; value: string }[]>([])
  const [orderItemId, setOrderItemId] = useState(presetItemId)
  const [reason, setReason] = useState('')
  const [reasonVisible, setReasonVisible] = useState(false)
  const [description, setDescription] = useState('')
  const [fileList, setFileList] = useState<ImageUploadItem[]>([])
  const [returnName, setReturnName] = useState('')
  const [returnPhone, setReturnPhone] = useState('')
  const [loading, setLoading] = useState(true)
  // 防止连点造成重复申请
  const submittingRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!orderId) {
      setLoading(false)
      return
    }
    try {
      const [orderData, reasonList] = await Promise.all([
        getOrderDetailAPI(orderId),
        getReturnReasonListAPI(),
      ])
      setOrder(orderData)
      setReasonOptions((reasonList || []).map((item) => ({ label: item.name, value: item.name })))
      // 退货人信息默认用订单的收货人，用户可改
      setReturnName(orderData.receiverName || '')
      setReturnPhone(orderData.receiverPhone || '')
      const items = orderData.orderItemList || []
      if (!presetItemId && items.length === 1) {
        setOrderItemId(items[0].id)
      }
    } catch (e) {
      console.error('加载售后申请信息失败', e)
    } finally {
      setLoading(false)
    }
  }, [orderId, presetItemId])

  useEffect(() => {
    loadData()
    window.scrollTo(0, 0)
  }, [loadData])

  const handleUpload = async (file: File): Promise<ImageUploadItem> => {
    const res = await uploadImageAPI(file)
    return { url: res.url }
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    if (!orderItemId) {
      Toast.show({ content: '请选择要申请售后的商品' })
      return
    }
    if (!reason) {
      Toast.show({ content: '请选择退货原因' })
      return
    }
    if (description.length > MAX_DESC_LENGTH) {
      Toast.show({ content: `问题描述不能超过${MAX_DESC_LENGTH}字` })
      return
    }
    if (!returnName.trim()) {
      Toast.show({ content: '请填写退货人姓名' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(returnPhone)) {
      Toast.show({ content: '请填写正确的手机号' })
      return
    }
    submittingRef.current = true
    try {
      await createReturnApplyAPI({
        orderId,
        orderItemId,
        reason,
        description: description.trim(),
        proofPics: fileList.map((item) => item.url),
        returnName: returnName.trim(),
        returnPhone,
      })
      Toast.show({ icon: 'success', content: '提交成功' })
      setTimeout(() => navigate('/aftersale/list', { replace: true }), 800)
    } catch (e) {
      console.error('提交售后申请失败', e)
      submittingRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="aftersale-apply-page">
        <NavBarCustom title="申请售后" />
        <div className="as-tip">加载中...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="aftersale-apply-page">
        <NavBarCustom title="申请售后" />
        <div className="as-tip">订单不存在</div>
      </div>
    )
  }

  const items: OmsOrderItem[] = order.orderItemList || []

  return (
    <div className="aftersale-apply-page">
      <NavBarCustom title="申请售后" />

      {/* 选择申请售后的商品 */}
      <div className="as-section">
        <div className="as-section__header">选择商品</div>
        {items.map((item) => (
          <div
            className={`as-goods ${orderItemId === item.id ? 'current' : ''}`}
            key={item.id}
            onClick={() => setOrderItemId(item.id)}
          >
            <span className="as-goods__radio">{orderItemId === item.id ? '●' : '○'}</span>
            <img src={item.productPic} alt={item.productName} />
            <div className="as-goods__right">
              <p className="as-goods__title ellipsis">{item.productName}</p>
              <p className="as-goods__spec ellipsis">{formatProductAttr(item.productAttr)}</p>
              <div className="as-goods__price-box">
                <span className="price">
                  <span className="price-symbol">¥</span>
                  {formatPrice(item.productPrice, false)}
                </span>
                <span className="as-goods__number">x {item.productQuantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 申请信息 */}
      <div className="as-section">
        <div className="as-row" onClick={() => setReasonVisible(true)}>
          <span className="as-row__tit">退货原因</span>
          <span className={`as-row__val ${reason ? '' : 'placeholder'}`}>
            {reason || '请选择'}
          </span>
          <span className="as-row__arrow">›</span>
        </div>
        <div className="as-row as-row--textarea">
          <span className="as-row__tit">问题描述</span>
          <textarea
            className="as-row__textarea"
            value={description}
            maxLength={MAX_DESC_LENGTH}
            placeholder="请描述遇到的问题，便于我们更快处理"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="as-row as-row--upload">
          <span className="as-row__tit">上传凭证</span>
          <ImageUploader
            value={fileList}
            onChange={setFileList}
            maxCount={MAX_PICS}
            upload={handleUpload}
          />
        </div>
      </div>

      {/* 退货人信息 */}
      <div className="as-section">
        <div className="as-row">
          <span className="as-row__tit">退货人</span>
          <input
            className="as-row__input"
            type="text"
            value={returnName}
            placeholder="退货人姓名"
            onChange={(e) => setReturnName(e.target.value)}
          />
        </div>
        <div className="as-row">
          <span className="as-row__tit">联系电话</span>
          <input
            className="as-row__input"
            type="tel"
            maxLength={11}
            value={returnPhone}
            placeholder="退货人手机号"
            onChange={(e) => setReturnPhone(e.target.value)}
          />
        </div>
      </div>

      <button className="as-submit-btn" onClick={handleSubmit}>
        提交申请
      </button>

      <Picker
        columns={[reasonOptions]}
        visible={reasonVisible}
        value={[reason]}
        onClose={() => setReasonVisible(false)}
        onConfirm={(value) => setReason((value[0] as string) || '')}
      />
    </div>
  )
}
