import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface UmsResource {
  id: number
  name: string
  url: string
  description?: string
  categoryId: number
  createTime?: string
}

export interface UmsResourceCategory {
  id: number
  name: string
  sort: number
  createTime?: string
}

export function listResource(params: {
  categoryId?: number
  nameKeyword?: string
  urlKeyword?: string
  pageNum: number
  pageSize: number
}) {
  return request<CommonPage<UmsResource>>({ url: '/resource/list', method: 'get', params })
}

export function listAllResource() {
  return request<UmsResource[]>({ url: '/resource/listAll', method: 'get' })
}

export function createResource(data: Partial<UmsResource>) {
  return request({ url: '/resource/create', method: 'post', data })
}

export function updateResource(id: number, data: Partial<UmsResource>) {
  return request({ url: `/resource/update/${id}`, method: 'post', data })
}

export function deleteResource(id: number) {
  return request({ url: `/resource/delete/${id}`, method: 'post' })
}

export function listAllResourceCategory() {
  return request<UmsResourceCategory[]>({ url: '/resourceCategory/listAll', method: 'get' })
}

export function createResourceCategory(data: Partial<UmsResourceCategory>) {
  return request({ url: '/resourceCategory/create', method: 'post', data })
}

export function updateResourceCategory(id: number, data: Partial<UmsResourceCategory>) {
  return request({ url: `/resourceCategory/update/${id}`, method: 'post', data })
}

export function deleteResourceCategory(id: number) {
  return request({ url: `/resourceCategory/delete/${id}`, method: 'post' })
}
