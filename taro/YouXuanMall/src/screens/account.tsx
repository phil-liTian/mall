import {useState} from 'react'
import {Text, View} from '@tarojs/components'
import {mallApi} from '../lib/api'
import {useSession} from '../lib/session'
import {Button, Field, Header, Page, confirm, toast} from '../lib/ui'

export function Account() {
  const {member, guard, navigate, logout} = useSession()
  const open = (name: 'orders' | 'addresses', status = -1) => {
    if (guard()) navigate(name === 'orders' ? {name, status} : {name})
  }
  return <Page>
    <View className='hero'><Text className='hero-name'>我的优选</Text>
      <View onClick={() => {if (!member) guard()}} className='space'>
        <Text className='hero-note'>{member?.nickname || member?.username || '登录 / 注册'}</Text>
        <Text className='hero-note'>{member ? `积分 ${member.integration ?? 0}` : '登录后查看订单与购物车'}</Text>
      </View></View>
    <View className='panel'><View className='between'><Text className='title'>我的订单</Text>
      <Text className='link' onClick={() => open('orders')}>全部订单 ›</Text></View>
      <View className='shortcuts'>
        {([{label: '待付款', status: 0}, {label: '待收货', status: 2}, {label: '已完成', status: 3}]).map(item =>
          <View key={item.label} className='shortcut' onClick={() => open('orders', item.status)}>
            <Text className='shortcut-icon'>{item.status === 0 ? '▣' : item.status === 2 ? '▤' : '✓'}</Text><Text>{item.label}</Text>
          </View>)}</View>
    </View>
    <View className='panel between' onClick={() => open('addresses')}><Text className='title'>📍 收货地址</Text><Text>›</Text></View>
    {([{name: 'games', label: '游戏中心', desc: '玩个小游戏，放松一下'},
      {name: 'planner', label: '日历待办', desc: '选个日期，记下要做的事'},
      {name: 'alarm', label: '快捷添加提醒', desc: '用系统日历到点提醒'}] as const).map(item =>
      <View key={item.name} className='panel between' onClick={() => navigate({name: item.name})}>
        <View><Text className='title'>{item.label}</Text><Text className='muted space'>{item.desc}</Text></View><Text>›</Text>
      </View>)}
    {member ? <Button secondary title='退出登录' onClick={async () => {
      if (await confirm('退出登录', '确定退出当前账号？')) logout()
    }} /> : <Button title='立即登录' onClick={guard} />}
  </Page>
}

export function Login() {
  const {back, login, navigate} = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!username.trim() || !password) {toast('请输入用户名和密码'); return}
    setBusy(true)
    try {await login(username.trim(), password)}
    catch (error) {toast(error instanceof Error ? error.message : '登录失败')}
    finally {setBusy(false)}
  }
  return <><Header title='会员登录' onBack={back} /><Page>
    <Text className='heading'>欢迎回来</Text><Text className='muted'>登录优选商城，继续发现心仪好物</Text>
    <View className='panel space'><Field label='用户名' value={username} onChange={setUsername} />
      <Field label='密码' value={password} onChange={setPassword} password />
      <Button title={busy ? '登录中…' : '登录'} onClick={submit} disabled={busy} />
      <Text className='link center' onClick={() => navigate({name: 'register'})}>没有账号？立即注册 ›</Text>
    </View>
  </Page></>
}

export function Register() {
  const {back} = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [telephone, setTelephone] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [busy, setBusy] = useState(false)
  const code = async () => {
    if (!/^1[3-9]\d{9}$/.test(telephone)) {toast('请输入正确手机号'); return}
    try {await mallApi.authCode(telephone); toast('验证码已发送')}
    catch (error) {toast(error instanceof Error ? error.message : '获取验证码失败')}
  }
  const submit = async () => {
    if (!username.trim() || !password || !/^1[3-9]\d{9}$/.test(telephone) || !authCode.trim()) {
      toast('请填写完整且有效的注册信息'); return
    }
    setBusy(true)
    try {await mallApi.register({username: username.trim(), password, telephone, authCode: authCode.trim()}); toast('注册成功，请登录'); back()}
    catch (error) {toast(error instanceof Error ? error.message : '注册失败')}
    finally {setBusy(false)}
  }
  return <><Header title='注册账号' onBack={back} /><Page><View className='panel'>
    <Field label='用户名' value={username} onChange={setUsername} />
    <Field label='密码' value={password} onChange={setPassword} password />
    <Field label='手机号码' value={telephone} onChange={setTelephone} type='number' />
    <Field label='验证码' value={authCode} onChange={setAuthCode} type='number' />
    <Button secondary title='获取验证码' onClick={code} />
    <View className='space'><Button title={busy ? '注册中…' : '注册'} disabled={busy} onClick={submit} /></View>
  </View></Page></>
}
