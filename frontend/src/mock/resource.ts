import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const categories = Mock.mock({
  'list|5': [
    {
      'id|+1': 1,
      name: '@ctitle(2,4)',
      'sort|1-100': 1,
      createTime: '@datetime',
    },
  ],
}).list

const resources = Mock.mock({
  'list|20': [
    {
      'id|+1': 1,
      name: '@ctitle(3,6)',
      url: '/@word(4,8)/@word(4,8)',
      description: '@ctitle(6,12)',
      'categoryId|1-5': 1,
      createTime: '@datetime',
    },
  ],
}).list

export default [
  {
    url: '/api/resource/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      let data = resources
      if (query.categoryId) {
        data = data.filter((r: any) => r.categoryId === Number(query.categoryId))
      }
      if (query.nameKeyword) {
        data = data.filter((r: any) => r.name.includes(query.nameKeyword))
      }
      if (query.urlKeyword) {
        data = data.filter((r: any) => r.url.includes(query.urlKeyword))
      }
      return page(data, pageNum, pageSize)
    },
  },
  { url: '/api/resource/listAll', method: 'get', response: () => ok(resources) },
  { url: '/api/resource/create', method: 'post', response: () => ok(1) },
  { url: '/api/resource/update/:id', method: 'post', response: () => ok(1) },
  {
    url: '/api/resource/:id',
    method: 'get',
    response: ({ url }: any) => {
      const id = Number(url.split('/').pop().split('?')[0])
      return ok(resources.find((r: any) => r.id === id) || resources[0])
    },
  },
  { url: '/api/resource/delete/:id', method: 'post', response: () => ok(1) },
  { url: '/api/resourceCategory/listAll', method: 'get', response: () => ok(categories) },
  { url: '/api/resourceCategory/create', method: 'post', response: () => ok(1) },
  { url: '/api/resourceCategory/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/resourceCategory/delete/:id', method: 'post', response: () => ok(1) },
] as MockMethod[]
