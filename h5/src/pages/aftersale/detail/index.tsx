import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Dialog, Toast, ImageViewer } from 'antd-mobile'
import { getReturnApplyDetailAPI, cancelReturnApplyAPI } from '@/api/aftersale'
import type { OmsOrderReturnApply } from '@/types/order'
import { NavBarCustom } from '@/components/NavBarCustom'
import { formatPrice, formatProductAttr } from '@/utils/format'
import { formatDate } from '@/utils/date'
import './index.css'

const statusInfoMap: Record<number, { text: string; desc: string; icon: string }> = {
  0: { text: '待处理', desc: '已提交申请，等待客服处理', icon: '⏳' },
  1: { text: '退货中', desc: '申请已通过，请按客服指引寄回商品', icon: '🚚' },
  2: { text: '已完成', desc: '售后已处理完成', icon: '✅' },
  3: { text: '已拒绝', desc: '申请未通过，可查看处理备注', icon: '❌' },
}

export default function AftersaleDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const applyId = Number(id)
  const [apply, setApply] = useState<OmsOrderReturnApply | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!applyId) return
    try {
      const data = await getReturnApplyDetailAPI(applyId)
      setApply(data)
    } catch (e) {
      console.error('加载售后详情失败', e)
    } finally {
      setLoading(false)
    }
  }, [applyId])

  useEffect(() => {
    loadData()
    window.scrollTo(0, 0)
  }, [loadData])

  const handleCancel = async () => {
    const confirm = await Dialog.confirm({ content: '是否要撤销该售后申请？' })
    if (!confirm) return
    try {
      await cancelReturnApplyAPI(applyId)
      Toast.show({ icon: 'success', content: '已撤销' })
      setTimeout(() => navigate('/aftersale/list', { replace: true }), 800)
    } catch (e) {
      console.error('撤销售后申请失败', e)
    }
  }

  if (loading) {
    return (
      <div className="aftersale-detail-page">
        <NavBarCustom title="售后详情" fallback="/aftersale/list" />
        <div className="asd__tip">加载中...</div>
      </div>
    )
  }

  if (!apply) {
    return (
      <div className="aftersale-detail-page">
        <NavBarCustom title="售后详情" fallback="/aftersale/list" />
        <div className="asd__tip">售后申请不存在</div>
      </div>
    )
  }

  const statusInfo = statusInfoMap[apply.status] || { text: '', desc: '', icon: '' }
  const picList = apply.proofPics ? apply.proofPics.split(',').filter(Boolean) : []

  return (
    <div className="aftersale-detail-page">
      <NavBarCustom title="售后详情" fallback="/aftersale/list" />

      {/* 状态横幅 */}
      <div className="asd-status">
        <span className="asd-status__icon">{statusInfo.icon}</span>
        <div className="asd-status__cen">
          <div className="asd-status__text">{statusInfo.text}</div>
          <div className="asd-status__desc">{statusInfo.desc}</div>
        </div>
      </div>

      {/* 商品信息 */}
      <div className="asd-section">
        <div className="asd-goods">
          <img src={apply.productPic} alt={apply.productName} />
          <div className="asd-goods__right">
            <p className="asd-goods__title ellipsis">{apply.productName}</p>
            <p className="asd-goods__spec ellipsis">{formatProductAttr(apply.productAttr)}</p>
            <div className="asd-goods__price-box">
              <span className="price">
                <span className="price-symbol">¥</span>
                {formatPrice(apply.productRealPrice, false)}
              </span>
              <span className="asd-goods__number">x {apply.productCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 申请信息 */}
      <div className="asd-section">
        <div className="asd-row">
          <span className="asd-row__tit">退款金额</span>
          <span className="asd-row__val red">¥{formatPrice(apply.returnAmount, false)}</span>
        </div>
        <div className="asd-row">
          <span className="asd-row__tit">退货原因</span>
          <span className="asd-row__val">{apply.reason}</span>
        </div>
        <div className="asd-row">
          <span className="asd-row__tit">问题描述</span>
          <span className="asd-row__val">{apply.description || '无'}</span>
        </div>
        {picList.length > 0 && (
          <div className="asd-row asd-row--pics">
            <span className="asd-row__tit">凭证图片</span>
            <div className="asd-pics">
              {picList.map((pic, index) => (
                <img
                  key={pic}
                  src={pic}
                  alt="凭证"
                  onClick={() =>
                    ImageViewer.Multi.show({ images: picList, defaultIndex: index })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 处理信息 */}
      <div className="asd-section">
        <div className="asd-row">
          <span className="asd-row__tit">订单编号</span>
          <span className="asd-row__val">{apply.orderSn}</span>
        </div>
        <div className="asd-row">
          <span className="asd-row__tit">申请时间</span>
          <span className="asd-row__val">{formatDate(apply.createTime)}</span>
        </div>
        <div className="asd-row">
          <span className="asd-row__tit">退货人</span>
          <span className="asd-row__val">
            {apply.returnName} {apply.returnPhone}
          </span>
        </div>
        {apply.handleTime && (
          <div className="asd-row">
            <span className="asd-row__tit">处理时间</span>
            <span className="asd-row__val">{formatDate(apply.handleTime)}</span>
          </div>
        )}
        {apply.handleNote && (
          <div className="asd-row">
            <span className="asd-row__tit">处理备注</span>
            <span className="asd-row__val">{apply.handleNote}</span>
          </div>
        )}
      </div>

      {/* 仅待处理状态可撤销 */}
      {apply.status === 0 && (
        <div className="asd-footer">
          <button className="asd-footer__btn" onClick={handleCancel}>
            撤销申请
          </button>
        </div>
      )}
    </div>
  )
}
