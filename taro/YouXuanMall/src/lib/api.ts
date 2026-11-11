import Taro from '@tarojs/taro'
import type {Address, CartItem, Category, ConfirmOrder, HomeContent, Member, Order, Page, Product, ProductDetail} from './types'

const origin = process.env.TARO_APP_API_ORIGIN || (process.env.TARO_ENV === 'h5'
  ? 'http://m.starchase.xyz' : 'https://m.starchase.xyz')
export const API_BASE_URL = `${origin.replace(/\/$/, '')}/api`
export const MEDIA_BASE_URL = `${origin.replace(/\/$/, '')}/mall-files/`
const SESSION_KEY = 'youxuan_taro_session'
type Saved = {token: string; member: Member}

function readSaved(): Saved | null {
  try {
    const stored = Taro.getStorageSync(SESSION_KEY) as Saved | undefined
    return stored?.token && stored.member?.username ? stored : null
  } catch {return null}
}
let saved = readSaved()
let token = saved?.token || ''
let onUnauthorized: (() => void) | undefined
export const getSavedSession = () => saved
export const getToken = () => token
export const onSessionExpired = (callback: (() => void) | undefined) => {onUnauthorized = callback}
export function saveSession(next: Saved | null) {
  if (next) Taro.setStorageSync(SESSION_KEY, next)
  else Taro.removeStorageSync(SESSION_KEY)
  saved = next
  token = next?.token || ''
}
export function useToken(next: string) {token = next}

type Params = Record<string, string | number | undefined>
function query(params: Params = {}) {
  return Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')
}
export async function request<T>(path: string, options: {method?: 'GET' | 'POST'; params?: Params; body?: unknown; form?: Params} = {}): Promise<T> {
  const {method = 'GET', params, body, form} = options
  const activeToken = token
  try {
    const response = await Taro.request<{code: number; data: T; message: string}>({
      url: `${API_BASE_URL}${path}${query(params) ? `?${query(params)}` : ''}`,
      method, timeout: 10000,
      header: {'source-client': 'miniapp',
        ...(activeToken ? {Authorization: activeToken} : {}),
        ...(body !== undefined ? {'Content-Type': 'application/json'} : {}),
        ...(form ? {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'} : {})},
      data: form ? query(form) : body,
    })
    if (response.statusCode === 401 || response.data?.code === 401) {
      if (activeToken && activeToken === token) onUnauthorized?.()
      throw new Error(response.data?.message || '登录已失效，请重新登录')
    }
    if (response.statusCode < 200 || response.statusCode >= 300) throw new Error(`请求失败 (${response.statusCode})`)
    if (response.data?.code !== 200) throw new Error(response.data?.message || '请求失败')
    return response.data.data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('无法连接线上商城，请检查网络与请求域名')
  }
}

export const mallApi = {
  home: () => request<HomeContent>('/home/content'),
  recommend: (pageNum: number) => request<Product[]>('/home/recommendProductList', {params: {pageNum, pageSize: 8}}),
  hot: (pageNum: number) => request<Product[]>('/home/hotProductList', {params: {pageNum, pageSize: 10}}),
  new: (pageNum: number) => request<Product[]>('/home/newProductList', {params: {pageNum, pageSize: 10}}),
  categories: (id: number) => request<Category[]>(`/home/productCateList/${id}`),
  search: (params: {keyword?: string; productCategoryId?: number; sort: number; pageNum: number}) =>
    request<Page<Product>>('/product/search', {params: {...params, pageSize: 10}}),
  product: (id: number) => request<ProductDetail>(`/product/detail/${id}`),
  login: (username: string, password: string) => request<{token: string; tokenHead: string}>('/sso/login', {method: 'POST', form: {username, password}}),
  member: () => request<Member>('/sso/info'),
  authCode: (telephone: string) => request<unknown>('/sso/getAuthCode', {params: {telephone}}),
  register: (data: {username: string; password: string; telephone: string; authCode: string}) =>
    request<unknown>('/sso/register', {method: 'POST', form: data}),
  cart: () => request<CartItem[]>('/cart/list'),
  addCart: (item: Record<string, unknown>) => request<unknown>('/cart/add', {method: 'POST', body: item}),
  quantity: (id: number, quantity: number) => request<unknown>('/cart/update/quantity', {params: {id, quantity}}),
  deleteCart: (ids: number[]) => request<unknown>('/cart/delete', {method: 'POST', params: {ids: ids.join(',')}}),
  confirmOrder: (ids: number[]) => request<ConfirmOrder>('/order/generateConfirmOrder', {method: 'POST', body: ids}),
  createOrder: (cartIds: number[], memberReceiveAddressId: number) =>
    request<{order: Order}>('/order/generateOrder', {method: 'POST', body: {cartIds, memberReceiveAddressId, useIntegration: 0, payType: 0}}),
  orders: (status: number, pageNum: number) => request<Page<Order>>('/order/list', {params: {status, pageNum, pageSize: 5}}),
  order: (id: number) => request<Order>(`/order/detail/${id}`),
  cancelOrder: (orderId: number) => request<unknown>('/order/cancelUserOrder', {method: 'POST', params: {orderId}}),
  receiveOrder: (orderId: number) => request<unknown>('/order/confirmReceiveOrder', {method: 'POST', params: {orderId}}),
  addresses: () => request<Address[]>('/member/address/list'),
  address: (id: number) => request<Address>(`/member/address/${id}`),
  saveAddress: (data: Address) => request<unknown>(data.id ? `/member/address/update/${data.id}` : '/member/address/add', {method: 'POST', body: data}),
  deleteAddress: (id: number) => request<unknown>(`/member/address/delete/${id}`, {method: 'POST'}),
}
