import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { page, parsePage } from './_util'

// 生成一组推荐数据，nameField 为该组的名称字段
function genList(nameField: string) {
  return Mock.mock({
    'list|12': [
      {
        'id|+1': 1,
        [nameField]: '@ctitle(2,6)',
        'recommendStatus|0-1': 1,
        'sort|0-100': 0,
      },
    ],
  }).list
}

const brands = genList('brandName')
const news = genList('productName')
const hots = genList('productName')
const subjects = genList('subjectName')

// 为一组推荐接口生成 mock 路由
function genRoutes(basePath: string, list: any[], nameField: string): MockMethod[] {
  return [
    {
      url: `/api${basePath}/list`,
      method: 'get',
      response: ({ query }: any) => {
        const { pageNum, pageSize } = parsePage(query)
        let data = list
        if (query[nameField])
          data = data.filter((it: any) => String(it[nameField]).includes(query[nameField]))
        if (query.recommendStatus !== undefined && query.recommendStatus !== '')
          data = data.filter((it: any) => it.recommendStatus === Number(query.recommendStatus))
        return page(data, pageNum, pageSize)
      },
    },
    { url: `/api${basePath}/create`, method: 'post', response: () => ({ code: 200, message: 'success', data: 1 }) },
    { url: `/api${basePath}/update/sort/:id`, method: 'post', response: () => ({ code: 200, message: 'success', data: 1 }) },
    { url: `/api${basePath}/delete`, method: 'post', response: () => ({ code: 200, message: 'success', data: 1 }) },
    { url: `/api${basePath}/update/recommendStatus`, method: 'post', response: () => ({ code: 200, message: 'success', data: 1 }) },
  ]
}

export default [
  ...genRoutes('/home/brand', brands, 'brandName'),
  ...genRoutes('/home/newProduct', news, 'productName'),
  ...genRoutes('/home/recommendProduct', hots, 'productName'),
  ...genRoutes('/home/recommendSubject', subjects, 'subjectName'),
] as MockMethod[]
