import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface OmsOrder {
  id: number
  orderSn: string
  createTime: string
  memberUsername: string
  totalAmount: number
  payAmount: number
  freightAmount: number
  promotionAmount: number
  integrationAmount: number
  couponAmount: number
  discountAmount: number
  payType: number
  sourceType: number
  status: number
  orderType: number
  receiverName: string
  receiverPhone: string
  receiverPostCode?: string
  receiverProvince?: string
  receiverCity?: string
  receiverRegion?: string
  receiverDetailAddress?: string
  note?: string
  deliveryCompany?: string
  deliverySn?: string
}

export interface OmsOrderItem {
  id: number
  productName: string
  productPic?: string
  productSkuCode?: string
  productPrice: number
  productQuantity: number
  productAttr?: string
}

export interface OmsOrderHistory {
  id: number
  createTime: string
  orderStatus: number
  note: string
  operateMan: string
}

export interface OmsOrderDetail extends OmsOrder {
  orderItemList: OmsOrderItem[]
  historyList: OmsOrderHistory[]
}

export interface OrderQueryParams {
  pageNum: number
  pageSize: number
  orderSn?: string
  receiverKeyword?: string
  status?: number
  orderType?: number
  createTime?: string
  createTimeEnd?: string
}

export function listOrder(params: OrderQueryParams) {
  return request<CommonPage<OmsOrder>>({ url: '/order/list', method: 'get', params })
}

export function getOrder(id: number) {
  return request<OmsOrderDetail>({ url: `/order/${id}`, method: 'get' })
}

export function deliveryOrder(deliveryParamList: { orderId: number; deliveryCompany: string; deliverySn: string }[]) {
  return request({ url: '/order/update/delivery', method: 'post', data: deliveryParamList })
}

export function closeOrder(params: { ids: number[]; note: string }) {
  return request({
    url: '/order/update/close',
    method: 'post',
    params: { ids: params.ids.join(','), note: params.note },
  })
}

export function deleteOrder(ids: number[]) {
  return request({ url: '/order/delete', method: 'post', params: { ids: ids.join(',') } })
}

export function updateReceiverInfo(data: Record<string, unknown>) {
  return request({ url: '/order/update/receiverInfo', method: 'post', data })
}

export function updateMoneyInfo(data: Record<string, unknown>) {
  return request({ url: '/order/update/moneyInfo', method: 'post', data })
}

export function updateOrderNote(params: { id: number; note: string; status: number }) {
  return request({ url: '/order/update/note', method: 'post', params })
}
