import { request } from '@/utils/request'

export interface SmsFlashProductRelation {
  id?: number
  flashPromotionId: number
  flashPromotionSessionId: number
  productId: number
  flashPromotionPrice: number
  flashPromotionCount: number
  flashPromotionLimit: number
  sort: number
  // 仅列表展示字段
  productName?: string
  productSn?: string
  productPrice?: number
  productPic?: string
  productStock?: number
}

export interface FlashProductRelationQuery {
  flashPromotionId?: number
  flashPromotionSessionId?: number
}

export function listFlashProductRelation(params: FlashProductRelationQuery) {
  return request<SmsFlashProductRelation[]>({
    url: '/flashProductRelation/list',
    method: 'get',
    params,
  })
}

export function createFlashProductRelation(data: SmsFlashProductRelation[]) {
  return request({ url: '/flashProductRelation/create', method: 'post', data })
}

export function updateFlashProductRelation(
  id: number,
  data: Partial<SmsFlashProductRelation>,
) {
  return request({ url: `/flashProductRelation/update/${id}`, method: 'post', data })
}

export function deleteFlashProductRelation(id: number) {
  return request({ url: `/flashProductRelation/delete/${id}`, method: 'post' })
}