/** @format */

import React from 'react';
import {Animated, Text, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {DEFAULT_OPTIONS, equalize, nextRotation, percentTenths, pickOption, slices, wheelError} from '../src/wheel';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('five household tasks start with equal 20% weights', () => {
  expect(DEFAULT_OPTIONS.map(option => option.label)).toEqual(['洗碗', '拖地', '倒垃圾', '擦桌子', '洗衣服']);
  expect(DEFAULT_OPTIONS.map(option => option.percent)).toEqual(Array(5).fill('20'));
  expect(wheelError(DEFAULT_OPTIONS)).toBeNull();
  expect(slices(DEFAULT_OPTIONS).map(slice => slice.center)).toEqual([36, 108, 180, 252, 324]);
});

test('weights use decimal tenths; sample selects the matching sector and rotation points to its center', () => {
  const options = [
    {...DEFAULT_OPTIONS[0], percent: '10.1'},
    {...DEFAULT_OPTIONS[1], percent: '0'},
    {...DEFAULT_OPTIONS[2], percent: '89.9'},
  ];
  expect(percentTenths('10.1')).toBe(101);
  expect(percentTenths('10.12')).toBeNull();
  expect(wheelError(options)).toBeNull();
  expect(pickOption(options, () => 0.1)).toBe(0);
  expect(pickOption(options, () => 0.101)).toBe(2);
  expect(pickOption(options, () => 0.9999)).toBe(2);
  expect(() => pickOption([{...options[0], percent: '90'}, ...options.slice(1)])).toThrow();
  const center = slices(options)[2].center;
  const angle = nextRotation(0, center);
  expect((angle + center) / 360).toBeCloseTo(Math.round((angle + center) / 360));
  const second = nextRotation(angle, slices(options)[0].center);
  expect(second).toBeGreaterThan(angle + 1440);
  const alignedTurns = (second + slices(options)[0].center) / 360;
  expect(alignedTurns).toBeCloseTo(Math.round(alignedTurns));
  expect(equalize(options).map(option => option.percent)).toEqual(['33.4', '33.3', '33.3']);
});

test('game list opens wheel; edited percentages control spins and reset equalizes', async () => {
  const animation = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
    start: callback => callback?.({finished: true}),
  } as ReturnType<typeof Animated.timing>));
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.25);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(<App />);});
    const press = async (label: string) => {
      const text = renderer.root.findAllByType(Text).find(node => node.props.children === label);
      expect(text).toBeTruthy();
      let target = text!.parent;
      while (target && typeof target.props.onPress !== 'function') target = target.parent;
      expect(target).toBeTruthy();
      await ReactTestRenderer.act(async () => {target!.props.onPress();});
    };
    await press('我的');
    await press('游戏中心');
    await press('幸运大转盘');
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '家务只是默认示例，选项和概率都可以修改')).toBe(true);
    const weights = () => renderer.root.findAllByType(TextInput).filter(input =>
      String(input.props.accessibilityLabel).endsWith('项概率'));
    expect(weights().map(input => input.props.value)).toEqual(Array(5).fill('20'));
    await ReactTestRenderer.act(async () => {weights()[0].props.onChangeText('30');});
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '概率总和需要等于 100%')).toBe(true);
    await ReactTestRenderer.act(async () => {weights()[1].props.onChangeText('10');});
    await press('开始转动');
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '抽中了：洗碗')).toBe(true);
    await press('平均分配');
    expect(weights().map(input => input.props.value)).toEqual(Array(5).fill('20'));
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '抽中了：洗碗')).toBe(false);
  } finally {
    animation.mockRestore();
    random.mockRestore();
  }
});
