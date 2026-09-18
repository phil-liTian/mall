import { request } from '@/utils/request'
import type { CommonPage } from '@/types/common'

export interface UmsRole {
  id: number
  name: string
  description?: string
  adminCount: number
  status: number
  sort: number
  createTime?: string
}

export function listRole(params: { keyword?: string; pageNum: number; pageSize: number }) {
  return request<CommonPage<UmsRole>>({ url: '/role/list', method: 'get', params })
}

export function listAllRole() {
  return request<UmsRole[]>({ url: '/role/listAll', method: 'get' })
}

export function createRole(data: Partial<UmsRole>) {
  return request({ url: '/role/create', method: 'post', data })
}

export function updateRole(id: number, data: Partial<UmsRole>) {
  return request({ url: `/role/update/${id}`, method: 'post', data })
}

export function deleteRole(ids: number[]) {
  return request({ url: '/role/delete', method: 'post', params: { ids: ids.join(',') } })
}

export function updateRoleStatus(id: number, status: number) {
  return request({ url: `/role/updateStatus/${id}`, method: 'post', params: { status } })
}

export function listMenuByRole(roleId: number) {
  return request<{ id: number; title: string }[]>({ url: `/role/listMenu/${roleId}`, method: 'get' })
}

export function listResourceByRole(roleId: number) {
  return request<{ id: number; name: string }[]>({
    url: `/role/listResource/${roleId}`,
    method: 'get',
  })
}

export function allocMenu(roleId: number, menuIds: number[]) {
  return request({
    url: '/role/allocMenu',
    method: 'post',
    params: { roleId, menuIds: menuIds.join(',') },
  })
}

export function allocResource(roleId: number, resourceIds: number[]) {
  return request({
    url: '/role/allocResource',
    method: 'post',
    params: { roleId, resourceIds: resourceIds.join(',') },
  })
}
