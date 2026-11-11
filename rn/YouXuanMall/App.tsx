import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BackHandler, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {getToken, mallApi, onSessionExpired, setToken} from './src/api';
import {loadSession, saveSession} from './src/auth-session';
import {Account, Login, Register} from './src/account';
import {Home, Categories, ProductScreen, Search} from './src/catalog';
import {AddressForm, Addresses, Cart, Checkout, Orders, OrderScreen} from './src/commerce';
import {DiceGame, Games} from './src/games';
import {MemoryGame} from './src/memory-game';
import {ReactionGame} from './src/reaction-game';
import {TruthDareGame} from './src/truth-dare-game';
import {RpsTournament} from './src/rps-tournament';
import {GuessNumberGame} from './src/guess-number-game';
import {AlarmShortcut, Planner} from './src/personal-scenarios';
import {RouletteGame} from './src/roulette';
import {SessionContext} from './src/session';
import type {Member, Screen} from './src/types';
import {CartIcon, colors, Loading} from './src/ui';

const tabs = [
  {name: 'home', icon: '⌂', label: '首页'},
  {name: 'categories', icon: '☷', label: '分类'},
  {name: 'cart', label: '购物车'},
  {name: 'account', icon: '◯', label: '我的'},
] as const;
type Tab = (typeof tabs)[number]['name'];
const tabNames: Screen['name'][] = tabs.map(item => item.name);

function Mall() {
  const [stack, setStack] = useState<Screen[]>([{name: 'home'}]);
  const [member, setMember] = useState<Member | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number>();
  const [version, setVersion] = useState(0);
  const loginReturn = useRef<Screen>({name: 'home'});
  const current = stack[stack.length - 1];

  const navigate = useCallback((screen: Screen) => {
    setStack(previous => [...previous, screen]);
    setVersion(previous => previous + 1);
  }, []);
  const replace = useCallback((screen: Screen) => {
    setStack(previous => [...previous.slice(0, -1), screen]);
    setVersion(previous => previous + 1);
  }, []);
  const back = useCallback(() => {
    setStack(previous => previous.length > 1 ? previous.slice(0, -1) : previous);
    setVersion(previous => previous + 1);
  }, []);
  const tab = useCallback((name: Tab) => {setStack([{name}]); setVersion(previous => previous + 1);}, []);
  const guard = useCallback(() => {
    if (member) return true;
    loginReturn.current = current.name === 'login' ? {name: 'home'} : current;
    navigate({name: 'login'});
    return false;
  }, [member, current, navigate]);
  const login = useCallback(async (username: string, password: string) => {
    const result = await mallApi.login(username, password);
    const nextToken = `${result.tokenHead}${result.token}`;
    setToken(nextToken);
    try {
      const info = await mallApi.member();
      if (getToken() !== nextToken) return;
      await saveSession({token: nextToken, member: info});
      if (getToken() !== nextToken) return;
      setMember(info);
      setStack([loginReturn.current]);
      setVersion(previous => previous + 1);
    } catch (e) {if (getToken() === nextToken) setToken(''); throw e;}
  }, []);
  const logout = useCallback(() => {
    setToken('');
    setMember(null);
    setSelectedAddressId(undefined);
    saveSession(null).catch(() => {});
    tab('home');
  }, [tab]);
  const selectAddress = useCallback((id: number) => {setSelectedAddressId(id); back();}, [back]);
  useEffect(() => {
    onSessionExpired(logout);
    return () => onSessionExpired(() => {});
  }, [logout]);
  useEffect(() => {
    let active = true;
    loadSession().then(saved => {
      if (!active || !saved) return;
      setToken(saved.token);
      setMember(saved.member);
      // A temporary network failure should not discard a valid cached login.
      mallApi.member().then(info => {
        if (!active || getToken() !== saved.token) return;
        setMember(info);
        saveSession({token: saved.token, member: info}).catch(() => {});
      }).catch(() => {});
    }).catch(() => {}).finally(() => {if (active) setRestoring(false);});
    return () => {active = false;};
  }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {back(); return true;}
      if (stack[0]?.name !== 'home') {tab('home'); return true;}
      return false;
    });
    return () => listener.remove();
  }, [back, stack, tab]);

  const session = useMemo(() => ({member, navigate, replace, back, tab, guard, login, logout, selectedAddressId, selectAddress}),
    [member, navigate, replace, back, tab, guard, login, logout, selectedAddressId, selectAddress]);

  let page: React.ReactNode;
  switch (current.name) {
    case 'home': page = <Home />; break;
    case 'categories': page = <Categories />; break;
    case 'cart': page = <Cart />; break;
    case 'account': page = <Account />; break;
    case 'games': page = <Games />; break;
    case 'dice': page = <DiceGame />; break;
    case 'roulette': page = <RouletteGame />; break;
    case 'memory': page = <MemoryGame />; break;
    case 'reaction': page = <ReactionGame />; break;
    case 'truthDare': page = <TruthDareGame />; break;
    case 'rpsTournament': page = <RpsTournament />; break;
    case 'guessNumber': page = <GuessNumberGame />; break;
    case 'planner': page = <Planner />; break;
    case 'alarm': page = <AlarmShortcut />; break;
    case 'login': page = <Login />; break;
    case 'register': page = <Register />; break;
    case 'search': page = <Search keyword={current.keyword} title={current.title} categoryId={current.categoryId} feed={current.feed} />; break;
    case 'product': page = <ProductScreen id={current.id} />; break;
    case 'checkout': page = <Checkout cartIds={current.cartIds} />; break;
    case 'addresses': page = <Addresses />; break;
    case 'addressForm': page = <AddressForm id={current.id} />; break;
    case 'orders': page = <Orders initialStatus={current.status} />; break;
    case 'order': page = <OrderScreen id={current.id} />; break;
  }
  if (restoring) return <View style={styles.app}><Loading /></View>;
  return <SessionContext.Provider value={session}>
    <SafeAreaView style={styles.app} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View key={version} style={styles.page}>{page}</View>
      {tabNames.includes(current.name) ? <View style={styles.tabs}>
        {tabs.map(item => <Pressable accessibilityRole="tab" accessibilityState={{selected: current.name === item.name}}
          key={item.name} style={styles.tab} onPress={() => tab(item.name)}>
          {item.name === 'cart'
            ? <CartIcon color={current.name === item.name ? colors.red : colors.muted} />
            : <Text style={[styles.tabIcon, current.name === item.name && styles.active]}>{item.icon}</Text>}
          <Text style={[styles.tabLabel, current.name === item.name && styles.active]}>{item.label}</Text>
        </Pressable>)}
      </View> : null}
    </SafeAreaView>
  </SessionContext.Provider>;
}

export default function App(): React.JSX.Element {
  return <SafeAreaProvider><Mall /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  app: {flex: 1, backgroundColor: colors.white},
  page: {flex: 1},
  tabs: {flexDirection: 'row', height: 60, borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.white},
  tab: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2},
  tabIcon: {fontSize: 21, color: colors.muted},
  tabLabel: {fontSize: 11, color: colors.muted},
  active: {color: colors.red, fontWeight: '700'},
});
