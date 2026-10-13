/** 价格分转元（后端金额单位为分，前端展示为元） */
export const fenToYuan = (fen: number): string => {
  if (fen == null) return '0.00'
  return (fen / 100).toFixed(2)
}

/** 元转分 */
export const yuanToFen = (yuan: number | string): number => {
  const num = typeof yuan === 'string' ? parseFloat(yuan) : yuan
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

/** 格式化价格，带货币符号 */
export const formatPrice = (fen: number, withSymbol = true): string => {
  const yuan = fenToYuan(fen)
  return withSymbol ? `¥${yuan}` : yuan
}

/** 手机号脱敏 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/** 姓名脱敏 */
export const maskName = (name: string): string => {
  if (!name) return ''
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}

/** 解析商品销售属性 JSON，形如 [{"key":"颜色","value":"红色"}] */
export const formatProductAttr = (jsonAttr: string): string => {
  if (!jsonAttr) return ''
  try {
    const arr = JSON.parse(jsonAttr) as { key: string; value: string }[]
    return arr.map((a) => `${a.key}:${a.value}`).join('; ')
  } catch {
    return jsonAttr
  }
}
