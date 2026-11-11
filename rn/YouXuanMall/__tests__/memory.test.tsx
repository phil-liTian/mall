/** @format */

import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {createMemoryDeck, DEFAULT_PAIRS, MIN_PAIRS, PAIRS} from '../src/memory';

jest.mock('react-native-safe-area-context', () => {
  const {View: NativeView} = require('react-native');
  return {SafeAreaProvider: NativeView, SafeAreaView: NativeView};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('deck contains six distinct pairs and is shuffled without losing cards', () => {
  const ordered = createMemoryDeck(DEFAULT_PAIRS, () => 0.999999);
  const shuffled = createMemoryDeck(DEFAULT_PAIRS, () => 0);
  expect(ordered).toHaveLength(DEFAULT_PAIRS * 2);
  expect(shuffled.map(card => card.id).sort((a, b) => a - b)).toEqual(ordered.map(card => card.id).sort((a, b) => a - b));
  expect(shuffled.map(card => card.id)).not.toEqual(ordered.map(card => card.id));
  for (let pair = 0; pair < DEFAULT_PAIRS; pair++) {
    expect(shuffled.filter(card => card.pair === pair)).toHaveLength(2);
  }
  expect(createMemoryDeck(MIN_PAIRS)).toHaveLength(MIN_PAIRS * 2);
  expect(createMemoryDeck(PAIRS.length)).toHaveLength(PAIRS.length * 2);
  expect(() => createMemoryDeck(MIN_PAIRS - 1)).toThrow(RangeError);
  expect(() => createMemoryDeck(PAIRS.length + 1)).toThrow(RangeError);
});

test('game center opens matching cards, ignores extra taps, hides misses and supports replay', async () => {
  jest.useFakeTimers();
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => {renderer = ReactTestRenderer.create(<App />);});
    const text = () => renderer.root.findAllByType(Text).map(node => node.props.children);
    const press = async (label: string) => {
      const node = renderer.root.findAllByType(Text).find(item => item.props.children === label);
      expect(node).toBeTruthy();
      let button = node!.parent;
      while (button && typeof button.props.onPress !== 'function') button = button.parent;
      expect(button).toBeTruthy();
      await ReactTestRenderer.act(async () => {button!.props.onPress();});
    };
    const cards = () => renderer.root.findAll(node =>
      /^第\d+张卡片/.test(node.props.accessibilityLabel ?? '') && typeof node.props.onPress === 'function');
    const flip = async (index: number) => {
      await ReactTestRenderer.act(async () => {cards()[index].props.onPress();});
    };

    await press('我的');
    await press('游戏中心');
    await press('翻牌配对');
    expect(cards()).toHaveLength(12);
    expect(cards()[0].props.accessibilityLabel).toContain('未翻开');

    await flip(0);
    expect(cards()[0].props.accessibilityLabel).toContain('已翻开熊猫');
    await ReactTestRenderer.act(async () => {jest.advanceTimersByTime(2000);});
    expect(text()).toContain('00:02');
    await flip(2);
    await flip(3); // A third tap during the mismatch animation must be ignored.
    expect(cards()[3].props.accessibilityLabel).toContain('未翻开');
    expect(text()).toContain(1);
    await ReactTestRenderer.act(async () => {jest.advanceTimersByTime(900);});
    expect(cards()[0].props.accessibilityLabel).toContain('未翻开');
    expect(cards()[2].props.accessibilityLabel).toContain('未翻开');

    for (let index = 0; index < 12; index += 2) {
      await flip(index);
      await flip(index + 1);
      expect(cards()[index].props.accessibilityLabel).toContain('已配对');
    }
    expect(text()).toContain('🎉 全部配对成功！');
    expect(text()).toContain(7);
    const finishedTime = text().find(value => typeof value === 'string' && /^\d\d:\d\d$/.test(value));
    await ReactTestRenderer.act(async () => {jest.advanceTimersByTime(3000);});
    expect(text()).toContain(finishedTime);
    await press('再玩一次');
    expect(cards().every(card => card.props.accessibilityLabel.includes('未翻开'))).toBe(true);
    expect(text()).toContain(0);
    expect(text()).toContain('00:00');

    const increase = renderer.root.findAll(node => node.props.accessibilityLabel === '增加卡片' && typeof node.props.onPress === 'function')[0];
    expect(increase).toBeTruthy();
    await ReactTestRenderer.act(async () => {increase!.props.onPress();});
    expect(cards()).toHaveLength(14);
    expect(text()).toContainEqual([14, ' 张']);

    await flip(0);
    await flip(2);
    await press('重新开始'); // Pending mismatch must not close cards in a new round.
    await flip(0);
    await ReactTestRenderer.act(async () => {jest.advanceTimersByTime(900);});
    expect(cards()[0].props.accessibilityLabel).toContain('已翻开熊猫');
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => {renderer.unmount();});
    random.mockRestore();
    jest.useRealTimers();
  }
});
