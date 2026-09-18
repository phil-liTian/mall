import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface CmsSubject {
  id: number
  title: string
  categoryName?: string
  pic?: string
  productCount?: number
  recommendStatus?: number
  createTime?: string
  showStatus?: number
}

export function listSubject(keyword: string, pageNum: number, pageSize: number) {
  return request<CommonPage<CmsSubject>>({
    url: '/subject/list',
    method: 'get',
    params: { keyword, pageNum, pageSize },
  })
}

export function listAllSubject() {
  return request<CmsSubject[]>({ url: '/subject/listAll', method: 'get' })
}
