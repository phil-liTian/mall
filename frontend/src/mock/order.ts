import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ok, page, parsePage } from './_util'

const orders = Mock.mock({
  'list|25': [
    {
      'id|+1': 1,
      orderSn: /2024[0-9]{12}/,
      createTime: '@datetime',
      memberUsername: '@word(5,8)',
      'totalAmount|100-5000.2': 1,
      'payAmount|100-5000.2': 1,
      'freightAmount|0-20.2': 1,
      'promotionAmount|0-50.2': 1,
      'integrationAmount|0-30.2': 1,
      'couponAmount|0-30.2': 1,
      'discountAmount|0-30.2': 1,
      'payType|1': [0, 1, 2],
      'sourceType|1': [0, 1],
      'status|0-4': 0,
      'orderType|1': [0, 1],
      receiverName: '@cname',
      receiverPhone: /1[3-9][0-9]{9}/,
      receiverPostCode: /[0-9]{6}/,
      receiverProvince: '@province',
      receiverCity: '@city',
      receiverRegion: '@county',
      receiverDetailAddress: '@ctitle(6,12)',
      note: '@ctitle(3,8)',
      deliveryCompany: '顺丰速运',
      deliverySn: /SF[0-9]{12}/,
    },
  ],
}).list

function buildDetail(order: any) {
  const orderItemList = Mock.mock({
    'list|1-4': [
      {
        'id|+1': 1,
        productName: '@ctitle(4,10)',
        productPic: '',
        productSkuCode: /SKU[0-9]{8}/,
        'productPrice|50-800.2': 1,
        'productQuantity|1-5': 1,
        productAttr: '颜色:黑色;尺寸:XL',
      },
    ],
  }).list
  const historyList = [
    { id: 1, createTime: order.createTime, orderStatus: 0, note: '提交订单', operateMan: '会员' },
    { id: 2, createTime: order.createTime, orderStatus: 1, note: '完成付款', operateMan: '会员' },
  ]
  return { ...order, orderItemList, historyList }
}

export default [
  {
    url: '/api/order/list',
    method: 'get',
    response: ({ query }: any) => {
      const { pageNum, pageSize } = parsePage(query)
      let data = orders
      if (query.orderSn) data = data.filter((o: any) => o.orderSn.includes(query.orderSn))
      if (query.receiverKeyword)
        data = data.filter((o: any) => o.receiverName.includes(query.receiverKeyword))
      if (query.status !== undefined && query.status !== '')
        data = data.filter((o: any) => o.status === Number(query.status))
      if (query.orderType !== undefined && query.orderType !== '')
        data = data.filter((o: any) => o.orderType === Number(query.orderType))
      return page(data, pageNum, pageSize)
    },
  },
  {
    url: '/api/order/:id',
    method: 'get',
    response: ({ url }: any) => {
      const id = Number(url.split('/').pop().split('?')[0])
      const order = orders.find((o: any) => o.id === id) || orders[0]
      return ok(buildDetail(order))
    },
  },
  { url: '/api/order/update/delivery', method: 'post', response: () => ok(1) },
  { url: '/api/order/update/close', method: 'post', response: () => ok(1) },
  { url: '/api/order/delete', method: 'post', response: () => ok(1) },
  { url: '/api/order/update/receiverInfo', method: 'post', response: () => ok(1) },
  { url: '/api/order/update/moneyInfo', method: 'post', response: () => ok(1) },
  { url: '/api/order/update/note', method: 'post', response: () => ok(1) },
] as MockMethod[]
