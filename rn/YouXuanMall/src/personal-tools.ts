import {NativeModules, Platform} from 'react-native';
import {parseTodos} from './planner';
import type {Todo} from './planner';

type PersonalToolsNative = {
  loadTodos(): Promise<string>;
  saveTodos(serialized: string): Promise<void>;
  openAlarm(hour: number, minute: number, message: string): Promise<void>;
};

function nativeTools(): PersonalToolsNative {
  const module = NativeModules.PersonalTools as PersonalToolsNative | undefined;
  if (!module) throw new Error(Platform.OS === 'android'
    ? '请重新安装应用，以启用日历和闹钟功能'
    : '当前平台暂不支持本机待办和系统闹钟');
  return module;
}

// Keep writes ordered even if the user toggles several items quickly or navigates away.
let lastWrite: Promise<void> = Promise.resolve();

export async function loadTodos(): Promise<Todo[]> {
  await lastWrite.catch(() => {});
  return parseTodos(await nativeTools().loadTodos());
}

export function saveTodos(todos: Todo[]): Promise<void> {
  lastWrite = lastWrite.catch(() => {}).then(() => nativeTools().saveTodos(JSON.stringify(todos)));
  return lastWrite;
}

export function openSystemAlarm(hour: number, minute: number, message: string): Promise<void> {
  return nativeTools().openAlarm(hour, minute, message);
}
