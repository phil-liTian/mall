import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const admins = Mock.mock({
  'list|18': [
    {
      'id|+1': 1,
      username: '@word(5,8)',
      nickName: '@cname',
      note: '@ctitle(4,8)',
      icon: '',
      email: '@email',
      'status|1': [0, 1],
      createTime: '@datetime',
      loginTime: '@datetime',
    },
  ],
}).list

export default [
  {
    url: '/api/admin/login',
    method: 'post',
    response: ({ body }: any) => {
      if (body?.username === 'admin' && body?.password === 'macro123') {
        return ok({ token: Mock.mock('@guid'), tokenHead: 'Bearer ' })
      }
      return { code: 401, message: '用户名或密码错误', data: null }
    },
  },
  {
    url: '/api/admin/info',
    method: 'get',
    response: () =>
      ok({ username: 'admin', nickName: '超级管理员', icon: '', menus: [], roles: ['超级管理员'] }),
  },
  { url: '/api/admin/logout', method: 'post', response: () => ok(null) },
  {
    url: '/api/admin/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize, keyword } = parsePage(query)
      const data = keyword ? admins.filter((a: any) => a.username.includes(keyword)) : admins
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/admin/updateStatus/:id',
    method: 'post',
    response: ({ query }: any) => {
      // status via query
      void query
      return ok(1)
    },
  },
  { url: '/api/admin/delete/:id', method: 'post', response: () => ok(1) },
] as MockMethod[]
