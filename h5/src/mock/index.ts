import type { MockMethod } from 'vite-plugin-mock'
import {
  ok,
  allProducts,
  brandList,
  advertiseList,
  genFlashPromotion,
  subjectList,
  categoryList,
  memberInfo,
  defaultAddressList,
  genCartItems,
} from './_data'

/** 分页工具 */
const paginate = <T>(list: T[], pageNum = 1, pageSize = 10) => {
  const start = (pageNum - 1) * pageSize
  const pageList = list.slice(start, start + pageSize)
  return {
    pageNum,
    pageSize,
    total: list.length,
    totalPage: Math.ceil(list.length / pageSize),
    list: pageList,
  }
}

/** 读取 localStorage 中的持久化数据 */
const readStore = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeStore = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// ========== 首页相关 ==========
const homeMocks: MockMethod[] = [
  {
    url: '/api/home/content',
    method: 'get',
    response: () =>
      ok({
        advertiseList,
        brandList,
        homeFlashPromotion: genFlashPromotion(),
        hotProductList: allProducts.filter((p) => p.recommandStatus === 1).slice(0, 4),
        newProductList: allProducts.filter((p) => p.newStatus === 1).slice(0, 6),
        subjectList,
      }),
  },
  {
    url: '/api/home/recommendProductList',
    method: 'get',
    response: ({ query }) => {
      const pageNum = Number(query.pageNum) || 1
      const pageSize = Number(query.pageSize) || 10
      return ok(paginate(allProducts, pageNum, pageSize))
    },
  },
  {
    url: '/api/home/productCateList/:parentId',
    method: 'get',
    response: ({ query }) => {
      const parentId = Number(query.parentId) || 0
      return ok(categoryList.filter((c) => c.parentId === parentId))
    },
  },
  {
    url: '/api/home/newProductList',
    method: 'get',
    response: ({ query }) => {
      const pageNum = Number(query.pageNum) || 1
      const pageSize = Number(query.pageSize) || 10
      const list = allProducts.filter((p) => p.newStatus === 1)
      return ok(paginate(list, pageNum, pageSize))
    },
  },
  {
    url: '/api/home/hotProductList',
    method: 'get',
    response: ({ query }) => {
      const pageNum = Number(query.pageNum) || 1
      const pageSize = Number(query.pageSize) || 10
      const list = allProducts.filter((p) => p.recommandStatus === 1)
      return ok(paginate(list, pageNum, pageSize))
    },
  },
]

// ========== 商品相关 ==========
const productMocks: MockMethod[] = [
  {
    url: '/api/product/categoryTreeList',
    method: 'get',
    response: () => {
      const roots = categoryList.filter((c) => c.parentId === 0)
      return ok(
        roots.map((r) => ({
          id: r.id,
          name: r.name,
          children: categoryList
            .filter((c) => c.parentId === r.id)
            .map((c) => ({ id: c.id, name: c.name })),
        })),
      )
    },
  },
  {
    url: '/api/product/search',
    method: 'get',
    response: ({ query }) => {
      const pageNum = Number(query.pageNum) || 1
      const pageSize = Number(query.pageSize) || 10
      const keyword = query.keyword as string
      const cid = query.productCategoryId ? Number(query.productCategoryId) : 0
      let list = allProducts
      if (keyword) {
        list = list.filter(
          (p) => p.name.includes(keyword) || p.brandName.includes(keyword) || p.subTitle.includes(keyword),
        )
      }
      if (cid) list = list.filter((p) => p.productCategoryId === cid)
      const sort = Number(query.sort) || 0
      if (sort === 2) list = [...list].sort((a, b) => b.sale - a.sale)
      else if (sort === 3) list = [...list].sort((a, b) => a.price - b.price)
      else if (sort === 4) list = [...list].sort((a, b) => b.price - a.price)
      return ok(paginate(list, pageNum, pageSize))
    },
  },
  {
    url: '/api/product/detail/:id',
    method: 'get',
    response: ({ query }) => {
      const id = Number(query.id)
      const product = allProducts.find((p) => p.id === id)
      if (!product) return ok(null)
      return ok({
        product,
        brand: brandList.find((b) => b.id === product.brandId),
        productAttributeList: [],
        productAttributeValueList: [],
        skuStockList: [
          { id: 1, skuCode: 'SKU001', price: product.price, stock: 999, spData: '[{"key":"规格","value":"默认"}]', lockStock: 0, lowStock: 10, pic: product.pic, productId: product.id, sale: 100 },
        ],
        productFullReductionList: [],
        productLadderList: [],
        couponList: [],
      })
    },
  },
]

