import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Toast, Rate, ImageUploader, type ImageUploadItem } from 'antd-mobile'
import { createCommentAPI, getUncommentedItemsAPI } from '@/api/comment'
import { uploadImageAPI } from '@/api/upload'
import type { OmsOrderItem } from '@/types/order'
import { NavBarCustom } from '@/components/NavBarCustom'
import { Empty } from '@/components/Empty'
import { formatProductAttr } from '@/utils/format'
import './index.css'

const MAX_PICS = 5
const MAX_CONTENT_LENGTH = 500

type CommentDraft = {
  star: number
  content: string
  fileList: ImageUploadItem[]
}

export default function CommentCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = Number(searchParams.get('orderId') ?? 0)

  const [items, setItems] = useState<OmsOrderItem[]>([])
  const [drafts, setDrafts] = useState<Record<number, CommentDraft>>({})
  const [loading, setLoading] = useState(true)
  const submittingRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!orderId) {
      setLoading(false)
      return
    }
    try {
      const list = await getUncommentedItemsAPI(orderId)
      setItems(list || [])
      // 预建全量 key，否则下面的受控组件第一次渲染会吃到 undefined
      setDrafts(
        (list || []).reduce<Record<number, CommentDraft>>((acc, item) => {
          acc[item.id] = { star: 5, content: '', fileList: [] }
          return acc
        }, {}),
      )
    } catch (e) {
      console.error('加载待评价商品失败', e)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadData()
    window.scrollTo(0, 0)
  }, [loadData])

  const updateDraft = (orderItemId: number, patch: Partial<CommentDraft>) => {
    setDrafts((prev) => ({ ...prev, [orderItemId]: { ...prev[orderItemId], ...patch } }))
  }

  const handleUpload = async (file: File): Promise<ImageUploadItem> => {
    const res = await uploadImageAPI(file)
    return { url: res.url }
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    const hasUnrated = items.some((item) => !drafts[item.id]?.star)
    if (hasUnrated) {
      Toast.show({ content: '请为每个商品打分' })
      return
    }
    submittingRef.current = true
    try {
      await createCommentAPI({
        orderId,
        items: items.map((item) => {
          const draft = drafts[item.id]
          return {
            orderItemId: item.id,
            star: draft.star,
            content: draft.content.trim(),
            pics: draft.fileList.map((f) => f.url),
          }
        }),
      })
      Toast.show({ icon: 'success', content: '评价成功' })
      setTimeout(() => navigate('/comment/my', { replace: true }), 800)
    } catch (e) {
      console.error('提交评价失败', e)
      submittingRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="comment-create-page">
        <NavBarCustom title="发表评价" />
        <div className="cc__tip">加载中...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="comment-create-page">
        <NavBarCustom title="发表评价" />
        <Empty text="该订单的商品都已评价" icon={<span className="cc__empty">✏️</span>} />
      </div>
    )
  }

  return (
    <div className="comment-create-page">
      <NavBarCustom title="发表评价" />

      {items.map((item) => {
        const draft = drafts[item.id]
        return (
          <div className="cc-item" key={item.id}>
            <div className="cc-item__goods">
              <img src={item.productPic} alt={item.productName} />
              <div className="cc-item__right">
                <p className="cc-item__title ellipsis">{item.productName}</p>
                <p className="cc-item__spec ellipsis">{formatProductAttr(item.productAttr)}</p>
              </div>
            </div>

            <div className="cc-item__star">
              <span className="cc-item__star-tit">商品评分</span>
              <Rate
                value={draft.star}
                onChange={(star) => updateDraft(item.id, { star })}
                style={{ '--active-color': '#fa436a' }}
              />
            </div>

            <textarea
              className="cc-item__textarea"
              value={draft.content}
              maxLength={MAX_CONTENT_LENGTH}
              placeholder="说说这件商品怎么样，可以帮助更多人"
              onChange={(e) => updateDraft(item.id, { content: e.target.value })}
            />

            <div className="cc-item__upload">
              <ImageUploader
                value={draft.fileList}
                onChange={(fileList) => updateDraft(item.id, { fileList })}
                maxCount={MAX_PICS}
                upload={handleUpload}
              />
            </div>
          </div>
        )
      })}

      <button className="cc-submit-btn" onClick={handleSubmit}>
        发表评价
      </button>
    </div>
  )
}
