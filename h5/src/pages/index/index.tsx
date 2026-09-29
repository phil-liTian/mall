import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swiper, Image, Toast } from 'antd-mobile'
import { getHomeContentAPI, getRecommendProductListAPI } from '@/api/home'
import type { HomeContentResult } from '@/types/home'
import type { PmsProduct, PmsBrand } from '@/types/product'
import { ProductCard } from '@/components/ProductCard'
import { formatPrice } from '@/utils/format'
import './index.css'

export default function Index() {
  const navigate = useNavigate()
  const [homeData, setHomeData] = useState<HomeContentResult | null>(null)
  const [recommendList, setRecommendList] = useState<PmsProduct[]>([])
  const [swiperIndex, setSwiperIndex] = useState(0)
  const pageRef = useRef({ pageNum: 1, pageSize: 6 })
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const loadHome = async () => {
    try {
      const data = await getHomeContentAPI()
      setHomeData(data)
    } catch (e) {
      console.error('加载首页数据失败', e)
    }
  }

  const loadRecommend = async (append = false) => {
    if (loading) return
    setLoading(true)
    try {
      const response = await getRecommendProductListAPI(pageRef.current)
      // 确保返回值是数组类型，防止接口返回非数组导致报错
      const list = Array.isArray(response) ? response : []
      if (list.length < pageRef.current.pageSize) {
        setHasMore(false)
      }
      setRecommendList((prev) => (append ? [...prev, ...list] : list))
    } catch (e) {
      console.error('加载推荐商品失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHome()
    loadRecommend(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 监听滚动触底加载更多
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loading) {
      pageRef.current.pageNum++
      loadRecommend(true)
    }
  }, [hasMore, loading])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const advertiseList = homeData?.advertiseList || []
  const brandList = homeData?.brandList || []
  const flashPromotion = homeData?.homeFlashPromotion
  const newProductList = homeData?.newProductList || []
  const hotProductList = homeData?.hotProductList || []

  return (
    <div className="home-page">
      {/* 顶部搜索栏 */}
      <div className="home-search" onClick={() => navigate('/product/search')}>
        <span className="home-search__icon">🔍</span>
        <span className="home-search__text">输入关键字搜索</span>
      </div>

      {/* 轮播图 */}
      {advertiseList.length > 0 && (
        <div className="home-carousel">
          <Swiper
            loop
            autoplay
            onIndexChange={(i) => setSwiperIndex(i)}
            style={{ '--border-radius': '16px' }}
          >
            {advertiseList.map((item) => (
              <Swiper.Item key={item.id}>
                <Image src={item.pic} fit="cover" height="350px" width="100%" />
              </Swiper.Item>
            ))}
          </Swiper>
          <div className="home-carousel__dots">
            <span>{swiperIndex + 1}</span>/<span>{advertiseList.length}</span>
          </div>
        </div>
      )}

      {/* 功能区 */}
      <div className="home-cate">
        {[
          { icon: '🏷️', text: '专题', path: '' },
          { icon: '💬', text: '话题', path: '' },
          { icon: '⭐', text: '优选', path: '' },
          { icon: '🔥', text: '特惠', path: '/product/hot' },
        ].map((item) => (
          <div
            key={item.text}
            className="home-cate__item"
            onClick={() => item.path && navigate(item.path)}
          >
            <div className="home-cate__icon">{item.icon}</div>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* 品牌制造商直供 */}
      {brandList.length > 0 && (
        <>
          <div
            className="home-section-header"
            onClick={() => Toast.show({ content: '品牌列表开发中' })}
          >
            <span className="home-section-header__icon">🏭</span>
            <div className="home-section-header__tit">
              <span className="home-section-header__title">品牌制造商直供</span>
              <span className="home-section-header__sub">工厂直达消费者，剔除品牌溢价</span>
            </div>
            <span className="home-section-header__arrow">›</span>
          </div>
          <div className="home-brand-list">
            {brandList.map((brand: PmsBrand) => (
              <div
                key={brand.id}
                className="home-brand-item"
                onClick={() => Toast.show({ content: '品牌详情开发中' })}
              >
                <div className="home-brand-item__img">
                  <img src={brand.logo} alt={brand.name} loading="lazy" />
                </div>
                <span className="home-brand-item__name ellipsis">{brand.name}</span>
                <span className="home-brand-item__count">商品数量：{brand.productCount}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 秒杀专区 */}
      {flashPromotion && flashPromotion.productList.length > 0 && (
        <>
          <div className="home-section-header">
            <span className="home-section-header__icon">⚡</span>
            <div className="home-section-header__tit">
              <span className="home-section-header__title">秒杀专区</span>
              <span className="home-section-header__sub">
                下一场 {formatTime(flashPromotion.nextStartTime)} 开始
              </span>
            </div>
            <div className="home-section-header__countdown">
              {formatTime(flashPromotion.endTime)} 结束
            </div>
          </div>
          <div className="home-grid">
            {flashPromotion.productList.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </>
      )}

      {/* 新鲜好物 */}
      {newProductList.length > 0 && (
        <>
          <div className="home-section-header" onClick={() => navigate('/product/new')}>
            <span className="home-section-header__icon">🆕</span>
            <div className="home-section-header__tit">
              <span className="home-section-header__title">新鲜好物</span>
              <span className="home-section-header__sub">为你寻觅世间好物</span>
            </div>
            <span className="home-section-header__arrow">›</span>
          </div>
          <div className="home-scroll">
            {newProductList.map((item) => (
              <div
                key={item.id}
                className="home-scroll__item"
                onClick={() => navigate(`/product/detail/${item.id}`)}
              >
                <img src={item.pic} alt={item.name} loading="lazy" />
                <p className="ellipsis">{item.name}</p>
                <span className="price">
                  ¥{formatPrice(item.flashPromotionPrice || item.price, false)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 人气推荐 */}
      {hotProductList.length > 0 && (
        <>
          <div className="home-section-header" onClick={() => navigate('/product/hot')}>
            <span className="home-section-header__icon">🔥</span>
            <div className="home-section-header__tit">
              <span className="home-section-header__title">人气推荐</span>
              <span className="home-section-header__sub">大家都赞不绝口的</span>
            </div>
            <span className="home-section-header__arrow">›</span>
          </div>
          <div className="home-hot-list">
            {hotProductList.map((item) => (
              <ProductCard key={item.id} product={item} layout="list" />
            ))}
          </div>
        </>
      )}

      {/* 猜你喜欢 */}
      <div className="home-section-header">
        <span className="home-section-header__icon">❤️</span>
        <div className="home-section-header__tit">
          <span className="home-section-header__title">猜你喜欢</span>
          <span className="home-section-header__sub">你喜欢的都在这里了</span>
        </div>
      </div>
      <div className="home-grid">
        {(Array.isArray(recommendList) ? recommendList : []).map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
      <div className="home-loadmore">
        {loading ? '加载中...' : hasMore ? '上拉加载更多' : '没有更多了'}
      </div>
    </div>
  )
}

const formatTime = (time?: string) => {
  if (!time) return 'N/A'
  const d = new Date(time)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
    d.getSeconds(),
  ).padStart(2, '0')}`
}
