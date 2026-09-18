import { request } from '@/utils/request'

export interface OmsOrderSetting {
  id: number
  flashOrderOvertime: number
  normalOrderOvertime: number
  confirmOvertime: number
  finishOvertime: number
  commentOvertime: number
}

export function getOrderSetting(id: number) {
  return request<OmsOrderSetting>({ url: `/orderSetting/${id}`, method: 'get' })
}

export function updateOrderSetting(id: number, data: Partial<OmsOrderSetting>) {
  return request({ url: `/orderSetting/update/${id}`, method: 'post', data })
}
