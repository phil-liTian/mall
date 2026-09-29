import type { PmsProduct } from '@/types/product'
import type { PmsBrand } from '@/types/brand'
import type { PmsProductCategory } from '@/types/product'
import type { SmsHomeAdvertise, HomeFlashPromotion, CmsSubject } from '@/types/home'
import type { MemberReceiveAddress } from '@/types/address'
import type { CartItem } from '@/types/cart'
import type { MemberInfo } from '@/types/member'

/** 统一成功响应包装 */
export const ok = <T>(data: T) => ({ code: 200, message: 'success', data })

/** 失败响应包装 */
export const fail = (message: string, code = 500) => ({ code, message, data: null })

/** 生成商品图片 */
const pic = (id: number) =>
  `https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/product_${(id % 8) + 1}.png`

/** 商品名称素材 */
const productNames = [
  '小米11 Ultra 5G智能手机',
  '华为 Mate 60 Pro 12+512G',
  'Apple iPhone 15 Pro Max',
  '海尔冰箱 BCD-470WGHTD1BGZU1',
  '美的变频空调 KFR-35GW',
  '戴森 Dyson V12 无线吸尘器',
  '飞利浦电动牙刷 HX6730',
  '九阳破壁机 L18-Y915S',
  '索尼 WH-1000XM5 头戴耳机',
  '华为 MatePad Pro 13.2英寸',
  '联想 ThinkPad X1 Carbon',
  '大疆 DJI Mini 3 Pro 无人机',
]

const subTitles = [
  '影像旗舰 · 骁龙888',
  '卫星通话 · 昆仑玻璃',
  'A17 Pro 芯片 · 钛金属',
  '风冷无霜 · 一级能效',
  '新一级能效 · 自清洁',
  '激光探测 · 强劲吸力',
  '声波震动 · 净白牙齿',
  '静音破壁 · 营养释放',
  '主动降噪 · 长续航',
  'OLED 全面屏 · 星闪触控',
  '碳纤维机身 · 商务旗舰',
  '轻量折叠 · 4K HDR',
]

/** 生成商品列表 */
export const genProducts = (count: number, startId = 1): PmsProduct[] => {
  const list: PmsProduct[] = []
  for (let i = 0; i < count; i++) {
    const id = startId + i
    const idx = id % productNames.length
    list.push({
      id,
      brandId: (id % 5) + 1,
      brandName: ['小米', '华为', 'Apple', '海尔', '美的'][(id - 1) % 5],
      productCategoryId: ((id - 1) % 10) + 1,
      productCategoryName: '数码电器',
      name: productNames[idx],
      pic: pic(id),
      albumPics: Array.from({ length: 3 }, (_, k) => pic(id + k)).join(','),
      publishStatus: 1,
      newStatus: id % 3 === 0 ? 1 : 0,
      recommandStatus: id % 2 === 0 ? 1 : 0,
      verifyStatus: 1,
      sort: id,
      price: Math.floor(1000 + Math.random() * 9000),
      originalPrice: 0,
      sale: Math.floor(Math.random() * 5000),
      stock: 999,
      promotionPrice: 0,
      promotionType: 0,
      promotionStartTime: '',
      promotionEndTime: '',
      subTitle: subTitles[idx],
      description: '高品质好物，限时优惠',
      detailTitle: productNames[idx],
      detailMobileHtml: '<p>商品详情内容</p>',
      productSn: `SN${String(id).padStart(6, '0')}`,
      serviceIds: '1,2,3',
      createTime: '2024-01-01 10:00:00',
      updateTime: '2024-01-01 10:00:00',
      flashPromotionPrice: id % 4 === 0 ? Math.floor(500 + Math.random() * 5000) : undefined,
    })
  }
  return list
}

/** 全量商品池（用于搜索/列表/详情） */
export const allProducts: PmsProduct[] = genProducts(40)

