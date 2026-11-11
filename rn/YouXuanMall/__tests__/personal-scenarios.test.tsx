/** @format */

import React from 'react';
import {NativeModules, Text, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {alarmTimeError, dateKey, monthCells, parseTodos, shiftMonth} from '../src/planner';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('../src/api', () => ({
  mallApi: {home: jest.fn().mockResolvedValue({hotProductList: [], advertiseList: []}),
    recommend: jest.fn().mockResolvedValue([]), cart: jest.fn()},
  setToken: jest.fn(), onSessionExpired: jest.fn(),
}));

test('calendar uses local dates, handles short months and rejects bad saved items', () => {
  const november = monthCells('2026-11-11');
  expect(november.slice(0, 6)).toEqual(Array(6).fill(null));
  expect(november[6]).toBe('2026-11-01');
  expect(november.at(-1)).toBe('2026-11-30');
  expect(monthCells('2024-02-01').filter(Boolean)).toHaveLength(29);
  expect(shiftMonth('2024-01-31', 1)).toBe('2024-02-29');
  expect(shiftMonth('2026-03-31', -1)).toBe('2026-02-28');
  expect(dateKey(new Date(2026, 10, 11))).toBe('2026-11-11');
  expect(parseTodos(JSON.stringify([
    {id: '1', date: '2026-11-11', title: '开会', done: false},
    {id: '2', date: '2026-02-30', title: '非法日期', done: false},
  ]))).toHaveLength(1);
  expect(() => parseTodos('{broken')).toThrow();
  expect(alarmTimeError('00', '00')).toBeNull();
  expect(alarmTimeError('23', '59')).toBeNull();
  expect(alarmTimeError('24', '00')).toBeTruthy();
  expect(alarmTimeError('10', '60')).toBeTruthy();
});

test('personal center saves dated tasks locally and opens the system alarm with validated time', async () => {
  let stored = '[]';
  const native = {
    loadTodos: jest.fn(async () => stored),
    saveTodos: jest.fn(async (value: string) => {stored = value;}),
    openAlarm: jest.fn().mockResolvedValue(undefined),
  };
  const previous = NativeModules.PersonalTools;
  NativeModules.PersonalTools = native;
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
    const accessible = async (label: string) => {
      const button = renderer.root.findAll(node => node.props.accessibilityLabel === label
        && typeof node.props.onPress === 'function')[0];
      expect(button).toBeTruthy();
      await ReactTestRenderer.act(async () => {button.props.onPress();});
    };
    const type = async (label: string, value: string) => {
      const field = renderer.root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === label);
      expect(field).toBeTruthy();
      await ReactTestRenderer.act(async () => {field!.props.onChangeText(value);});
    };

    await press('我的');
    await press('日历待办');
    expect(native.loadTodos).toHaveBeenCalledTimes(1);
    const today = dateKey(new Date());
    const anotherDay = monthCells(today).find(date => date && date !== today)!;
    await accessible(`选择日期 ${anotherDay}`);
    await press('添加待办');
    expect(labels()).toContain('请输入待办内容');
    await type('待办内容', '买牛奶');
    await press('添加待办');
    expect(labels()).toContain('买牛奶');
    await ReactTestRenderer.act(async () => {await Promise.resolve();});
    expect(JSON.parse(stored)[0]).toMatchObject({date: anotherDay, title: '买牛奶', done: false});
    await accessible('完成待办 买牛奶');
    await ReactTestRenderer.act(async () => {await Promise.resolve();});
    expect(JSON.parse(stored)[0].done).toBe(true);
    await press('‹');
    await press('日历待办');
    expect(native.loadTodos).toHaveBeenCalledTimes(2);
    await accessible(`选择日期 ${anotherDay}`);
    expect(labels()).toContain('买牛奶');
    await accessible('删除待办 买牛奶');
    await ReactTestRenderer.act(async () => {await Promise.resolve();});
    expect(JSON.parse(stored)).toEqual([]);
    await press('‹');
    await press('快捷添加闹钟');
    await type('闹钟小时', '25');
    await press('打开系统闹钟');
    expect(labels()).toContain('请输入有效的时间（00:00–23:59）');
    expect(native.openAlarm).not.toHaveBeenCalled();
    await type('闹钟小时', '09');
    await type('闹钟分钟', '30');
    await type('提醒内容', '开会');
    await press('打开系统闹钟');
    expect(native.openAlarm).toHaveBeenCalledWith(9, 30, '开会');
    expect(labels()).toContain('已打开系统闹钟，请在系统页面确认保存');
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => {renderer.unmount();});
    NativeModules.PersonalTools = previous;
  }
});
