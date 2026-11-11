import {useEffect, useRef, useState} from 'react'
import {Input, ScrollView, Text, View} from '@tarojs/components'
import {mallApi} from '../lib/api'
import {useSession} from '../lib/session'
import type {Product, Sku} from '../lib/types'
import {money} from '../lib/types'
import {Button, Chips, Header, Loading, Message, Page, Photo, ProductCard, toast, useLoad} from '../lib/ui'

export function Home() {
  const {navigate, tab} = useSession()
  const {data, loading, error, reload} = useLoad(() => mallApi.home(), [])
  const [list, setList] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [more, setMore] = useState(true)
  const [busy, setBusy] = useState(false)
  const [listError, setListError] = useState('')
  const pending = useRef(false)
  const requestId = useRef(0)
  const load = async (next: number) => {
    if (pending.current) return
    pending.current = true; setBusy(true); setListError('')
    const id = ++requestId.current
    try {
      const products = await mallApi.recommend(next)
      if (id !== requestId.current) return
      setList(previous => next === 1 ? products : [...previous, ...products]); setPage(next); setMore(products.length === 8)
    } catch (cause) {if (id === requestId.current) setListError(cause instanceof Error ? cause.message : '加载失败')}
    finally {if (id === requestId.current) {setBusy(false); pending.current = false}}
  }
  useEffect(() => {load(1); return () => {requestId.current++}}, []) // eslint-disable-line react-hooks/exhaustive-deps
  const section = (title: string, products?: Product[]) => products?.length ? <View className='section'>
    <Text className='heading'>{title}</Text><View className='grid'>{products.map(p =>
      <ProductCard key={p.id} product={p} onClick={() => navigate({name: 'product', id: p.id})} />)}</View>
  </View> : null
  const hero = data?.advertiseList?.[0]
  return <Page onReachBottom={() => {if (more && page && !busy) load(page + 1)}}>
    <View className='hero'><Text className='hero-name'>优选商城</Text><Text className='hero-note'>用心挑选每一件好物</Text>
      <View className='search-bar' onClick={() => navigate({name: 'search'})}>⌕  搜索你想要的商品</View></View>
    {hero?.pic ? <View onClick={() => navigate({name: 'search'})}><Photo uri={hero.pic} className='banner' /></View> : null}
    <View className='panel shortcuts'>
      {([{icon: '☷', label: '全部分类'}, {icon: '✦', label: '人气热卖'}, {icon: '✧', label: '新品上市'}]).map(item =>
        <View key={item.label} className='shortcut' onClick={() => item.label === '全部分类' ? tab('categories') :
          navigate({name: 'search', title: item.label, feed: item.label === '人气热卖' ? 'hot' : 'new'})}>
          <Text className='shortcut-icon'>{item.icon}</Text><Text>{item.label}</Text></View>)}
    </View>
    {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
    {section('限时精选', data?.homeFlashPromotion?.productList)}
    {section('人气推荐', data?.hotProductList)}{section('新品好物', data?.newProductList)}
    <Text className='heading'>猜你喜欢</Text><View className='grid'>{list.map((p, i) =>
      <ProductCard key={`${p.id}-${i}`} product={p} onClick={() => navigate({name: 'product', id: p.id})} />)}</View>
    {busy ? <Loading /> : null}{listError ? <Message text={listError} onRetry={() => load(page || 1)} /> : null}
    {!busy && !error && !list.length && !listError ? <Message text='暂无推荐商品' /> : null}
  </Page>
}

export function Categories() {
  const {navigate} = useSession()
  const {data: roots, loading, error, reload} = useLoad(() => mallApi.categories(0), [])
  const [current, setCurrent] = useState<number>()
  useEffect(() => {if (roots?.length && current === undefined) setCurrent(roots[0].id)}, [roots, current])
  const {data: children, loading: childrenLoading, error: childrenError, reload: retry} = useLoad(() =>
    current === undefined ? Promise.resolve([]) : mallApi.categories(current), [current])
  return <><Header title='商品分类' /><View className='category-body'>
    <ScrollView scrollY className='category-side'>
      {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
      {roots?.map(item => <View key={item.id} className={`category-item ${item.id === current ? 'active' : ''}`}
        onClick={() => setCurrent(item.id)}>{item.name}</View>)}
    </ScrollView>
    <ScrollView scrollY className='category-main'><View className='wrap'>
      {childrenLoading ? <Loading /> : null}{childrenError ? <Message text={childrenError} onRetry={retry} /> : null}
      {children?.map(item => <View key={item.id} className='category-tile' onClick={() =>
        navigate({name: 'search', categoryId: item.id, title: item.name})}>
        <Photo uri={item.icon} /><Text>{item.name}</Text>
      </View>)}
    </View></ScrollView>
  </View></>
}

export function Search({keyword = '', categoryId, title, feed}: {
  keyword?: string; categoryId?: number; title?: string; feed?: 'hot' | 'new'
}) {
  const {back, navigate} = useSession()
  const [input, setInput] = useState(keyword)
  const [term, setTerm] = useState(keyword)
  const [sort, setSort] = useState(0)
  const [list, setList] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [more, setMore] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const requestId = useRef(0)
  const load = async (next: number, query: string, order: number) => {
    if (pending.current && next > 1) return
    pending.current = true; setBusy(true); setError('')
    const id = ++requestId.current
    try {
      const result = feed && !query ? {list: await (feed === 'hot' ? mallApi.hot(next) : mallApi.new(next)), totalPage: Infinity}
        : await mallApi.search({keyword: query || undefined, productCategoryId: categoryId, sort: order, pageNum: next})
      if (id !== requestId.current) return
      const fetched = result.list || []
      setList(previous => next === 1 ? fetched : [...previous, ...fetched]); setPage(next)
      setMore(fetched.length >= 10 && next < (result.totalPage || Infinity))
    } catch (cause) {if (id === requestId.current) setError(cause instanceof Error ? cause.message : '加载失败')}
    finally {if (id === requestId.current) {pending.current = false; setBusy(false)}}
  }
  useEffect(() => {load(1, term, sort); return () => {requestId.current++; pending.current = false}},
    [term, sort, categoryId, feed]) // eslint-disable-line react-hooks/exhaustive-deps
  const reset = () => {requestId.current++; pending.current = false; setList([]); setPage(0); setMore(true)}
  const submit = () => {reset(); const next = input.trim(); if (next === term) load(1, next, sort); else setTerm(next)}
  return <><Header title={title || '搜索商品'} onBack={back} />
    <View className='search-form'><Input className='input' value={input} placeholder='搜索商品名称'
      confirmType='search' onConfirm={submit} onInput={event => setInput(event.detail.value)} />
      <Button title='搜索' onClick={submit} /></View>
    {!feed || !!term ? <View className='filters'>
      {([['综合', 0], ['销量', 2], ['价格↑', 3], ['价格↓', 4]] as [string, number][]).map(([label, value]) =>
        <Text key={value} className={sort === value ? 'active' : ''} onClick={() => {if (sort !== value) {reset(); setSort(value)}}}>
          {label}</Text>)}
    </View> : null}
    <Page onReachBottom={() => {if (more && page && !busy) load(page + 1, term, sort)}}>
      <View className='grid'>{list.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate({name: 'product', id: p.id})} />)}</View>
      {busy ? <Loading /> : null}{error ? <Message text={error} onRetry={() => load(page || 1, term, sort)} /> : null}
      {!busy && !error && !list.length ? <Message text='没有找到相关商品，换个关键词试试' /> : null}
    </Page>
  </>
}

