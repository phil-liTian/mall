import { request } from '@/api/request'
import type { CartItem } from '@/types/cart'

/** 添加购物车 */
export const addCartAPI = (data: Partial<CartItem>) => {
  return request({ method: 'POST', url: '/cart/add', data })
}

/** 获取购物车列表 */
export const getCartListAPI = () => {
  return request<CartItem[]>({ method: 'GET', url: '/cart/list' })
}

/** 删除购物车商品 */
export const deleteCartAPI = (params: { ids: string }) => {
  return request({ method: 'POST', url: '/cart/delete', params })
}

/** 更新商品数量 */
export const updateCartQuantityAPI = (data: { id: string; quantity: number }) => {
  return request({ method: 'GET', url: `/cart/update/quantity?id=${data.id}&quantity=${data.quantity}` })
}

/** 清空购物车 */
export const clearCartAPI = () => {
  return request({ method: 'POST', url: '/cart/clear' })
}
