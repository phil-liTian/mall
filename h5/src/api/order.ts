import { request } from '@/api/request'
import type {
  ConfirmOrderResult,
  GenerateOrderResult,
  OrderParam,
  OmsOrderDetail,
  OmsOrderReturnApplyParam,
} from '@/types/order'
import type { CommonPage, PageParam } from '@/types/common'

/** 生成确认单信息 */
export const generateConfirmOrderAPI = (cartIds: number[]) => {
  return request<ConfirmOrderResult>({ method: 'POST', url: '/order/generateConfirmOrder', data: cartIds })
}

/** 生成订单 */
export const generateOrderAPI = (data: OrderParam) => {
  return request<GenerateOrderResult>({ method: 'POST', url: '/order/generateOrder', data })
}

/** 按状态分页获取用户订单列表 */
export const getOrderListAPI = (params: PageParam & { status: number }) => {
  return request<CommonPage<OmsOrderDetail>>({ method: 'GET', url: '/order/list', params })
}

/** 根据ID获取订单详情 */
export const getOrderDetailAPI = (orderId: number) => {
  return request<OmsOrderDetail>({ method: 'GET', url: `/order/detail/${orderId}` })
}

/** 用户取消订单 */
export const cancelUserOrderAPI = (orderId: number) => {
  return request({ method: 'POST', url: '/order/cancelUserOrder', params: { orderId } })
}

/** 用户确认收货 */
export const confirmReceiveOrderAPI = (orderId: number) => {
  return request({ method: 'POST', url: '/order/confirmReceiveOrder', params: { orderId } })
}

/** 用户删除订单 */
export const deleteOrderAPI = (orderId: number) => {
  return request({ method: 'POST', url: '/order/deleteOrder', params: { orderId } })
}

/** 支付成功回调 */
export const payOrderSuccessAPI = (params: { orderId: number; payType: number }) => {
  return request({ method: 'POST', url: '/order/paySuccess', params })
}

/** 支付宝交易状态查询 */
export const fetchAliapyStatusAPI = (params: { outTradeNo: string }) => {
  return request<string>({ method: 'GET', url: '/alipay/query', params })
}

/** 申请退货 */
export const createReturnApplyAPI = (data: OmsOrderReturnApplyParam) => {
  return request({ method: 'POST', url: '/returnApply/create', data })
}
