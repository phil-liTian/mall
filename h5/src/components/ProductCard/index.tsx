import { useNavigate } from 'react-router-dom'
import type { PmsProduct } from '@/types/product'
import { formatPrice } from '@/utils/format'
import './index.css'

interface ProductCardProps {
  product: PmsProduct
  layout?: 'grid' | 'list'
}

export const ProductCard = ({ product, layout = 'grid' }: ProductCardProps) => {
  const navigate = useNavigate()

  const goDetail = () => {
    navigate(`/product/detail/${product.id}`)
  }

  const displayPrice = product.flashPromotionPrice || product.promotionPrice || product.price

  if (layout === 'list') {
    return (
      <div className="product-card product-card--list" onClick={goDetail}>
        <div className="product-card__img">
          <img src={product.pic} alt={product.name} loading="lazy" />
        </div>
        <div className="product-card__info">
          <p className="product-card__name ellipsis-2">{product.name}</p>
          {product.subTitle && <p className="product-card__sub ellipsis">{product.subTitle}</p>}
          <div className="product-card__bottom">
            <span className="price">
              <span className="price-symbol">¥</span>
              {formatPrice(displayPrice, false)}
            </span>
            {product.sale > 0 && <span className="product-card__sale">已售{product.sale}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-card" onClick={goDetail}>
      <div className="product-card__img">
        <img src={product.pic} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card__info">
        <p className="product-card__name ellipsis-2">{product.name}</p>
        {product.subTitle && <p className="product-card__sub ellipsis">{product.subTitle}</p>}
        <div className="product-card__bottom">
          <span className="price">
            <span className="price-symbol">¥</span>
            {formatPrice(displayPrice, false)}
          </span>
        </div>
      </div>
    </div>
  )
}
