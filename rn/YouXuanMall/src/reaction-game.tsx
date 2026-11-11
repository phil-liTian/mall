import React, {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSession} from './session';
import {Button, colors, Header, s} from './ui';

type Phase = 'idle' | 'waiting' | 'go' | 'early' | 'result';

// Random wait prevents players from memorizing the timing of the signal.
export function reactionDelay(random: () => number = Math.random): number {
  return 1500 + Math.floor(random() * 2501);
}

export function ReactionGame() {
  const {back} = useSession();
  const [phase, setPhase] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const [result, setResult] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const greenAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {if (timer.current !== null) clearTimeout(timer.current);}, []);
  const changePhase = (next: Phase) => {phaseRef.current = next; setPhase(next);};
  const start = () => {
    if (phaseRef.current === 'waiting' || phaseRef.current === 'go') return;
    if (timer.current !== null) clearTimeout(timer.current);
    greenAt.current = null;
    setResult(null);
    changePhase('waiting');
    timer.current = setTimeout(() => {
      timer.current = null;
      if (phaseRef.current !== 'waiting') return;
      greenAt.current = Date.now();
      changePhase('go');
    }, reactionDelay());
  };
  const tap = () => {
    if (phaseRef.current === 'waiting') {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      changePhase('early');
    } else if (phaseRef.current === 'go' && greenAt.current !== null) {
      const duration = Math.max(0, Date.now() - greenAt.current);
      setResult(duration);
      setBest(previous => previous === null ? duration : Math.min(previous, duration));
      setAttempts(previous => previous + 1);
      changePhase('result');
    }
  };

  const copy = {
    idle: ['准备好了吗？', '点击下方按钮开始挑战'],
    waiting: ['等待变绿…', '先别点，提前点击算抢跑'],
    go: ['现在点击！', '越快越好'],
    early: ['抢跑了！', '等变绿后再点，重新试试'],
    result: [`${result} ms`, '这次的反应时间'],
  }[phase];
  return <View style={s.page}>
    <Header title="反应力挑战" onBack={back} />
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.heading}>挑战你的手速</Text>
      <Text style={styles.intro}>开始后等待区域变绿，立刻点击。提前点击会判为抢跑。</Text>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statNumber}>{best === null ? '—' : `${best} ms`}</Text><Text style={s.hint}>最佳成绩</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>{attempts}</Text><Text style={s.hint}>完成次数</Text></View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="反应区域"
        accessibilityState={{disabled: phase !== 'waiting' && phase !== 'go'}}
        disabled={phase !== 'waiting' && phase !== 'go'} onPress={tap}
        style={[styles.target, phase === 'waiting' && styles.waiting,
          phase === 'go' && styles.go, phase === 'early' && styles.early, phase === 'result' && styles.result]}>
        <Text style={[styles.targetTitle, phase === 'go' && styles.goTitle]}>{copy[0]}</Text>
        <Text style={[styles.targetHint, phase === 'go' && styles.goTitle]}>{copy[1]}</Text>
      </Pressable>
      <Text style={styles.tip}>绿灯亮起后点击上方区域，成绩越低越快</Text>
      <Button title={phase === 'idle' ? '开始挑战' : phase === 'early' || phase === 'result' ? '再来一次' : '正在挑战…'}
        disabled={phase === 'waiting' || phase === 'go'} onPress={start} style={styles.button} />
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  body: {padding: 16, paddingBottom: 36},
  heading: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 12},
  intro: {fontSize: 13, color: colors.muted, lineHeight: 21, marginTop: 6, marginBottom: 20},
  stats: {flexDirection: 'row', gap: 12, marginBottom: 18},
  stat: {flex: 1, backgroundColor: colors.white, borderRadius: 16, alignItems: 'center', paddingVertical: 17},
  statNumber: {fontSize: 21, fontWeight: '800', color: colors.red, marginBottom: 4},
  target: {height: 280, borderRadius: 22, backgroundColor: '#F1F2F5', alignItems: 'center',
    justifyContent: 'center', padding: 22},
  waiting: {backgroundColor: '#FCE4E6'},
  go: {backgroundColor: '#31B978'},
  early: {backgroundColor: '#FFF0DF'},
  result: {backgroundColor: '#EAF6F0'},
  targetTitle: {fontSize: 28, fontWeight: '800', color: colors.ink, textAlign: 'center'},
  targetHint: {fontSize: 14, color: colors.muted, marginTop: 12, textAlign: 'center'},
  goTitle: {color: colors.white},
  tip: {color: colors.muted, textAlign: 'center', fontSize: 13, marginTop: 20},
  button: {marginTop: 18},
});
