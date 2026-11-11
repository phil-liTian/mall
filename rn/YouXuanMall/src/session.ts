import {createContext, useContext} from 'react';
import type {Member, Screen} from './types';

export type Session = {
  member: Member | null;
  navigate: (screen: Screen) => void;
  replace: (screen: Screen) => void;
  back: () => void;
  tab: (name: 'home' | 'categories' | 'cart' | 'account') => void;
  guard: () => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  selectedAddressId?: number;
  selectAddress: (id: number) => void;
};

export const SessionContext = createContext<Session | null>(null);
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('Session provider is missing');
  return value;
}
