/** @format */

import React from 'react';
import {Text, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {rangeError, secretNumber} from '../src/guess-number';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('secret includes both bounds and requires a valid positive integer range', () => {
  expect(secretNumber(1, 100, () => 0)).toBe(1);
  expect(secretNumber(1, 100, () => 0.999999)).toBe(100);
  expect(secretNumber(10, 20, () => 0.5)).toBe(15);
  expect(rangeError('1', '9999')).toBeNull();
  expect(rangeError('01', '10')).toBeTruthy();
  expect(rangeError('100', '10')).toBeTruthy();
  expect(rangeError('1', '10000')).toBeTruthy();
  expect(() => secretNumber(20, 10)).toThrow(RangeError);
});

test('guessing game validates input, narrows bounds and supports replay and custom ranges', async () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.49);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(<App />);});
    const labels = () => renderer.root.findAllByType(Text).map(node =>
      Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children);
    const press = async (label: string) => {
      const text = renderer.root.findAllByType(Text).find(node => node.props.children === label);
      expect(text).toBeTruthy();
      let target = text!.parent;
      while (target && typeof target.props.onPress !== 'function') target = target.parent;
      expect(target).toBeTruthy();
      await ReactTestRenderer.act(async () => {target!.props.onPress();});
    };
    const type = async (field: string, value: string) => {
      const input = renderer.root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === field);
      expect(input).toBeTruthy();
      await ReactTestRenderer.act(async () => {input!.props.onChangeText(value);});
    };

    await press('我的');
    await press('游戏中心');
    await press('猜数字');
    await type('最大值', '1');
    await press('开始游戏');
    expect(labels()).toContain('请输入 1–9999 内的整数，且最小值小于最大值');
    await type('最大值', '100');
    await press('开始游戏'); // 1–100, secret = 50.
    expect(labels()).toContain('1 – 100');
    await press('猜一下');
    expect(labels()).toContain('请输入有效的正整数');
    await type('输入猜测数字', '25');
    await press('猜一下');
    expect(labels()).toContain('太小了，再猜大一点');
    expect(labels()).toContain('26 – 100');
    await type('输入猜测数字', '25');
    await press('猜一下');
    expect(labels()).toContain('这个数字已经猜过了');
    await type('输入猜测数字', '80');
    await press('猜一下');
    expect(labels()).toContain('太大了，再猜小一点');
    expect(labels()).toContain('26 – 79');
    await type('输入猜测数字', '100');
    await press('猜一下');
    expect(labels()).toContain('请在剩余范围 26–79 内猜测');
    expect(labels()).toContain('已经猜了 2 次');
    await type('输入猜测数字', '50');
    await press('猜一下');
    expect(labels()).toContain('恭喜猜中！答案就是 50');
    expect(labels()).toContain('已经猜了 3 次');

    random.mockReturnValue(0);
    await press('再玩一局');
    expect(labels()).toContain('已经猜了 0 次');
    await type('输入猜测数字', '1');
    await press('猜一下');
    expect(labels()).toContain('恭喜猜中！答案就是 1');
    await press('修改范围');
    await type('最小值', '10');
    await type('最大值', '20');
    random.mockReturnValue(0.5);
    await press('开始游戏');
    expect(labels()).toContain('10 – 20');
    await type('输入猜测数字', '15');
    await press('猜一下');
    expect(labels()).toContain('恭喜猜中！答案就是 15');
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => {renderer.unmount();});
    random.mockRestore();
  }
});
