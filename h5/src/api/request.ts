import axios, { type AxiosRequestConfig } from 'axios'
import { Toast } from 'antd-mobile'
import type { CommonResult } from '@/types/common'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  paramsSerializer: {
    indexes: null,
  },
})

http.interceptors.request.use((config) => {
  config.headers = {
    'source-client': 'miniapp',
    ...config.headers,
  }
  const token = localStorage.getItem('mall_h5_token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const res = response.data as CommonResult<unknown>
    if (res.code !== 200) {
      Toast.show({ content: res.message || '请求失败' })
      if (res.code === 401) {
        localStorage.removeItem('mall_h5_token')
        localStorage.removeItem('mall_h5_member')
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?redirect=${redirect}`
        }
      }
      return Promise.reject(new Error(res.message || 'error'))
    }
    return response
  },
  (error) => {
    Toast.show({ content: error.message || '网络异常' })
    return Promise.reject(error)
  },
)

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<CommonResult<T>>(config)
  return response.data.data
}

export default http
