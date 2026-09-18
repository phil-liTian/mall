import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface UmsMenu {
  id: number
  parentId: number
  title: string
  level: number
  name?: string
  icon?: string
  hidden: number
  sort: number
  createTime?: string
  children?: UmsMenu[]
}

export function listMenu(parentId: number, params: { pageNum: number; pageSize: number }) {
  return request<CommonPage<UmsMenu>>({ url: `/menu/list/${parentId}`, method: 'get', params })
}

export function treeList() {
  return request<UmsMenu[]>({ url: '/menu/treeList', method: 'get' })
}

export function createMenu(data: Partial<UmsMenu>) {
  return request({ url: '/menu/create', method: 'post', data })
}

export function updateMenu(id: number, data: Partial<UmsMenu>) {
  return request({ url: `/menu/update/${id}`, method: 'post', data })
}

export function getMenu(id: number) {
  return request<UmsMenu>({ url: `/menu/${id}`, method: 'get' })
}

export function deleteMenu(id: number) {
  return request({ url: `/menu/delete/${id}`, method: 'post' })
}

export function updateMenuHidden(id: number, hidden: number) {
  return request({ url: `/menu/updateHidden/${id}`, method: 'post', params: { hidden } })
}
