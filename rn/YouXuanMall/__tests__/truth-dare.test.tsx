/** @format */

import React from 'react';
import {Text, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {DEFAULT_CHALLENGES, pickChallenge} from '../src/truth-dare';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('draws only unplayed questions in the selected mode', () => {
  const truths = DEFAULT_CHALLENGES.filter(item => item.kind === 'truth');
  const dares = DEFAULT_CHALLENGES.filter(item => item.kind === 'dare');
  expect(pickChallenge(DEFAULT_CHALLENGES, 'truth', [], () => 0)).toEqual(truths[0]);
  expect(pickChallenge(DEFAULT_CHALLENGES, 'truth', [truths[0].id], () => 0)).toEqual(truths[1]);
  expect(pickChallenge(DEFAULT_CHALLENGES, 'truth', truths.map(item => item.id))).toBeNull();
  expect(pickChallenge(DEFAULT_CHALLENGES, 'dare', truths.map(item => item.id), () => 0)).toEqual(dares[0]);
});

test('game list opens truth or dare; custom prompts, separate rounds and reset work', async () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
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
    const input = () => renderer.root.findByType(TextInput);
    const change = async (value: string) => {
      await ReactTestRenderer.act(async () => {input().props.onChangeText(value);});
    };

    await press('我的');
    await press('游戏中心');
    await press('真心话大冒险');
    expect(labels()).toContain('真心话 · 已抽 0/8');
    await press('添加');
    expect(labels()).toContain('请输入题目内容');
    await change('说说今天最惊喜的一件事');
    await press('添加');
    expect(input().props.value).toBe('');
    expect(labels()).toContain('真心话 · 已抽 0/9');
    await change('说说今天最惊喜的一件事');
    await press('添加');
    expect(labels()).toContain('这道题已经存在了');

    // Two taps within one render must still select two different prompts.
    const drawButton = renderer.root.findAll(node => typeof node.props.onPress === 'function'
      && node.findAllByType(Text).some(child => child.props.children === '抽一题'))[0];
    expect(drawButton).toBeTruthy();
    await ReactTestRenderer.act(async () => {
      drawButton.props.onPress();
      drawButton.props.onPress();
    });
    expect(labels()).toContain('真心话 · 已抽 2/9');
    const truths = DEFAULT_CHALLENGES.filter(item => item.kind === 'truth');
    expect(labels()).toContain(truths[1].text);
    for (let index = 2; index < 9; index++) await press('再抽一题');
    expect(labels()).toContain('说说今天最惊喜的一件事');
    expect(labels()).toContain('真心话 · 已抽 9/9');
    expect(labels()).toContain('本轮已抽完');

    await press('大冒险');
    expect(labels()).toContain('大冒险 · 已抽 0/8');
    await press('抽一题');
    expect(labels()).toContain('大冒险 · 已抽 1/8');
    await press('真心话');
    expect(labels()).toContain('真心话 · 已抽 9/9');
    await press('重新洗牌');
    expect(labels()).toContain('真心话 · 已抽 0/9');
    await press('大冒险');
    expect(labels()).toContain('大冒险 · 已抽 1/8');
    await press('真心话');

    const remove = renderer.root.findAll(node => node.props.accessibilityLabel === '删除题目 说说今天最惊喜的一件事'
      && typeof node.props.onPress === 'function')[0];
    expect(remove).toBeTruthy();
    await ReactTestRenderer.act(async () => {remove.props.onPress();});
    expect(labels()).toContain('真心话 · 已抽 0/8');
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => {renderer.unmount();});
    random.mockRestore();
  }
});
