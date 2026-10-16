import { request } from '@/utils/request'

export interface SmsFlashSession {
  id: number
  name: string
  startTime: string
  endTime: string
  status: number
  createTime?: string
}

export function listFlashSession() {
  return request<SmsFlashSession[]>({ url: '/flashSession/list', method: 'get' })
}

export function createFlashSession(data: Partial<SmsFlashSession>) {
  return request({ url: '/flashSession/create', method: 'post', data })
}

export function updateFlashSession(id: number, data: Partial<SmsFlashSession>) {
  return request({ url: `/flashSession/update/${id}`, method: 'post', data })
}

export function deleteFlashSession(id: number) {
  return request({ url: `/flashSession/delete/${id}`, method: 'post' })
}

export function updateFlashSessionStatus(id: number, status: number) {
  return request({ url: `/flashSession/update/status/${id}`, method: 'post', params: { status } })
}

export function getFlashSession(id: number) {
  return request<SmsFlashSession>({ url: `/flashSession/${id}`, method: 'get' })
}