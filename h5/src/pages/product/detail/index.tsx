import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Swiper, Toast, Dialog } from 'antd-mobile'
import { getProductDetailAPI } from '@/api/product'
import { addCartAPI } from '@/api/cart'
import { useMemberStore } from '@/store/member'
import type {
  PmsProduct,
  PmsBrand,
  PmsSkuStock,
  PmsProductAttribute,
  SpecOption,
} from '@/types/product'
import { QuantityStepper } from '@/components/Stepper'
import { formatPrice } from '@/utils/format'
import './index.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const hasLogin = useMemberStore((s) => s.hasLogin)

  const [product, setProduct] = useState<PmsProduct>({} as PmsProduct)
  const [brand, setBrand] = useState<PmsBrand>({} as PmsBrand)
  const [imgList, setImgList] = useState<string[]>([])
  const [skuStockList, setSkuStockList] = useState<PmsSkuStock[]>([])
  const [specList, setSpecList] = useState<PmsProductAttribute[]>([])
  const [specChildList, setSpecChildList] = useState<SpecOption[]>([])
  const [specSelected, setSpecSelected] = useState<SpecOption[]>([])
  const [attrList, setAttrList] = useState<{ key: string; value: string }[]>([])
  const [favorite, setFavorite] = useState(false)
  const [specVisible, setSpecVisible] = useState(false)
  const [attrVisible, setAttrVisible] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // 当前价格（优先促销价）
  const currentPrice = useMemo(() => {
    return product.flashPromotionPrice || product.promotionPrice || product.price || 0
  }, [product])

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const data = await getProductDetailAPI(Number(id))
      if (data) {
        setProduct(data.product)
        setBrand(data.brand)
        setSkuStockList(data.skuStockList || [])
        initImgList(data.product)
        initSpecList(data)
        initAttrList(data)
      }
    } catch (e) {
      console.error('加载商品详情失败', e)
    }
  }, [id])

  const initImgList = (p: PmsProduct) => {
    const tempPics = p.albumPics?.split(',') || []
    tempPics.unshift(p.pic)
    setImgList(tempPics.filter((item) => item))
  }

  const initSpecList = (data: any) => {
    const { productAttributeList, productAttributeValueList } = data
    const specs: PmsProductAttribute[] = []
    const children: SpecOption[] = []

    for (const item of productAttributeList || []) {
      if (item.type === 0) {
        specs.push(item)
        if (item.handAddStatus === 1) {
          const filterValueList = (productAttributeValueList || []).filter(
            (v: any) => v.productAttributeId === item.id,
          )
          const inputList = filterValueList[0]?.value?.split(',') || []
          for (const val of inputList) {
            children.push({ pid: item.id, pname: item.name, name: val })
          }
        } else {
          const inputList = item.inputList?.split(',') || []
          for (const val of inputList) {
            children.push({ pid: item.id, pname: item.name, name: val })
          }
        }
      }
    }

    // 根据 SKU 筛选可用规格
    const availableSpecSet = new Set<string>()
    for (const sku of data.skuStockList || []) {
      try {
        const spDataArr = JSON.parse(sku.spData)
        for (const sp of spDataArr) {
          availableSpecSet.add(sp.value)
        }
      } catch (e) {
        // ignore
      }
    }
    const filteredChildren = children.filter((item) => availableSpecSet.has(item.name))

    // 规格默认选中第一条
    const selected: SpecOption[] = []
    specs.forEach((item) => {
      for (const cItem of filteredChildren) {
        if (cItem.pid === item.id) {
          cItem.selected = true
          selected.push(cItem)
          break
        }
      }
    })

    setSpecList(specs)
    setSpecChildList(filteredChildren)
    setSpecSelected(selected)
  }

  const initAttrList = (data: any) => {
    const { productAttributeList, productAttributeValueList } = data
    const attrs: { key: string; value: string }[] = []
    for (const item of productAttributeList || []) {
      if (item.type === 1) {
        const filterValueList = (productAttributeValueList || []).filter(
          (v: any) => v.productAttributeId === item.id,
        )
        const value = filterValueList[0]?.value || ''
        attrs.push({ key: item.name, value })
      }
    }
    setAttrList(attrs)
  }

  // 获取当前选中的 SKU
  const getSkuStock = (): PmsSkuStock | null => {
    for (const sku of skuStockList) {
      try {
        const spDataArr = JSON.parse(sku.spData)
        const availableMap = new Map<string, string>()
        for (const sp of spDataArr) {
          availableMap.set(sp.key, sp.value)
        }
        let correctCount = 0
        for (const item of specSelected) {
          const value = availableMap.get(item.pname)
          if (value != null && value === item.name) {
            correctCount++
          }
        }
        if (correctCount === specSelected.length) {
          return sku
        }
      } catch (e) {
        // ignore
      }
    }
    return null
  }

  useEffect(() => {
    loadData()
    window.scrollTo(0, 0)
  }, [loadData])

  const handleSelectSpec = (index: number, pid: number) => {
    const list = specChildList.map((item) => {
      if (item.pid === pid) {
        return { ...item, selected: false }
      }
      return item
    })
    list[index] = { ...list[index], selected: true }
    setSpecChildList(list)
    setSpecSelected(list.filter((item) => item.selected))
  }

  const checkLogin = () => {
    if (!hasLogin) {
      Dialog.confirm({ content: '你还没登录，是否要登录？', confirmText: '去登录', cancelText: '取消' }).then(
        (ok) => {
          if (ok) navigate(`/login?redirect=${encodeURIComponent(`/product/detail/${id}`)}`)
        },
      )
      return false
    }
    return true
  }

  const handleAddToCart = async () => {
    if (!checkLogin()) return
    const skuStock = getSkuStock()
    if (!skuStock) {
      Toast.show({ content: '请选择规格' })
      return
    }
    try {
      await addCartAPI({
        price: product.price,
        productAttr: skuStock.spData,
        productBrand: product.brandName,
        productCategoryId: product.productCategoryId,
        productId: product.id,
        productName: product.name,
        productPic: product.pic,
        productSkuCode: skuStock.skuCode,
        productSkuId: skuStock.id,
        productSn: product.productSn,
        productSubTitle: product.subTitle,
        quantity,
      })
      Toast.show({ icon: 'success', content: '已加入购物车' })
      setSpecVisible(false)
    } catch (e) {
      console.error('加入购物车失败', e)
    }
  }

  const handleBuyNow = () => {
    if (!checkLogin()) return
    const skuStock = getSkuStock()
    if (!skuStock) {
      setSpecVisible(true)
      return
    }
    Toast.show({ content: '请从购物车下单' })
  }

  const handleToggleFavorite = () => {
    if (!checkLogin()) return
    setFavorite((prev) => !prev)
    Toast.show({ content: favorite ? '取消收藏成功' : '收藏成功' })
  }

  return (
    <div className="detail-page">
      {/* 轮播图 */}
      <div className="detail-carousel">
        <Swiper>
          {imgList.map((item, index) => (
            <Swiper.Item key={index}>
              <div className="detail-carousel__item">
                <img src={item} alt={product.name} />
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
        <div className="detail-back" onClick={() => navigate(-1)}>
          <div className="detail-back__arrow" />
        </div>
      </div>

      {/* 商品基本信息 */}
      <div className="detail-intro">
        <div className="detail-intro__name">{product.name}</div>
        <div className="detail-intro__sub">{product.subTitle}</div>
        <div className="detail-intro__price-box">
          <span className="price">
            <span className="price-symbol">¥</span>
            {formatPrice(currentPrice, false)}
          </span>
          {product.originalPrice > currentPrice && (
            <span className="detail-intro__m-price">¥{formatPrice(product.originalPrice, false)}</span>
          )}
        </div>
        <div className="detail-intro__bot">
          <span>销量: {product.sale}</span>
          <span>库存: {product.stock}</span>
          <span>浏览量: 768</span>
        </div>
      </div>

      {/* 规格参数列表 */}
      <div className="detail-list">
        {specList.length > 0 && (
          <div className="detail-list__row" onClick={() => setSpecVisible(true)}>
            <span className="detail-list__tit">购买类型</span>
            <div className="detail-list__con">
              {specSelected.map((sItem, sIndex) => (
                <span key={sIndex} className="detail-list__selected">
                  {sItem.name}
                </span>
              ))}
            </div>
            <span className="detail-list__arrow">›</span>
          </div>
        )}
        {attrList.length > 0 && (
          <div className="detail-list__row" onClick={() => setAttrVisible(true)}>
            <span className="detail-list__tit">商品参数</span>
            <div className="detail-list__con">查看</div>
            <span className="detail-list__arrow">›</span>
          </div>
        )}
        <div className="detail-list__row">
          <span className="detail-list__tit">服务</span>
          <div className="detail-list__con">
            <span>无忧退货 ·</span>
            <span>快速退款 ·</span>
            <span>免费包邮</span>
          </div>
        </div>
      </div>

      {/* 品牌信息 */}
      {brand.name && (
        <div className="detail-brand">
          <div className="detail-brand__header">
            <span>品牌信息</span>
          </div>
          <div className="detail-brand__box">
            <div className="detail-brand__logo">
              <img src={brand.logo} alt={brand.name} />
            </div>
            <div className="detail-brand__title">
              <span>{brand.name}</span>
              <span>品牌首字母：{brand.firstLetter}</span>
            </div>
          </div>
        </div>
      )}

      {/* 图文详情 */}
      <div className="detail-desc">
        <div className="detail-desc__header">
          <span>图文详情</span>
        </div>
        {product.detailMobileHtml ? (
          <div
            className="detail-desc__html"
            dangerouslySetInnerHTML={{ __html: product.detailMobileHtml }}
          />
        ) : (
          <div className="detail-desc__empty">暂无详情</div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="detail-bottom">
        <div className="detail-bottom__btn" onClick={() => navigate('/')}>
          <span className="detail-bottom__icon">🏠</span>
          <span>首页</span>
        </div>
        <div className="detail-bottom__btn" onClick={() => navigate('/cart')}>
          <span className="detail-bottom__icon">🛒</span>
          <span>购物车</span>
        </div>
        <div
          className={`detail-bottom__btn ${favorite ? 'active' : ''}`}
          onClick={handleToggleFavorite}
        >
          <span className="detail-bottom__icon">{favorite ? '❤️' : '🤍'}</span>
          <span>收藏</span>
        </div>
        <div className="detail-bottom__action-group">
          <button className="detail-bottom__action buy" onClick={handleBuyNow}>
            立即购买
          </button>
          <button className="detail-bottom__action cart" onClick={() => setSpecVisible(true)}>
            加入购物车
          </button>
        </div>
      </div>

      {/* 规格选择弹窗 */}
      {specVisible && (
        <div className="detail-popup show" onClick={() => setSpecVisible(false)}>
          <div className="detail-popup__layer" onClick={(e) => e.stopPropagation()}>
            <div className="detail-popup__top">
              <img src={product.pic} alt={product.name} />
              <div className="detail-popup__info">
                <span className="price">
                  <span className="price-symbol">¥</span>
                  {formatPrice(currentPrice, false)}
                </span>
                <span className="detail-popup__stock">库存：{product.stock}件</span>
                <div className="detail-popup__selected">
                  已选：
                  {specSelected.map((sItem, sIndex) => (
                    <span key={sIndex} className="detail-list__selected">
                      {sItem.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {specList.map((item) => (
              <div key={item.id} className="detail-popup__attr">
                <span className="detail-popup__attr-name">{item.name}</span>
                <div className="detail-popup__item-list">
                  {specChildList
                    .map((cItem, cIndex) => ({ cItem, cIndex }))
                    .filter(({ cItem }) => cItem.pid === item.id)
                    .map(({ cItem, cIndex }) => (
                      <span
                        key={cIndex}
                        className={`detail-popup__item ${cItem.selected ? 'selected' : ''}`}
                        onClick={() => handleSelectSpec(cIndex, item.id)}
                      >
                        {cItem.name}
                      </span>
                    ))}
                </div>
              </div>
            ))}
            <div className="detail-popup__qty">
              <span>数量</span>
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>
            <button className="detail-popup__btn" onClick={handleAddToCart}>
              完成
            </button>
          </div>
        </div>
      )}

      {/* 属性弹窗 */}
      {attrVisible && (
        <div className="detail-popup show" onClick={() => setAttrVisible(false)}>
          <div className="detail-popup__layer no-padding" onClick={(e) => e.stopPropagation()}>
            <div className="detail-attr-list">
              {attrList.map((item) => (
                <div key={item.key} className="detail-attr-row">
                  <span className="detail-attr-tit">{item.key}</span>
                  <span className="detail-attr-val">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
