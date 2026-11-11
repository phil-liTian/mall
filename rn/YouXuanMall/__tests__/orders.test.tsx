/** @format */

import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {Account} from '../src/account';
import {Cart, Orders} from '../src/commerce';
import {mallApi} from '../src/api';
import {SessionContext} from '../src/session';
import type {Session} from '../src/session';

jest.mock('../src/api', () => ({mallApi: {orders: jest.fn(), cart: jest.fn()}}));

const session = {
  member: {id: 1, username: 'test'}, guard: () => true,
  navigate: jest.fn(), back: jest.fn(), tab: jest.fn(), replace: jest.fn(),
  login: jest.fn(), logout: jest.fn(), selectAddress: jest.fn(),
} as Session;

test('completed order shortcut has the same cell width as other shortcuts and selects status 3', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<SessionContext.Provider value={session}><Account /></SessionContext.Provider>);
  });
  const links = renderer.root.findAllByType(View).filter(node =>
    ['待付款订单', '待收货订单', '已完成订单'].includes(node.props.accessibilityLabel));
  expect(links).toHaveLength(3);
  expect(links.map(node => StyleSheet.flatten(node.props.style).flex)).toEqual([1, 1, 1]);
  const completed = links[2].findAllByType(Image);
  expect(completed).toHaveLength(1);
  expect(StyleSheet.flatten(completed[0].props.style)).toMatchObject({width: 30, height: 30});
  let shortcut = links[2].parent;
  while (shortcut && typeof shortcut.props.onPress !== 'function') shortcut = shortcut.parent;
  expect(shortcut).toBeTruthy();
  await ReactTestRenderer.act(async () => {shortcut!.props.onPress();});
  expect(session.navigate).toHaveBeenCalledWith({name: 'orders', status: 3});
});

test('order tabs stay directly below the header and changing filters loads the selected status', async () => {
  (mallApi.orders as jest.Mock).mockResolvedValue({list: [], totalPage: 0});
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<SessionContext.Provider value={session}>
      <Orders initialStatus={3} />
    </SessionContext.Provider>);
  });
  const tabs = renderer.root.findAllByType(View).filter(node => node.props.accessibilityRole === 'tab');
  expect(tabs).toHaveLength(5);
  expect(tabs[3].props.accessibilityState).toEqual({selected: true});
  let tabBar = tabs[0].parent;
  while (tabBar && StyleSheet.flatten(tabBar.props.style)?.height !== 48) tabBar = tabBar.parent;
  expect(tabBar).toBeTruthy();
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === '还没有这个状态的订单')).toBe(true);
  let allTab = tabs[0].parent;
  while (allTab && typeof allTab.props.onPress !== 'function') allTab = allTab.parent;
  expect(allTab).toBeTruthy();
  await ReactTestRenderer.act(async () => {allTab!.props.onPress();});
  expect(mallApi.orders).toHaveBeenLastCalledWith(-1, 1);
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === '暂无订单')).toBe(true);
});

test('cart selection uses the same graphic for items and select all, and updates totals', async () => {
  (mallApi.cart as jest.Mock).mockResolvedValue([
    {id: 1, productId: 11, productName: '衬衫', productPic: '', price: 20, quantity: 2},
    {id: 2, productId: 12, productName: '裤子', productPic: '', price: 30, quantity: 1},
  ]);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<SessionContext.Provider value={session}><Cart /></SessionContext.Provider>);
  });
  const checkboxes = () => renderer.root.findAllByType(View).filter(node => node.props.accessibilityRole === 'checkbox');
  const press = async (node: ReactTestRenderer.ReactTestInstance) => {
    let target: ReactTestRenderer.ReactTestInstance | null = node;
    while (target && typeof target.props.onPress !== 'function') target = target.parent;
    expect(target).toBeTruthy();
    await ReactTestRenderer.act(async () => {target!.props.onPress();});
  };
  expect(checkboxes().map(node => node.props.accessibilityState.checked)).toEqual([true, true, true]);
  expect(renderer.root.findAllByType(Image)).toHaveLength(3);
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === '¥70.00')).toBe(true);
  await press(checkboxes()[2]);
  expect(checkboxes().map(node => node.props.accessibilityState.checked)).toEqual([false, false, false]);
  expect(renderer.root.findAllByType(Image)).toHaveLength(0);
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === '¥0.00')).toBe(true);
  await press(checkboxes()[0]);
  expect(checkboxes().map(node => node.props.accessibilityState.checked)).toEqual([true, false, false]);
  await press(checkboxes()[2]);
  expect(checkboxes().map(node => node.props.accessibilityState.checked)).toEqual([true, true, true]);
  await ReactTestRenderer.act(async () => {renderer.unmount();});
});
