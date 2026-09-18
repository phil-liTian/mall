import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const flashes = Mock.mock({
  'list|12': [
    {
      'id|+1': 1,
      title: '@ctitle(4,8)秒杀',
      startTime: '@datetime',
      endTime: '@datetime',
      'status|0-1': 1,
    },
  ],
}).list

export default [
  {
    url: '/api/flash/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize, keyword } = parsePage(query)
      const data = keyword
        ? flashes.filter((f: any) => f.title.includes(keyword))
        : flashes
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/flash/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      return ok(flashes.find((f: any) => f.id === id) || flashes[0])
    },
  },
  { url: '/api/flash/create', method: 'post', response: () => ok(1) },
  { url: '/api/flash/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/flash/delete/:id', method: 'post', response: () => ok(1) },
  { url: '/api/flash/update/status/:id', method: 'post', response: () => ok(1) },
] as MockMethod[]
