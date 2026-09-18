import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const attrCates = Mock.mock({
  'list|8': [
    {
      'id|+1': 1,
      name: '@ctitle(2,4)',
      'attributeCount|1-10': 1,
      'paramCount|1-8': 1,
    },
  ],
}).list

const attrs = Mock.mock({
  'list|40': [
    {
      'id|+1': 1,
      'productAttributeCategoryId|1-8': 1,
      name: '@ctitle(2,4)',
      'type|0-1': 0,
      'selectType|0-2': 0,
      'inputType|0-1': 0,
      inputList: '红色,蓝色,绿色',
      'sort|0-100': 0,
    },
  ],
}).list

export default [
  {
    url: '/api/productAttribute/list/:cid',
    method: 'get',
    response: ({ query, url }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      const m = url.match(/list\/(\d+)/)
      const cid = m ? Number(m[1]) : 0
      const type = Number(query.type) || 0
      const data = attrs.filter(
        (a: any) => a.productAttributeCategoryId === cid && a.type === type,
      )
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/productAttribute/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      return ok(attrs.find((a: any) => a.id === id) || attrs[0])
    },
  },
  { url: '/api/productAttribute/create', method: 'post', response: () => ok(1) },
  { url: '/api/productAttribute/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/productAttribute/delete', method: 'post', response: () => ok(1) },
  {
    url: '/api/productAttribute/attrInfo/:categoryId',
    method: 'get',
    response: () => ok([]),
  },
  {
    url: '/api/productAttribute/category/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      return page(attrCates, pageNum, pageSize)
    },
  },
  {
    url: '/api/productAttribute/category/list/withAttr',
    method: 'get',
    response: () =>
      ok(
        attrCates.map((c: any) => ({
          ...c,
          productAttributeList: attrs.filter(
            (a: any) => a.productAttributeCategoryId === c.id,
          ),
        })),
      ),
  },
  {
    url: '/api/productAttribute/category/:id',
    method: 'get',
    response: ({ query }: any) => {
      const id = Number(query.id)
      return ok(attrCates.find((c: any) => c.id === id) || attrCates[0])
    },
  },
  { url: '/api/productAttribute/category/create', method: 'post', response: () => ok(1) },
  { url: '/api/productAttribute/category/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/productAttribute/category/delete/:id', method: 'get', response: () => ok(1) },
] as MockMethod[]
