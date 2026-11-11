import React, {useEffect, useRef, useState} from 'react';
import {Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {mallApi} from './api';
import {useSession} from './session';
import {Button, CartIcon, Chips, colors, Header, Loading, Message, Photo, ProductCard, s, useLoad} from './ui';
import type {Category, Page, Product, Sku} from './types';
import {money} from './types';

export function Home() {
  const {navigate, tab} = useSession();
  const {data, loading, error, reload} = useLoad(() => mallApi.home(), []);
  const [list, setList] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recommendError, setRecommendError] = useState('');
  const loadingRef = useRef(false);
  const requestId = useRef(0);
  const loadRecommend = async (next: number) => {
    if (loadingRef.current && next > 1) return;
    const id = ++requestId.current;
    loadingRef.current = true;
    setBusy(true);
    setRecommendError('');
    try {
      const products = await mallApi.recommend(next);
      if (id !== requestId.current) return;
      setList(previous => next === 1 ? products : [...previous, ...products]);
      setPage(next);
      setMore(products.length === 8);
    } catch (e) {
      if (id === requestId.current) setRecommendError(e instanceof Error ? e.message : '加载推荐商品失败');
    } finally {if (id === requestId.current) {loadingRef.current = false; setBusy(false);}}
  };
  useEffect(() => {loadRecommend(1); return () => {requestId.current++;};}, []); // eslint-disable-line react-hooks/exhaustive-deps
  const hero = data?.advertiseList?.[0];
  const section = (title: string, products?: Product[]) => products?.length ? <View style={local.section}>
    <Text style={s.heading}>{title}</Text>
    <View style={s.grid}>{products.map(p => <ProductCard key={p.id} product={p} onPress={() => navigate({name: 'product', id: p.id})} />)}</View>
  </View> : null;
  return <View style={s.page}>
    <ScrollView refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={() => {reload(); loadRecommend(1);}} />}
      onScroll={({nativeEvent}) => {const {contentOffset, layoutMeasurement, contentSize} = nativeEvent;
        if (page > 0 && more && !loadingRef.current && contentOffset.y + layoutMeasurement.height >= contentSize.height - 160) loadRecommend(page + 1);
      }} scrollEventThrottle={220}>
      <View style={local.hero}>
        <Text style={local.logo}>优选商城</Text><Text style={local.tagline}>用心挑选每一件好物</Text>
        <Pressable style={local.searchBox} onPress={() => navigate({name: 'search'})}>
          <Text style={s.hint}>⌕  搜索你想要的商品</Text>
        </Pressable>
      </View>
      <View style={s.scroll}>
        {hero?.pic ? <Pressable onPress={() => navigate({name: 'search'})} style={local.banner}><Photo uri={hero.pic} style={local.bannerImage} /></Pressable> : null}
        <View style={[s.panel, s.between]}>
          {[['☷', '全部分类'], ['✦', '人气热卖'], ['✧', '新品上市']].map(([icon, label]) => <Pressable key={label}
            style={local.shortcut} onPress={() => label === '全部分类' ? tab('categories') : navigate({name: 'search', title: label, feed: label === '人气热卖' ? 'hot' : 'new'})}>
            <Text style={local.shortcutIcon}>{icon}</Text><Text style={s.body}>{label}</Text></Pressable>)}
        </View>
        {loading && !data ? <Loading /> : null}
        {error ? <Message text={error} onRetry={reload} /> : null}
        {section('限时精选', data?.homeFlashPromotion?.productList)}
        {section('人气推荐', data?.hotProductList)}
        {section('新品好物', data?.newProductList)}
        <Text style={s.heading}>猜你喜欢</Text>
        <View style={s.grid}>{list.map((p, i) => <ProductCard key={`${p.id}-${i}`} product={p} onPress={() => navigate({name: 'product', id: p.id})} />)}</View>
        {busy ? <Loading /> : null}
        {recommendError ? <Message text={recommendError} onRetry={() => loadRecommend(page || 1)} /> : null}
        {!busy && !recommendError && !list.length && !error && !loading ? <Message text="暂无推荐商品" /> : null}
        {!more && list.length > 0 ? <Text style={local.end}>已经到底啦</Text> : null}
      </View>
    </ScrollView>
  </View>;
}

