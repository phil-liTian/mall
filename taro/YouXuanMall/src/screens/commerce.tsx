import {useEffect, useRef, useState} from 'react'
import {Text, View} from '@tarojs/components'
import {mallApi} from '../lib/api'
import {useSession} from '../lib/session'
import type {Address, CartItem, Order} from '../lib/types'
import {money, orderStatus} from '../lib/types'
import {Button, Field, Header, Loading, Message, Page, Photo, confirm, toast, useLoad} from '../lib/ui'

function attributes(value?: string) {
  try {const list = JSON.parse(value || '[]') as {key: string; value: string}[]
    return Array.isArray(list) ? list.map(item => `${item.key}：${item.value}`).join(' · ') : ''
  } catch {return ''}
}
function errorToast(error: unknown) {toast(error instanceof Error ? error.message : '操作失败，请稍后重试')}

export function Cart() {
  const {member, guard, navigate, tab} = useSession()
  const {data, loading, error, reload} = useLoad(() => member ? mallApi.cart() : Promise.resolve([] as CartItem[]), [member?.id])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [updating, setUpdating] = useState(false)
  const items = data || []
  const checked = items.filter(item => selected[item.id] !== false)
  const total = checked.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const quantity = async (item: CartItem, next: number) => {
    if (updating || next < 1) return
    setUpdating(true)
    try {await mallApi.quantity(item.id, next); reload()}
    catch (cause) {errorToast(cause)} finally {setUpdating(false)}
  }
  const remove = async (id: number) => {
    if (!await confirm('移除商品', '确定从购物车删除这件商品？')) return
    try {await mallApi.deleteCart([id]); reload()}
    catch (cause) {errorToast(cause)}
  }
  return <><Header title={`购物车 ${member ? `(${items.length})` : ''}`} /><Page footer={member && items.length ? <>
    <View className='row' onClick={() => setSelected(Object.fromEntries(items.map(item => [item.id, checked.length !== items.length])))}>
      <Text className={`checkbox ${checked.length === items.length ? 'on' : ''}`}>{checked.length === items.length ? '✓' : ''}</Text><Text>全选</Text>
    </View><Text className='price'>{money(total)}</Text>
    <Button title={`结算 (${checked.length})`} disabled={!checked.length || updating}
      onClick={() => navigate({name: 'checkout', cartIds: checked.map(item => item.id)})} />
  </> : undefined}>
    {!member ? <View className='center'><Message text='登录后即可查看购物车' /><Button title='去登录' onClick={guard} /></View> : <>
      {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
      {!loading && !error && !items.length ? <View className='center'>
        <Message text='购物车还空着，去挑几件好物吧' /><Button title='去逛逛' onClick={() => tab('home')} /></View> : null}
      {items.map(item => <View key={item.id} className='panel row'>
        <Text className={`checkbox ${selected[item.id] !== false ? 'on' : ''}`}
          onClick={() => setSelected(previous => ({...previous, [item.id]: previous[item.id] === false}))}>
          {selected[item.id] !== false ? '✓' : ''}</Text>
        <View onClick={() => navigate({name: 'product', id: item.productId})}><Photo uri={item.productPic} /></View>
        <View className='grow'><Text className='title'>{item.productName}</Text>
          <Text className='muted'>{attributes(item.productAttr)}</Text><Text className='price'>{money(item.price)}</Text>
          <View className='between space'><View className='row'>
            <Text className='step' onClick={() => quantity(item, item.quantity - 1)}>−</Text><Text>{item.quantity}</Text>
            <Text className='step' onClick={() => quantity(item, item.quantity + 1)}>＋</Text>
          </View><Text className='muted' onClick={() => remove(item.id)}>删除</Text></View>
        </View>
      </View>)}
    </>}
  </Page></>
}

function AmountRow({label, value}: {label: string; value?: number}) {
  return <View className='between line'><Text className='muted'>{label}</Text><Text>{money(value)}</Text></View>
}
export function Checkout({cartIds}: {cartIds: number[]}) {
  const {back, navigate, replace, selectedAddressId} = useSession()
  const {data, loading, error, reload} = useLoad(() => mallApi.confirmOrder(cartIds), [cartIds.join(',')])
  const [submitting, setSubmitting] = useState(false)
  const address = data?.memberReceiveAddressList?.find(a => a.id === selectedAddressId)
    || data?.memberReceiveAddressList?.find(a => a.defaultStatus === 1) || data?.memberReceiveAddressList?.[0]
  const submit = async () => {
    if (submitting || !address?.id) {if (!address) toast('请先添加收货地址'); return}
    setSubmitting(true)
    try {const created = await mallApi.createOrder(cartIds, address.id); replace({name: 'order', id: created.order.id})}
    catch (cause) {errorToast(cause)} finally {setSubmitting(false)}
  }
  return <><Header title='确认订单' onBack={back} /><Page footer={data ? <>
    <Text className='price'>实付款 {money(data.calcAmount?.payAmount)}</Text>
    <Button title={submitting ? '提交中…' : '提交订单'} disabled={submitting || !address?.id} onClick={submit} />
  </> : undefined}>
    {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
    {data ? <>
      <View className='panel' onClick={() => navigate({name: 'addresses'})}>
        <Text className='title'>📍 {address ? `${address.name}  ${address.phoneNumber}` : '添加收货地址  ›'}</Text>
        {address ? <Text className='muted space'>{address.province}{address.city}{address.region}{address.detailAddress} ›</Text> : null}
      </View>
      <View className='panel'><Text className='title'>商品清单</Text>{data.cartPromotionItemList?.map((item, i) =>
        <View key={`${item.id}-${i}`} className='row line'><Photo uri={item.productPic} />
          <View className='grow'><Text>{item.productName}</Text><Text className='muted'>{attributes(item.productAttr)} ×{item.quantity}</Text>
            <Text className='price'>{money(item.price)}</Text></View></View>)}</View>
      <View className='panel'><AmountRow label='商品合计' value={data.calcAmount?.totalAmount} />
        <AmountRow label='运费' value={data.calcAmount?.freightAmount} />
        <AmountRow label='活动优惠' value={-(data.calcAmount?.promotionAmount || 0)} />
        <Text className='muted space'>创建订单后为待付款状态；当前应用尚未接入支付渠道。</Text>
      </View>
    </> : null}
  </Page></>
}

export function Addresses() {
  const {back, navigate, selectAddress} = useSession()
  const {data, loading, error, reload} = useLoad(() => mallApi.addresses(), [])
  const remove = async (id: number) => {
    if (!await confirm('删除地址', '确定删除这个收货地址？')) return
    try {await mallApi.deleteAddress(id); reload()}
    catch (cause) {errorToast(cause)}
  }
  return <><Header title='收货地址' onBack={back} /><Page footer={<Button title='＋ 新增收货地址' onClick={() => navigate({name: 'addressForm'})} />}>
    {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
    {!loading && !error && !data?.length ? <Message text='还没有收货地址' /> : null}
    {data?.map(address => <View key={address.id} className='panel'>
      <View onClick={() => {if (address.id) selectAddress(address.id)}}>
        <Text className='title'>{address.name}　{address.phoneNumber} {address.defaultStatus ? ' 默认' : ''}</Text>
        <Text className='muted space'>{address.province}{address.city}{address.region}{address.detailAddress}</Text>
        <Text className='link space'>选择此地址</Text>
      </View><View className='row line'>
        <Text onClick={() => navigate({name: 'addressForm', id: address.id})}>编辑</Text>
        {address.id ? <Text onClick={() => remove(address.id!)}>删除</Text> : null}
      </View>
    </View>)}
  </Page></>
}

export function AddressForm({id}: {id?: number}) {
  const {back} = useSession()
  const {data, loading, error} = useLoad(() => id ? mallApi.address(id) : Promise.resolve(undefined), [id])
  const [form, setForm] = useState<Address>({name: '', phoneNumber: '', province: '', city: '', region: '', detailAddress: '', defaultStatus: 0})
  const [saving, setSaving] = useState(false)
  useEffect(() => {if (data) setForm(data)}, [data])
  const edit = (key: keyof Address, value: string) => setForm(previous => ({...previous, [key]: value}))
  const save = async () => {
    if (!form.name.trim() || !/^1[3-9]\d{9}$/.test(form.phoneNumber) ||
      !form.province.trim() || !form.city.trim() || !form.region.trim() || !form.detailAddress.trim()) {
      toast('请填写姓名、正确手机号、省市区和详细地址'); return
    }
    setSaving(true)
    try {await mallApi.saveAddress({...form, id}); back()}
    catch (cause) {errorToast(cause)} finally {setSaving(false)}
  }
  return <><Header title={id ? '编辑收货地址' : '新增收货地址'} onBack={back} /><Page footer={
    <Button title={saving ? '保存中…' : '保存地址'} disabled={saving || loading} onClick={save} />}>
    {loading ? <Loading /> : null}{error ? <Message text={error} /> : null}
    {!loading && !error ? <View className='panel'>
      <Field label='收货人' value={form.name} onChange={v => edit('name', v)} />
      <Field label='手机号码' value={form.phoneNumber} onChange={v => edit('phoneNumber', v)} type='number' />
      <Field label='省份 / 直辖市' value={form.province} onChange={v => edit('province', v)} />
      <Field label='城市' value={form.city} onChange={v => edit('city', v)} />
      <Field label='区 / 县' value={form.region} onChange={v => edit('region', v)} />
      <Field label='详细地址' value={form.detailAddress} onChange={v => edit('detailAddress', v)} />
      <Text onClick={() => setForm(previous => ({...previous, defaultStatus: previous.defaultStatus ? 0 : 1}))}>
        {form.defaultStatus ? '☑' : '□'} 设为默认地址</Text>
    </View> : null}
  </Page></>
}

const statuses = [{label: '全部', value: -1}, {label: '待付款', value: 0}, {label: '待收货', value: 2},
  {label: '已完成', value: 3}, {label: '已关闭', value: 4}]
export function Orders({initialStatus}: {initialStatus: number}) {
  const {back, navigate} = useSession()
  const [status, setStatus] = useState(initialStatus)
  const [list, setList] = useState<Order[]>([])
  const [page, setPage] = useState(0)
  const [more, setMore] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const pending = useRef(false)
  const load = async (next: number, filter: number) => {
    if (pending.current && next > 1) return
    pending.current = true; setBusy(true); setError('')
    const id = ++requestId.current
    try {const response = await mallApi.orders(filter, next)
      if (id !== requestId.current) return
      const fetched = response.list || []
      setList(previous => next === 1 ? fetched : [...previous, ...fetched])
      setPage(next); setMore(fetched.length === 5 && next < (response.totalPage || Infinity))
    } catch (cause) {if (id === requestId.current) setError(cause instanceof Error ? cause.message : '加载失败')}
    finally {if (id === requestId.current) {setBusy(false); pending.current = false}}
  }
  useEffect(() => {load(1, status); return () => {requestId.current++; pending.current = false}}, [status]) // eslint-disable-line react-hooks/exhaustive-deps
  return <><Header title='我的订单' onBack={back} />
    <View className='order-tabs'>{statuses.map(item => <Text key={item.value} className={status === item.value ? 'active' : ''}
      onClick={() => {if (status !== item.value) {
        requestId.current++; pending.current = false; setList([]); setPage(0); setMore(true); setStatus(item.value)
      }}}>{item.label}</Text>)}</View>
    <Page onReachBottom={() => {if (more && page && !busy) load(page + 1, status)}}>
      {list.map(order => <View key={order.id} className='panel' onClick={() => navigate({name: 'order', id: order.id})}>
        <View className='between'><Text className='muted'>{order.orderSn}</Text>
          <Text className='link'>{orderStatus(order.status)}</Text></View>
        {order.orderItemList?.slice(0, 2).map(item => <View key={item.id} className='row line'>
          <Photo uri={item.productPic} /><View className='grow'><Text>{item.productName}</Text>
            <Text className='muted'>×{item.productQuantity}</Text></View>
        </View>)}
        <View className='between space'><Text className='muted'>{order.createTime}</Text>
          <Text className='price'>{money(order.payAmount)}</Text></View>
      </View>)}
      {busy ? <Loading /> : null}{error ? <Message text={error} onRetry={() => load(page || 1, status)} /> : null}
      {!busy && !error && !list.length ? <Message text='暂无订单' /> : null}
    </Page></>
}

export function OrderScreen({id}: {id: number}) {
  const {back, navigate} = useSession()
  const {data, loading, error, reload} = useLoad(() => mallApi.order(id), [id])
  const action = async (kind: 'cancel' | 'receive') => {
    if (!await confirm(kind === 'cancel' ? '取消订单' : '确认收货',
      kind === 'cancel' ? '确认取消这笔订单？' : '确认已经收到商品？')) return
    try {if (kind === 'cancel') await mallApi.cancelOrder(id); else await mallApi.receiveOrder(id); reload()}
    catch (cause) {errorToast(cause)}
  }
  return <><Header title='订单详情' onBack={back} /><Page footer={data?.status === 0 || data?.status === 2 ?
    <Button secondary title={data.status === 0 ? '取消订单' : '确认收货'}
      onClick={() => action(data.status === 0 ? 'cancel' : 'receive')} /> : undefined}>
    {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
    {data ? <>
      <View className='panel'><Text className='heading'>{orderStatus(data.status)}</Text>
        <Text className='muted'>订单编号：{data.orderSn}</Text><Text className='muted'>下单时间：{data.createTime}</Text></View>
      <View className='panel'><Text className='title'>{data.receiverName} {data.receiverPhone}</Text>
        <Text className='muted space'>{data.receiverProvince}{data.receiverCity}{data.receiverRegion}{data.receiverDetailAddress}</Text></View>
      <View className='panel'><Text className='title'>商品信息</Text>{data.orderItemList?.map(item =>
        <View key={item.id} className='row line' onClick={() => navigate({name: 'product', id: item.productId})}>
          <Photo uri={item.productPic} /><View className='grow'><Text>{item.productName}</Text>
            <Text className='muted'>×{item.productQuantity}</Text><Text className='price'>{money(item.productPrice)}</Text></View>
        </View>)}</View>
      <View className='panel'><AmountRow label='应付金额' value={data.payAmount} />
        {data.status === 0 ? <Text className='muted'>当前应用未接入支付渠道，请勿将创建订单视为支付成功。</Text> : null}
      </View>
    </> : null}
  </Page></>
}
