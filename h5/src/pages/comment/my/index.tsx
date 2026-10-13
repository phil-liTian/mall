import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpinLoading, Rate, ImageViewer } from 'antd-mobile'
import { getMyCommentListAPI } from '@/api/comment'
import type { PmsComment } from '@/types/comment'
import { NavBarCustom } from '@/components/NavBarCustom'
import { Empty } from '@/components/Empty'
import { formatProductAttr } from '@/utils/format'
import { formatDate } from '@/utils/date'
import './index.css'

export default function MyComment() {
  const navigate = useNavigate()
  const [commentList, setCommentList] = useState<PmsComment[]>([])
  const [loadingType, setLoadingType] = useState<'more' | 'loading' | 'nomore'>('more')
  const searchParamRef = useRef({ pageNum: 1, pageSize: 5 })

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
      try {
        const res = await getMyCommentListAPI({ ...searchParamRef.current })
        const list = res.list || []
        if (type === 'refresh') {
          setCommentList(list)
          setLoadingType(list.length < searchParamRef.current.pageSize ? 'nomore' : 'more')
        } else {
          if (list.length > 0) {
            setCommentList((prev) => [...prev, ...list])
            setLoadingType(list.length < searchParamRef.current.pageSize ? 'nomore' : 'more')
          } else {
            searchParamRef.current.pageNum--
            setLoadingType('nomore')
          }
        }
      } catch (e) {
        console.error('加载我的评价失败', e)
        setLoadingType('more')
      }
    },
    [loadingType],
  )

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
    <div className="my-comment-page">
      <NavBarCustom title="我的评价" fallback="/user" />

      <div className="mc__content">
        {commentList.map((comment) => {
          const picList = comment.pics ? comment.pics.split(',').filter(Boolean) : []
          return (
            <div className="mc-item" key={comment.id}>
              <div
                className="mc-item__goods"
                onClick={() => navigate(`/product/detail/${comment.productId}`)}
              >
                <p className="mc-item__title ellipsis">{comment.productName}</p>
                <p className="mc-item__spec ellipsis">
                  {formatProductAttr(comment.productAttribute)}
                </p>
              </div>

              <div className="mc-item__star">
                <Rate readOnly value={comment.star} style={{ '--active-color': '#fa436a' }} />
                <span className="mc-item__time">{formatDate(comment.createTime)}</span>
              </div>

              {comment.content && <p className="mc-item__content">{comment.content}</p>}

              {picList.length > 0 && (
                <div className="mc-item__pics">
                  {picList.map((pic, index) => (
                    <img
                      key={pic}
                      src={pic}
                      alt="晒图"
                      onClick={() =>
                        ImageViewer.Multi.show({ images: picList, defaultIndex: index })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="mc__loading">
          {loadingType === 'loading' && <SpinLoading color="primary" />}
          {loadingType === 'nomore' && commentList.length > 0 && <span>没有更多了</span>}
          {commentList.length === 0 && loadingType !== 'loading' && (
            <Empty text="还没有发表过评价" icon={<span className="mc__empty">✏️</span>} />
          )}
        </div>
      </div>
    </div>
  )
}
