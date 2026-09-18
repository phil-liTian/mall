import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface PmsProductAttribute {
  id: number
  productAttributeCategoryId: number
  name: string
  type: number
  selectType: number
  inputType: number
  inputList?: string
  sort?: number
  filterType?: number
  searchType?: number
  relatedStatus?: number
  handAddStatus?: number
}

export interface PmsProductAttributeCategory {
  id: number
  name: string
  attributeCount: number
  paramCount: number
  productAttributeList?: PmsProductAttribute[]
}

export function listAttr(cid: number, type: number, pageNum: number, pageSize: number) {
  return request<CommonPage<PmsProductAttribute>>({
    url: `/productAttribute/list/${cid}`,
    method: 'get',
    params: { type, pageNum, pageSize },
  })
}

export function createAttr(data: Partial<PmsProductAttribute>) {
  return request({ url: '/productAttribute/create', method: 'post', data })
}

export function updateAttr(id: number, data: Partial<PmsProductAttribute>) {
  return request({ url: `/productAttribute/update/${id}`, method: 'post', data })
}

export function getAttr(id: number) {
  return request<PmsProductAttribute>({ url: `/productAttribute/${id}`, method: 'get' })
}

export function deleteAttr(ids: number[]) {
  return request({ url: '/productAttribute/delete', method: 'post', params: { ids } })
}

export function attrInfo(categoryId: number) {
  return request({ url: `/productAttribute/attrInfo/${categoryId}`, method: 'get' })
}

export function listAttrCate(pageNum: number, pageSize: number) {
  return request<CommonPage<PmsProductAttributeCategory>>({
    url: '/productAttribute/category/list',
    method: 'get',
    params: { pageNum, pageSize },
  })
}

export function listAttrCateWithAttr() {
  return request<PmsProductAttributeCategory[]>({
    url: '/productAttribute/category/list/withAttr',
    method: 'get',
  })
}

export function createAttrCate(name: string) {
  return request({ url: '/productAttribute/category/create', method: 'post', params: { name } })
}

export function updateAttrCate(id: number, name: string) {
  return request({
    url: `/productAttribute/category/update/${id}`,
    method: 'post',
    params: { name },
  })
}

export function deleteAttrCate(id: number) {
  return request({ url: `/productAttribute/category/delete/${id}`, method: 'get' })
}

export function getAttrCate(id: number) {
  return request<PmsProductAttributeCategory>({
    url: `/productAttribute/category/${id}`,
    method: 'get',
  })
}
