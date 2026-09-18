import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const reasons = Mock.mock({
  'list|10': [
    {
      'id|+1': 1,
      name: '@ctitle(3,6)',
      'sort|0-100': 1,
      'status|1': [0, 1],
      createTime: '@datetime',
    },
  ],
}).list

export default [
  {
    url: '/api/returnReason/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      return page(reasons, pageNum, pageSize)
    },
  },
  {
    url: '/api/returnReason/:id',
    method: 'get',
    response: ({ url }: any) => {
      const id = Number(url.split('/').pop().split('?')[0])
      const item = reasons.find((r: any) => r.id === id) || reasons[0]
      return ok(item)
    },
  },
  { url: '/api/returnReason/create', method: 'post', response: () => ok(1) },
  { url: '/api/returnReason/update/status', method: 'post', response: () => ok(1) },
  { url: '/api/returnReason/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/returnReason/delete', method: 'post', response: () => ok(1) },
] as MockMethod[]
