import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface UmsAdmin {
  id: number
  username: string
  nickName?: string
  note?: string
  icon?: string
  email?: string
  status: number
  createTime?: string
  loginTime?: string
}

export function login(data: { username: string; password: string }) {
  return request<{ token: string; tokenHead: string }>({
    url: '/admin/login',
    method: 'post',
    data,
  })
}

export function getAdminInfo() {
  return request<{ username: string; menus: unknown[]; icon: string; roles: string[] }>({
    url: '/admin/info',
    method: 'get',
  })
}

export function logout() {
  return request({ url: '/admin/logout', method: 'post' })
}

export function listAdmin(params: { keyword?: string; pageNum: number; pageSize: number }) {
  return request<CommonPage<UmsAdmin>>({ url: '/admin/list', method: 'get', params })
}

export function updateAdminStatus(id: number, status: number) {
  return request({ url: `/admin/updateStatus/${id}`, method: 'post', params: { status } })
}

export function deleteAdmin(id: number) {
  return request({ url: `/admin/delete/${id}`, method: 'post' })
}
