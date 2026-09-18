import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface SmsFlash {
  id: number
  title: string
  startTime: string
  endTime: string
  status: number
}

export function listFlash(keyword: string, pageNum: number, pageSize: number) {
  return request<CommonPage<SmsFlash>>({
    url: '/flash/list',
    method: 'get',
    params: { keyword, pageNum, pageSize },
  })
}

export function createFlash(data: Partial<SmsFlash>) {
  return request({ url: '/flash/create', method: 'post', data })
}

export function updateFlash(id: number, data: Partial<SmsFlash>) {
  return request({ url: `/flash/update/${id}`, method: 'post', data })
}

export function deleteFlash(id: number) {
  return request({ url: `/flash/delete/${id}`, method: 'post' })
}

export function updateFlashStatus(id: number, status: number) {
  return request({ url: `/flash/update/status/${id}`, method: 'post', params: { status } })
}

export function getFlash(id: number) {
  return request<SmsFlash>({ url: `/flash/${id}`, method: 'get' })
}
