/** @format */

import {API_BASE_URL, mallApi, onSessionExpired, setToken} from '../src/api';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();
  setToken('');
  onSessionExpired(() => {});
  mockFetch.mockResolvedValue({ok: true, json: async () => ({code: 200, data: {order: {id: 42}}})});
});

test('login sends form data and protected checkout uses the bearer token and cart IDs', async () => {
  await mallApi.login('a+b', 'p&ss');
  const [loginUrl, loginOptions] = mockFetch.mock.calls[0];
  expect(loginUrl).toBe(`${API_BASE_URL}/sso/login`);
  expect(loginOptions.body).toBe('username=a%2Bb&password=p%26ss');
  expect(loginOptions.headers['Content-Type']).toContain('application/x-www-form-urlencoded');

  setToken('Bearer test-token');
  await mallApi.confirmOrder([3, 8]);
  await mallApi.createOrder([3, 8], 12);
  expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe('Bearer test-token');
  expect(mockFetch.mock.calls[1][1].body).toBe('[3,8]');
  expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
    cartIds: [3, 8], memberReceiveAddressId: 12, useIntegration: 0, payType: 0,
  });
});

test('homepage loads from the public H5 API proxy', async () => {
  expect(API_BASE_URL).toBe('http://m.starchase.xyz/api');
  await mallApi.home();
  expect(mockFetch.mock.calls[0][0]).toBe('http://m.starchase.xyz/api/home/content');
});

test('API errors are surfaced instead of treating an unsuccessful order as complete', async () => {
  mockFetch.mockResolvedValueOnce({ok: true, json: async () => ({code: 500, message: '库存不足', data: null})});
  await expect(mallApi.createOrder([3], 12)).rejects.toThrow('库存不足');
});

test('a late 401 from an old token does not log out a new session', async () => {
  const expired = jest.fn();
  onSessionExpired(expired);
  setToken('Bearer old');
  let resolve!: (response: unknown) => void;
  mockFetch.mockReturnValueOnce(new Promise(done => {resolve = done;}));
  const pending = mallApi.member();
  expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer old');
  setToken('Bearer new');
  resolve({ok: true, json: async () => ({code: 401, message: '未登录'})});
  await expect(pending).rejects.toThrow('未登录');
  expect(expired).not.toHaveBeenCalled();

  mockFetch.mockResolvedValueOnce({ok: false, status: 401});
  await expect(mallApi.member()).rejects.toThrow('请求失败 (401)');
  expect(expired).toHaveBeenCalledTimes(1);
});
