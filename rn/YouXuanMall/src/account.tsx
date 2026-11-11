import React, {useState} from 'react';
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {mallApi} from './api';
import {useSession} from './session';
import {Button, colors, Field, Header, s} from './ui';

function OrderStatusIcon({status}: {status: number}) {
  return <View accessible={false} style={local.orderIcon}>
    {status === 0 ? <View style={local.paymentCard}>
      <View style={local.paymentStripe} />
      <View style={local.paymentDetail} />
    </View> : status === 2 ? <View style={local.packageBox}>
      <View style={local.packageTape} />
      <View style={local.packageBase} />
    </View> : <Image source={require('./assets/icons/order-completed.png')} style={local.completedIcon} />}
  </View>;
}

export function Account() {
  const {member, guard, navigate, logout} = useSession();
  const open = (screen: 'orders' | 'addresses', status = -1) => {
    if (guard()) navigate(screen === 'orders' ? {name: 'orders', status} : {name: 'addresses'});
  };
  return <View style={s.page}><ScrollView>
    <View style={local.hero}><Text style={local.heroTitle}>我的优选</Text>
      <Pressable onPress={() => !member && guard()} style={local.profile}>
        <View style={local.avatar}><Text style={local.avatarText}>{member ? member.username[0]?.toUpperCase() : '优'}</Text></View>
        <View><Text style={local.profileName}>{member?.nickname || member?.username || '登录 / 注册'}</Text>
          <Text style={local.profileSub}>{member ? `积分 ${member.integration ?? 0}` : '登录后查看订单和购物车'}</Text></View>
      </Pressable></View>
    <View style={s.scroll}>
      <View style={s.panel}><View style={s.between}><Text style={s.title}>我的订单</Text>
        <Pressable onPress={() => open('orders')}><Text style={s.hint}>全部订单 ›</Text></Pressable></View>
        <View style={local.orders}>
          {[['待付款', 0], ['待收货', 2], ['已完成', 3]].map(([label, status]) =>
            <Pressable key={label} accessibilityRole="button" accessibilityLabel={`${label}订单`}
              onPress={() => open('orders', Number(status))} style={local.orderLink}>
              <OrderStatusIcon status={Number(status)} />
              <Text style={s.body}>{label}</Text></Pressable>)}
        </View>
      </View>
      <Pressable style={[s.panel, s.between]} onPress={() => open('addresses')}>
        <Text style={s.title}>📍 收货地址</Text><Text style={s.hint}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={[s.panel, s.between]} onPress={() => navigate({name: 'games'})}>
        <View><Text style={s.title}>游戏中心</Text><Text style={s.hint}>玩个小游戏，放松一下</Text></View>
        <Text style={s.hint}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={[s.panel, s.between]} onPress={() => navigate({name: 'planner'})}>
        <View><Text style={s.title}>日历待办</Text><Text style={s.hint}>选个日期，记下要做的事</Text></View>
        <Text style={s.hint}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={[s.panel, s.between]} onPress={() => navigate({name: 'alarm'})}>
        <View><Text style={s.title}>快捷添加闹钟</Text><Text style={s.hint}>设置时间，交给手机闹钟提醒</Text></View>
        <Text style={s.hint}>›</Text>
      </Pressable>
      {member ? <Button secondary title="退出登录" onPress={() => Alert.alert('退出登录', '确定退出当前账号？', [
        {text: '取消', style: 'cancel'}, {text: '退出', onPress: logout},
      ])} /> : <Button title="立即登录" onPress={guard} />}
    </View>
  </ScrollView></View>;
}

export function Login() {
  const {back, login, navigate} = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!username.trim() || !password) {Alert.alert('提示', '请输入用户名和密码'); return;}
    setBusy(true);
    try {await login(username.trim(), password);} catch (e) {
      Alert.alert('登录失败', e instanceof Error ? e.message : '请检查账号密码');
    } finally {setBusy(false);}
  };
  return <View style={s.page}><Header title="会员登录" onBack={back} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
      <Text style={local.welcome}>欢迎回来</Text><Text style={[s.hint, local.subtitle]}>登录优选商城，继续发现心仪好物</Text>
      <View style={s.panel}><Field label="用户名" value={username} onChangeText={setUsername} />
        <Field label="密码" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title={busy ? '登录中…' : '登录'} onPress={submit} disabled={busy} />
        <Pressable onPress={() => navigate({name: 'register'})} style={local.registerLink}><Text style={local.link}>没有账号？立即注册 ›</Text></Pressable>
      </View>
    </ScrollView>
  </View>;
}

