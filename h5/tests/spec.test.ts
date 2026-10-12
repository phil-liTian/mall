// 一次性验证脚本（无测试框架）：node --experimental-strip-types tests/spec.test.ts
// 数据取自 Backend/sql/mall-admin.sql 中商品 23「毛衫测试」的真实记录
import assert from 'node:assert/strict'
import { buildSpecState } from '../src/pages/product/detail/spec.ts'

const 尺寸 = {
  id: 1,
  name: '尺寸',
  type: 0,
  handAddStatus: 0,
  inputList: 'M,X,XL,2XL,3XL,4XL',
  productAttributeCategoryId: 1,
  searchType: 0,
  selectType: 2,
  relatedStatus: 0,
  sort: 0,
}
const 颜色 = { ...尺寸, id: 7, name: '颜色', handAddStatus: 1, inputList: '黑色,红色,白色,粉色', sort: 100 }
const 商品编号 = { ...尺寸, id: 24, name: '商品编号', type: 1, handAddStatus: 1, inputList: '' }

// pms_product_attribute_value (124, 23, 7, '米白色,浅黄色')
const valueList = [
  { id: 124, productId: 23, productAttributeId: 7, value: '米白色,浅黄色' },
  { id: 125, productId: 23, productAttributeId: 24, value: 'no1098' },
]

const sku = (id: number, spData: string) => ({
  id,
  skuCode: `SKU${id}`,
  price: 99,
  stock: 10,
  spData,
  lockStock: 0,
  lowStock: 0,
  pic: '',
  productId: 23,
  sale: 0,
})

const cases: [string, () => void][] = [
  [
    '商品23：pms_sku_stock 无记录时，仍应展示属性自带的全部规格值',
    () => {
      const { specList, specChildList, specSelected } = buildSpecState({
        productAttributeList: [尺寸, 颜色, 商品编号],
        productAttributeValueList: valueList,
        skuStockList: [],
      })
      assert.deepEqual(
        specList.map((s) => s.name),
        ['尺寸', '颜色'],
        'type=1 的参数不应混入规格维度',
      )
      assert.deepEqual(
        specChildList.filter((o) => o.pid === 1).map((o) => o.name),
        ['M', 'X', 'XL', '2XL', '3XL', '4XL'],
        '尺寸应取 inputList 的 6 个值',
      )
      assert.deepEqual(
        specChildList.filter((o) => o.pid === 7).map((o) => o.name),
        ['米白色', '浅黄色'],
        '颜色 handAddStatus=1 应取商品属性值',
      )
      assert.deepEqual(
        specSelected.map((o) => o.name),
        ['M', '米白色'],
        '每个维度应默认选中第一项',
      )
    },
  ],
  [
    'SKU 存在时，按 spData 过滤掉不在售的规格值',
    () => {
      const { specChildList, specSelected } = buildSpecState({
        productAttributeList: [尺寸, 颜色],
        productAttributeValueList: valueList,
        skuStockList: [
          sku(1, '[{"key":"尺寸","value":"XL"},{"key":"颜色","value":"米白色"}]'),
          sku(2, '[{"key":"尺寸","value":"2XL"},{"key":"颜色","value":"米白色"}]'),
        ],
      })
      assert.deepEqual(
        specChildList.map((o) => o.name),
        ['XL', '2XL', '米白色'],
        '只保留 SKU 中实际在售的规格值',
      )
      assert.deepEqual(specSelected.map((o) => o.name), ['XL', '米白色'])
    },
  ],
  [
    '脏数据：某维度的 spData 与属性值完全对不上时，该维度回退展示全部值',
    () => {
      const { specChildList } = buildSpecState({
        productAttributeList: [尺寸, 颜色],
        productAttributeValueList: valueList,
        // 颜色写的是属性值里不存在的「藏青色」，尺寸正常
        skuStockList: [sku(1, '[{"key":"尺寸","value":"XL"},{"key":"颜色","value":"藏青色"}]')],
      })
      assert.deepEqual(
        specChildList.filter((o) => o.pid === 1).map((o) => o.name),
        ['XL'],
        '尺寸能对上，应正常过滤',
      )
      assert.deepEqual(
        specChildList.filter((o) => o.pid === 7).map((o) => o.name),
        ['米白色', '浅黄色'],
        '颜色整列对不上，应回退展示全部值而不是整列消失',
      )
    },
  ],
  [
    'spData 为非法 JSON 时跳过该 SKU，不影响其它 SKU',
    () => {
      const { specChildList } = buildSpecState({
        productAttributeList: [尺寸],
        productAttributeValueList: valueList,
        skuStockList: [sku(1, '不是JSON'), sku(2, '[{"key":"尺寸","value":"XL"}]')],
      })
      assert.deepEqual(specChildList.map((o) => o.name), ['XL'])
    },
  ],
  [
    '无规格商品（mock 场景）：productAttributeList 为空时返回空状态',
    () => {
      const state = buildSpecState({
        productAttributeList: [],
        productAttributeValueList: [],
        skuStockList: [sku(1, '[{"key":"规格","value":"默认"}]')],
      })
      assert.deepEqual(state, { specList: [], specChildList: [], specSelected: [] })
    },
  ],
]

let failed = 0
for (const [name, run] of cases) {
  try {
    run()
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.log(`  ✗ ${name}`)
    console.log(`    ${(e as Error).message.split('\n').slice(0, 6).join('\n    ')}`)
  }
}
console.log(`\n${cases.length - failed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
