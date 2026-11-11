import {MEDIA_BASE_URL} from './api'

export function imageUri(value?: string): string {
  const uri = value?.trim() || ''
  if (!uri) return ''
  const minio = uri.match(/^https?:\/\/[^/?#]+:9000\/(mall\/.*)$/i)
  if (minio) return MEDIA_BASE_URL + minio[1]
  const proxied = uri.match(/^https?:\/\/(?:mall|m)\.starchase\.xyz\/mall-files\/(.+)$/i)
  if (proxied) return MEDIA_BASE_URL + proxied[1]
  if (uri.startsWith('/mall/')) return MEDIA_BASE_URL + uri.slice(1)
  if (uri.startsWith('/mall-files/')) return MEDIA_BASE_URL + uri.slice('/mall-files/'.length)
  if (/^(?:https?:)?\/\/(macro-oss\.oss-cn-shenzhen\.aliyuncs\.com|img10\.360buyimg\.com|img13\.360buyimg\.com)/i.test(uri))
    return uri.replace(/^(?:http:)?\/\//, 'https://')
  return uri
}
