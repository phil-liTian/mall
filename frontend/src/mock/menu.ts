import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

// 一级菜单
const topMenus = Mock.mock({
  'list|5': [
    {
      'id|+1': 1,
      parentId: 0,
      title: '@ctitle(2,4)',
      level: 0,
      name: '@word(4,8)',
      'icon|1': ['setting', 'user', 'shop', 'appstore', 'file'],
      'hidden|1': [0, 1],
      'sort|1-100': 1,
      createTime: '@datetime',
    },
  ],
}).list

// 二级菜单
const subMenus = Mock.mock({
  'list|10': [
    {
      'id|+100': 100,
      'parentId|1-5': 1,
      title: '@ctitle(2,4)',
      level: 1,
      name: '@word(4,8)',
      'icon|1': ['setting', 'user', 'shop', 'appstore', 'file'],
      'hidden|1': [0, 1],
      'sort|1-100': 1,
      createTime: '@datetime',
    },
  ],
}).list

const allMenus = [...topMenus, ...subMenus]

export default [
  {
    url: '/api/menu/list/:parentId',
    method: 'get',
    response: ({ query, url }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      const parentId = Number(url.split('/').pop().split('?')[0])
      const data = allMenus.filter((m: any) => m.parentId === parentId)
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/menu/treeList',
    method: 'get',
    response: () =>
      ok(
        topMenus.map((t: any) => ({
          ...t,
          children: subMenus.filter((s: any) => s.parentId === t.id),
        })),
      ),
  },
  { url: '/api/menu/create', method: 'post', response: () => ok(1) },
  { url: '/api/menu/update/:id', method: 'post', response: () => ok(1) },
  {
    url: '/api/menu/:id',
    method: 'get',
    response: ({ url }: any) => {
      const id = Number(url.split('/').pop().split('?')[0])
      return ok(allMenus.find((m: any) => m.id === id) || allMenus[0])
    },
  },
  { url: '/api/menu/delete/:id', method: 'post', response: () => ok(1) },
  { url: '/api/menu/updateHidden/:id', method: 'post', response: () => ok(1) },
] as MockMethod[]
