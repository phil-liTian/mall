import { useState, useEffect, useRef, useCallback, type UIEvent } from 'react'
import { Popup, Rate, ImageViewer, SpinLoading } from 'antd-mobile'
import { getCommentListAPI, getCommentStatAPI } from '@/api/comment'
import type { PmsComment, PmsCommentStat } from '@/types/comment'
import { Empty } from '@/components/Empty'
import { formatProductAttr } from '@/utils/format'
import { formatDate } from '@/utils/date'
import './index.css'

const PREVIEW_SIZE = 3
const PAGE_SIZE = 10
const DEFAULT_AVATAR =
  'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png'

interface CommentSectionProps {
  productId: number
}

const CommentCard = ({ comment }: { comment: PmsComment }) => {
  const picList = comment.pics ? comment.pics.split(',').filter(Boolean) : []
  return (
    <div className="cs-card">
      <div className="cs-card__user">
        <img
          className="cs-card__avatar"
          src={comment.memberIcon || DEFAULT_AVATAR}
          alt={comment.memberNickName}
        />
        <div className="cs-card__meta">
          <span className="cs-card__name">{comment.memberNickName}</span>
          <Rate readOnly value={comment.star} style={{ '--star-size': '20px' }} />
        </div>
        <span className="cs-card__time">{formatDate(comment.createTime)}</span>
      </div>
      {comment.content && <p className="cs-card__content">{comment.content}</p>}
      {picList.length > 0 && (
        <div className="cs-card__pics">
          {picList.map((pic, index) => (
            <img
              key={pic}
              src={pic}
              alt="晒图"
              onClick={() => ImageViewer.Multi.show({ images: picList, defaultIndex: index })}
            />
          ))}
        </div>
      )}
      {comment.productAttribute && (
        <p className="cs-card__spec">{formatProductAttr(comment.productAttribute)}</p>
      )}
    </div>
  )
}

export const CommentSection = ({ productId }: CommentSectionProps) => {
  const [stat, setStat] = useState<PmsCommentStat | null>(null)
  const [preview, setPreview] = useState<PmsComment[]>([])
  const [popupVisible, setPopupVisible] = useState(false)

  // 弹层内的全量列表，与首屏 3 条各自独立
  const [allList, setAllList] = useState<PmsComment[]>([])
  const [onlyPic, setOnlyPic] = useState(false)
  const [loadingType, setLoadingType] = useState<'more' | 'loading' | 'nomore'>('more')
  const pageNumRef = useRef(1)
  const onlyPicRef = useRef(false)

  useEffect(() => {
    if (!productId) return
    Promise.all([
      getCommentListAPI({ productId, pageNum: 1, pageSize: PREVIEW_SIZE }),
      getCommentStatAPI(productId),
    ])
      .then(([listRes, statRes]) => {
        setPreview(listRes.list || [])
        setStat(statRes)
      })
      .catch((e) => console.error('加载商品评价失败', e))
  }, [productId])

  const loadAll = useCallback(
    async (type: 'refresh' | 'add' = 'refresh') => {
      if (type === 'add' && loadingType !== 'more') return
      if (type === 'refresh') {
        pageNumRef.current = 1
      } else {
        pageNumRef.current++
      }
      setLoadingType('loading')
      try {
        const res = await getCommentListAPI({
          productId,
          pageNum: pageNumRef.current,
          pageSize: PAGE_SIZE,
          ...(onlyPicRef.current ? { onlyPic: true } : {}),
        })
        const list = res.list || []
        if (type === 'refresh') {
          setAllList(list)
        } else if (list.length > 0) {
          setAllList((prev) => [...prev, ...list])
        } else {
          pageNumRef.current--
        }
        setLoadingType(list.length < PAGE_SIZE ? 'nomore' : 'more')
      } catch (e) {
        console.error('加载评价列表失败', e)
        setLoadingType('more')
      }
    },
    [productId, loadingType],
  )

  const handleOpenAll = () => {
    setPopupVisible(true)
    loadAll('refresh')
  }

  const handleToggleOnlyPic = (value: boolean) => {
    if (value === onlyPicRef.current) return
    onlyPicRef.current = value
    setOnlyPic(value)
    setAllList([])
    loadAll('refresh')
  }

  const handlePopupScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 100 && loadingType === 'more') {
      loadAll('add')
    }
  }

  const total = stat?.total ?? 0
  // 好评率按好评数/总数算，无评价时不展示
  const goodRate = total > 0 ? Math.round(((stat?.goodCount ?? 0) / total) * 100) : 0

  return (
    <div className="comment-section">
      <div className="cs__header" onClick={total > 0 ? handleOpenAll : undefined}>
        <span className="cs__tit">商品评价（{total}）</span>
        {total > 0 && (
          <>
            <span className="cs__rate">好评 {goodRate}%</span>
            <span className="cs__arrow">›</span>
          </>
        )}
      </div>

      {total === 0 ? (
        <div className="cs__empty">暂无评价，快来抢沙发</div>
      ) : (
        <>
          {preview.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
          <div className="cs__more" onClick={handleOpenAll}>
            查看全部 {total} 条评价
          </div>
        </>
      )}

      <Popup
        visible={popupVisible}
        onMaskClick={() => setPopupVisible(false)}
        bodyStyle={{ height: '80vh', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}
      >
        <div className="cs-popup">
          <div className="cs-popup__header">
            <span className="cs-popup__tit">全部评价</span>
            <span className="cs-popup__close" onClick={() => setPopupVisible(false)}>
              ✕
            </span>
          </div>
          <div className="cs-popup__filter">
            <span
              className={`cs-popup__tag ${onlyPic ? '' : 'current'}`}
              onClick={() => handleToggleOnlyPic(false)}
            >
              全部 {total}
            </span>
            <span
              className={`cs-popup__tag ${onlyPic ? 'current' : ''}`}
              onClick={() => handleToggleOnlyPic(true)}
            >
              有图 {stat?.picCount ?? 0}
            </span>
          </div>
          <div className="cs-popup__body" onScroll={handlePopupScroll}>
            {allList.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
            <div className="cs-popup__loading">
              {loadingType === 'loading' && <SpinLoading color="primary" />}
              {loadingType === 'nomore' && allList.length > 0 && <span>没有更多了</span>}
              {allList.length === 0 && loadingType !== 'loading' && <Empty text="暂无评价" />}
            </div>
          </div>
        </div>
      </Popup>
    </div>
  )
}
