import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import type {ImageStyle, StyleProp, ViewStyle} from 'react-native';
import type {Product} from './types';
import {money} from './types';
import {imageUri} from './media';

export const colors = {red: '#DF3C43', ink: '#24252A', muted: '#83878D', bg: '#F6F7F8', line: '#EBEDF0', white: '#FFFFFF'};

export function CartIcon({color = colors.muted}: {color?: string}) {
  const tint = {backgroundColor: color};
  return <View accessible={false} style={s.cartIcon}>
    <View style={[s.cartHandle, tint]} />
    <View style={[s.cartStem, tint]} />
    <View style={[s.cartBasket, tint]} />
    <View style={[s.cartBase, tint]} />
    <View style={[s.cartWheelLeft, tint]} />
    <View style={[s.cartWheelRight, tint]} />
  </View>;
}

export function Button({title, onPress, secondary, disabled, style}: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
    style={[s.button, secondary && s.secondary, disabled && s.disabled, style]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text>
  </Pressable>;
}

export function Header({title, onBack, right}: {title: string; onBack?: () => void; right?: React.ReactNode}) {
  return <View style={s.header}>
    {onBack ? <Pressable accessibilityRole="button" onPress={onBack} style={s.back}><Text style={s.backText}>‹</Text></Pressable> : null}
    <Text style={s.headerTitle}>{title}</Text>
    <View style={s.headerRight}>{right}</View>
  </View>;
}

export function Field({label, value, onChangeText, placeholder, secureTextEntry, keyboardType}: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string;
  secureTextEntry?: boolean; keyboardType?: 'default' | 'phone-pad' | 'number-pad';
}) {
  return <View style={s.field}><Text style={s.fieldLabel}>{label}</Text>
    <TextInput style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder ?? label}
      placeholderTextColor="#A1A5AA" secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize="none" />
  </View>;
}

export function Message({text, onRetry}: {text: string; onRetry?: () => void}) {
  return <View style={s.message}><Text style={s.messageText}>{text}</Text>
    {onRetry ? <Button title="重新加载" secondary onPress={onRetry} style={s.retry} /> : null}</View>;
}

export function Loading() { return <View style={s.loading}><ActivityIndicator color={colors.red} size="large" /></View>; }
export function Photo({uri, style}: {uri?: string; style?: StyleProp<ImageStyle>}) {
  const normalized = imageUri(uri);
  const [attempt, setAttempt] = useState<{uri?: string; useOriginal: boolean; failed: boolean}>({uri: undefined, useOriginal: false, failed: false});
  const current = attempt.uri === uri ? attempt : {uri, useOriginal: false, failed: false};
  const source = current.useOriginal ? uri?.trim() : normalized;
  const canRetryWithHttp = !!uri && uri.trim().startsWith('http://') && normalized?.startsWith('https://');
  return source && !current.failed ? <Image source={{uri: source}} style={[s.photo, style]} resizeMode="cover"
    onError={() => {
      if (canRetryWithHttp && !current.useOriginal) setAttempt({uri, useOriginal: true, failed: false});
      else setAttempt({uri, useOriginal: current.useOriginal, failed: true});
    }} />
    : <View style={[s.photo, s.photoEmpty, style]}><Text style={s.photoIcon}>{uri ? '图片加载失败' : '好物'}</Text></View>;
}

export function ProductCard({product, onPress}: {product: Product; onPress: () => void}) {
  return <Pressable onPress={onPress} style={s.product} accessibilityRole="button">
    <Photo uri={product.pic} style={s.productPhoto} />
    <View style={s.productBody}>
      <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={s.productSub} numberOfLines={1}>{product.subTitle || product.brandName || '优选好物'}</Text>
      <Text style={s.price}>{money(product.price)}</Text>
    </View>
  </Pressable>;
}

export function Chips({items}: {items: {label: string; selected: boolean; onPress: () => void}[]}) {
  return <ScrollView horizontal style={s.chipsViewport} showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
    {items.map((item, i) => <Pressable key={`${item.label}-${i}`} onPress={item.onPress}
      style={[s.chip, item.selected && s.chipActive]}>
      <Text style={[s.chipText, item.selected && s.chipTextActive]}>{item.label}</Text>
    </Pressable>)}
  </ScrollView>;
}

