import React, {useEffect, useRef, useState} from 'react';
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {mallApi} from './api';
import {useSession} from './session';
import type {Address, CartItem, Order} from './types';
import {money, orderStatus} from './types';
import {Button, colors, Field, Header, Loading, Message, Photo, s, useLoad} from './ui';

function ask(title: string, message: string, action: () => void) {
  Alert.alert(title, message, [{text: '再想想', style: 'cancel'}, {text: '确定', onPress: action}]);
}
function showError(error: unknown) {Alert.alert('操作失败', error instanceof Error ? error.message : '请稍后重试');}

function SelectionIndicator({selected}: {selected: boolean}) {
  return selected
    ? <Image source={require('./assets/icons/order-completed.png')} style={local.selectionIcon} />
    : <View style={[local.selectionIcon, local.selectionEmpty]} />;
}

export function Cart() {
  const {member, guard, navigate, tab} = useSession();
  const {data, loading, error, reload} = useLoad(() => member ? mallApi.cart() : Promise.resolve([] as CartItem[]), [member?.id]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [updating, setUpdating] = useState(false);
  const items = data ?? [];
  const checked = items.filter(item => selected[item.id] !== false);
  const total = checked.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const updateQuantity = async (item: CartItem, next: number) => {
    if (updating || next < 1) return;
    setUpdating(true);
    try {await mallApi.quantity(item.id, next); reload();} catch (e) {showError(e);} finally {setUpdating(false);}
  };
  const remove = (id: number) => ask('移除商品', '确定从购物车删除这件商品？', async () => {
    try {await mallApi.deleteCart([id]); reload();} catch (e) {showError(e);}
  });
  return <View style={s.page}><Header title={`购物车 ${member ? `(${items.length})` : ''}`} />
    {!member ? <View style={local.center}><Message text="登录后即可查看购物车" />
      <Button title="去登录" onPress={guard} /></View> : <>
      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
        {!loading && !error && !items.length ? <View style={local.center}><Message text="购物车还空着，去挑几件好物吧" />
          <Button title="去逛逛" onPress={() => tab('home')} /></View> : null}
        {items.map(item => <View key={item.id} style={[s.panel, s.row]}>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`选择${item.productName}`}
            accessibilityState={{checked: selected[item.id] !== false}}
            onPress={() => setSelected(previous => ({...previous, [item.id]: previous[item.id] === false}))}
            style={local.itemSelection}>
            <SelectionIndicator selected={selected[item.id] !== false} />
          </Pressable>
          <Pressable onPress={() => navigate({name: 'product', id: item.productId})}>
            <Photo uri={item.productPic} style={local.cartPhoto} /></Pressable>
          <View style={local.cartInfo}><Text style={s.title} numberOfLines={2}>{item.productName}</Text>
            <Text style={s.hint} numberOfLines={1}>{formatAttributes(item.productAttr)}</Text>
            <Text style={s.price}>{money(item.price)}</Text>
            <View style={s.between}><View style={s.row}>
              <Pressable disabled={updating} onPress={() => updateQuantity(item, item.quantity - 1)} style={local.step}><Text>−</Text></Pressable>
              <Text style={local.number}>{item.quantity}</Text>
              <Pressable disabled={updating} onPress={() => updateQuantity(item, item.quantity + 1)} style={local.step}><Text>＋</Text></Pressable>
            </View><Pressable onPress={() => remove(item.id)}><Text style={s.hint}>删除</Text></Pressable></View>
          </View>
        </View>)}
      </ScrollView>
      {items.length > 0 ? <View style={s.footer}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="全选"
          accessibilityState={{checked: checked.length === items.length}}
          style={local.selectAll}
          onPress={() => setSelected(Object.fromEntries(items.map(item => [item.id, checked.length !== items.length])))}>
          <SelectionIndicator selected={checked.length === items.length} />
          <Text style={local.selectAllText}>全选</Text>
        </Pressable>
        <Text style={s.price}>{money(total)}</Text>
        <Button title={`结算 (${checked.length})`} disabled={!checked.length || updating}
          onPress={() => navigate({name: 'checkout', cartIds: checked.map(item => item.id)})} />
      </View> : null}
    </>}
  </View>;
}

