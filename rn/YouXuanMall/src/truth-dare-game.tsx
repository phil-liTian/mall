import React, {useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {DEFAULT_CHALLENGES, pickChallenge} from './truth-dare';
import type {Challenge, ChallengeKind} from './truth-dare';
import {useSession} from './session';
import {Button, colors, Header, s} from './ui';

const names: Record<ChallengeKind, string> = {truth: '真心话', dare: '大冒险'};

export function TruthDareGame() {
  const {back} = useSession();
  const [kind, setKind] = useState<ChallengeKind>('truth');
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES);
  const usedRef = useRef<Record<ChallengeKind, string[]>>({truth: [], dare: []});
  const [used, setUsed] = useState(usedRef.current);
  const [current, setCurrent] = useState<Challenge | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const nextId = useRef(0);
  const custom = challenges.filter(item => item.kind === kind && item.id.startsWith('custom-'));
  const total = challenges.filter(item => item.kind === kind).length;
  const remaining = total - used[kind].length;

  const changeKind = (next: ChallengeKind) => {
    setKind(next);
    setCurrent(null);
    setError('');
    setInput('');
  };
  const draw = () => {
    const next = pickChallenge(challenges, kind, usedRef.current[kind]);
    if (!next) return;
    setCurrent(next);
    usedRef.current = {...usedRef.current, [kind]: [...usedRef.current[kind], next.id]};
    setUsed(usedRef.current);
  };
  const reset = () => {
    usedRef.current = {...usedRef.current, [kind]: []};
    setUsed(usedRef.current);
    setCurrent(null);
  };
  const add = () => {
    const value = input.trim();
    if (!value) {setError('请输入题目内容'); return;}
    if (challenges.some(item => item.kind === kind && item.text === value)) {
      setError('这道题已经存在了'); return;
    }
    setChallenges(previous => [...previous, {id: `custom-${nextId.current++}`, kind, text: value}]);
    setInput('');
    setError('');
  };
  const remove = (id: string) => {
    setChallenges(previous => previous.filter(item => item.id !== id));
    usedRef.current = {...usedRef.current, [kind]: usedRef.current[kind].filter(usedId => usedId !== id)};
    setUsed(usedRef.current);
    if (current?.id === id) setCurrent(null);
  };

  return <View style={s.page}>
    <Header title="真心话大冒险" onBack={back} />
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>今天玩点什么？</Text>
      <Text style={styles.intro}>选一种玩法，随机抽题；本轮抽过的题不会重复。</Text>
      <View style={styles.tabs}>
        {(['truth', 'dare'] as ChallengeKind[]).map(value =>
          <Pressable key={value} accessibilityRole="tab" accessibilityState={{selected: kind === value}}
            onPress={() => changeKind(value)} style={[styles.tab, kind === value && styles.tabActive]}>
            <Text style={[styles.tabText, kind === value && styles.tabTextActive]}>{names[value]}</Text>
          </Pressable>)}
      </View>
      <View style={styles.prompt}>
        <Text style={styles.promptLabel}>{names[kind]} · 已抽 {used[kind].length}/{total}</Text>
        <Text style={styles.promptText}>{current?.text ?? (remaining ? `点击抽取一题${names[kind]}` : '本轮题目已抽完')}</Text>
        {remaining === 0 ? <Text style={styles.finished}>已抽完全部题目，可以重新洗牌再玩</Text> : null}
      </View>
      <Button title={remaining ? current ? '再抽一题' : '抽一题' : '本轮已抽完'} onPress={draw}
        disabled={remaining === 0} style={styles.drawButton} />
      {used[kind].length > 0 ? <Button title="重新洗牌" secondary onPress={reset} style={styles.resetButton} /> : null}

      <View style={styles.customPanel}>
        <Text style={s.title}>添加自定义{names[kind]}</Text>
        <Text style={styles.customTip}>自己出题，让这局更有趣（仅本次进入页面有效）</Text>
        <View style={styles.addRow}>
          <TextInput accessibilityLabel={`自定义${names[kind]}题目`} placeholder="写下你的题目"
            style={styles.input} value={input} onChangeText={text => {setInput(text); setError('');}}
            maxLength={60} returnKeyType="done" onSubmitEditing={add} />
          <Button title="添加" onPress={add} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {custom.map(item => <View key={item.id} style={styles.customRow}>
          <Text style={styles.customText}>{item.text}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`删除题目 ${item.text}`}
            onPress={() => remove(item.id)} style={styles.remove}>
            <Text style={styles.removeText}>删除</Text>
          </Pressable>
        </View>)}
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  body: {padding: 16, paddingBottom: 36},
  heading: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 12},
  intro: {fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 6, marginBottom: 20},
  tabs: {flexDirection: 'row', backgroundColor: colors.white, borderRadius: 14, padding: 5, marginBottom: 16},
  tab: {flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10},
  tabActive: {backgroundColor: '#FFF0F1'},
  tabText: {fontSize: 15, fontWeight: '600', color: colors.muted},
  tabTextActive: {color: colors.red, fontWeight: '800'},
  prompt: {backgroundColor: colors.white, borderRadius: 18, minHeight: 215, padding: 22,
    justifyContent: 'center', alignItems: 'center'},
  promptLabel: {color: colors.red, fontSize: 13, fontWeight: '700', marginBottom: 20},
  promptText: {color: colors.ink, fontSize: 22, fontWeight: '700', lineHeight: 32, textAlign: 'center'},
  finished: {color: colors.muted, fontSize: 13, marginTop: 16, textAlign: 'center'},
  drawButton: {marginTop: 18},
  resetButton: {marginTop: 10},
  customPanel: {backgroundColor: colors.white, borderRadius: 16, padding: 16, marginTop: 24},
  customTip: {color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 6, marginBottom: 14},
  addRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  input: {flex: 1, minWidth: 0, minHeight: 46, borderRadius: 12, backgroundColor: colors.bg,
    paddingHorizontal: 12, color: colors.ink, fontSize: 14},
  error: {color: colors.red, fontSize: 12, marginTop: 8},
  customRow: {flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.line,
    paddingTop: 12, marginTop: 12},
  customText: {flex: 1, fontSize: 14, color: colors.ink, lineHeight: 20},
  remove: {paddingHorizontal: 12, paddingVertical: 9},
  removeText: {fontSize: 13, color: colors.red},
});
