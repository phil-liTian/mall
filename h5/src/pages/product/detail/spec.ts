import type {
  PmsProductAttribute,
  PmsProductAttributeValue,
  PmsSkuStock,
  SpecOption,
} from '@/types/product'

/** 构建规格所需的详情数据片段 */
export type SpecSource = {
  productAttributeList?: PmsProductAttribute[]
  productAttributeValueList?: PmsProductAttributeValue[]
  skuStockList?: PmsSkuStock[]
}

export type SpecState = {
  /** type=0 的规格维度（尺寸、颜色…） */
  specList: PmsProductAttribute[]
  /** 全部可选规格值 */
  specChildList: SpecOption[]
  /** 每个维度默认选中的第一项 */
  specSelected: SpecOption[]
}

/** 取某个规格维度的全部候选值：支持手动新增的取商品属性值，否则取属性自带的 inputList */
const collectOptions = (
  attr: PmsProductAttribute,
  valueList: PmsProductAttributeValue[],
): SpecOption[] => {
  const raw =
    attr.handAddStatus === 1
      ? valueList.find((v) => v.productAttributeId === attr.id)?.value
      : attr.inputList
  return (raw?.split(',') ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ pid: attr.id, pname: attr.name, name }))
}

/** 汇总所有 SKU 的 spData 中实际在售的规格值 */
const collectSellableValues = (skuStockList: PmsSkuStock[]): Set<string> => {
  const sellable = new Set<string>()
  for (const sku of skuStockList) {
    try {
      const spDataArr = JSON.parse(sku.spData) as { key: string; value: string }[]
      for (const sp of spDataArr) sellable.add(sp.value)
    } catch {
      // spData 为脏数据时跳过该条 SKU
    }
  }
  return sellable
}

export const buildSpecState = (source: SpecSource): SpecState => {
  const attrList = source.productAttributeList ?? []
  const valueList = source.productAttributeValueList ?? []
  const skuStockList = source.skuStockList ?? []

  const specList = attrList.filter((item) => item.type === 0)
  const sellableValues = collectSellableValues(skuStockList)

  const specChildList: SpecOption[] = []
  for (const attr of specList) {
    const options = collectOptions(attr, valueList)
    const sellableOptions = options.filter((o) => sellableValues.has(o.name))
    // 该维度在 SKU 的 spData 里一个值都对不上（商品无 SKU，或 spData 与属性值不一致）时，
    // 回退展示属性自带的全部值，避免整列规格凭空消失
    specChildList.push(...(sellableOptions.length > 0 ? sellableOptions : options))
  }

  const specSelected: SpecOption[] = []
  for (const attr of specList) {
    const first = specChildList.find((o) => o.pid === attr.id)
    if (first) {
      first.selected = true
      specSelected.push(first)
    }
  }

  return { specList, specChildList, specSelected }
}
