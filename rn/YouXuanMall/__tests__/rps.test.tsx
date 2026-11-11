/** @format */

import React from 'react';
import {Text, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {shufflePlayers, winner} from '../src/rps';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('rock paper scissors rules and shuffled entrants are valid', () => {
  expect(winner('rock', 'rock')).toBeNull();
  expect(winner('rock', 'scissors')).toBe(0);
  expect(winner('scissors', 'paper')).toBe(0);
  expect(winner('paper', 'rock')).toBe(0);
  expect(winner('paper', 'scissors')).toBe(1);
  expect(winner('rock', 'paper')).toBe(1);
  const players = ['小王', '小张', '小李'];
  expect(shufflePlayers(players, () => 0.999999)).toEqual(players);
  expect(shufflePlayers(players, () => 0)).toEqual(['小张', '小李', '小王']);
  expect(players).toEqual(['小王', '小张', '小李']);
});

test('three players: name validation, hidden picks, draw rematch, bye and champion', async () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
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
    const pressAccessible = async (label: string) => {
      const target = renderer.root.findAll(node => node.props.accessibilityLabel === label
        && typeof node.props.onPress === 'function')[0];
      expect(target).toBeTruthy();
      await ReactTestRenderer.act(async () => {target.props.onPress();});
    };
    const input = () => renderer.root.findByType(TextInput);
    await press('我的');
    await press('游戏中心');
    await press('猜拳淘汰赛');
    await pressAccessible('移除选手 玩家4');
    await ReactTestRenderer.act(async () => {input().props.onChangeText('玩家1');});
    await press('添加');
    expect(labels()).toContain('参赛者名字不能重复');
    await ReactTestRenderer.act(async () => {input().props.onChangeText('小李');});
    await press('添加');
    expect(labels()).toContain('参赛者 · 4/16');
    await pressAccessible('移除选手 小李');

    await press('随机分组，开始比赛');
    expect(labels()).toContain('第 1 轮 · 第 1/1 场');
    expect(labels()).toContain('本轮轮空晋级');
    await pressAccessible('选择石头');
    expect(labels()).toContain('玩家1 已出拳，请 玩家2 出拳');
    await pressAccessible('选择石头');
    expect(labels()).toContain('平局！重新出拳');
    await press('平局，重赛');
    await pressAccessible('选择石头');
    await pressAccessible('选择剪刀');
    expect(labels()).toContain('玩家1 获胜！');
    await press('进入下一轮');
    expect(labels()).toContain('第 2 轮 · 第 1/1 场');
    await pressAccessible('选择剪刀');
    await pressAccessible('选择石头');
    expect(labels()).toContain('玩家3 获胜！');
    await press('查看冠军');
    expect(labels()).toContain('本届冠军');
    expect(labels()).toContain('玩家3');
    await press('重新开赛');
    expect(labels()).toContain('参赛者 · 3/16');

    // An even-sized round must finish both matches before advancing.
    await ReactTestRenderer.act(async () => {input().props.onChangeText('玩家4');});
    await press('添加');
    await press('随机分组，开始比赛');
    expect(labels()).toContain('第 1 轮 · 第 1/2 场');
    await pressAccessible('选择石头');
    await pressAccessible('选择剪刀');
    await press('下一场');
    expect(labels()).toContain('第 1 轮 · 第 2/2 场');
    expect(labels()).toContain('玩家1 晋级');
    await pressAccessible('选择布');
    await pressAccessible('选择石头');
    await press('进入下一轮');
    expect(labels()).toContain('第 2 轮 · 第 1/1 场');
    await pressAccessible('选择石头');
    await pressAccessible('选择剪刀');
    await press('查看冠军');
    expect(labels()).toContain('玩家1');
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => {renderer.unmount();});
    random.mockRestore();
  }
});
