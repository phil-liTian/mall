import {useState} from 'react'
import {Input, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useSession} from '../lib/session'
import {alarmTimeError, dateKey, monthCells, parseDate, parseTodos, shiftMonth} from '../lib/planner'
import type {Todo} from '../lib/planner'
import {Button, Field, Header, Page, toast} from '../lib/ui'

const TODO_KEY = 'youxuan_taro_todos'
function readTodos(): Todo[] {
  try {return parseTodos(Taro.getStorageSync(TODO_KEY) || '[]')}
  catch {return []}
}
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
export function Planner() {
  const {back} = useSession()
  const today = dateKey(new Date())
  const [selected, setSelected] = useState(today)
  const [todos, setTodos] = useState(readTodos)
  const [title, setTitle] = useState('')
  const month = parseDate(selected)
  const daily = todos.filter(item => item.date === selected).sort((a, b) => Number(a.done) - Number(b.done))
  const update = (next: Todo[]) => {
    try {Taro.setStorageSync(TODO_KEY, JSON.stringify(next)); setTodos(next)}
    catch {toast('保存失败，请重试')}
  }
  const add = () => {
    if (!title.trim()) {toast('请输入待办内容'); return}
    update([...todos, {id: `${Date.now()}-${Math.random()}`, title: title.trim(), date: selected, done: false}]); setTitle('')
  }
  return <><Header title='日历待办' onBack={back} /><Page>
    <Text className='heading'>给每一天留个计划</Text>
    <Text className='muted'>待办保存在这台设备上，选择日期即可查看和管理。</Text>
    <View className='calendar space'><View className='between'>
      <Text className='step' onClick={() => setSelected(shiftMonth(selected, -1))}>‹</Text>
      <Text className='title'>{month.getFullYear()}年{month.getMonth() + 1}月</Text>
      <Text className='step' onClick={() => setSelected(shiftMonth(selected, 1))}>›</Text>
    </View><View className='calendar-grid'>
      {weekdays.map(day => <View key={day} className='calendar-cell muted'>{day}</View>)}
      {monthCells(selected).map((day, i) => <View key={day ?? `empty-${i}`} className='calendar-cell'
        onClick={() => {if (day) setSelected(day)}}>
        {day ? <><Text className={`calendar-day ${day === selected ? 'selected' : ''}`}>{parseDate(day).getDate()}</Text>
          {todos.some(item => item.date === day && !item.done) ? <View className='calendar-dot' /> : null}</> : null}
      </View>)}
    </View></View>
    {selected !== today ? <Text className='link center' onClick={() => setSelected(today)}>回到今天</Text> : null}
    <View className='panel space'><Text className='title'>{month.getMonth() + 1}月{month.getDate()}日的待办</Text>
      <View className='row space'><Input className='input grow' value={title} maxlength={60} placeholder='添加一件要做的事'
        onInput={event => setTitle(event.detail.value)} onConfirm={add} /><Button title='添加' onClick={add} /></View>
      {daily.length ? daily.map(item => <View key={item.id} className='row line'>
        <Text className={`checkbox ${item.done ? 'on' : ''}`} onClick={() => update(todos.map(todo => todo.id === item.id ? {...todo, done: !todo.done} : todo))}>
          {item.done ? '✓' : ''}</Text>
        <Text className={`grow ${item.done ? 'todo-done' : ''}`}>{item.title}</Text>
        <Text className='link' onClick={() => update(todos.filter(todo => todo.id !== item.id))}>删除</Text>
      </View>) : <Text className='muted center'>这一天还没有待办</Text>}
    </View>
  </Page></>
}

function nextOccurrence(hour: number, minute: number) {
  const date = new Date()
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
  if (next.getTime() <= date.getTime()) next.setDate(next.getDate() + 1)
  return next
}
function icsDate(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`
}
export function AlarmShortcut() {
  const {back} = useSession()
  const [hour, setHour] = useState('07')
  const [minute, setMinute] = useState('00')
  const [message, setMessage] = useState('商城提醒')
  const [busy, setBusy] = useState(false)
  const add = async () => {
    const error = alarmTimeError(hour, minute)
    if (error) {toast(error); return}
    if (busy) return
    const next = nextOccurrence(Number(hour), Number(minute))
    const title = message.trim() || '商城提醒'
    setBusy(true)
    try {
      if (process.env.TARO_ENV === 'h5') {
        const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//YouXuanMall//Reminder//CN\r\nBEGIN:VEVENT\r\nUID:${Date.now()}@youxuan-mall\r\nDTSTART:${icsDate(next)}\r\nDTEND:${icsDate(new Date(next.getTime() + 60000))}\r\nSUMMARY:${title.replace(/[\\;,\n]/g, ' ')}\r\nBEGIN:VALARM\r\nTRIGGER:PT0S\r\nACTION:DISPLAY\r\nDESCRIPTION:${title.replace(/[\\;,\n]/g, ' ')}\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR`
        const url = URL.createObjectURL(new Blob([content], {type: 'text/calendar;charset=utf-8'}))
        const link = document.createElement('a'); link.href = url; link.download = '商城提醒.ics'; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        toast('已下载日历提醒文件，请打开并导入')
      } else {
        await Taro.addPhoneCalendar({title, startTime: Math.floor(next.getTime() / 1000),
          alarm: true, alarmOffset: 0})
        toast('已添加到系统日历，请检查提醒设置')
      }
    } catch (cause) {toast(cause instanceof Error ? cause.message : '添加提醒失败，请检查日历权限')}
    finally {setBusy(false)}
  }
  return <><Header title='快捷添加提醒' onBack={back} /><Page>
    <Text className='heading'>到点就提醒</Text>
    <Text className='muted'>Taro 无法直接创建系统时钟闹钟；此处添加系统日历事件，并在开始时提醒。</Text>
    <View className='panel space'><Text className='title'>提醒时间（下次到点）</Text>
      <View className='row space' style={{justifyContent: 'center'}}>
        <Input className='input' style={{width: '140px', textAlign: 'center'}} value={hour} maxlength={2} type='number' onInput={event => setHour(event.detail.value)} />
        <Text>:</Text><Input className='input' style={{width: '140px', textAlign: 'center'}} value={minute} maxlength={2} type='number' onInput={event => setMinute(event.detail.value)} />
      </View><Field label='提醒内容' value={message} onChange={setMessage} />
      <Button title={busy ? '正在添加…' : process.env.TARO_ENV === 'h5' ? '下载日历提醒' : '添加到系统日历'} disabled={busy} onClick={add} />
    </View>
  </Page></>
}
