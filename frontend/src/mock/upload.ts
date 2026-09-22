import type { MockMethod } from 'vite-plugin-mock'
import { ok } from './_util'

export default [
  {
    url: '/api/minio/upload',
    method: 'post',
    response: () =>
      ok({
        name: 'mock.png',
        url: 'https://via.placeholder.com/300x300.png?text=mock',
      }),
  },
] as MockMethod[]
