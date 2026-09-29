import { request } from '@/api/request'
import type { LoginResult, MemberInfo, LoginParam, RegisterParam } from '@/types/member'

/** 登录 */
export const loginAPI = (data: LoginParam) => {
  return request<LoginResult>({
    method: 'POST',
    url: '/sso/login',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    data,
  })
}

/** 获取用户信息 */
export const getMemberInfoAPI = () => {
  return request<MemberInfo>({ method: 'GET', url: '/sso/info' })
}

/** 注册 */
export const registerAPI = (data: RegisterParam) => {
  return request({
    method: 'POST',
    url: '/sso/register',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    data,
  })
}

/** 获取验证码 */
export const getAuthCodeAPI = (telephone: string) => {
  return request({ method: 'GET', url: '/sso/getAuthCode', params: { telephone } })
}
