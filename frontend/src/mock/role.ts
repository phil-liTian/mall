import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const roles = Mock.mock({
  'list|15': [
    {
      'id|+1': 1,
      name: '@ctitle(3,6)',
      description: '@ctitle(6,12)',
      'adminCount|1-20': 1,
      'status|1': [0, 1],
      'sort|1-100': 1,
      createTime: '@datetime',
    },
  ],
}).list

export default [
  {
    url: '/api/role/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize, keyword } = parsePage(query)
      const data = keyword ? roles.filter((r: any) => r.name.includes(keyword)) : roles
      return page(data, pageNum, pageSize)
    },
  },
  { url: '/api/role/listAll', method: 'get', response: () => ok(roles) },
  { url: '/api/role/create', method: 'post', response: () => ok(1) },
  { url: '/api/role/update/:id', method: 'post', response: () => ok(1) },
  { url: '/api/role/delete', method: 'post', response: () => ok(1) },
  { url: '/api/role/updateStatus/:id', method: 'post', response: () => ok(1) },
  {
    url: '/api/role/listMenu/:roleId',
    method: 'get',
    response: () => ok(Mock.mock({ 'list|2-4': [{ 'id|+1': 1, title: '@ctitle(2,4)' }] }).list),
  },
  {
    url: '/api/role/listResource/:roleId',
    method: 'get',
    response: () => ok(Mock.mock({ 'list|2-4': [{ 'id|+1': 1, name: '@ctitle(2,4)' }] }).list),
  },
  { url: '/api/role/allocMenu', method: 'post', response: () => ok(1) },
  { url: '/api/role/allocResource', method: 'post', response: () => ok(1) },
] as MockMethod[]
