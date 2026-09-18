import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface PmsBrand {
  id: number
  name: string
  firstLetter?: string
  sort?: number
  factoryStatus: number
  showStatus: number
  productCount?: number
  productCommentCount?: number
  logo?: string
  bigPic?: string
  brandStory?: string
}

export interface BrandListParams {
  keyword?: string
  showStatus?: number
  pageNum: number
  pageSize: number
}

export function listBrand(params: BrandListParams) {
  return request<CommonPage<PmsBrand>>({ url: '/brand/list', method: 'get', params })
}

export function listAllBrand() {
  return request<PmsBrand[]>({ url: '/brand/listAll', method: 'get' })
}

export function getBrand(id: number) {
  return request<PmsBrand>({ url: `/brand/${id}`, method: 'get' })
}

export function createBrand(data: Partial<PmsBrand>) {
  return request({ url: '/brand/create', method: 'post', data })
}

export function updateBrand(id: number, data: Partial<PmsBrand>) {
  return request({ url: `/brand/update/${id}`, method: 'post', data })
}

export function deleteBrand(id: number) {
  return request({ url: `/brand/delete/${id}`, method: 'get' })
}

export function deleteBrandBatch(ids: number[]) {
  return request({ url: '/brand/delete/batch', method: 'post', params: { ids } })
}

export function updateBrandShowStatus(data: { ids: number[]; showStatus: number }) {
  return request({ url: '/brand/update/showStatus', method: 'post', params: data })
}

export function updateBrandFactoryStatus(data: { ids: number[]; factoryStatus: number }) {
  return request({ url: '/brand/update/factoryStatus', method: 'post', params: data })
}