// Keyed screens remount on navigation; this hook cancels state updates when leaving a screen.
export function useLoad<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    load().then(value => {if (active) setData(value);}).catch(e => {
      if (active) setError(e instanceof Error ? e.message : '加载失败');
    }).finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
    // Caller passes stable navigation parameters as dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, revision]);
  return {data, loading, error, reload: () => setRevision(n => n + 1)};
}

export const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 16, paddingBottom: 28},
  panel: {backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14},
  row: {flexDirection: 'row', alignItems: 'center'},
  between: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  heading: {fontSize: 21, fontWeight: '800', color: colors.ink, marginBottom: 12},
  title: {fontSize: 17, fontWeight: '700', color: colors.ink},
  body: {fontSize: 14, color: colors.ink},
  hint: {fontSize: 13, lineHeight: 20, color: colors.muted},
  price: {fontSize: 19, color: colors.red, fontWeight: '800'},
  button: {backgroundColor: colors.red, borderRadius: 24, minHeight: 46, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center'},
  buttonText: {color: colors.white, fontSize: 15, fontWeight: '700'},
  secondary: {backgroundColor: '#FFF2F2', borderColor: '#F9D8D8', borderWidth: 1},
  secondaryText: {color: colors.red},
  disabled: {opacity: 0.45},
  header: {minHeight: 50, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderColor: colors.line},
  headerTitle: {fontSize: 17, fontWeight: '700', color: colors.ink},
  back: {position: 'absolute', left: 12, paddingHorizontal: 10, zIndex: 1},
  backText: {fontSize: 31, color: colors.ink, lineHeight: 38},
  headerRight: {position: 'absolute', right: 16},
  field: {marginBottom: 14},
  fieldLabel: {fontSize: 13, color: colors.ink, marginBottom: 7, fontWeight: '600'},
  input: {borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, minHeight: 48, paddingHorizontal: 14, fontSize: 15, color: colors.ink},
  message: {padding: 32, alignItems: 'center'},
  messageText: {fontSize: 14, lineHeight: 22, color: colors.muted, textAlign: 'center'},
  retry: {marginTop: 14},
  loading: {paddingVertical: 36},
  photo: {backgroundColor: '#F2F3F4', width: 86, height: 86, borderRadius: 12},
  photoEmpty: {justifyContent: 'center', alignItems: 'center'},
  photoIcon: {color: colors.muted, fontWeight: '700'},
  cartIcon: {width: 28, height: 27},
  cartHandle: {position: 'absolute', left: 1, top: 4, width: 7, height: 2, borderRadius: 1},
  cartStem: {position: 'absolute', left: 7, top: 4, width: 2, height: 16, borderRadius: 1},
  cartBasket: {position: 'absolute', left: 9, top: 7, width: 18, height: 11, borderRadius: 2},
  cartBase: {position: 'absolute', left: 7, top: 19, width: 20, height: 2, borderRadius: 1},
  cartWheelLeft: {position: 'absolute', left: 10, top: 23, width: 4, height: 4, borderRadius: 2},
  cartWheelRight: {position: 'absolute', left: 22, top: 23, width: 4, height: 4, borderRadius: 2},
  product: {width: '48%', backgroundColor: colors.white, borderRadius: 15, marginBottom: 12, overflow: 'hidden'},
  productPhoto: {width: '100%', height: 156, borderRadius: 0},
  productBody: {padding: 11},
  productName: {fontSize: 14, fontWeight: '600', color: colors.ink, minHeight: 38},
  productSub: {color: colors.muted, fontSize: 11, marginTop: 5, marginBottom: 8},
  chipsViewport: {height: 54, flexGrow: 0},
  chips: {height: 54, paddingHorizontal: 14, gap: 8, alignItems: 'center'},
  chip: {minHeight: 36, justifyContent: 'center', paddingHorizontal: 15,
    backgroundColor: colors.white, borderRadius: 18, borderColor: colors.line, borderWidth: 1},
  chipActive: {backgroundColor: '#FFF0F1', borderColor: colors.red},
  chipText: {fontSize: 13, lineHeight: 18, color: colors.ink},
  chipTextActive: {color: colors.red, fontWeight: '700'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  footer: {backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
});
