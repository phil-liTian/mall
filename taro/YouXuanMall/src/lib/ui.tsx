import {useCallback, useEffect, useRef, useState} from 'react'
import {Image, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type {Product} from './types'
import {money} from './types'
import {imageUri} from './media'

export function Button({title, onClick, secondary, disabled}: {title: string; onClick: () => void; secondary?: boolean; disabled?: boolean}) {
  return <View className={`button ${secondary ? 'button-outline' : ''} ${disabled ? 'disabled' : ''}`}
    onClick={() => {if (!disabled) onClick()}}><Text>{title}</Text></View>
}
export function Header({title, onBack, right}: {title: string; onBack?: () => void; right?: React.ReactNode}) {
  return <View className='header'>
    {onBack ? <Text className='back' onClick={onBack}>‹</Text> : null}
    <Text className='header-title'>{title}</Text>{right}
  </View>
}
export function Field({label, value, onChange, type = 'text', placeholder, password}: {
  label: string; value: string; onChange: (value: string) => void; type?: 'text' | 'number' | 'digit'; placeholder?: string; password?: boolean
}) {
  return <View className='field'><Text className='field-label'>{label}</Text>
    <Input value={value} type={type} password={password} placeholder={placeholder || `请输入${label}`}
      onInput={event => onChange(event.detail.value)} className='field-input' />
  </View>
}
export function Photo({uri, className = ''}: {uri?: string; className?: string}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {setFailed(false)}, [uri])
  return <View className={`photo ${className}`}>
    {uri && !failed ? <Image src={imageUri(uri)} mode='aspectFill' className='photo-img' onError={() => setFailed(true)} />
      : <Text className='photo-empty'>暂无图片</Text>}
  </View>
}
export function ProductCard({product, onClick}: {product: Product; onClick: () => void}) {
  return <View className='product-card' onClick={onClick}>
    <Photo uri={product.pic} className='product-picture' />
    <Text className='product-name'>{product.name}</Text>
    <View className='between'><Text className='price'>{money(product.promotionPrice || product.price)}</Text>
      <Text className='muted small'>销量 {product.sale || 0}</Text></View>
  </View>
}
export function Chips({items}: {items: {label: string; selected: boolean; onClick: () => void}[]}) {
  return <View className='chips'>{items.map((item, index) => <Text key={`${item.label}-${index}`}
    className={`chip ${item.selected ? 'chip-active' : ''}`} onClick={item.onClick}>{item.label}</Text>)}</View>
}
export function Message({text, onRetry}: {text: string; onRetry?: () => void}) {
  return <View className='message'><Text>{text}</Text>{onRetry ? <Text className='link' onClick={onRetry}>点击重试</Text> : null}</View>
}
export function Loading() {return <View className='message'><Text>加载中…</Text></View>}
export function Page({children, footer, onReachBottom}: {children: React.ReactNode; footer?: React.ReactNode; onReachBottom?: () => void}) {
  return <View className='page'><ScrollView scrollY className='page-scroll' lowerThreshold={120} onScrollToLower={onReachBottom}>
    <View className='page-content'>{children}</View></ScrollView>
    {footer ? <View className='page-footer'>{footer}</View> : null}</View>
}

export function useLoad<T>(loader: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const current = useRef(loader)
  current.current = loader
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    current.current().then(value => {if (active) setData(value)}).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : '加载失败')
    }).finally(() => {if (active) setLoading(false)})
    return () => {active = false}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, revision])
  const reload = useCallback(() => setRevision(value => value + 1), [])
  return {data, loading, error, reload}
}
export function toast(title: string) {Taro.showToast({title, icon: 'none', duration: 2200})}
export async function confirm(title: string, content: string) {
  const result = await Taro.showModal({title, content, confirmColor: '#DF3C43'})
  return result.confirm
}
