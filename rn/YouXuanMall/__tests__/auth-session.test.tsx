/** @format */

import React from 'react';
import {Alert, NativeModules, Text, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {getToken, setToken} from '../src/api';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

test('login survives app restart and offline profile refresh; logout removes saved session', async () => {
  let stored = '';
  let offline = false;
  const native = {
    loadSession: jest.fn(async () => stored),
    saveSession: jest.fn(async (value: string) => {stored = value;}),
  };
  const previous = NativeModules.PersonalTools;
  NativeModules.PersonalTools = native;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = jest.fn(async (url: string) => {
    if (url.endsWith('/sso/info') && offline) throw new TypeError('offline');
    const data = url.includes('/home/recommendProductList') ? [] :
      url.endsWith('/sso/login') ? {token: 'test', tokenHead: 'Bearer '} :
      url.endsWith('/sso/info') ? {id: 1, username: 'alice', nickname: '小爱', password: 'private'} :
      {hotProductList: [], advertiseList: []};
    return {ok: true, json: async () => ({code: 200, data})};
  }) as unknown as typeof fetch;
  let app!: ReactTestRenderer.ReactTestRenderer;
  const labels = () => app.root.findAllByType(Text).map(node => node.props.children);
  const press = async (label: string) => {
    const node = app.root.findAllByType(Text).find(text => text.props.children === label);
    expect(node).toBeTruthy();
    let target = node!.parent;
    while (target && typeof target.props.onPress !== 'function') target = target.parent;
    await ReactTestRenderer.act(async () => {target!.props.onPress();});
  };
  try {
    await ReactTestRenderer.act(async () => {app = ReactTestRenderer.create(<App />);});
    await press('我的');
    await press('立即登录');
    const fields = app.root.findAllByType(TextInput);
    await ReactTestRenderer.act(async () => {
      fields[0].props.onChangeText('alice');
      fields[1].props.onChangeText('123456');
    });
    await press('登录');
    expect(JSON.parse(stored)).toMatchObject({token: 'Bearer test', member: {username: 'alice'}});
    expect(stored).not.toContain('private');
    expect(getToken()).toBe('Bearer test');

    await ReactTestRenderer.act(async () => {app.unmount();});
    setToken('');
    offline = true;
    await ReactTestRenderer.act(async () => {app = ReactTestRenderer.create(<App />);});
    await press('我的');
    expect(labels()).toContain('小爱');
    expect(getToken()).toBe('Bearer test');

    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find(button => button.text === '退出')?.onPress?.();
    });
    try {await press('退出登录');} finally {alert.mockRestore();}
    expect(getToken()).toBe('');
    expect(stored).toBe('');
  } finally {
    if (app) await ReactTestRenderer.act(async () => {app.unmount();});
    setToken('');
    globalThis.fetch = originalFetch;
    NativeModules.PersonalTools = previous;
  }
});