export function Categories() {
  const {navigate} = useSession();
  const {data: roots, loading, error, reload} = useLoad(() => mallApi.categories(0), []);
  const [current, setCurrent] = useState<number>();
  useEffect(() => {if (roots?.length && current === undefined) setCurrent(roots[0].id);}, [roots, current]);
  const {data: children, loading: childrenLoading, error: childrenError, reload: reloadChildren} = useLoad(() => current === undefined ? Promise.resolve([] as Category[]) : mallApi.categories(current), [current]);
  return <View style={s.page}><Header title="商品分类" />
    {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
    <View style={local.categories}>
      <ScrollView style={local.categoryLeft}>{roots?.map(item => <Pressable key={item.id}
        style={[local.categoryTab, item.id === current && local.categorySelected]} onPress={() => setCurrent(item.id)}>
        <Text style={[s.body, item.id === current && local.categorySelectedText]}>{item.name}</Text>
      </Pressable>)}</ScrollView>
      <ScrollView style={local.categoryRight} contentContainerStyle={local.categoryGrid}>
        {childrenLoading ? <Loading /> : null}
        {childrenError ? <Message text={childrenError} onRetry={reloadChildren} /> : null}
        {children?.map(item => <Pressable key={item.id} style={local.categoryTile} onPress={() => navigate({name: 'search', categoryId: item.id, title: item.name})}>
          <Photo uri={item.icon} style={local.categoryPhoto} /><Text style={s.body}>{item.name}</Text>
        </Pressable>)}
        {current && children?.length === 0 && !childrenLoading && !childrenError ? <Message text="暂无子分类" /> : null}
      </ScrollView>
    </View>
  </View>;
}

export function Search({keyword = '', categoryId, title, feed}: {keyword?: string; categoryId?: number; title?: string; feed?: 'hot' | 'new'}) {
  const {navigate, back} = useSession();
  const [input, setInput] = useState(keyword);
  const [term, setTerm] = useState(keyword);
  const [sort, setSort] = useState(0);
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const pending = useRef(false);
  const submitSearch = () => {
    const next = input.trim();
    requestId.current++; pending.current = false;
    setItems([]); setPage(0); setHasMore(true); setBusy(true); setError('');
    if (next === term) fetchPage(1, next, sort);
    else setTerm(next);
  };
  const fetchPage = async (next: number, q: string, order: number) => {
    if (pending.current && next > 1) return;
    pending.current = true;
    setBusy(true); setError('');
    const id = ++requestId.current;
    try {
      const result: Page<Product> = feed && !q ? {
        list: await (feed === 'hot' ? mallApi.hot(next) : mallApi.new(next)),
        pageNum: next, totalPage: Infinity, total: Infinity,
      } : await mallApi.search({keyword: q || undefined, productCategoryId: categoryId, sort: order, pageNum: next});
      if (id === requestId.current) {
        const nextItems = result?.list ?? [];
        setItems(previous => next === 1 ? nextItems : [...previous, ...nextItems]);
        setPage(next);
        setHasMore(nextItems.length >= 10 && next < (result.totalPage || Infinity));
      }
    } catch (e) {if (id === requestId.current) setError(e instanceof Error ? e.message : '加载失败');}
    finally {if (id === requestId.current) {setBusy(false); pending.current = false;}}
  };
  useEffect(() => {fetchPage(1, term, sort); return () => {requestId.current++; pending.current = false;};}, [term, sort, categoryId, feed]); // eslint-disable-line react-hooks/exhaustive-deps
  const onSort = (order: number) => {if (sort !== order) {
    requestId.current++; pending.current = false;
    setItems([]); setPage(0); setHasMore(true); setBusy(true); setError(''); setSort(order);
  }};
  return <View style={s.page}>
    <Header title={title || '搜索商品'} onBack={back} />
    <View style={local.searchRow}><TextInput style={local.searchInput} value={input} onChangeText={setInput}
      placeholder="搜索商品名称" returnKeyType="search" onSubmitEditing={submitSearch} />
      <Button title="搜索" onPress={submitSearch} /></View>
    {!feed || !!term ? <View style={local.sortBar}>
      {([{label: '综合', value: 0}, {label: '销量', value: 2},
        {label: '价格↑', value: 3}, {label: '价格↓', value: 4}]).map(item =>
        <Pressable key={item.value} accessibilityRole="tab"
          accessibilityState={{selected: sort === item.value}}
          onPress={() => onSort(item.value)} style={local.sortTab}>
          <Text numberOfLines={1} style={[local.sortText, sort === item.value && local.sortTextActive]}>
            {item.label}
          </Text>
          {sort === item.value ? <View style={local.sortUnderline} /> : null}
        </Pressable>)}
    </View> : null}
    <ScrollView onScroll={({nativeEvent}) => {const {contentOffset, layoutMeasurement, contentSize} = nativeEvent;
      if (page > 0 && hasMore && !pending.current && contentOffset.y + layoutMeasurement.height >= contentSize.height - 120) fetchPage(page + 1, term, sort);
    }} scrollEventThrottle={220} contentContainerStyle={s.scroll}>
      <View style={s.grid}>{items.map(p => <ProductCard key={p.id} product={p} onPress={() => navigate({name: 'product', id: p.id})} />)}</View>
      {busy ? <Loading /> : null}{error ? <Message text={error} onRetry={() => fetchPage(page + 1, term, sort)} /> : null}
      {!busy && !error && items.length === 0 ? <Message text="没有找到相关商品，换个关键词试试" /> : null}
      {!hasMore && items.length > 0 ? <Text style={local.end}>已经到底啦</Text> : null}
    </ScrollView>
  </View>;
}

function skuAttributes(sku: Sku): {key: string; value: string}[] {
  try {const parsed: unknown = JSON.parse(sku.spData || '[]');
    return Array.isArray(parsed) ? parsed.filter(v => typeof v?.key === 'string' && typeof v?.value === 'string') : [];
  } catch {return [];}
}

export function ProductScreen({id}: {id: number}) {
  const {back, tab, guard} = useSession();
  const {data, loading, error, reload} = useLoad(() => mallApi.product(id), [id]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{text: string; success: boolean} | null>(null);
  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 2200);
    return () => clearTimeout(timeout);
  }, [feedback]);
  const product: Product | undefined = data?.product;
  const skus = data?.skuStockList ?? [];
  const dimensions = new Map<string, string[]>();
  skus.forEach(sku => skuAttributes(sku).forEach(({key, value}) => {
    const options = dimensions.get(key) ?? [];
    if (!options.includes(value)) options.push(value);
    dimensions.set(key, options);
  }));
  const chosen = skus.find(sku => {
    const attrs = skuAttributes(sku);
    return sku.stock > (sku.lockStock ?? 0) && [...dimensions.keys()].every(key =>
      attrs.some(attr => attr.key === key && attr.value === (selected[key] ?? dimensions.get(key)?.[0])));
  });
  const images = [product?.pic, ...(product?.albumPics?.split(',') ?? [])].filter((v): v is string => !!v);
  const addToCart = async () => {
    if (!guard() || !product) return;
    if (busy) return;
    if (!chosen) {setFeedback({text: '该规格暂无库存', success: false}); return;}
    if (quantity > chosen.stock - (chosen.lockStock ?? 0)) {
      setFeedback({text: '购买数量超过可用库存', success: false}); return;
    }
    setBusy(true); setFeedback(null);
    try {
      await mallApi.addCart({productId: product.id, productName: product.name, productPic: product.pic,
        productBrand: product.brandName, productCategoryId: product.productCategoryId,
        productSkuId: chosen.id, productSkuCode: chosen.skuCode, productSn: product.productSn,
        productSubTitle: product.subTitle, productAttr: chosen.spData || '[]', price: product.price, quantity});
      setFeedback({text: '已成功加入购物车', success: true});
    } catch (e) {setFeedback({text: e instanceof Error ? e.message : '加入购物车失败', success: false});}
    finally {setBusy(false);}
  };
  return <View style={s.page}><Header title="商品详情" onBack={back} />
    <ScrollView contentContainerStyle={s.scroll}>
      {loading ? <Loading /> : null}{error ? <Message text={error} onRetry={reload} /> : null}
      {product ? <>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={local.detailImages}>
          {images.map((uri, i) => <Photo key={`${uri}-${i}`} uri={uri} style={local.detailImage} />)}
        </ScrollView>
        <View style={s.panel}><Text style={local.detailName}>{product.name}</Text>
          <Text style={s.hint}>{product.subTitle || '品质生活，从这里开始'}</Text>
          <Text style={[s.price, local.detailPrice]}>{money(chosen?.price ?? product.price)}</Text>
          <Text style={s.hint}>销量 {product.sale ?? 0} · {product.brandName ?? '优选好物'}</Text></View>
        <View style={s.panel}><Text style={s.title}>选择规格</Text>
          {[...dimensions].map(([key, options]) => <View key={key} style={local.specGroup}>
            <Text style={s.hint}>{key}</Text><Chips items={options.map(value => ({label: value, selected: (selected[key] ?? options[0]) === value,
              onPress: () => {setQuantity(1); setSelected(previous => ({...previous, [key]: value}));}}))} />
          </View>)}
          {!skus.length ? <Text style={s.hint}>暂无可购买的规格</Text> : null}
          <View style={s.between}><Text style={s.body}>购买数量</Text>
            <View style={s.row}><Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={local.step}><Text>−</Text></Pressable>
              <Text style={local.stepValue}>{quantity}</Text><Pressable onPress={() => setQuantity(Math.min(99, chosen?.stock ? chosen.stock - (chosen.lockStock ?? 0) : 1, quantity + 1))} style={local.step}><Text>＋</Text></Pressable></View></View>
          <Text style={s.hint}>可用库存 {chosen ? Math.max(0, chosen.stock - (chosen.lockStock ?? 0)) : 0}</Text>
        </View>
      </> : null}
    </ScrollView>
    {product ? <View style={[s.footer, local.detailFooter]}>
      <Pressable accessibilityRole="button" accessibilityLabel="查看购物车" onPress={() => tab('cart')}
        style={local.cartShortcut}>
        <View style={local.cartShortcutIcon}><CartIcon color={colors.red} /></View>
        <Text style={local.cartShortcutText}>购物车</Text>
      </Pressable>
      <Button title={busy ? '添加中…' : '加入购物车'} disabled={busy || !chosen} onPress={addToCart} style={local.addButton} />
    </View> : null}
    {feedback ? <View pointerEvents="none" accessibilityLiveRegion="polite" style={local.toast}>
      <View style={[local.toastDot, feedback.success ? local.toastSuccess : local.toastError]} />
      <Text style={local.toastText}>{feedback.text}</Text>
    </View> : null}
  </View>;
}

