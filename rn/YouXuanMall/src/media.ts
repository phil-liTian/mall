import {MALL_ORIGIN, MEDIA_PROXY_URL} from './config';

// Product pictures are stored both in external image stores and in MinIO. The
// backend's MinIO publicUrl uses the admin site, while H5 exposes the same
// files through its own /mall-files/ proxy.
const secureImageHosts = /^(macro-oss\.oss-cn-shenzhen\.aliyuncs\.com|img10\.360buyimg\.com|img13\.360buyimg\.com)$/i;

export function imageUri(value?: string): string | undefined {
  const uri = value?.trim();
  if (!uri) return undefined;

  const proxied = uri.match(/^https?:\/\/(?:mall|m)\.starchase\.xyz\/mall-files\/(.+)$/i);
  if (proxied) return `${MEDIA_PROXY_URL}${proxied[1]}`;

  const minio = uri.match(/^https?:\/\/[^/?#]+:9000\/(mall\/.*)$/i);
  if (minio) return `${MEDIA_PROXY_URL}${minio[1]}`;

  if (uri.startsWith('/mall-files/')) return `${MALL_ORIGIN}${uri}`;
  if (uri.startsWith('/mall/')) return `${MEDIA_PROXY_URL}${uri.slice(1)}`;

  const external = uri.match(/^(?:https?:)?\/\/([^/]+)(\/.*)?$/i);
  if (external && secureImageHosts.test(external[1])) {
    return `https://${external[1]}${external[2] ?? ''}`;
  }
  return uri;
}
