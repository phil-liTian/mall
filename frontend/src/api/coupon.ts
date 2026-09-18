import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface SmsCoupon {
  id: number
  name: string
  type: number
  amount: number
  publishCount: number
  useCount: number
  receiveCount: number
  perLimit: number
  minPoint: number
  startTime: string
  endTime: string
  useType: number
  note?: string
}

export interface SmsCouponHistory {
  id: number
  couponId: number
  memberNickname: string
  orderSn?: string
  getType: number
  useStatus: number
  useTime?: string
  createTime: string
}

export interface CouponListParams {
  name?: string
  type?: number
  pageNum: number
  pageSize: number
}

export function listCoupon(params: CouponListParams) {
  return request<CommonPage<SmsCoupon>>({ url: '/coupon/list', method: 'get', params })
}

export function createCoupon(data: Partial<SmsCoupon>) {
  return request({ url: '/coupon/create', method: 'post', data })
}

export function updateCoupon(id: number, data: Partial<SmsCoupon>) {
  return request({ url: `/coupon/update/${id}`, method: 'post', data })
}

export function deleteCoupon(id: number) {
  return request({ url: `/coupon/delete/${id}`, method: 'post' })
}

export function getCoupon(id: number) {
  return request<SmsCoupon>({ url: `/coupon/${id}`, method: 'get' })
}

export interface CouponHistoryParams {
  couponId?: number
  useStatus?: number
  orderSn?: string
  pageNum: number
  pageSize: number
}

export function listCouponHistory(params: CouponHistoryParams) {
  return request<CommonPage<SmsCouponHistory>>({
    url: '/couponHistory/list',
    method: 'get',
    params,
  })
}
