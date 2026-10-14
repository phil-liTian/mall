/** 格式化价格，带货币符号（后端金额单位为元） */
export const formatPrice = (price: number, withSymbol = true): string => {
  const num = Number(price)
  const yuan = isNaN(num) ? '0.00' : num.toFixed(2)
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
