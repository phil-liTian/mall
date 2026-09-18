import type { MockMethod } from 'vite-plugin-mock'
import { ok } from './_util'

const setting = {
  id: 1,
  flashOrderOvertime: 60,
  normalOrderOvertime: 120,
  confirmOvertime: 15,
  finishOvertime: 7,
  commentOvertime: 7,
}

export default [
  {
    url: '/api/orderSetting/:id',
    method: 'get',
    response: () => ok(setting),
  },
  {
    url: '/api/orderSetting/update/:id',
    method: 'post',
    response: () => ok(1),
  },
] as MockMethod[]
