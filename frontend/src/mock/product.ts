import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const products = Mock.mock({
  'list|30': [
    {
      'id|+1': 1,
      name: '@ctitle(5,12)',
      'productSn|8': /[0-9]/,
      pic: Mock.Random.image('100x100', '#4A7BF7', '商品'),
      'price|50-5000.2': 1,
      'originalPrice|100-6000.2': 1,
      'stock|0-999': 100,
      subTitle: '@ctitle(6,16)',
      'brandId|1-15': 1,
      brandName: '@ctitle(2,4)',
      'productCategoryId|1-8': 1,
      productCategoryName: '@ctitle(2,4)',
      'sort|0-100': 0,
      'newStatus|0-1': 0,
      'recommandStatus|0-1': 0,
      'publishStatus|0-1': 0,
      'verifyStatus|0-1': 0,
    },
  ],
}).list

export default [
  {
    url: '/api/product/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize, keyword } = parsePage(query)
      let data = products
      if (keyword) data = data.filter((p: any) => p.name.includes(keyword))
      if (query.publishStatus !== undefined && query.publishStatus !== '')
        data = data.filter((p: any) => p.publishStatus === Number(query.publishStatus))
      if (query.verifyStatus !== undefined && query.verifyStatus !== '')
        data = data.filter((p: any) => p.verifyStatus === Number(query.verifyStatus))
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/product/simpleList',
    method: 'get',
    response: ({ query }: any) => {
      const kw = query.keyword || ''
      const data = kw ? products.filter((p: any) => p.name.includes(kw)) : products.slice(0, 10)
      return ok(data)
    },
  },
  {
    url: '/api/product/updateInfo/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      const found = products.find((p: any) => p.id === id) || products[0]
      return ok({ ...found, detailHtml: '<p>商品详情内容</p>' })
    },
  },
  { url: '/api/product/create', method: 'post', response: () => ok(1) },
  { url: '/api/product/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/product/update/verifyStatus', method: 'post', response: () => ok(1) },
  { url: '/api/product/update/publishStatus', method: 'post', response: () => ok(1) },
  { url: '/api/product/update/recommendStatus', method: 'post', response: () => ok(1) },
  { url: '/api/product/update/newStatus', method: 'post', response: () => ok(1) },
  { url: '/api/product/update/deleteStatus', method: 'post', response: () => ok(1) },
] as MockMethod[]
