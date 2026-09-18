import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface SmsHomeAdvertise {
  id: number
  name: string
  type: number
  pic: string
  startTime: string
  endTime: string
  status: number
  clickCount?: number
  orderCount?: number
  url?: string
  note?: string
  sort: number
}

export interface AdvertiseListParams {
  name?: string
  type?: number
  endTime?: string
  pageNum: number
  pageSize: number
}

export function listAdvertise(params: AdvertiseListParams) {
  return request<CommonPage<SmsHomeAdvertise>>({
    url: '/home/advertise/list',
    method: 'get',
    params,
  })
}

export function createAdvertise(data: Partial<SmsHomeAdvertise>) {
  return request({ url: '/home/advertise/create', method: 'post', data })
}

export function deleteAdvertise(ids: number[]) {
  return request({ url: '/home/advertise/delete', method: 'post', params: { ids } })
}

export function updateAdvertiseStatus(id: number, status: number) {
  return request({
    url: `/home/advertise/update/status/${id}`,
    method: 'post',
    params: { status },
  })
}

export function getAdvertise(id: number) {
  return request<SmsHomeAdvertise>({ url: `/home/advertise/${id}`, method: 'get' })
}

export function updateAdvertise(id: number, data: Partial<SmsHomeAdvertise>) {
  return request({ url: `/home/advertise/update/${id}`, method: 'post', data })
}