const local = StyleSheet.create({
  hero: {backgroundColor: colors.red, paddingHorizontal: 20, paddingTop: 26, paddingBottom: 35, borderBottomLeftRadius: 26, borderBottomRightRadius: 26},
  logo: {color: colors.white, fontSize: 30, fontWeight: '800'},
  tagline: {color: '#FFE4E5', marginTop: 5, marginBottom: 20},
  searchBox: {borderRadius: 25, backgroundColor: colors.white, padding: 14},
  banner: {marginBottom: 12, borderRadius: 16, overflow: 'hidden'},
  bannerImage: {width: '100%', height: 140, borderRadius: 16},
  shortcut: {alignItems: 'center', gap: 7},
  shortcutIcon: {fontSize: 23, color: colors.red},
  section: {marginBottom: 12},
  end: {textAlign: 'center', color: colors.muted, padding: 16},
  categories: {flex: 1, flexDirection: 'row'},
  categoryLeft: {width: 108, flexGrow: 0, backgroundColor: '#EEEFF1'},
  categoryRight: {flex: 1, backgroundColor: colors.white},
  categoryTab: {paddingVertical: 18, paddingHorizontal: 14},
  categorySelected: {backgroundColor: colors.white, borderLeftColor: colors.red, borderLeftWidth: 3},
  categorySelectedText: {color: colors.red, fontWeight: '700'},
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', padding: 13},
  categoryTile: {width: '33.33%', alignItems: 'center', paddingVertical: 12, gap: 8},
  categoryPhoto: {width: 64, height: 64},
  searchRow: {flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, backgroundColor: colors.white},
  searchInput: {flex: 1, paddingHorizontal: 14, minHeight: 45, borderRadius: 22, backgroundColor: colors.bg, color: colors.ink},
  sortBar: {height: 50, flexDirection: 'row', backgroundColor: colors.white,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line},
  sortTab: {flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center'},
  sortText: {fontSize: 14, lineHeight: 20, color: colors.ink, textAlign: 'center'},
  sortTextActive: {color: colors.red, fontWeight: '700'},
  sortUnderline: {position: 'absolute', bottom: 0, width: 26, height: 2,
    borderRadius: 1, backgroundColor: colors.red},
  detailImages: {backgroundColor: colors.white, borderRadius: 14, marginBottom: 14},
  detailImage: {width: 325, height: 300, borderRadius: 0},
  detailName: {fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 7},
  detailPrice: {marginVertical: 13, fontSize: 27},
  specGroup: {marginVertical: 10},
  step: {paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.bg, borderRadius: 8},
  stepValue: {width: 36, textAlign: 'center', fontSize: 17},
  detailFooter: {paddingHorizontal: 16, paddingVertical: 10, gap: 18},
  cartShortcut: {width: 64, alignItems: 'center', justifyContent: 'center', gap: 4},
  cartShortcutIcon: {width: 35, height: 35, borderRadius: 18, backgroundColor: '#FFF0F1',
    alignItems: 'center', justifyContent: 'center'},
  cartShortcutText: {fontSize: 11, fontWeight: '600', color: colors.ink},
  addButton: {flex: 1, minHeight: 50},
  toast: {position: 'absolute', bottom: 86, alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', gap: 8, maxWidth: '86%', paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 22, backgroundColor: '#2E3038', elevation: 6,
    shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.18, shadowRadius: 7},
  toastDot: {width: 8, height: 8, borderRadius: 4},
  toastSuccess: {backgroundColor: '#69C68D'},
  toastError: {backgroundColor: '#FFAD6A'},
  toastText: {fontSize: 13, color: colors.white, fontWeight: '600'},
});
