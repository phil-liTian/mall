import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const applies = Mock.mock({
  'list|15': [
    {
      'id|+1': 1,
      'orderId|1-25': 1,
      orderSn: /2024[0-9]{12}/,
      createTime: '@datetime',
      memberUsername: '@word(5,8)',
      'returnAmount|50-2000.2': 1,
      returnName: '@cname',
      returnPhone: /1[3-9][0-9]{9}/,
      'status|0-3': 0,
      handleTime: '@datetime',
      productPic: '',
      productName: '@ctitle(4,10)',
      productBrand: '@ctitle(2,4)',
      productAttr: '颜色:黑色;尺寸:XL',
      'productCount|1-3': 1,
      'productPrice|50-800.2': 1,
      'productRealPrice|50-800.2': 1,
      reason: '质量问题',
      description: '@ctitle(6,12)',
      proofPics: '',
      handleNote: '',
      handleMan: '',
      receiveMan: '',
      receiveTime: '',
      receiveNote: '',
    },
  ],
}).list

export default [
  {
    url: '/api/returnApply/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      let data = applies
      if (query.receiverKeyword)
        data = data.filter((a: any) => a.returnName.includes(query.receiverKeyword))
      if (query.status !== undefined && query.status !== '')
        data = data.filter((a: any) => a.status === Number(query.status))
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/returnApply/:id',
    method: 'get',
    response: ({ url }: any) => {
      const id = Number(url.split('/').pop().split('?')[0])
      const item = applies.find((a: any) => a.id === id) || applies[0]
      return ok(item)
    },
  },
  { url: '/api/returnApply/delete', method: 'post', response: () => ok(1) },
  { url: '/api/returnApply/update/status/:id', method: 'post', response: () => ok(1) },
] as MockMethod[]