export function Register() {
  const {back} = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [busy, setBusy] = useState(false);
  const code = async () => {
    if (!/^1[3-9]\d{9}$/.test(telephone)) {Alert.alert('提示', '请输入正确的手机号码'); return;}
    try {await mallApi.authCode(telephone); Alert.alert('提示', '验证码已发送，请查看手机或后端日志');}
    catch (e) {Alert.alert('获取验证码失败', e instanceof Error ? e.message : '请重试');}
  };
  const submit = async () => {
    if (!username.trim() || !password || !/^1[3-9]\d{9}$/.test(telephone) || !authCode.trim()) {
      Alert.alert('提示', '请填写用户名、密码、有效手机号和验证码'); return;
    }
    setBusy(true);
    try {await mallApi.register({username: username.trim(), password, telephone, authCode: authCode.trim()});
      Alert.alert('注册成功', '请使用新账号登录', [{text: '去登录', onPress: back}]);
    } catch (e) {Alert.alert('注册失败', e instanceof Error ? e.message : '请重试');}
    finally {setBusy(false);}
  };
  return <View style={s.page}><Header title="注册账号" onBack={back} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
      <View style={s.panel}><Field label="用户名" value={username} onChangeText={setUsername} />
        <Field label="密码" value={password} onChangeText={setPassword} secureTextEntry />
        <Field label="手机号码" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
        <Field label="验证码" value={authCode} onChangeText={setAuthCode} keyboardType="number-pad" />
        <Button title="获取验证码" secondary onPress={code} style={local.code} />
        <Button title={busy ? '注册中…' : '注册'} disabled={busy} onPress={submit} />
      </View>
    </ScrollView>
  </View>;
}

const local = StyleSheet.create({
  hero: {backgroundColor: colors.red, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 35, borderBottomLeftRadius: 26, borderBottomRightRadius: 26},
  heroTitle: {fontSize: 23, fontWeight: '800', color: colors.white},
  profile: {flexDirection: 'row', alignItems: 'center', marginTop: 26, gap: 15},
  avatar: {width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFE7E7', justifyContent: 'center', alignItems: 'center'},
  avatarText: {fontSize: 26, color: colors.red, fontWeight: '800'},
  profileName: {fontSize: 20, fontWeight: '700', color: colors.white},
  profileSub: {fontSize: 13, color: '#FFE7E7', marginTop: 5},
  orders: {flexDirection: 'row', paddingTop: 22},
  orderLink: {flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center', gap: 8},
  orderIcon: {width: 32, height: 32, justifyContent: 'center', alignItems: 'center'},
  paymentCard: {width: 26, height: 19, borderWidth: 2, borderColor: colors.red, borderRadius: 4, overflow: 'hidden'},
  paymentStripe: {height: 3, backgroundColor: colors.red, marginTop: 3},
  paymentDetail: {width: 7, height: 2, borderRadius: 1, backgroundColor: colors.red, marginTop: 4, marginLeft: 3},
  packageBox: {width: 24, height: 23, borderWidth: 2, borderColor: colors.red, borderRadius: 3, alignItems: 'center'},
  packageTape: {width: 6, height: 8, borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.red},
  packageBase: {position: 'absolute', top: 11, left: 0, right: 0, height: 2, backgroundColor: colors.red},
  completedIcon: {width: 30, height: 30},
  welcome: {fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 30},
  subtitle: {marginVertical: 10, marginBottom: 24},
  registerLink: {marginTop: 22, alignItems: 'center'},
  link: {color: colors.red, fontWeight: '600'},
  code: {marginBottom: 20},
});
