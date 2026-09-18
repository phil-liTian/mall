import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface OmsReturnReason {
  id: number
  name: string
  sort: number
  status: number
  createTime: string
}

export function listReturnReason(pageNum: number, pageSize: number) {
  return request<CommonPage<OmsReturnReason>>({
    url: '/returnReason/list',
    method: 'get',
    params: { pageNum, pageSize },
  })
}

export function createReturnReason(data: Partial<OmsReturnReason>) {
  return request({ url: '/returnReason/create', method: 'post', data })
}

export function updateReturnReason(id: number, data: Partial<OmsReturnReason>) {
  return request({ url: `/returnReason/update/${id}`, method: 'post', data })
}

export function deleteReturnReason(ids: number[]) {
  return request({ url: '/returnReason/delete', method: 'post', params: { ids: ids.join(',') } })
}

export function getReturnReason(id: number) {
  return request<OmsReturnReason>({ url: `/returnReason/${id}`, method: 'get' })
}

export function updateReturnReasonStatus(params: { ids: number[]; status: number }) {
  return request({
    url: '/returnReason/update/status',
    method: 'post',
    params: { ids: params.ids.join(','), status: params.status },
  })
}