function skuAttrs(sku: Sku): {key: string; value: string}[] {
  try {const parsed: unknown = JSON.parse(sku.spData || '[]')
    return Array.isArray(parsed) ? parsed.filter(item => typeof item?.key === 'string' && typeof item?.value === 'string') : []
  } catch {return []}
}
export function ProductScreen({id}: {id: number}) {
  const {back, tab, guard} = useSession()
  const {data, loading, error, reload} = useLoad(() => mallApi.product(id), [id])
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const product = data?.product
  const skus = data?.skuStockList || []
  const dimensions = new Map<string, string[]>()
  skus.forEach(sku => skuAttrs(sku).forEach(({key, value}) => {
    const values = dimensions.get(key) || []
    if (!values.includes(value)) values.push(value)
    dimensions.set(key, values)
  }))
  const chosen = skus.find(sku => sku.stock > (sku.lockStock || 0) && [...dimensions.keys()].every(key =>
    skuAttrs(sku).some(attr => attr.key === key && attr.value === (selected[key] || dimensions.get(key)?.[0]))))
  const images = [product?.pic, ...(product?.albumPics?.split(',') || [])].filter((item): item is string => !!item)
  const add = async () => {
    if (!guard() || !product || busy) return
    if (!chosen) {toast('该规格暂无库存'); return}
    if (quantity > chosen.stock - (chosen.lockStock || 0)) {toast('购买数量超过可用库存'); return}
    setBusy(true)
    try {
      await mallApi.addCart({productId: product.id, productName: product.name, productPic: product.pic,
        productBrand: product.brandName, productCategoryId: product.productCategoryId,
        productSkuId: chosen.id, productSkuCode: chosen.skuCode, productSn: product.productSn,
        productSubTitle: product.subTitle, productAttr: chosen.spData || '[]', price: product.price, quantity})
      toast('已成功加入购物车')
    } catch (cause) {toast(cause instanceof Error ? cause.message : '加入购物车失败')}
    finally {setBusy(false)}
  }
  return <><Header title='商品详情' onBack={back} /><Page footer={product ? <>
    <Text className='link' onClick={() => tab('cart')}>🛒 购物车</Text>
    <Button title={busy ? '添加中…' : '加入购物车'} disabled={busy || !chosen} onClick={add} />
  </> : undefined}>
    {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
    {product ? <>
      <ScrollView scrollX className='detail-scroll'><View className='row'>
        {images.map((uri, i) => <Photo key={`${uri}-${i}`} uri={uri} className='detail-photo' />)}
      </View></ScrollView>
      <View className='panel'><Text className='heading'>{product.name}</Text><Text className='muted'>{product.subTitle}</Text>
        <Text className='price space'>{money(chosen?.price || product.price)}</Text>
        <Text className='muted space'>销量 {product.sale || 0} · {product.brandName || '优选好物'}</Text></View>
      <View className='panel'><Text className='title'>选择规格</Text>
        {[...dimensions].map(([name, options]) => <View key={name} className='space'>
          <Text className='muted'>{name}</Text><Chips items={options.map(value => ({label: value,
            selected: (selected[name] || options[0]) === value,
            onClick: () => {setSelected(previous => ({...previous, [name]: value})); setQuantity(1)}}))} />
        </View>)}
        {!skus.length ? <Text className='muted space'>暂无可购买的规格</Text> : null}
        <View className='between space'><Text>购买数量</Text><View className='row'>
          <Text className='step' onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Text>
          <Text>{quantity}</Text><Text className='step' onClick={() => setQuantity(Math.min(99, chosen ? chosen.stock - (chosen.lockStock || 0) : 1, quantity + 1))}>＋</Text>
        </View></View><Text className='muted space'>可用库存 {chosen ? chosen.stock - (chosen.lockStock || 0) : 0}</Text>
      </View>
    </> : null}
  </Page></>
}
