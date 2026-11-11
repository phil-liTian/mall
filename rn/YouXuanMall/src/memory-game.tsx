import React, {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {createMemoryDeck, DEFAULT_PAIRS, MIN_PAIRS, PAIRS} from './memory';
import {useSession} from './session';
import {Button, colors, Header, s} from './ui';

const HIDE_DELAY = 900;

export function MemoryGame() {
  const {back} = useSession();
  const {width} = useWindowDimensions();
  const size = Math.max(42, Math.min(88, Math.floor((width - 94) / 4)));
  const [pairCount, setPairCount] = useState(DEFAULT_PAIRS);
  const [deck, setDeck] = useState(() => createMemoryDeck(DEFAULT_PAIRS));
  const [opened, setOpened] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const openedRef = useRef<number[]>([]);
  const matchedRef = useRef<number[]>([]);
  const lockedRef = useRef(false);
  const startedAt = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!started || complete) return;
    const timer = setInterval(() => {
      if (startedAt.current !== null) setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [started, complete]);
  useEffect(() => () => {if (hideTimer.current !== null) clearTimeout(hideTimer.current);}, []);

  const restart = (nextPairCount = pairCount) => {
    if (hideTimer.current !== null) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    lockedRef.current = false;
    openedRef.current = [];
    matchedRef.current = [];
    startedAt.current = null;
    setDeck(createMemoryDeck(nextPairCount));
    setOpened([]);
    setMatched([]);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    setComplete(false);
  };
  const changeCount = (nextPairCount: number) => {
    if (nextPairCount < MIN_PAIRS || nextPairCount > PAIRS.length) return;
    setPairCount(nextPairCount);
    restart(nextPairCount);
  };

  const flip = (id: number) => {
    if (complete || lockedRef.current || openedRef.current.includes(id) || matchedRef.current.includes(id)) return;
    if (startedAt.current === null) {
      startedAt.current = Date.now();
      setStarted(true);
    }
    const first = openedRef.current[0];
    if (first === undefined) {
      openedRef.current = [id];
      setOpened([id]);
      return;
    }
    openedRef.current = [first, id];
    setOpened([first, id]);
    setMoves(count => count + 1);
    if (deck.find(card => card.id === first)?.pair === deck.find(card => card.id === id)?.pair) {
      matchedRef.current = [...matchedRef.current, first, id];
      setMatched(matchedRef.current);
      openedRef.current = [];
      setOpened([]);
      if (matchedRef.current.length === deck.length) {
        setSeconds(Math.floor((Date.now() - startedAt.current!) / 1000));
        setComplete(true);
      }
    } else {
      lockedRef.current = true;
      hideTimer.current = setTimeout(() => {
        openedRef.current = [];
        setOpened([]);
        lockedRef.current = false;
        hideTimer.current = null;
      }, HIDE_DELAY);
    }
  };

  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <View style={s.page}>
    <Header title="翻牌配对" onBack={back} />
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>记住它们的位置</Text>
      <Text style={styles.subtitle}>每次翻开两张，配对成功的卡片会一直亮着</Text>
      <View style={styles.countPanel}>
        <View style={styles.countCopy}><Text style={s.title}>卡片数量</Text><Text style={s.hint}>{MIN_PAIRS * 2}–{PAIRS.length * 2} 张 · 每次调整两张</Text></View>
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="减少卡片" disabled={pairCount === MIN_PAIRS}
            onPress={() => changeCount(pairCount - 1)} style={[styles.stepButton, pairCount === MIN_PAIRS && styles.disabled]}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.countText}>{pairCount * 2} 张</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="增加卡片" disabled={pairCount === PAIRS.length}
            onPress={() => changeCount(pairCount + 1)} style={[styles.stepButton, pairCount === PAIRS.length && styles.disabled]}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statNumber}>{moves}</Text><Text style={s.hint}>步数</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>{elapsed}</Text><Text style={s.hint}>用时</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>{matched.length / 2}/{pairCount}</Text><Text style={s.hint}>配对</Text></View>
      </View>
      <View style={styles.boardPanel}>
        <View style={[styles.board, {width: size * 4 + 30}]}>
          {deck.map((card, index) => {
            const found = matched.includes(card.id);
            const visible = found || opened.includes(card.id);
            return <Pressable key={card.id} accessibilityRole="button"
              accessibilityLabel={`第${index + 1}张卡片，${found ? `已配对${card.label}` : visible ? `已翻开${card.label}` : '未翻开'}`}
              disabled={found || complete} onPress={() => flip(card.id)}
              style={[styles.card, {width: size, height: size * 1.12}, visible && styles.cardVisible, found && styles.cardMatched]}>
              <Text style={[styles.cardText, visible ? {fontSize: size * 0.45} : styles.cardBack]}>{visible ? card.symbol : '✦'}</Text>
            </Pressable>;
          })}
        </View>
      </View>
      {complete ? <View style={styles.success}>
        <Text style={styles.successTitle}>🎉 全部配对成功！</Text>
        <Text style={s.hint}>用了 {moves} 步 · {elapsed}，再来挑战一次吧</Text>
      </View> : <Text style={styles.tip}>{lockedRef.current ? '记住这两张卡片的位置' : '翻开两张相同的卡片即可配对'}</Text>}
      <Button title={complete ? '再玩一次' : '重新开始'} onPress={() => restart()} style={styles.restart} />
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  body: {padding: 16, paddingBottom: 36},
  title: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 12},
  subtitle: {fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 6, marginBottom: 20},
  countPanel: {backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  countCopy: {flexShrink: 1, marginRight: 8},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: 8},
  stepButton: {width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center'},
  stepText: {fontSize: 20, color: colors.red, lineHeight: 25},
  countText: {color: colors.ink, fontSize: 14, fontWeight: '700', minWidth: 35, textAlign: 'center'},
  disabled: {opacity: 0.4},
  stats: {flexDirection: 'row', gap: 10, marginBottom: 16},
  stat: {flex: 1, backgroundColor: colors.white, borderRadius: 14, paddingVertical: 12, alignItems: 'center'},
  statNumber: {fontSize: 18, fontWeight: '800', color: colors.red, marginBottom: 2},
  boardPanel: {backgroundColor: colors.white, borderRadius: 18, padding: 16, alignItems: 'center'},
  board: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 10},
  card: {backgroundColor: '#FCE8E9', borderRadius: 12, borderWidth: 2, borderColor: '#F8D3D6', alignItems: 'center', justifyContent: 'center'},
  cardVisible: {backgroundColor: colors.white, borderColor: colors.red},
  cardMatched: {backgroundColor: '#FFF4F4', borderColor: '#F3B3B8'},
  cardText: {textAlign: 'center', includeFontPadding: false},
  cardBack: {fontSize: 28, color: colors.red},
  success: {alignItems: 'center', paddingTop: 18},
  successTitle: {fontSize: 19, fontWeight: '800', color: colors.red, marginBottom: 6},
  tip: {textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 18},
  restart: {marginTop: 20},
});