// ========== 购物车相关 ==========
const CART_KEY = 'mall_h5_mock_cart'
const cartMocks: MockMethod[] = [
  {
    url: '/api/cart/list',
    method: 'get',
    response: () => {
      const list = readStore(CART_KEY, genCartItems())
      return ok(list)
    },
  },
  {
    url: '/api/cart/add',
    method: 'post',
    response: ({ body }) => {
      const list = readStore(CART_KEY, genCartItems())
      const existing = list.find((item) => item.productId === body.productId)
      if (existing) {
        existing.quantity += body.quantity || 1
      } else {
        const product = allProducts.find((p) => p.id === body.productId)
        if (product) {
          list.push({
            id: String(Date.now()),
            memberId: '1',
            memberNickname: memberInfo.nickname || '',
            productId: product.id,
            productSkuId: body.productSkuId || 1,
            productSkuCode: `SKU${String(product.id).padStart(6, '0')}`,
            productCategoryId: product.productCategoryId,
            productName: product.name,
            productSubTitle: product.subTitle,
            productBrand: product.brandName,
            productPic: product.pic,
            price: product.price,
            quantity: body.quantity || 1,
            productAttr: body.productAttr || '[]',
            productSn: product.productSn,
            createDate: new Date().toISOString(),
            modifyDate: new Date().toISOString(),
            deleteStatus: 0,
            checked: true,
            spDataStr: '默认',
          })
        }
      }
      writeStore(CART_KEY, list)
      return ok(null)
    },
  },
  {
    url: '/api/cart/delete',
    method: 'post',
    response: ({ query }) => {
      const ids = String(query.ids).split(',').filter(Boolean)
      let list = readStore(CART_KEY, genCartItems())
      list = list.filter((item) => !ids.includes(item.id))
      writeStore(CART_KEY, list)
      return ok(null)
    },
  },
  {
    url: '/api/cart/update/quantity',
    method: 'get',
    response: ({ query }) => {
      const id = String(query.id)
      const quantity = Number(query.quantity)
      const list = readStore(CART_KEY, genCartItems())
      const item = list.find((i) => i.id === id)
      if (item) item.quantity = quantity
      writeStore(CART_KEY, list)
      return ok(null)
    },
  },
  {
    url: '/api/cart/clear',
    method: 'post',
    response: () => {
      writeStore(CART_KEY, [])
      return ok(null)
    },
  },
]

