import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const brands = Mock.mock({
  'list|15': [
    {
      'id|+1': 1,
      name: '@ctitle(2,4)',
      firstLetter: '@first',
      'sort|0-100': 0,
      'factoryStatus|0-1': 1,
      'showStatus|0-1': 1,
      'productCount|0-200': 0,
      'productCommentCount|0-100': 0,
      logo: Mock.Random.image('60x60', '#4A7BF7', 'LOGO'),
      bigPic: '',
      brandStory: '@cparagraph(1,3)',
    },
  ],
}).list

export default [
  {
    url: '/api/brand/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize, keyword } = parsePage(query)
      let data = brands
      if (keyword) data = data.filter((b: any) => b.name.includes(keyword))
      if (query.showStatus !== undefined && query.showStatus !== '')
        data = data.filter((b: any) => b.showStatus === Number(query.showStatus))
      return page(data, pageNum, pageSize)
    },
  },
  { url: '/api/brand/listAll', method: 'get', response: () => ok(brands) },
  {
    url: '/api/brand/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      return ok(brands.find((b: any) => b.id === id) || brands[0])
    },
  },
  { url: '/api/brand/create', method: 'post', response: () => ok(1) },
  { url: '/api/brand/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/brand/delete/batch', method: 'post', response: () => ok(1) },
  { url: '/api/brand/delete/:id', method: 'get', response: () => ok(1) },
  { url: '/api/brand/update/showStatus', method: 'post', response: () => ok(1) },
  { url: '/api/brand/update/factoryStatus', method: 'post', response: () => ok(1) },
] as MockMethod[]
