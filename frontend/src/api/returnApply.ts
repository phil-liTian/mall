import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface OmsReturnApply {
  id: number
  orderId: number
  orderSn: string
  createTime: string
  memberUsername: string
  returnAmount: number
  returnName: string
  returnPhone: string
  status: number
  handleTime?: string
  productPic?: string
  productName?: string
  productBrand?: string
  productAttr?: string
  productCount?: number
  productPrice?: number
  productRealPrice?: number
  reason?: string
  description?: string
  proofPics?: string
  handleNote?: string
  handleMan?: string
  receiveMan?: string
  receiveTime?: string
  receiveNote?: string
}

export interface ReturnApplyQueryParams {
  pageNum: number
  pageSize: number
  receiverKeyword?: string
  status?: number
  createTime?: string
  handleTime?: string
}

export function listReturnApply(params: ReturnApplyQueryParams) {
  return request<CommonPage<OmsReturnApply>>({ url: '/returnApply/list', method: 'get', params })
}

export function deleteReturnApply(ids: number[]) {
  return request({ url: '/returnApply/delete', method: 'post', params: { ids: ids.join(',') } })
}

export function getReturnApply(id: number) {
  return request<OmsReturnApply>({ url: `/returnApply/${id}`, method: 'get' })
}

export function updateReturnApplyStatus(id: number, data: Record<string, unknown>) {
  return request({ url: `/returnApply/update/status/${id}`, method: 'post', data })
}