// ========== 订单相关 ==========
const ORDER_KEY = 'mall_h5_mock_orders'
const orderMocks: MockMethod[] = [
  {
    url: '/api/order/generateConfirmOrder',
    method: 'post',
    response: ({ body }) => {
      const cartIds: number[] = body || []
      const cartList = readStore(CART_KEY, genCartItems())
      const items = cartList.filter((c) => cartIds.includes(Number(c.id)))
      const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      return ok({
        memberReceiveAddressList: readStore('mall_h5_mock_address', defaultAddressList),
        cartPromotionItemList: items.map((i) => ({
          id: Number(i.id),
          productId: i.productId,
          productName: i.productName,
          productPic: i.productPic,
          productAttr: i.productAttr,
          productBrand: i.productBrand,
          productCategoryId: i.productCategoryId,
          productSkuCode: i.productSkuCode,
          productSkuId: i.productSkuId,
          productSn: i.productSn,
          productSubTitle: i.productSubTitle,
          promotionMessage: '',
          price: i.price,
          quantity: i.quantity,
          reduceAmount: 0,
          realStock: 999,
          integration: 0,
          growth: 0,
          memberId: 1,
          memberNickname: memberInfo.nickname || '',
          createDate: new Date().toISOString(),
          modifyDate: new Date().toISOString(),
          deleteStatus: 0,
        })),
        couponHistoryDetailList: [],
        calcAmount: {
          totalAmount,
          freightAmount: totalAmount > 9900 ? 0 : 800,
          promotionAmount: 0,
          payAmount: totalAmount + (totalAmount > 9900 ? 0 : 800),
        },
        integrationConsumeSetting: { id: 1, couponStatus: 1, deductionPerAmount: 100, maxPercentPerOrder: 50, useUnit: 100 },
        memberIntegration: memberInfo.integration || 0,
      })
    },
  },
  {
    url: '/api/order/generateOrder',
    method: 'post',
    response: ({ body }) => {
      const orders = readStore(ORDER_KEY, [])
      const orderId = Date.now()
      const cartList = readStore(CART_KEY, genCartItems())
      const items = cartList.filter((c) => body.cartIds?.includes(Number(c.id)))
      const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const addressList = readStore('mall_h5_mock_address', defaultAddressList)
      const address = addressList.find((a) => a.id === body.memberReceiveAddressId) || addressList[0]
      const order = {
        id: orderId,
        orderSn: `SN${orderId}`,
        memberId: 1,
        memberUsername: memberInfo.username,
        totalAmount,
        freightAmount: totalAmount > 9900 ? 0 : 800,
        promotionAmount: 0,
        couponAmount: 0,
        integrationAmount: 0,
        payAmount: totalAmount + (totalAmount > 9900 ? 0 : 800),
        payType: body.payType || 0,
        status: 0,
        orderType: 0,
        sourceType: 1,
        promotionInfo: '',
        integration: Math.floor(totalAmount / 100),
        growth: Math.floor(totalAmount / 100),
        useIntegration: body.useIntegration || 0,
        couponId: body.couponId || 0,
        note: '',
        createTime: new Date().toISOString(),
        paymentTime: '',
        deliveryTime: '',
        commentTime: '',
        confirmStatus: 0,
        deleteStatus: 0,
        receiverName: address?.name || '',
        receiverPhone: address?.phoneNumber || '',
        receiverProvince: address?.province || '',
        receiverCity: address?.city || '',
        receiverRegion: address?.region || '',
        receiverDetailAddress: address?.detailAddress || '',
        receiverPostCode: address?.postCode || '',
        deliveryCompany: '',
        deliverySn: '',
        discountAmount: 0,
        autoConfirmDay: 15,
        billType: 0,
        billHeader: '',
        billContent: '',
        billReceiverPhone: '',
        billReceiverEmail: '',
        orderItemList: items.map((i) => ({
          id: Number(i.id),
          orderId,
          orderSn: `SN${orderId}`,
          productId: i.productId,
          productName: i.productName,
          productPic: i.productPic,
          productAttr: i.productAttr,
          productBrand: i.productBrand,
          productCategoryId: i.productCategoryId,
          productSkuId: i.productSkuId,
          productSkuCode: i.productSkuCode,
          productSn: i.productSn,
          productPrice: i.price,
          productQuantity: i.quantity,
          promotionName: '',
          promotionAmount: 0,
          couponAmount: 0,
          integrationAmount: 0,
          realAmount: i.price * i.quantity,
          giftIntegration: 0,
          giftGrowth: 0,
        })),
      }
      orders.unshift(order)
      writeStore(ORDER_KEY, orders)
      // 下单成功后从购物车移除
      const remainCart = cartList.filter((c) => !body.cartIds?.includes(Number(c.id)))
      writeStore(CART_KEY, remainCart)
      return ok({ order, orderItemsList: order.orderItemList })
    },
  },
  {
    url: '/api/order/list',
    method: 'get',
    response: ({ query }) => {
      const status = query.status !== undefined ? Number(query.status) : -1
      const pageNum = Number(query.pageNum) || 1
      const pageSize = Number(query.pageSize) || 10
      let orders = readStore(ORDER_KEY, [])
      if (status >= 0) orders = orders.filter((o) => o.status === status)
      return ok(paginate(orders, pageNum, pageSize))
    },
  },
  {
    url: '/api/order/detail/:id',
    method: 'get',
    response: ({ query }) => {
      const id = Number(query.id)
      const orders = readStore(ORDER_KEY, [])
      return ok(orders.find((o) => o.id === id) || null)
    },
  },
  {
    url: '/api/order/cancelUserOrder',
    method: 'post',
    response: ({ query }) => {
      const id = Number(query.orderId)
      const orders = readStore(ORDER_KEY, [])
      const order = orders.find((o) => o.id === id)
      if (order) order.status = 4
      writeStore(ORDER_KEY, orders)
      return ok(null)
    },
  },
  {
    url: '/api/order/confirmReceiveOrder',
    method: 'post',
    response: ({ query }) => {
      const id = Number(query.orderId)
      const orders = readStore(ORDER_KEY, [])
      const order = orders.find((o) => o.id === id)
      if (order) order.status = 3
      writeStore(ORDER_KEY, orders)
      return ok(null)
    },
  },
  {
    url: '/api/order/deleteOrder',
    method: 'post',
    response: ({ query }) => {
      const id = Number(query.orderId)
      let orders = readStore(ORDER_KEY, [])
      orders = orders.filter((o) => o.id !== id)
      writeStore(ORDER_KEY, orders)
      return ok(null)
    },
  },
  {
    url: '/api/order/paySuccess',
    method: 'post',
    response: ({ query }) => {
      const id = Number(query.orderId)
      const orders = readStore(ORDER_KEY, [])
      const order = orders.find((o) => o.id === id)
      if (order) {
        order.status = 1
        order.paymentTime = new Date().toISOString()
      }
      writeStore(ORDER_KEY, orders)
      return ok(null)
    },
  },
]

