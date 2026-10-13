/** 单个商品的评价内容 */
export type PmsCommentItemParam = {
  /** 订单项ID */
  orderItemId: number
  /** 评分，1-5 */
  star: number
  /** 评价内容 */
  content?: string
  /** 晒图地址，最多5张 */
  pics?: string[]
}

/** 整单评价请求参数 */
export type PmsCommentParam = {
  /** 订单ID */
  orderId: number
  /** 各商品的评价内容 */
  items: PmsCommentItemParam[]
}

/** 商品评价 */
export type PmsComment = {
  id: number
  /** 商品ID */
  productId: number
  /** 评价会员ID */
  memberId: number
  /** 来源订单ID */
  orderId: number
  /** 来源订单项ID */
  orderItemId: number
  /** 会员昵称 */
  memberNickName: string
  /** 会员头像 */
  memberIcon: string
  /** 商品名称 */
  productName: string
  /** 购买时的商品属性 JSON 字符串 */
  productAttribute: string
  /** 评价星数：1-5 */
  star: number
  /** 评价时间 */
  createTime: string
  /** 评价内容 */
  content: string
  /** 晒图地址，以逗号隔开 */
  pics: string
  /** 回复数 */
  replayCount: number
}

/** 商品评价统计 */
export type PmsCommentStat = {
  /** 评价总数 */
  total: number
  /** 平均星级 */
  avgStar: number
  /** 好评数（4星及以上） */
  goodCount: number
  /** 有图评价数 */
  picCount: number
}
