import dayjs from 'dayjs'

/** 格式化时间 */
export const formatDate = (date: string | number | Date, fmt = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''
  return dayjs(date).format(fmt)
}

/** 格式化日期（仅年月日） */
export const formatDateDay = (date: string | number | Date) => {
  return formatDate(date, 'YYYY-MM-DD')
}

/** 订单状态文案 */
export const orderStatusText = (status: number): string => {
  const map: Record<number, string> = {
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已关闭',
  }
  return map[status] ?? '未知'
}

/** 支付状态文案 */
export const payStatusText = (status: number): string => {
  const map: Record<number, string> = {
    0: '未支付',
    1: '已支付',
  }
  return map[status] ?? '未知'
}
