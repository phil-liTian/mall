import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

// 四组首页推荐通用记录结构（名称字段随组不同：brandName/productName/subjectName）
export interface HomeRecommend {
  id: number
  recommendStatus: number
  sort: number
  [key: string]: unknown
}

export interface HomeRecommendListParams {
  recommendStatus?: number
  pageNum: number
  pageSize: number
  [key: string]: unknown
}

// 工厂函数：按 basePath 生成一组推荐接口
function createHomeRecommendApi(basePath: string) {
  return {
    list<T = HomeRecommend>(params: HomeRecommendListParams) {
      return request<CommonPage<T>>({ url: `${basePath}/list`, method: 'get', params })
    },
    create(list: Array<Record<string, unknown>>) {
      return request({ url: `${basePath}/create`, method: 'post', data: list })
    },
    updateSort(id: number, sort: number) {
      return request({ url: `${basePath}/update/sort/${id}`, method: 'post', params: { sort } })
    },
    delete(ids: number[]) {
      return request({ url: `${basePath}/delete`, method: 'post', params: { ids } })
    },
    updateRecommendStatus(data: { ids: number[]; recommendStatus: number }) {
      return request({ url: `${basePath}/update/recommendStatus`, method: 'post', params: data })
    },
  }
}

export const homeBrandApi = createHomeRecommendApi('/home/brand')
export const homeNewApi = createHomeRecommendApi('/home/newProduct')
export const homeHotApi = createHomeRecommendApi('/home/recommendProduct')
export const homeSubjectApi = createHomeRecommendApi('/home/recommendSubject')