export function Checkout({cartIds}: {cartIds: number[]}) {
  const {back, navigate, replace, selectedAddressId} = useSession();
  const {data, loading, error, reload} = useLoad(() => mallApi.confirmOrder(cartIds), [cartIds.join(',')]);
  const [submitting, setSubmitting] = useState(false);
  const address = data?.memberReceiveAddressList?.find(a => a.id === selectedAddressId)
    ?? data?.memberReceiveAddressList?.find(a => a.defaultStatus === 1)
    ?? data?.memberReceiveAddressList?.[0];
  const submit = async () => {
    if (!address?.id || submitting) {if (!address) Alert.alert('提示', '请先添加收货地址'); return;}
    setSubmitting(true);
    try {
      const created = await mallApi.createOrder(cartIds, address.id);
      replace({name: 'order', id: created.order.id});
    } catch (e) {showError(e);} finally {setSubmitting(false);}
  };
  return <View style={s.page}><Header title="确认订单" onBack={back} />
    <ScrollView contentContainerStyle={s.scroll}>
      {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
      {data ? <>
        <Pressable style={s.panel} onPress={() => navigate({name: 'addresses'})}>
          <Text style={s.title}>📍 {address ? `${address.name}  ${address.phoneNumber}` : '添加收货地址  ›'}</Text>
          {address ? <Text style={[s.hint, local.space]}>{address.province}{address.city}{address.region}{address.detailAddress}  ›</Text> : null}
        </Pressable>
        <View style={s.panel}><Text style={s.title}>商品清单</Text>
          {data.cartPromotionItemList?.map((item, i) => <View style={[s.row, local.line]} key={`${item.id}-${i}`}>
            <Photo uri={item.productPic} /><View style={local.cartInfo}>
              <Text style={s.body} numberOfLines={2}>{item.productName}</Text>
              <Text style={s.hint}>{formatAttributes(item.productAttr)} ×{item.quantity}</Text>
              <Text style={s.price}>{money(item.price)}</Text></View>
          </View>)}</View>
        <View style={s.panel}><AmountRow label="商品合计" value={data.calcAmount?.totalAmount} />
          <AmountRow label="运费" value={data.calcAmount?.freightAmount} />
          <AmountRow label="活动优惠" value={-(data.calcAmount?.promotionAmount || 0)} />
          <Text style={s.hint}>订单使用后端核算的价格，创建后为待付款状态。</Text></View>
      </> : null}
    </ScrollView>
    {data ? <View style={s.footer}><Text style={s.price}>实付款 {money(data.calcAmount?.payAmount)}</Text>
      <Button title={submitting ? '提交中…' : '提交订单'} disabled={submitting || !address?.id} onPress={submit} /></View> : null}
  </View>;
}

function AmountRow({label, value}: {label: string; value?: number}) {
  return <View style={[s.between, local.amount]}><Text style={s.hint}>{label}</Text><Text style={s.body}>{money(value)}</Text></View>;
}

export function Addresses() {
  const {back, navigate, selectAddress} = useSession();
  const {data, loading, error, reload} = useLoad(() => mallApi.addresses(), []);
  const remove = (id: number) => ask('删除地址', '确定删除这个收货地址？', async () => {
    try {await mallApi.deleteAddress(id); reload();} catch (e) {showError(e);}
  });
  return <View style={s.page}><Header title="收货地址" onBack={back} />
    <ScrollView contentContainerStyle={s.scroll}>
      {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
      {!loading && !error && !data?.length ? <Message text="还没有收货地址" /> : null}
      {data?.map(address => <View style={s.panel} key={address.id}>
        <Pressable onPress={() => address.id && selectAddress(address.id)}>
          <Text style={s.title}>{address.name}  {address.phoneNumber} {address.defaultStatus ? '  默认' : ''}</Text>
          <Text style={[s.hint, local.space]}>{address.province}{address.city}{address.region}{address.detailAddress}</Text>
          <Text style={local.selectHint}>选择此地址</Text>
        </Pressable>
        <View style={[s.row, local.actions]}>
          <Pressable onPress={() => navigate({name: 'addressForm', id: address.id})}><Text style={s.hint}>编辑</Text></Pressable>
          {address.id ? <Pressable onPress={() => remove(address.id!)}><Text style={s.hint}>删除</Text></Pressable> : null}
        </View>
      </View>)}
    </ScrollView><View style={s.footer}><Button title="＋ 新增收货地址" onPress={() => navigate({name: 'addressForm'})} style={local.wide} /></View>
  </View>;
}

export function AddressForm({id}: {id?: number}) {
  const {back} = useSession();
  const {data, loading, error} = useLoad(() => id ? mallApi.address(id) : Promise.resolve(undefined), [id]);
  const [form, setForm] = useState<Address>({name: '', phoneNumber: '', province: '', city: '', region: '', detailAddress: '', defaultStatus: 0});
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {if (data && !initialized) {setForm(data); setInitialized(true);}}, [data, initialized]);
  const [saving, setSaving] = useState(false);
  const edit = (key: keyof Address, value: string) => setForm(previous => ({...previous, [key]: value}));
  const save = async () => {
    if (!form.name.trim() || !/^1[3-9]\d{9}$/.test(form.phoneNumber) ||
      !form.province.trim() || !form.city.trim() || !form.region.trim() || !form.detailAddress.trim()) {
      Alert.alert('提示', '请填写姓名、正确手机号、省市区和详细地址'); return;
    }
    setSaving(true);
    try {await mallApi.saveAddress({...form, id}); back();} catch (e) {showError(e);} finally {setSaving(false);}
  };
  return <View style={s.page}><Header title={id ? '编辑收货地址' : '新增收货地址'} onBack={back} />
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      {loading ? <Loading /> : null}{error ? <Message text={error} /> : null}
      {!loading && !error ? <View style={s.panel}>
        <Field label="收货人" value={form.name} onChangeText={v => edit('name', v)} />
        <Field label="手机号码" value={form.phoneNumber} keyboardType="phone-pad" onChangeText={v => edit('phoneNumber', v)} />
        <Field label="省份 / 直辖市" value={form.province} onChangeText={v => edit('province', v)} />
        <Field label="城市" value={form.city} onChangeText={v => edit('city', v)} />
        <Field label="区 / 县" value={form.region} onChangeText={v => edit('region', v)} />
        <Field label="详细地址" value={form.detailAddress} onChangeText={v => edit('detailAddress', v)} />
        <Pressable onPress={() => setForm(previous => ({...previous, defaultStatus: previous.defaultStatus ? 0 : 1}))}>
          <Text style={s.body}>{form.defaultStatus ? '☑' : '□'} 设为默认地址</Text></Pressable>
      </View> : null}
    </ScrollView>
    {!loading && !error ? <View style={s.footer}><Button title={saving ? '保存中…' : '保存地址'} disabled={saving} style={local.wide} onPress={save} /></View> : null}
  </View>;
}

const statuses = [{label: '全部', value: -1}, {label: '待付款', value: 0}, {label: '待收货', value: 2}, {label: '已完成', value: 3}, {label: '已关闭', value: 4}];
export function Orders({initialStatus}: {initialStatus: number}) {
  const {back, navigate} = useSession();
  const [status, setStatus] = useState(initialStatus);
  const [list, setList] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const pending = useRef(false);
  const load = async (next: number, filter: number) => {
    if (pending.current && next > 1) return;
    pending.current = true;
    setBusy(true); setError('');
    const id = ++requestId.current;
    try {const response = await mallApi.orders(filter, next);
      const fetched = response.list || [];
      if (id === requestId.current) {
        setList(previous => next === 1 ? fetched : [...previous, ...fetched]);
        setPage(next); setMore(fetched.length === 5 && next < (response.totalPage || Infinity));
      }
    } catch (e) {if (id === requestId.current) setError(e instanceof Error ? e.message : '加载订单失败');}
    finally {if (id === requestId.current) {setBusy(false); pending.current = false;}}
  };
  useEffect(() => {load(1, status); return () => {requestId.current++; pending.current = false;};}, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  const empty = !busy && !error && list.length === 0;
  return <View style={s.page}><Header title="我的订单" onBack={back} />
    <View style={local.orderTabs}>
      {statuses.map(item => <Pressable key={item.value} accessibilityRole="tab"
        accessibilityState={{selected: status === item.value}} style={local.orderTab}
        onPress={() => {if (status !== item.value) {
          requestId.current++; pending.current = false;
          setList([]); setPage(0); setMore(true); setBusy(true); setError(''); setStatus(item.value);
        }}}>
        <Text style={[local.orderTabText, status === item.value && local.orderTabTextActive]}>{item.label}</Text>
        {status === item.value ? <View style={local.orderTabUnderline} /> : null}
      </Pressable>)}
    </View>
    <ScrollView contentContainerStyle={[s.scroll, empty && local.orderEmptyContent]} onScroll={({nativeEvent}) => {const {contentOffset, layoutMeasurement, contentSize} = nativeEvent;
      if (page > 0 && more && !pending.current && contentOffset.y + layoutMeasurement.height >= contentSize.height - 120) load(page + 1, status);
    }} scrollEventThrottle={220}>
      {list.map(order => <Pressable key={order.id} style={s.panel} onPress={() => navigate({name: 'order', id: order.id})}>
        <View style={s.between}><Text style={s.hint}>{order.orderSn}</Text>
          <Text style={local.selectHint}>{orderStatus(order.status)}</Text></View>
        {order.orderItemList?.slice(0, 2).map(item => <View key={item.id} style={[s.row, local.line]}>
          <Photo uri={item.productPic} style={local.orderPhoto} />
          <View style={local.cartInfo}><Text style={s.body} numberOfLines={2}>{item.productName}</Text>
            <Text style={s.hint}>×{item.productQuantity}</Text></View>
        </View>)}
        <View style={s.between}><Text style={s.hint}>{order.createTime}</Text><Text style={s.price}>{money(order.payAmount)}</Text></View>
      </Pressable>)}
      {busy ? <Loading /> : null}{error ? <Message text={error} onRetry={() => load(page + 1, status)} /> : null}
      {empty ? <Message text={status === -1 ? '暂无订单' : '还没有这个状态的订单'} /> : null}
    </ScrollView>
  </View>;
}

export function OrderScreen({id}: {id: number}) {
  const {back, navigate} = useSession();
  const {data, loading, error, reload} = useLoad(() => mallApi.order(id), [id]);
  const action = (kind: 'cancel' | 'receive') => ask(kind === 'cancel' ? '取消订单' : '确认收货',
    kind === 'cancel' ? '确认取消这笔订单？' : '确认已经收到商品？', async () => {
      try {if (kind === 'cancel') await mallApi.cancelOrder(id); else await mallApi.receiveOrder(id); reload();}
      catch (e) {showError(e);}
    });
  return <View style={s.page}><Header title="订单详情" onBack={back} />
    <ScrollView contentContainerStyle={s.scroll}>
      {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
      {data ? <><View style={s.panel}><Text style={s.heading}>{orderStatus(data.status)}</Text>
        <Text style={s.hint}>订单编号：{data.orderSn}</Text><Text style={s.hint}>下单时间：{data.createTime}</Text></View>
        <View style={s.panel}><Text style={s.title}>{data.receiverName} {data.receiverPhone}</Text>
          <Text style={[s.hint, local.space]}>{data.receiverProvince}{data.receiverCity}{data.receiverRegion}{data.receiverDetailAddress}</Text></View>
        <View style={s.panel}><Text style={s.title}>商品信息</Text>{data.orderItemList?.map(item =>
          <Pressable key={item.id} onPress={() => navigate({name: 'product', id: item.productId})} style={[s.row, local.line]}>
            <Photo uri={item.productPic} /><View style={local.cartInfo}>
              <Text style={s.body} numberOfLines={2}>{item.productName}</Text>
              <Text style={s.hint}>×{item.productQuantity}</Text>
              <Text style={s.price}>{money(item.productPrice)}</Text></View>
          </Pressable>)}</View>
        <View style={s.panel}><AmountRow label="应付金额" value={data.payAmount} />
          {data.status === 0 ? <Text style={s.hint}>订单尚未支付；当前应用未接入支付渠道，请勿把创建订单视为支付成功。</Text> : null}
        </View></> : null}
    </ScrollView>
    {data?.status === 0 || data?.status === 2 ? <View style={s.footer}>
      <Button title={data.status === 0 ? '取消订单' : '确认收货'} secondary onPress={() => action(data.status === 0 ? 'cancel' : 'receive')} style={local.wide} />
    </View> : null}
  </View>;
}

function formatAttributes(value?: string) {
  try {const list = JSON.parse(value || '[]') as {key: string; value: string}[];
    return Array.isArray(list) ? list.map(item => `${item.key}：${item.value}`).join(' · ') : '';
  } catch {return '';}
}

const local = StyleSheet.create({
  orderTabs: {height: 48, flexDirection: 'row', backgroundColor: colors.white,
    borderBottomWidth: 1, borderColor: colors.line},
  orderTab: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  orderTabText: {color: colors.ink, fontSize: 13},
  orderTabTextActive: {color: colors.red, fontWeight: '700'},
  orderTabUnderline: {position: 'absolute', bottom: 0, left: '50%', marginLeft: -14,
    height: 2, width: 28, backgroundColor: colors.red, borderRadius: 1},
  orderEmptyContent: {flexGrow: 1, justifyContent: 'center'},
  center: {alignItems: 'center', paddingTop: 50},
  selectionIcon: {width: 24, height: 24},
  selectionEmpty: {borderWidth: 2, borderColor: colors.muted, borderRadius: 12},
  itemSelection: {width: 32, height: 40, marginRight: 6, alignItems: 'flex-start', justifyContent: 'center'},
  selectAll: {flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 6, paddingRight: 8},
  selectAllText: {fontSize: 14, color: colors.ink},
  cartPhoto: {width: 78, height: 78},
  cartInfo: {flex: 1, marginLeft: 12, gap: 6},
  step: {paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.bg, borderRadius: 5},
  number: {width: 28, textAlign: 'center'},
  line: {paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line},
  amount: {paddingVertical: 8},
  space: {marginTop: 7},
  actions: {borderTopWidth: 1, borderColor: colors.line, marginTop: 12, paddingTop: 12, gap: 25},
  selectHint: {color: colors.red, fontSize: 13, marginTop: 6},
  wide: {flex: 1},
  orderPhoto: {width: 62, height: 62},
});
