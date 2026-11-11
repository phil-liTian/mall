/** @format */

import React from 'react';
import {Animated, Text, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {MAX_DICE, rollDice} from '../src/dice';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('dice rolls within six faces and rejects invalid counts', () => {
  const samples = [0, 0.499, 0.999];
  let index = 0;
  expect(rollDice(3, () => samples[index++])).toEqual([1, 3, 6]);
  expect(rollDice(MAX_DICE, () => 0.5)).toHaveLength(MAX_DICE);
  expect(() => rollDice(0)).toThrow(RangeError);
  expect(() => rollDice(MAX_DICE + 1)).toThrow(RangeError);
});

test('personal center opens the game list and rolls the selected number of dice', async () => {
  const animation = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
    start: callback => callback?.({finished: true}),
  } as ReturnType<typeof Animated.timing>));
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
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
    expect(renderer.root.findAllByType(Text).some(node => node.props.children === '投骰子')).toBe(true);
    await press('投骰子');

    const count = renderer.root.findByType(TextInput);
    await ReactTestRenderer.act(async () => {count.props.onChangeText('3');});
    expect(renderer.root.findByType(TextInput).props.value).toBe('3');
    await press('开始投掷');
    expect(renderer.root.findAllByType(Text).filter(node =>
      typeof node.props.children?.[0] === 'string' && node.props.children[0] === '第 ',
    )).toHaveLength(3);
    expect(renderer.root.findAllByType(Text).some(node => node.props.accessibilityLabel === '总点数 12')).toBe(true);

    await ReactTestRenderer.act(async () => {renderer.root.findByType(TextInput).props.onChangeText('0');});
    expect(renderer.root.findAllByType(Text).some(node =>
      Array.isArray(node.props.children) && node.props.children.join('') === '请输入 1–20 之间的整数',
    )).toBe(true);
    const previousRollCalls = random.mock.calls.length;
    await press('开始投掷');
    expect(random).toHaveBeenCalledTimes(previousRollCalls);
  } finally {
    animation.mockRestore();
    random.mockRestore();
  }
});
