import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Text, View} from '@tarojs/components'
import {getSavedSession, getToken, mallApi, onSessionExpired, saveSession, useToken} from '../../lib/api'
import {SessionContext} from '../../lib/session'
import type {Member, Screen} from '../../lib/types'
import {Home, Categories, Search, ProductScreen} from '../../screens/catalog'
import {Cart, Checkout, Addresses, AddressForm, Orders, OrderScreen} from '../../screens/commerce'
import {Account, Login, Register} from '../../screens/account'
import {GameHub, DiceGame, RouletteGame, MemoryGame, ReactionGame, TruthDareGame, RpsTournament, GuessNumberGame} from '../../screens/games'
import {Planner, AlarmShortcut} from '../../screens/personal'
import './index.scss'

type Tab = 'home' | 'categories' | 'cart' | 'account'
const tabs: {name: Tab; label: string; icon: string}[] = [
  {name: 'home', label: '首页', icon: '⌂'}, {name: 'categories', label: '分类', icon: '☷'},
  {name: 'cart', label: '购物车', icon: '🛒'}, {name: 'account', label: '我的', icon: '◯'},
]
export default function Mall() {
  const [stack, setStack] = useState<Screen[]>([{name: 'home'}])
  const [member, setMember] = useState<Member | null>(getSavedSession()?.member ?? null)
  const [selectedAddressId, setSelectedAddressId] = useState<number>()
  const [version, setVersion] = useState(0)
  const loginReturn = useRef<Screen>({name: 'home'})
  const current = stack[stack.length - 1]
  const navigate = useCallback((screen: Screen) => {setStack(previous => [...previous, screen]); setVersion(v => v + 1)}, [])
  const replace = useCallback((screen: Screen) => {setStack(previous => [...previous.slice(0, -1), screen]); setVersion(v => v + 1)}, [])
  const back = useCallback(() => {setStack(previous => previous.length > 1 ? previous.slice(0, -1) : previous); setVersion(v => v + 1)}, [])
  const tab = useCallback((name: Tab) => {setStack([{name}]); setVersion(v => v + 1)}, [])
  const guard = useCallback(() => {
    if (member) return true
    loginReturn.current = current.name === 'login' ? {name: 'home'} : current
    navigate({name: 'login'})
    return false
  }, [member, current, navigate])
  const logout = useCallback(() => {saveSession(null); setMember(null); setSelectedAddressId(undefined); tab('home')}, [tab])
  const login = useCallback(async (username: string, password: string) => {
    const result = await mallApi.login(username, password)
    const nextToken = `${result.tokenHead}${result.token}`
    useToken(nextToken)
    try {
      const info = await mallApi.member()
      if (getToken() !== nextToken) return
      saveSession({token: nextToken, member: {
        id: info.id, username: info.username, nickname: info.nickname,
        icon: info.icon, integration: info.integration,
      }})
      setMember(info)
      setStack([loginReturn.current]); setVersion(v => v + 1)
    } catch (error) {if (getToken() === nextToken) useToken(''); throw error}
  }, [])
  useEffect(() => {
    onSessionExpired(logout)
    const initial = getSavedSession()
    if (initial) mallApi.member().then(info => {
      if (getToken() !== initial.token) return
      setMember(info)
      saveSession({token: initial.token, member: {
        id: info.id, username: info.username, nickname: info.nickname, icon: info.icon, integration: info.integration,
      }})
    }).catch(() => {})
    return () => onSessionExpired(undefined)
  }, [logout])
  const selectAddress = useCallback((id: number) => {setSelectedAddressId(id); back()}, [back])
  const session = useMemo(() => ({member, navigate, replace, back, tab, guard, login, logout, selectedAddressId, selectAddress}),
    [member, navigate, replace, back, tab, guard, login, logout, selectedAddressId, selectAddress])
  let content: React.ReactNode
  switch (current.name) {
    case 'home': content = <Home />; break
    case 'categories': content = <Categories />; break
    case 'cart': content = <Cart />; break
    case 'account': content = <Account />; break
    case 'search': content = <Search {...current} />; break
    case 'product': content = <ProductScreen id={current.id} />; break
    case 'login': content = <Login />; break
    case 'register': content = <Register />; break
    case 'checkout': content = <Checkout cartIds={current.cartIds} />; break
    case 'addresses': content = <Addresses />; break
    case 'addressForm': content = <AddressForm id={current.id} />; break
    case 'orders': content = <Orders initialStatus={current.status} />; break
    case 'order': content = <OrderScreen id={current.id} />; break
    case 'games': content = <GameHub />; break
    case 'dice': content = <DiceGame />; break
    case 'roulette': content = <RouletteGame />; break
    case 'memory': content = <MemoryGame />; break
    case 'reaction': content = <ReactionGame />; break
    case 'truthDare': content = <TruthDareGame />; break
    case 'rpsTournament': content = <RpsTournament />; break
    case 'guessNumber': content = <GuessNumberGame />; break
    case 'planner': content = <Planner />; break
    case 'alarm': content = <AlarmShortcut />; break
  }
  return <SessionContext.Provider value={session}><View className='app'>
    <View className='screen' key={version}>{content}</View>
    {tabs.some(item => item.name === current.name) ? <View className='tab-bar'>
      {tabs.map(item => <View key={item.name} onClick={() => tab(item.name)} className={`tab ${current.name === item.name ? 'active' : ''}`}>
        <Text className='tab-icon'>{item.icon}</Text><Text>{item.label}</Text>
      </View>)}
    </View> : null}
  </View></SessionContext.Provider>
}
