import React, {useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {rangeError, secretNumber} from './guess-number';
import {useSession} from './session';
import {Button, colors, Header, s} from './ui';

type Guess = {value: number; hint: string};

export function GuessNumberGame() {
  const {back} = useSession();
  const [minText, setMinText] = useState('1');
  const [maxText, setMaxText] = useState('100');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'won'>('setup');
  const phaseRef = useRef<'setup' | 'playing' | 'won'>('setup');
  const secretRef = useRef<number | null>(null);
  const [guessText, setGuessText] = useState('');
  const [history, setHistory] = useState<Guess[]>([]);
  const seenRef = useRef(new Set<number>());
  const boundsRef = useRef<[number, number]>([1, 100]);
  const [bounds, setBounds] = useState<[number, number]>([1, 100]);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');

  const start = () => {
    const invalid = rangeError(minText, maxText);
    if (invalid) {setError(invalid); return;}
    const min = Number(minText);
    const max = Number(maxText);
    secretRef.current = secretNumber(min, max);
    boundsRef.current = [min, max];
    setBounds([min, max]);
    seenRef.current = new Set();
    setHistory([]);
    setGuessText('');
    setHint('数字已生成，试着猜猜看！');
    setError('');
    phaseRef.current = 'playing';
    setPhase('playing');
  };
  const submit = () => {
    if (phaseRef.current !== 'playing' || secretRef.current === null) return;
    if (!/^[1-9]\d{0,3}$/.test(guessText)) {setError('请输入有效的正整数'); return;}
    const value = Number(guessText);
    if (seenRef.current.has(value)) {setError('这个数字已经猜过了'); return;}
    const [min, max] = boundsRef.current;
    if (value < min || value > max) {setError(`请在剩余范围 ${min}–${max} 内猜测`); return;}
    seenRef.current.add(value);
    setGuessText('');
    setError('');
    if (value === secretRef.current) {
      setHint(`恭喜猜中！答案就是 ${value}`);
      setHistory(previous => [{value, hint: '猜中了'}, ...previous]);
      phaseRef.current = 'won';
      setPhase('won');
    } else {
      const tooSmall = value < secretRef.current;
      const next: [number, number] = tooSmall ? [value + 1, max] : [min, value - 1];
      boundsRef.current = next;
      setBounds(next);
      setHint(tooSmall ? '太小了，再猜大一点' : '太大了，再猜小一点');
      setHistory(previous => [{value, hint: tooSmall ? '偏小' : '偏大'}, ...previous]);
    }
  };
  const changeRange = () => {
    secretRef.current = null;
    phaseRef.current = 'setup';
    setPhase('setup');
    setError('');
  };

  return <View style={s.page}>
    <Header title="猜数字" onBack={back} />
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>数字藏在哪里？</Text>
      <Text style={styles.intro}>设定范围，猜出随机生成的数字；每次猜测都会缩小范围。</Text>
      {phase === 'setup' ? <View style={styles.panel}>
        <Text style={s.title}>设定数字范围</Text>
        <Text style={styles.note}>支持 1–9999 之间的整数</Text>
        <View style={styles.rangeRow}>
          <View style={styles.rangeField}>
            <Text style={styles.label}>最小值</Text>
            <TextInput accessibilityLabel="最小值" style={styles.input} keyboardType="number-pad" maxLength={4}
              value={minText} onChangeText={text => {setMinText(text); setError('');}} />
          </View>
          <Text style={styles.dash}>—</Text>
          <View style={styles.rangeField}>
            <Text style={styles.label}>最大值</Text>
            <TextInput accessibilityLabel="最大值" style={styles.input} keyboardType="number-pad" maxLength={4}
              value={maxText} onChangeText={text => {setMaxText(text); setError('');}} />
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="开始游戏" onPress={start} style={styles.action} />
      </View> : <>
        <View style={styles.rangeCard}>
          <Text style={styles.label}>还可能是</Text>
          <Text style={styles.rangeValue}>{bounds[0]} – {bounds[1]}</Text>
          <Text style={s.hint}>已经猜了 {history.length} 次</Text>
        </View>
        <View style={styles.panel}>
          <Text style={[styles.hint, phase === 'won' && styles.won]}>{hint}</Text>
          {phase === 'playing' ? <View style={styles.guessRow}>
            <TextInput accessibilityLabel="输入猜测数字" placeholder="输入数字" style={[styles.input, styles.guessInput]}
              keyboardType="number-pad" returnKeyType="done" maxLength={4}
              value={guessText} onChangeText={text => {setGuessText(text); setError('');}} onSubmitEditing={submit} />
            <Button title="猜一下" onPress={submit} />
          </View> : <Button title="再玩一局" onPress={start} style={styles.action} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <Button title="修改范围" secondary onPress={changeRange} style={styles.changeButton} />
        {history.length ? <View style={styles.history}>
          <Text style={s.title}>猜测记录</Text>
          {history.map((item, index) => <View key={`${index}-${item.value}`} style={styles.historyRow}>
            <Text style={styles.historyNumber}>{item.value}</Text>
            <Text style={styles.historyHint}>{item.hint}</Text>
          </View>)}
        </View> : null}
      </>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  body: {padding: 16, paddingBottom: 36},
  heading: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 12},
  intro: {fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 6, marginBottom: 20},
  panel: {backgroundColor: colors.white, borderRadius: 16, padding: 18},
  note: {color: colors.muted, fontSize: 12, marginTop: 7},
  rangeRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18},
  rangeField: {flex: 1},
  label: {fontSize: 13, color: colors.muted, marginBottom: 8},
  dash: {color: colors.muted, fontSize: 20, marginTop: 20},
  input: {height: 48, borderRadius: 12, backgroundColor: colors.bg, color: colors.ink,
    fontSize: 18, paddingHorizontal: 14, textAlign: 'center'},
  error: {color: colors.red, fontSize: 12, marginTop: 12},
  action: {marginTop: 18},
  rangeCard: {backgroundColor: '#FFF0F1', borderRadius: 18, alignItems: 'center', paddingVertical: 24,
    marginBottom: 14},
  rangeValue: {color: colors.red, fontSize: 30, fontWeight: '800', marginBottom: 8},
  hint: {color: colors.ink, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 16},
  won: {color: colors.red},
  guessRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  guessInput: {flex: 1, minWidth: 0},
  changeButton: {marginTop: 14},
  history: {backgroundColor: colors.white, borderRadius: 16, padding: 18, marginTop: 18},
  historyRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderColor: colors.line},
  historyNumber: {fontSize: 17, fontWeight: '700', color: colors.ink},
  historyHint: {fontSize: 13, color: colors.red},
});
