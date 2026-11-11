/** @format */

import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {mallApi} from '../src/api';
import {ProductScreen, Search} from '../src/catalog';
import {SessionContext} from '../src/session';
import type {Session} from '../src/session';
import {Photo} from '../src/ui';

jest.mock('react-native-safe-area-context', () => {
  const {View: RNView} = require('react-native');
  return {SafeAreaProvider: RNView, SafeAreaView: RNView};
});

jest.mock('../src/api', () => ({
  mallApi: {
    home: jest.fn(), recommend: jest.fn(), product: jest.fn(),
    search: jest.fn(), cart: jest.fn(), addCart: jest.fn(),
  },
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

const item = {id: 7, name: '测试商品', pic: '', price: 29.9, productCategoryId: 1};
const home = mallApi.home as jest.Mock;
const recommend = mallApi.recommend as jest.Mock;
const detail = mallApi.product as jest.Mock;

beforeEach(() => {
  home.mockResolvedValue({hotProductList: [item], advertiseList: []});
  recommend.mockResolvedValue([]);
  detail.mockResolvedValue({product: item, skuStockList: [{id: 9, skuCode: 'SKU-9', price: 29.9, stock: 3, spData: '[]'}]});
});

test('a recommended item opens its details with the available stock', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(<App />);});
  expect(home).toHaveBeenCalledTimes(1);
  const textNodes = () => renderer.root.findAllByType(Text).map(node => node.props.children);
  expect(textNodes()).toContain('优选商城');
  expect(textNodes()).toContain('测试商品');

  const productLabel = renderer.root.findAllByType(Text).find(node => node.props.children === '测试商品')!;
  let target = productLabel.parent;
  while (target && typeof target.props.onPress !== 'function') target = target.parent;
  expect(target).toBeTruthy();
  await ReactTestRenderer.act(async () => {target!.props.onPress();});
  expect(detail).toHaveBeenCalledWith(7);
  expect(textNodes().map(value => Array.isArray(value) ? value.join('') : value)).toContain('可用库存 3');
});

test('switching search sort discards an older response', async () => {
  let finishOld!: (page: unknown) => void;
  const oldRequest = new Promise(resolve => {finishOld = resolve;});
  const search = mallApi.search as jest.Mock;
  search.mockReset().mockReturnValueOnce(oldRequest).mockResolvedValueOnce({
    list: [{...item, id: 8, name: '低价商品'}], pageNum: 1, totalPage: 1, total: 1,
  });
  const noop = jest.fn();
  const session = {
    member: null, navigate: noop, replace: noop, back: noop, tab: noop,
    guard: () => false, login: jest.fn(), logout: noop, selectAddress: noop,
  } as Session;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<SessionContext.Provider value={session}><Search /></SessionContext.Provider>);
  });
  const tabs = renderer.root.findAllByType(View).filter(node => node.props.accessibilityRole === 'tab');
  expect(tabs).toHaveLength(4);
  expect(tabs.map(node => StyleSheet.flatten(node.props.style).flex)).toEqual([1, 1, 1, 1]);
  expect(tabs[0].props.accessibilityState).toEqual({selected: true});
  expect(renderer.root.findAllByType(View).some(node => StyleSheet.flatten(node.props.style)?.height === 50)).toBe(true);
  expect(renderer.root.findAllByType(Text).filter(node => ['综合', '销量', '价格↑', '价格↓'].includes(node.props.children)).map(node => node.props.children))
    .toEqual(['综合', '销量', '价格↑', '价格↓']);
  const price = renderer.root.findAllByType(Text).find(node => node.props.children === '价格↑')!;
  let sortButton = price.parent;
  while (sortButton && typeof sortButton.props.onPress !== 'function') sortButton = sortButton.parent;
  expect(sortButton).toBeTruthy();
  await ReactTestRenderer.act(async () => {sortButton!.props.onPress();});
  expect(search).toHaveBeenCalledTimes(2);
  expect(search.mock.calls[1][0].sort).toBe(3);
  expect(tabs[0].props.accessibilityState).toEqual({selected: false});
  expect(tabs[2].props.accessibilityState).toEqual({selected: true});

  await ReactTestRenderer.act(async () => {
    finishOld({list: [{...item, name: '过期商品'}], pageNum: 1, totalPage: 1, total: 1});
  });
  const labels = renderer.root.findAllByType(Text).map(node => node.props.children);
  expect(labels).toContain('低价商品');
  expect(labels).not.toContain('过期商品');
});

