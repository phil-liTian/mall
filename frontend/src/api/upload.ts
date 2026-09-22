import { request } from '@/utils/request'

export interface MinioUploadResult {
  url: string
  name: string
}

export function uploadFile(file: File): Promise<MinioUploadResult> {
  const form = new FormData()
  form.append('file', file)
  return request<MinioUploadResult>({
    url: '/minio/upload',
    method: 'post',
    data: form,
  })
}