// ========== 地址相关 ==========
const ADDRESS_KEY = 'mall_h5_mock_address'
const addressMocks: MockMethod[] = [
  {
    url: '/api/member/address/list',
    method: 'get',
    response: () => ok(readStore(ADDRESS_KEY, defaultAddressList)),
  },
  {
    url: '/api/member/address/:id',
    method: 'get',
    response: ({ query }) => {
      const id = Number(query.id)
      const list = readStore(ADDRESS_KEY, defaultAddressList)
      return ok(list.find((a) => a.id === id) || null)
    },
  },
  {
    url: '/api/member/address/add',
    method: 'post',
    response: ({ body }) => {
      const list = readStore(ADDRESS_KEY, defaultAddressList)
      const newItem = { ...body, id: Date.now() }
      if (newItem.defaultStatus === 1) list.forEach((a) => (a.defaultStatus = 0))
      list.push(newItem)
      writeStore(ADDRESS_KEY, list)
      return ok(newItem)
    },
  },
  {
    url: '/api/member/address/update/:id',
    method: 'post',
    response: ({ query, body }) => {
      const id = Number(query.id)
      const list = readStore(ADDRESS_KEY, defaultAddressList)
      const idx = list.findIndex((a) => a.id === id)
      if (idx >= 0) {
        if (body.defaultStatus === 1) list.forEach((a) => (a.defaultStatus = 0))
        list[idx] = { ...list[idx], ...body, id }
      }
      writeStore(ADDRESS_KEY, list)
      return ok(null)
    },
  },
  {
    url: '/api/member/address/delete/:id',
    method: 'post',
    response: ({ query }) => {
      const id = Number(query.id)
      let list = readStore(ADDRESS_KEY, defaultAddressList)
      list = list.filter((a) => a.id !== id)
      writeStore(ADDRESS_KEY, list)
      return ok(null)
    },
  },
]

// ========== 会员相关 ==========
let mockToken = 'mock-token-' + Date.now()
const memberMocks: MockMethod[] = [
  {
    url: '/api/sso/login',
    method: 'post',
    response: ({ body }) => {
      // 演示账号：任意非空账号密码均可登录
      if (!body.username || !body.password) {
        return { code: 401, message: '用户名或密码不能为空', data: null }
      }
      mockToken = 'mock-token-' + Date.now()
      return ok({ tokenHead: 'Bearer ', token: mockToken })
    },
  },
  {
    url: '/api/sso/register',
    method: 'post',
    response: () => ok(null),
  },
  {
    url: '/api/sso/getAuthCode',
    method: 'get',
    response: () => ok('123456'),
  },
  {
    url: '/api/sso/info',
    method: 'get',
    response: () => ok(memberInfo),
  },
]

// ========== 品牌相关 ==========
const brandMocks: MockMethod[] = [
  {
    url: '/api/brand/detail/:id',
    method: 'get',
    response: ({ query }) => {
      const id = Number(query.id)
      return ok(brandList.find((b) => b.id === id) || null)
    },
  },
  {
    url: '/api/brand/productList',
    method: 'get',
    response: ({ query }) => {
      const brandId = Number(query.brandId)
      const pageNum = Number(query.pageNum) || 1
      const pageSize = Number(query.pageSize) || 10
      const list = allProducts.filter((p) => p.brandId === brandId)
      return ok(paginate(list, pageNum, pageSize))
    },
  },
  {
    url: '/api/brand/recommendList',
    method: 'get',
    response: () => ok(brandList),
  },
]

export default [
  ...homeMocks,
  ...productMocks,
  ...cartMocks,
  ...orderMocks,
  ...addressMocks,
  ...memberMocks,
  ...brandMocks,
] as MockMethod[]
