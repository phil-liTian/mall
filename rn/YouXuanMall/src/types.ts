export type Product = {
  id: number;
  name: string;
  pic: string;
  albumPics?: string;
  price: number;
  originalPrice?: number;
  promotionPrice?: number;
  subTitle?: string;
  brandName?: string;
  productCategoryId: number;
  productSn?: string;
  sale?: number;
  stock?: number;
};

export type Category = {id: number; name: string; icon?: string; parentId?: number};
export type Page<T> = {list: T[]; pageNum: number; totalPage: number; total: number};
export type HomeContent = {
  advertiseList?: {id: number; pic: string; name: string; url?: string}[];
  hotProductList?: Product[];
  newProductList?: Product[];
  homeFlashPromotion?: {productList?: Product[]};
};

export type Sku = {
  id: number;
  skuCode: string;
  spData?: string;
  stock: number;
  lockStock?: number;
  price: number;
  pic?: string;
};
export type ProductDetail = {
  product: Product;
  skuStockList: Sku[];
  productAttributeList?: {id: number; name: string; type: number; handAddStatus: number; inputList?: string}[];
  productAttributeValueList?: {productAttributeId: number; value: string}[];
};
export type CartItem = {
  id: number;
  productId: number;
  productName: string;
  productPic: string;
  productAttr?: string;
  price: number;
  quantity: number;
};
export type Address = {
  id?: number;
  name: string;
  phoneNumber: string;
  province: string;
  city: string;
  region: string;
  detailAddress: string;
  defaultStatus?: number;
};
export type ConfirmOrder = {
  memberReceiveAddressList: Address[];
  cartPromotionItemList: (CartItem & {promotionMessage?: string})[];
  calcAmount: {
    totalAmount: number;
    freightAmount: number;
    promotionAmount: number;
    payAmount: number;
  };
};
export type Order = {
  id: number;
  orderSn: string;
  status: number;
  payAmount: number;
  createTime: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverProvince?: string;
  receiverCity?: string;
  receiverRegion?: string;
  receiverDetailAddress?: string;
  orderItemList?: {
    id: number;
    productId: number;
    productName: string;
    productPic: string;
    productQuantity: number;
    productPrice: number;
  }[];
};
export type Member = {id: number; username: string; nickname?: string; icon?: string; integration?: number};

export type Screen =
  | {name: 'home' | 'categories' | 'cart' | 'account' | 'login' | 'register' | 'addresses' | 'games' | 'dice' | 'roulette' | 'memory' | 'reaction' | 'truthDare' | 'rpsTournament' | 'guessNumber' | 'planner' | 'alarm'}
  | {name: 'search'; keyword?: string; categoryId?: number; title?: string; feed?: 'hot' | 'new'}
  | {name: 'product'; id: number}
  | {name: 'checkout'; cartIds: number[]}
  | {name: 'addressForm'; id?: number}
  | {name: 'orders'; status: number}
  | {name: 'order'; id: number};

export const money = (value?: number) => `¥${(Number(value) || 0).toFixed(2)}`;
export const orderStatus = (status: number) =>
  ({0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已关闭'}[status] ?? '处理中');
