/** @format */

import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {reactionDelay} from '../src/reaction-game';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('signal appears after a variable wait between 1.5 and 4 seconds', () => {
  expect(reactionDelay(() => 0)).toBe(1500);
  expect(reactionDelay(() => 0.5)).toBe(2750);
  expect(reactionDelay(() => 0.999999)).toBe(4000);
});

test('reaction challenge handles false starts, scores and best time across attempts', async () => {
  jest.useFakeTimers();
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(<App />);});
    const labels = () => renderer.root.findAllByType(Text).map(node => node.props.children);
    const press = async (label: string) => {
      const text = renderer.root.findAllByType(Text).find(node => node.props.children === label);
      expect(text).toBeTruthy();
      let target = text!.parent;
      while (target && typeof target.props.onPress !== 'function') target = target.parent;
      expect(target).toBeTruthy();
      await ReactTestRenderer.act(async () => {target!.props.onPress();});
    };
    const touchArea = async () => {
      const target = renderer.root.findAll(node => node.props.accessibilityLabel === '反应区域'
        && typeof node.props.onPress === 'function')[0];
      expect(target).toBeTruthy();
      await ReactTestRenderer.act(async () => {target.props.onPress();});
    };
    const wait = async (ms: number) => {
      await ReactTestRenderer.act(async () => {jest.advanceTimersByTime(ms);});
    };

    await press('我的');
    await press('游戏中心');
    await press('反应力挑战');
    expect(labels()).toContain('准备好了吗？');
    await press('开始挑战');
    expect(labels()).toContain('等待变绿…');
    await wait(1499);
    expect(labels()).toContain('等待变绿…');
    await touchArea();
    expect(labels()).toContain('抢跑了！');
    await wait(5000);
    expect(labels()).not.toContain('现在点击！');
    expect(labels()).toContain(0);

    await press('再来一次');
    await wait(1500);
    expect(labels()).toContain('现在点击！');
    await wait(234);
    await touchArea();
    expect(labels()).toContain('234 ms');
    expect(labels()).toContain(1);

    await press('再来一次');
    await wait(1500);
    await wait(420);
    await touchArea();
    expect(labels()).toContain('420 ms');
    expect(labels()).toContain('234 ms');
    expect(labels()).toContain(2);

    await press('再来一次');
    await press('‹');
    await wait(5000);
    expect(labels()).toContain('游戏中心');
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => {renderer.unmount();});
    random.mockRestore();
    jest.useRealTimers();
  }
});
