import React, {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {alarmTimeError, dateKey, monthCells, parseDate, shiftMonth} from './planner';
import type {Todo} from './planner';
import {loadTodos, openSystemAlarm, saveTodos} from './personal-tools';
import {useSession} from './session';
import {Button, colors, Header, Loading, s} from './ui';

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

export function Planner() {
  const {back} = useSession();
  const today = dateKey(new Date());
  const [selected, setSelected] = useState(today);
  const [todos, setTodos] = useState<Todo[]>([]);
  const todosRef = useRef<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadTodos().then(saved => {
      if (!mounted.current) return;
      todosRef.current = saved;
      setTodos(saved);
      setAvailable(true);
    }).catch(cause => {
      if (mounted.current) setError(cause instanceof Error ? cause.message : '待办加载失败');
    }).finally(() => {if (mounted.current) setLoading(false);});
    return () => {mounted.current = false;};
  }, []);

  const update = (next: Todo[]) => {
    if (!available) return;
    todosRef.current = next;
    setTodos(next);
    setError('');
    saveTodos(next).catch(() => {
      loadTodos().then(saved => {
        if (mounted.current) {todosRef.current = saved; setTodos(saved);}
      }).catch(() => {});
      if (mounted.current) setError('保存失败，请重试');
    });
  };
  const add = () => {
    const value = title.trim();
    if (!value) {setError('请输入待办内容'); return;}
    update([...todosRef.current, {id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      date: selected, title: value, done: false}]);
    setTitle('');
  };
  const toggle = (id: string) => update(todosRef.current.map(item =>
    item.id === id ? {...item, done: !item.done} : item));
  const remove = (id: string) => update(todosRef.current.filter(item => item.id !== id));
  const month = parseDate(selected);
  const daily = todos.filter(item => item.date === selected).sort((a, b) => Number(a.done) - Number(b.done));
  const monthTitle = `${month.getFullYear()}年${month.getMonth() + 1}月`;
  const dayTitle = `${month.getMonth() + 1}月${month.getDate()}日 · 周${['日', ...weekdays.slice(0, 6)][month.getDay()]}`;

  return <View style={s.page}>
    <Header title="日历待办" onBack={back} />
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>给每一天留个计划</Text>
      <Text style={styles.intro}>待办保存在这台手机上，选中日期就能查看和管理。</Text>
      <View style={styles.calendar}>
        <View style={styles.monthBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="上个月" onPress={() => setSelected(shiftMonth(selected, -1))}
            style={styles.monthButton}><Text style={styles.monthArrow}>‹</Text></Pressable>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="下个月" onPress={() => setSelected(shiftMonth(selected, 1))}
            style={styles.monthButton}><Text style={styles.monthArrow}>›</Text></Pressable>
        </View>
        <View style={styles.dayGrid}>
          {weekdays.map(day => <View key={day} style={styles.dayCell}><Text style={styles.weekday}>{day}</Text></View>)}
          {monthCells(selected).map((date, index) => <View key={date ?? `empty-${index}`} style={styles.dayCell}>
            {date ? <Pressable accessibilityRole="button" accessibilityLabel={`选择日期 ${date}`}
              accessibilityState={{selected: date === selected}} onPress={() => setSelected(date)}
              style={[styles.dayButton, date === selected && styles.selectedDay]}>
              <Text style={[styles.dayNumber, date === selected && styles.selectedText,
                date === today && date !== selected && styles.todayText]}>{parseDate(date).getDate()}</Text>
              {todos.some(item => item.date === date && !item.done) ?
                <View style={[styles.dot, date === selected && styles.selectedDot]} /> : null}
            </Pressable> : null}
          </View>)}
        </View>
      </View>
      {selected !== today ? <Pressable accessibilityRole="button" onPress={() => setSelected(today)} style={styles.todayLink}>
        <Text style={styles.linkText}>回到今天</Text>
      </Pressable> : null}

      <View style={styles.todoPanel}>
        <Text style={s.title}>{dayTitle}</Text>
        {loading ? <Loading /> : !available ? null : <>
          <View style={styles.addRow}>
            <TextInput accessibilityLabel="待办内容" placeholder="添加一件要做的事" maxLength={60}
              value={title} onChangeText={text => {setTitle(text); setError('');}}
              onSubmitEditing={add} returnKeyType="done" style={styles.input} />
            <Button title="添加待办" onPress={add} />
          </View>
          {daily.length ? daily.map(item => <View key={item.id} style={styles.todoRow}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{checked: item.done}}
              accessibilityLabel={`${item.done ? '恢复' : '完成'}待办 ${item.title}`}
              onPress={() => toggle(item.id)} style={styles.checkTouch}>
              <View style={[styles.check, item.done && styles.checked]}>{item.done ? <Text style={styles.checkMark}>✓</Text> : null}</View>
            </Pressable>
            <Text style={[styles.todoTitle, item.done && styles.doneTitle]}>{item.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`删除待办 ${item.title}`}
              onPress={() => remove(item.id)} style={styles.deleteTouch}><Text style={styles.deleteText}>删除</Text></Pressable>
          </View>) : <Text style={styles.empty}>这一天还没有待办，添加第一件吧</Text>}
        </>}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScrollView>
  </View>;
}

