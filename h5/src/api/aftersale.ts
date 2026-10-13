import { request } from '@/api/request'
import type {
  OmsOrderReturnApply,
  OmsOrderReturnApplyParam,
  OmsOrderReturnReason,
} from '@/types/order'
import type { CommonPage, PageParam } from '@/types/common'

/** 提交售后申请 */
export const createReturnApplyAPI = (data: OmsOrderReturnApplyParam) => {
  return request({ method: 'POST', url: '/returnApply/create', data })
}

/** 分页获取我的售后申请列表 */
export const getReturnApplyListAPI = (params: PageParam & { status?: number }) => {
  return request<CommonPage<OmsOrderReturnApply>>({
    method: 'GET',
    url: '/returnApply/list',
    params,
  })
}

/** 获取售后申请详情 */
export const getReturnApplyDetailAPI = (id: number) => {
  return request<OmsOrderReturnApply>({ method: 'GET', url: `/returnApply/detail/${id}` })
}

/** 撤销售后申请 */
export const cancelReturnApplyAPI = (id: number) => {
  return request({ method: 'POST', url: `/returnApply/cancel/${id}` })
}

/** 获取可选的退货原因 */
export const getReturnReasonListAPI = () => {
  return request<OmsOrderReturnReason[]>({ method: 'GET', url: '/returnApply/reasonList' })
}
