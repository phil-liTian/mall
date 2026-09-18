import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface PmsProduct {
  id: number
  name: string
  productSn: string
  pic?: string
  price: number
  originalPrice?: number
  stock?: number
  subTitle?: string
  brandId?: number
  brandName?: string
  productCategoryId?: number
  productCategoryName?: string
  sort?: number
  newStatus: number
  recommandStatus: number
  publishStatus: number
  verifyStatus: number
  detailHtml?: string
}

export interface ProductListParams {
  keyword?: string
  productCategoryId?: number
  publishStatus?: number
  verifyStatus?: number
  pageNum: number
  pageSize: number
}

export function listProduct(params: ProductListParams) {
  return request<CommonPage<PmsProduct>>({ url: '/product/list', method: 'get', params })
}

export function getProductUpdateInfo(id: number) {
  return request<PmsProduct>({ url: `/product/updateInfo/${id}`, method: 'get' })
}

export function createProduct(data: Partial<PmsProduct>) {
  return request({ url: '/product/create', method: 'post', data })
}

export function updateProduct(id: number, data: Partial<PmsProduct>) {
  return request({ url: `/product/update/${id}`, method: 'post', data })
}

export function updateVerifyStatus(data: { ids: number[]; verifyStatus: number; detail?: string }) {
  return request({ url: '/product/update/verifyStatus', method: 'post', params: data })
}

export function updatePublishStatus(data: { ids: number[]; publishStatus: number }) {
  return request({ url: '/product/update/publishStatus', method: 'post', params: data })
}

export function updateRecommendStatus(data: { ids: number[]; recommendStatus: number }) {
  return request({ url: '/product/update/recommendStatus', method: 'post', params: data })
}

export function updateNewStatus(data: { ids: number[]; newStatus: number }) {
  return request({ url: '/product/update/newStatus', method: 'post', params: data })
}

export function updateDeleteStatus(data: { ids: number[]; deleteStatus: number }) {
  return request({ url: '/product/update/deleteStatus', method: 'post', params: data })
}

export function simpleList(keyword?: string) {
  return request<PmsProduct[]>({ url: '/product/simpleList', method: 'get', params: { keyword } })
}
