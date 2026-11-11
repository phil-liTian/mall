import {NativeModules, Platform} from 'react-native';
import type {Member} from './types';

export type SavedSession = {token: string; member: Member};

type SessionStore = {
  loadSession(): Promise<string>;
  saveSession(serialized: string): Promise<void>;
};

function store(): SessionStore | undefined {
  return NativeModules.PersonalTools as SessionStore | undefined;
}

// A logout must never finish writing before an older login write.
let lastWrite: Promise<void> = Promise.resolve();

export async function loadSession(): Promise<SavedSession | null> {
  await lastWrite.catch(() => {});
  const native = store();
  if (!native?.loadSession) return null;
  const serialized = await native.loadSession();
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object') return null;
    const {token, member} = value as SavedSession;
    if (typeof token !== 'string' || !token.startsWith('Bearer ') || !member ||
      typeof member.id !== 'number' || typeof member.username !== 'string') return null;
    return {token, member};
  } catch { return null; }
}

export function saveSession(session: SavedSession | null): Promise<void> {
  // /sso/info can contain extra fields; only cache the profile needed by the UI.
  const serialized = session ? JSON.stringify({token: session.token, member: {
    id: session.member.id, username: session.member.username,
    nickname: session.member.nickname, icon: session.member.icon,
    integration: session.member.integration,
  }}) : '';
  lastWrite = lastWrite.catch(() => {}).then(async () => {
    const native = store();
    if (native?.saveSession) await native.saveSession(serialized);
    else if (Platform.OS === 'android') throw new Error('请重新安装应用，以启用登录状态保存');
  });
  return lastWrite;
}
