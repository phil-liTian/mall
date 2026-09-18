export interface CommonResult<T = unknown> {
  code: number
  message: string
  data: T
}

export interface CommonPage<T> {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: T[]
}
