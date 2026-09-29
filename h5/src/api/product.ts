import { request } from '@/api/request'
import type { CommonPage } from '@/types/common'
import type { PmsProduct } from '@/types/product'
import type { CategoryTreeNode, ProductListParam, PmsPortalProductDetail } from '@/types/product'

/** 商品分类树 */
export const getCategoryTreeAPI = () => {
  return request<CategoryTreeNode[]>({ method: 'GET', url: '/product/categoryTreeList' })
}

/** 商品列表搜索 */
export const searchProductListAPI = (params: ProductListParam) => {
  return request<CommonPage<PmsProduct>>({ method: 'GET', url: '/product/search', params })
}

/** 商品详情 */
export const getProductDetailAPI = (id: number) => {
  return request<PmsPortalProductDetail>({ method: 'GET', url: `/product/detail/${id}` })
}
