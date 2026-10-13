import { request } from '@/api/request'

/** MinIO 上传返回 */
export type MinioUploadResult = {
  /** 对象名 */
  name: string
  /** 可直接访问的图片地址 */
  url: string
}

/**
 * 上传图片（评价晒图、售后凭证）
 * 不手动设置 Content-Type，交给 axios 自动带上 multipart 的 boundary
 */
export const uploadImageAPI = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request<MinioUploadResult>({ method: 'POST', url: '/upload/image', data: formData })
}
