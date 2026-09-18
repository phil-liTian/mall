import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const advertises = Mock.mock({
  'list|10': [
    {
      'id|+1': 1,
      name: '@ctitle(3,6)广告',
      'type|1-2': 1,
      pic: Mock.Random.image('120x60', '#4A7BF7', 'AD'),
      startTime: '@datetime',
      endTime: '@datetime',
      'status|0-1': 1,
      'clickCount|0-1000': 0,
      'orderCount|0-500': 0,
      url: '@url',
      note: '@ctitle(4,10)',
      'sort|0-100': 0,
    },
  ],
}).list

export default [
  {
    url: '/api/home/advertise/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      let data = advertises
      if (query.name) data = data.filter((a: any) => a.name.includes(query.name))
      if (query.type !== undefined && query.type !== '')
        data = data.filter((a: any) => a.type === Number(query.type))
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/home/advertise/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      return ok(advertises.find((a: any) => a.id === id) || advertises[0])
    },
  },
  { url: '/api/home/advertise/create', method: 'post', response: () => ok(1) },
  { url: '/api/home/advertise/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/home/advertise/delete', method: 'post', response: () => ok(1) },
  { url: '/api/home/advertise/update/status/:id', method: 'post', response: () => ok(1) },
] as MockMethod[]
