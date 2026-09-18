// mock 公共工具
export function ok<T>(data: T, message = 'success') {
  return { code: 200, message, data }
}

export function fail(message = 'error', code = 500) {
  return { code, message, data: null }
}

// 生成分页响应
export function page<T>(list: T[], pageNum = 1, pageSize = 10) {
  const total = list.length
  const start = (pageNum - 1) * pageSize
  return ok({
    pageNum: Number(pageNum),
    pageSize: Number(pageSize),
    total,
    totalPage: Math.ceil(total / pageSize),
    list: list.slice(start, start + pageSize),
  })
}

// 从 url query 解析分页参数
export function parsePage(query: Record<string, any>) {
  return {
    pageNum: Number(query.pageNum) || 1,
    pageSize: Number(query.pageSize) || 10,
    keyword: query.keyword || '',
  }
}
