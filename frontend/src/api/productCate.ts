import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface PmsProductCategory {
  id: number
  parentId: number
  name: string
  level: number
  productCount: number
  productUnit?: string
  navStatus: number
  showStatus: number
  sort?: number
  icon?: string
  keywords?: string
  description?: string
  children?: PmsProductCategory[]
}

export function listCate(parentId: number, pageNum: number, pageSize: number) {
  return request<CommonPage<PmsProductCategory>>({
    url: `/productCategory/list/${parentId}`,
    method: 'get',
    params: { pageNum, pageSize },
  })
}

export function getCate(id: number) {
  return request<PmsProductCategory>({ url: `/productCategory/${id}`, method: 'get' })
}

export function createCate(data: Partial<PmsProductCategory>) {
  return request({ url: '/productCategory/create', method: 'post', data })
}

export function updateCate(id: number, data: Partial<PmsProductCategory>) {
  return request({ url: `/productCategory/update/${id}`, method: 'post', data })
}

export function deleteCate(id: number) {
  return request({ url: `/productCategory/delete/${id}`, method: 'post' })
}

export function updateNavStatus(data: { ids: number[]; navStatus: number }) {
  return request({ url: '/productCategory/update/navStatus', method: 'post', params: data })
}

export function updateShowStatus(data: { ids: number[]; showStatus: number }) {
  return request({ url: '/productCategory/update/showStatus', method: 'post', params: data })
}

export function listWithChildren() {
  return request<PmsProductCategory[]>({ url: '/productCategory/list/withChildren', method: 'get' })
}
