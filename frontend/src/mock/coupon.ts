import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const coupons = Mock.mock({
  'list|15': [
    {
      'id|+1': 1,
      name: '@ctitle(3,6)优惠券',
      'type|0-3': 0,
      'amount|5-200': 10,
      'publishCount|100-1000': 100,
      'useCount|0-100': 0,
      'receiveCount|0-100': 0,
      'perLimit|1-5': 1,
      'minPoint|0-500': 0,
      startTime: '@date',
      endTime: '@date',
      'useType|0-2': 0,
      note: '@ctitle(4,10)',
    },
  ],
}).list

const histories = Mock.mock({
  'list|15': [
    {
      'id|+1': 1,
      'couponId|1-15': 1,
      memberNickname: '@cname',
      orderSn: '@guid',
      'getType|0-1': 0,
      'useStatus|0-2': 0,
      useTime: '@datetime',
      createTime: '@datetime',
    },
  ],
}).list

export default [
  {
    url: '/api/coupon/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      let data = coupons
      if (query.name) data = data.filter((c: any) => c.name.includes(query.name))
      if (query.type !== undefined && query.type !== '')
        data = data.filter((c: any) => c.type === Number(query.type))
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/coupon/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      return ok(coupons.find((c: any) => c.id === id) || coupons[0])
    },
  },
  { url: '/api/coupon/create', method: 'post', response: () => ok(1) },
  { url: '/api/coupon/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/coupon/delete/:id', method: 'post', response: () => ok(1) },
  {
    url: '/api/couponHistory/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      let data = histories
      if (query.couponId)
        data = data.filter((h: any) => h.couponId === Number(query.couponId))
      if (query.useStatus !== undefined && query.useStatus !== '')
        data = data.filter((h: any) => h.useStatus === Number(query.useStatus))
      if (query.orderSn) data = data.filter((h: any) => h.orderSn.includes(query.orderSn))
      return page(data, pageNum, pageSize)
    },
  },
] as MockMethod[]
