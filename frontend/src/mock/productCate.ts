import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

// 一级分类 parentId=0
const level1 = Mock.mock({
  'list|8': [
    {
      'id|+1': 1,
      parentId: 0,
      name: '@ctitle(2,4)',
      level: 0,
      'productCount|0-200': 0,
      productUnit: '件',
      'navStatus|0-1': 1,
      'showStatus|0-1': 1,
      'sort|0-100': 0,
    },
  ],
}).list

// 二级分类
const level2 = Mock.mock({
  'list|16': [
    {
      'id|+1': 100,
      'parentId|1-8': 1,
      name: '@ctitle(2,4)',
      level: 1,
      'productCount|0-100': 0,
      productUnit: '件',
      'navStatus|0-1': 1,
      'showStatus|0-1': 1,
      'sort|0-100': 0,
    },
  ],
}).list

const all = [...level1, ...level2]

export default [
  {
    url: '/api/productCategory/list/:parentId',
    method: 'get',
    response: ({ query, url }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      const m = url.match(/list\/(\d+)/)
      const parentId = m ? Number(m[1]) : 0
      const data = all.filter((c: any) => c.parentId === parentId)
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/productCategory/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      return ok(all.find((c: any) => c.id === id) || all[0])
    },
  },
  {
    url: '/api/productCategory/list/withChildren',
    method: 'get',
    response: () =>
      ok(
        level1.map((l1: any) => ({
          ...l1,
          children: level2.filter((l2: any) => l2.parentId === l1.id),
        })),
      ),
  },
  { url: '/api/productCategory/create', method: 'post', response: () => ok(1) },
  { url: '/api/productCategory/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/productCategory/delete/:id', method: 'post', response: () => ok(1) },
  { url: '/api/productCategory/update/navStatus', method: 'post', response: () => ok(1) },
  { url: '/api/productCategory/update/showStatus', method: 'post', response: () => ok(1) },
] as MockMethod[]