export function AlarmShortcut() {
  const {back} = useSession();
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('00');
  const [message, setMessage] = useState('商城提醒');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const open = async () => {
    const invalid = alarmTimeError(hour, minute);
    if (invalid) {setError(invalid); setNotice(''); return;}
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await openSystemAlarm(Number(hour), Number(minute), message.trim() || '商城提醒');
      setNotice('已打开系统闹钟，请在系统页面确认保存');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法打开系统闹钟');
    } finally {setBusy(false);}
  };
  return <View style={s.page}>
    <Header title="快捷添加闹钟" onBack={back} />
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>到点就提醒</Text>
      <Text style={styles.intro}>填好时间和提醒内容，一键跳到手机闹钟确认保存。</Text>
      <View style={styles.todoPanel}>
        <Text style={s.title}>闹钟时间</Text>
        <View style={styles.timeRow}>
          <TextInput accessibilityLabel="闹钟小时" keyboardType="number-pad" maxLength={2} value={hour}
            onChangeText={value => {setHour(value); setError(''); setNotice('');}}
            selectTextOnFocus style={styles.timeInput} />
          <Text style={styles.timeSeparator}>:</Text>
          <TextInput accessibilityLabel="闹钟分钟" keyboardType="number-pad" maxLength={2} value={minute}
            onChangeText={value => {setMinute(value); setError(''); setNotice('');}}
            selectTextOnFocus style={styles.timeInput} />
        </View>
        <Text style={styles.fieldLabel}>提醒内容</Text>
        <TextInput accessibilityLabel="提醒内容" maxLength={60} value={message}
          onChangeText={value => {setMessage(value); setNotice('');}}
          style={styles.messageInput} placeholder="例如：起床、出门、开会" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.success}>{notice}</Text> : null}
        <Button title={busy ? '正在打开…' : '打开系统闹钟'} disabled={busy} onPress={open} style={styles.alarmButton} />
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  body: {padding: 16, paddingBottom: 36},
  heading: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 12},
  intro: {fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 6, marginBottom: 18},
  calendar: {backgroundColor: colors.white, borderRadius: 16, padding: 12},
  monthBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  monthButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center'},
  monthArrow: {color: colors.ink, fontSize: 28, lineHeight: 34},
  monthTitle: {fontSize: 18, fontWeight: '700', color: colors.ink},
  dayGrid: {flexDirection: 'row', flexWrap: 'wrap'},
  dayCell: {width: '14.2857%', alignItems: 'center', height: 43},
  weekday: {fontSize: 13, color: colors.muted, marginTop: 8},
  dayButton: {width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center'},
  selectedDay: {backgroundColor: colors.red},
  dayNumber: {fontSize: 14, color: colors.ink, lineHeight: 18},
  selectedText: {color: colors.white, fontWeight: '700'},
  todayText: {color: colors.red, fontWeight: '800'},
  dot: {width: 4, height: 4, borderRadius: 2, backgroundColor: colors.red},
  selectedDot: {backgroundColor: colors.white},
  todayLink: {alignSelf: 'flex-end', padding: 12},
  linkText: {color: colors.red, fontSize: 13, fontWeight: '700'},
  todoPanel: {backgroundColor: colors.white, borderRadius: 16, padding: 16, marginTop: 14},
  addRow: {flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 18},
  input: {flex: 1, minWidth: 0, minHeight: 46, borderRadius: 12, backgroundColor: colors.bg,
    color: colors.ink, fontSize: 14, paddingHorizontal: 12},
  empty: {textAlign: 'center', color: colors.muted, fontSize: 13, paddingVertical: 24},
  todoRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.line},
  checkTouch: {padding: 6, marginLeft: -6},
  check: {width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.red,
    alignItems: 'center', justifyContent: 'center'},
  checked: {backgroundColor: colors.red},
  checkMark: {color: colors.white, fontSize: 14, fontWeight: '800', lineHeight: 17},
  todoTitle: {flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20, marginLeft: 8},
  doneTitle: {textDecorationLine: 'line-through', color: colors.muted},
  deleteTouch: {paddingHorizontal: 8, paddingVertical: 10},
  deleteText: {fontSize: 12, color: colors.red},
  error: {fontSize: 13, color: colors.red, marginTop: 12},
  success: {fontSize: 13, color: '#229661', marginTop: 12},
  timeRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 28},
  timeInput: {width: 85, height: 72, borderRadius: 14, backgroundColor: colors.bg,
    color: colors.ink, fontSize: 32, fontWeight: '700', textAlign: 'center', padding: 0},
  timeSeparator: {fontSize: 30, color: colors.ink, marginHorizontal: 14},
  fieldLabel: {fontSize: 14, color: colors.ink, marginBottom: 9},
  messageInput: {minHeight: 48, backgroundColor: colors.bg, borderRadius: 12,
    paddingHorizontal: 12, color: colors.ink, fontSize: 14},
  alarmButton: {marginTop: 22},
});
