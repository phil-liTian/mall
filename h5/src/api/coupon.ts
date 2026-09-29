import { request } from '@/api/request'
import type { SmsCoupon } from '@/types/coupon'

/** 商品优惠券列表 */
export const getProductCouponListAPI = (productId: string) => {
  return request<SmsCoupon[]>({ method: 'GET', url: `/member/coupon/listByProduct/${productId}` })
}

/** 领取优惠券 */
export const addMemberCouponAPI = (couponId: string) => {
  return request({ method: 'POST', url: `/member/coupon/add/${couponId}` })
}

/** 我的优惠券列表 */
export const getMemberCouponListAPI = (useStatus: number) => {
  return request<SmsCoupon[]>({ method: 'GET', url: '/member/coupon/list', params: { useStatus } })
}
