import axios, { type AxiosRequestConfig } from 'axios'
import { message } from 'antd'
import type { CommonResult } from '@/types/common'
import { getToken, clearToken } from '@/store/auth'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const res = response.data as CommonResult
    if (res.code !== 200) {
      message.error(res.message || '请求失败')
      if (res.code === 401) {
        clearToken()
        location.href = '/#/login'
      }
      return Promise.reject(new Error(res.message || 'error'))
    }
    return response
  },
  (error) => {
    message.error(error.message || '网络异常')
    return Promise.reject(error)
  },
)

// 统一返回 data，业务层直接拿到 CommonResult.data
export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<CommonResult<T>>(config)
  return response.data.data
}

export default http
