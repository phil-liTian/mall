import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const subjects = Mock.mock({
  'list|15': [
    {
      'id|+1': 1,
      title: '@ctitle(3,8)专题',
      categoryName: '@ctitle(2,4)',
      pic: Mock.Random.image('120x60', '#4A7BF7', 'SUB'),
      'productCount|0-50': 0,
      'recommendStatus|0-1': 0,
      createTime: '@datetime',
      'showStatus|0-1': 1,
    },
  ],
}).list

export default [
  {
    url: '/api/subject/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize, keyword } = parsePage(query)
      const data = keyword
        ? subjects.filter((s: any) => s.title.includes(keyword))
        : subjects
      return page(data, pageNum, pageSize)
    },
  },
  { url: '/api/subject/listAll', method: 'get', response: () => ok(subjects) },
] as MockMethod[]