test('product image retries its original HTTP URL if HTTPS fails', async () => {
  const uri = 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/item.jpg';
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(<Photo uri={uri} />);});
  expect(renderer.root.findByType(Image).props.source.uri).toBe(uri.replace('http:', 'https:'));
  await ReactTestRenderer.act(async () => {renderer.root.findByType(Image).props.onError();});
  expect(renderer.root.findByType(Image).props.source.uri).toBe(uri);
  await ReactTestRenderer.act(async () => {renderer.root.findByType(Image).props.onError();});
  expect(renderer.root.findByType(Text).props.children).toBe('图片加载失败');
});

test('product footer opens cart and only shows a brief success toast after add request resolves', async () => {
  jest.useFakeTimers();
  let resolveAdd!: () => void;
  (mallApi.addCart as jest.Mock).mockReturnValueOnce(new Promise<void>(resolve => {resolveAdd = resolve;}));
  const tab = jest.fn();
  const session = {member: {id: 1, username: 'tester'}, navigate: jest.fn(), replace: jest.fn(),
    back: jest.fn(), tab, guard: () => true, login: jest.fn(), logout: jest.fn(), selectAddress: jest.fn()} as Session;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(
      <SessionContext.Provider value={session}><ProductScreen id={7} /></SessionContext.Provider>,
    );});
    const press = async (label: string) => {
      const node = renderer.root.findAllByType(Text).find(text => text.props.children === label)!;
      expect(node).toBeTruthy();
      let target = node.parent;
      while (target && typeof target.props.onPress !== 'function') target = target.parent;
      expect(target).toBeTruthy();
      await ReactTestRenderer.act(async () => {target!.props.onPress();});
    };
    expect(renderer.root.findAllByType(View).some(view => view.props.accessibilityLabel === '查看购物车')).toBe(true);
    await press('加入购物车');
    expect(mallApi.addCart).toHaveBeenCalledTimes(1);
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '已成功加入购物车')).toBe(false);
    await ReactTestRenderer.act(async () => {resolveAdd();});
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '已成功加入购物车')).toBe(true);
    await ReactTestRenderer.act(async () => {jest.advanceTimersByTime(2200);});
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '已成功加入购物车')).toBe(false);
    await press('购物车');
    expect(tab).toHaveBeenCalledWith('cart');
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => {renderer.unmount();});
    jest.useRealTimers();
  }
});

test('failed add to cart shows the server error without claiming success', async () => {
  (mallApi.addCart as jest.Mock).mockRejectedValueOnce(new Error('库存不足'));
  const session = {member: {id: 1, username: 'tester'}, navigate: jest.fn(), replace: jest.fn(),
    back: jest.fn(), tab: jest.fn(), guard: () => true, login: jest.fn(), logout: jest.fn(), selectAddress: jest.fn()} as Session;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(
    <SessionContext.Provider value={session}><ProductScreen id={7} /></SessionContext.Provider>,
  );});
  const add = renderer.root.findAllByType(Text).find(node => node.props.children === '加入购物车')!;
  let target = add.parent;
  while (target && typeof target.props.onPress !== 'function') target = target.parent;
  await ReactTestRenderer.act(async () => {target!.props.onPress();});
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === '库存不足')).toBe(true);
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === '已成功加入购物车')).toBe(false);
  await ReactTestRenderer.act(async () => {renderer.unmount();});
});
