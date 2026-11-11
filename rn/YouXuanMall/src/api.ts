import type {Address, CartItem, ConfirmOrder, HomeContent, Member, Order, Page, Product, ProductDetail, Category} from './types';
import {API_BASE_URL} from './config';

// The production H5 site proxies /api/ to mall-portal. This works on emulators and physical devices.
export {API_BASE_URL} from './config';

let token = '';
let onUnauthorized: (() => void) | undefined;
export const setToken = (value: string) => {token = value;};
export const getToken = () => token;
export const onSessionExpired = (callback: () => void) => {onUnauthorized = callback;};

type Params = Record<string, string | number | undefined>;
function query(params: Params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export async function request<T>(path: string, options: {method?: 'GET' | 'POST'; params?: Params; body?: unknown; form?: Params} = {}): Promise<T> {
  const {method = 'GET', params, body, form} = options;
  const requestToken = token;
  const search = query(params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}${search ? `?${search}` : ''}`, {
      method,
      signal: controller.signal,
      headers: {
        'source-client': 'miniapp',
        ...(requestToken ? {Authorization: requestToken} : {}),
        ...(body !== undefined ? {'Content-Type': 'application/json'} : {}),
        ...(form ? {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'} : {}),
      },
      body: form ? query(form) : body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401 && requestToken && requestToken === token) onUnauthorized?.();
      throw new Error(`请求失败 (${response.status})`);
    }
    const result = await response.json() as {code: number; message: string; data: T};
    if (result.code !== 200) {
      if (result.code === 401 && requestToken && requestToken === token) onUnauthorized?.();
      throw new Error(result.message || '请求失败');
    }
    return result.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('请求超时，请检查网络或线上商城服务');
    if (error instanceof TypeError) throw new Error('无法连接线上商城，请检查网络后重试');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const mallApi = {
  home: () => request<HomeContent>('/home/content'),
  recommend: (pageNum: number) => request<Product[]>('/home/recommendProductList', {params: {pageNum, pageSize: 8}}),
  hot: (pageNum: number) => request<Product[]>('/home/hotProductList', {params: {pageNum, pageSize: 10}}),
  new: (pageNum: number) => request<Product[]>('/home/newProductList', {params: {pageNum, pageSize: 10}}),
  categories: (parentId: number) => request<Category[]>(`/home/productCateList/${parentId}`),
  search: (params: {keyword?: string; productCategoryId?: number; pageNum: number; sort: number}) =>
    request<Page<Product>>('/product/search', {params: {...params, pageSize: 10}}),
  product: (id: number) => request<ProductDetail>(`/product/detail/${id}`),
  login: (username: string, password: string) =>
    request<{token: string; tokenHead: string}>('/sso/login', {method: 'POST', form: {username, password}}),
  member: () => request<Member>('/sso/info'),
  authCode: (telephone: string) => request<unknown>('/sso/getAuthCode', {params: {telephone}}),
  register: (data: {username: string; password: string; telephone: string; authCode: string}) =>
    request<unknown>('/sso/register', {method: 'POST', form: data}),
  cart: () => request<CartItem[]>('/cart/list'),
  addCart: (item: Record<string, unknown>) => request<unknown>('/cart/add', {method: 'POST', body: item}),
  quantity: (id: number, quantity: number) => request<unknown>('/cart/update/quantity', {params: {id, quantity}}),
  deleteCart: (ids: number[]) => request<unknown>('/cart/delete', {method: 'POST', params: {ids: ids.join(',')}}),
  confirmOrder: (cartIds: number[]) => request<ConfirmOrder>('/order/generateConfirmOrder', {method: 'POST', body: cartIds}),
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
};
