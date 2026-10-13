import { request } from '@/api/request'
import type { PmsComment, PmsCommentParam, PmsCommentStat } from '@/types/comment'
import type { OmsOrderItem } from '@/types/order'
import type { CommonPage, PageParam } from '@/types/common'

/** 提交整单评价 */
export const createCommentAPI = (data: PmsCommentParam) => {
  return request({ method: 'POST', url: '/comment/create', data })
}

/** 分页获取商品评价（游客可读） */
export const getCommentListAPI = (
  params: PageParam & { productId: number; onlyPic?: boolean },
) => {
  return request<CommonPage<PmsComment>>({ method: 'GET', url: '/comment/list', params })
}

/** 获取商品评价统计（游客可读） */
export const getCommentStatAPI = (productId: number) => {
  return request<PmsCommentStat>({ method: 'GET', url: `/comment/stat/${productId}` })
}

/** 分页获取我的评价 */
export const getMyCommentListAPI = (params: PageParam) => {
  return request<CommonPage<PmsComment>>({ method: 'GET', url: '/comment/myList', params })
}

/** 获取订单内待评价的商品 */
export const getUncommentedItemsAPI = (orderId: number) => {
  return request<OmsOrderItem[]>({ method: 'GET', url: `/comment/uncommented/${orderId}` })
}