/** 品牌列表 */
export const brandList: PmsBrand[] = [
  { id: 1, name: '小米', firstLetter: 'X', sort: 1, factoryStatus: 1, showStatus: 1, productCount: 120, productCommentCount: 5000, logo: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/brand_xiaomi.png', bigPic: '', brandStory: '为发烧而生', brandDesc: '小米科技', createTime: '2024-01-01 10:00:00' },
  { id: 2, name: '华为', firstLetter: 'H', sort: 2, factoryStatus: 1, showStatus: 1, productCount: 200, productCommentCount: 8000, logo: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/brand_huawei.png', bigPic: '', brandStory: '构建万物互联的智能世界', brandDesc: '华为技术', createTime: '2024-01-01 10:00:00' },
  { id: 3, name: 'Apple', firstLetter: 'A', sort: 3, factoryStatus: 1, showStatus: 1, productCount: 80, productCommentCount: 12000, logo: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/brand_apple.png', bigPic: '', brandStory: 'Think Different', brandDesc: '苹果公司', createTime: '2024-01-01 10:00:00' },
  { id: 4, name: '海尔', firstLetter: 'H', sort: 4, factoryStatus: 1, showStatus: 1, productCount: 150, productCommentCount: 6000, logo: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/brand_haier.png', bigPic: '', brandStory: '真诚到永远', brandDesc: '海尔集团', createTime: '2024-01-01 10:00:00' },
  { id: 5, name: '美的', firstLetter: 'M', sort: 5, factoryStatus: 1, showStatus: 1, productCount: 180, productCommentCount: 7000, logo: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/brand_midea.png', bigPic: '', brandStory: '科技尽善 生活尽美', brandDesc: '美的集团', createTime: '2024-01-01 10:00:00' },
]

/** 广告轮播 */
export const advertiseList: SmsHomeAdvertise[] = [
  { id: 1, name: '新品首发', pic: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/banner1.png', startTime: '', endTime: '', status: 1, clickCount: 0, orderCount: 0, url: '', note: '', sort: 1, createTime: '' },
  { id: 2, name: '限时秒杀', pic: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/banner2.png', startTime: '', endTime: '', status: 1, clickCount: 0, orderCount: 0, url: '', note: '', sort: 2, createTime: '' },
  { id: 3, name: '品牌特卖', pic: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/banner3.png', startTime: '', endTime: '', status: 1, clickCount: 0, orderCount: 0, url: '', note: '', sort: 3, createTime: '' },
]

/** 秒杀场次 */
export const genFlashPromotion = (): HomeFlashPromotion => {
  const now = new Date()
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const nextStart = new Date(end.getTime() + 60 * 60 * 1000)
  const nextEnd = new Date(nextStart.getTime() + 2 * 60 * 60 * 1000)
  return {
    startTime: now.toISOString(),
    endTime: end.toISOString(),
    nextStartTime: nextStart.toISOString(),
    nextEndTime: nextEnd.toISOString(),
    productList: allProducts.slice(0, 4),
  }
}

/** 专题列表 */
export const subjectList: CmsSubject[] = [
  { id: 1, categoryId: 1, categoryName: '精选专题', pic: advertiseList[0].pic, albumPics: '', title: '年中大促', description: '好物精选 限时折扣', showStatus: 1, content: '', forwardCount: 0, collectCount: 0, readCount: 0, commentCount: 0, productCount: 10, recommendStatus: 1, createTime: '' },
  { id: 2, categoryId: 1, categoryName: '精选专题', pic: advertiseList[1].pic, albumPics: '', title: '品牌周', description: '大牌直降', showStatus: 1, content: '', forwardCount: 0, collectCount: 0, readCount: 0, commentCount: 0, productCount: 8, recommendStatus: 1, createTime: '' },
]

/** 商品分类 */
export const categoryList: PmsProductCategory[] = [
  { id: 1, parentId: 0, name: '手机数码', level: 0, sort: 1, icon: '📱', productCount: 50, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 2, parentId: 0, name: '家用电器', level: 0, sort: 2, icon: '🔌', productCount: 40, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 3, parentId: 0, name: '电脑办公', level: 0, sort: 3, icon: '💻', productCount: 30, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 4, parentId: 0, name: '服饰鞋包', level: 0, sort: 4, icon: '👜', productCount: 60, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 5, parentId: 0, name: '美妆个护', level: 0, sort: 5, icon: '💄', productCount: 35, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  // 二级分类
  { id: 11, parentId: 1, name: '智能手机', level: 1, sort: 1, icon: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png', productCount: 20, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 12, parentId: 1, name: '耳机音箱', level: 1, sort: 2, icon: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png', productCount: 15, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 21, parentId: 2, name: '大家电', level: 1, sort: 1, icon: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png', productCount: 25, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 22, parentId: 2, name: '厨电生活', level: 1, sort: 2, icon: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png', productCount: 18, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 31, parentId: 3, name: '笔记本', level: 1, sort: 1, icon: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png', productCount: 12, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
  { id: 32, parentId: 3, name: '平板电脑', level: 1, sort: 2, icon: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png', productCount: 10, productUnit: '件', navStatus: 1, showStatus: 1, description: '', keywords: '', createTime: '' },
]

/** 演示用户信息 */
export const memberInfo: MemberInfo = {
  id: 1,
  username: 'mall',
  nickname: '商城体验用户',
  icon: 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png',
  integration: 2000,
  growth: 800,
}

/** 默认收货地址列表 */
export const defaultAddressList: MemberReceiveAddress[] = [
  {
    id: 1,
    memberId: 1,
    name: '张三',
    phoneNumber: '13812345678',
    defaultStatus: 1,
    postCode: '518000',
    province: '广东省',
    city: '深圳市',
    region: '南山区',
    detailAddress: '科技园南区T3栋8楼',
  },
  {
    id: 2,
    memberId: 1,
    name: '李四',
    phoneNumber: '13987654321',
    defaultStatus: 0,
    postCode: '100000',
    province: '北京市',
    city: '北京市',
    region: '海淀区',
    detailAddress: '中关村大街1号院',
  },
]

/** 生成购物车项 */
export const genCartItems = (): CartItem[] => {
  const items = allProducts.slice(0, 3)
  return items.map((p, idx) => ({
    id: String(idx + 1),
    memberId: '1',
    memberNickname: memberInfo.nickname || '',
    productId: p.id,
    productSkuId: idx + 1,
    productSkuCode: `SKU${String(idx + 1).padStart(6, '0')}`,
    productCategoryId: p.productCategoryId,
    productName: p.name,
    productSubTitle: p.subTitle,
    productBrand: p.brandName,
    productPic: p.pic,
    price: p.price,
    quantity: idx + 1,
    productAttr: JSON.stringify([{ key: '规格', value: '默认' }]),
    productSn: p.productSn,
    createDate: '2024-01-01 10:00:00',
    modifyDate: '2024-01-01 10:00:00',
    deleteStatus: 0,
    checked: true,
    spDataStr: '默认',
  }))
}
