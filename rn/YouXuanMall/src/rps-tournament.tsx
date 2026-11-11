import React, {useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {HANDS, shufflePlayers, winner} from './rps';
import type {Hand} from './rps';
import {useSession} from './session';
import {Button, colors, Header, s} from './ui';

const MAX_PLAYERS = 16;
type Choices = [Hand | null, Hand | null];

export function RpsTournament() {
  const {back} = useSession();
  const [players, setPlayers] = useState(['玩家1', '玩家2', '玩家3', '玩家4']);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);
  const [entrants, setEntrants] = useState<string[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [advanced, setAdvanced] = useState<string[]>([]);
  const [choices, setChoices] = useState<Choices>([null, null]);
  const choicesRef = useRef<Choices>([null, null]);
  const [resultShown, setResultShown] = useState(false);
  const resultRef = useRef(false);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [champion, setChampion] = useState<string | null>(null);

  const matches = Array.from({length: Math.floor(entrants.length / 2)}, (_, index) =>
    [entrants[index * 2], entrants[index * 2 + 1]] as const);
  const currentMatch = matches[matchIndex];
  const bye = entrants.length % 2 ? entrants[entrants.length - 1] : null;

  const clearMatch = () => {
    choicesRef.current = [null, null];
    setChoices([null, null]);
    resultRef.current = false;
    setResultShown(false);
    setMatchWinner(null);
  };
  const add = () => {
    const next = name.trim();
    if (!next) {setError('请输入参赛者名字'); return;}
    if (players.some(player => player.toLocaleLowerCase() === next.toLocaleLowerCase())) {
      setError('参赛者名字不能重复'); return;
    }
    if (players.length >= MAX_PLAYERS) {setError(`最多 ${MAX_PLAYERS} 人参赛`); return;}
    setPlayers(previous => [...previous, next]);
    setName('');
    setError('');
  };
  const start = () => {
    if (players.length < 2) return;
    setEntrants(shufflePlayers(players));
    setRound(1);
    setMatchIndex(0);
    setAdvanced([]);
    setChampion(null);
    clearMatch();
  };
  const throwHand = (hand: Hand) => {
    if (!currentMatch || champion || resultRef.current) return;
    const first = choicesRef.current[0];
    if (first === null) {
      choicesRef.current = [hand, null];
      setChoices(choicesRef.current);
      return;
    }
    choicesRef.current = [first, hand];
    setChoices(choicesRef.current);
    resultRef.current = true;
    setResultShown(true);
    const side = winner(first, hand);
    setMatchWinner(side === null ? null : currentMatch[side]);
  };
  const advance = () => {
    if (!matchWinner || !currentMatch || !resultRef.current) return;
    const winners = [...advanced, matchWinner];
    if (matchIndex + 1 < matches.length) {
      setAdvanced(winners);
      setMatchIndex(matchIndex + 1);
    } else {
      if (bye) winners.push(bye);
      if (winners.length === 1) setChampion(winners[0]);
      else {
        setEntrants(shufflePlayers(winners));
        setRound(previous => previous + 1);
        setMatchIndex(0);
        setAdvanced([]);
      }
    }
    clearMatch();
  };
  const reset = () => {
    setRound(0);
    setEntrants([]);
    setMatchIndex(0);
    setAdvanced([]);
    setChampion(null);
    setError('');
    clearMatch();
  };

  return <View style={s.page}>
    <Header title="猜拳淘汰赛" onBack={back} />
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {round === 0 ? <>
        <Text style={styles.heading}>谁能笑到最后？</Text>
        <Text style={styles.intro}>输入名字后随机分组，两人轮流出拳；平局重赛，奇数人时一人轮空。</Text>
        <View style={styles.panel}>
          <Text style={s.title}>参赛者 · {players.length}/{MAX_PLAYERS}</Text>
          <View style={styles.names}>
            {players.map(player => <View key={player} style={styles.nameTag}>
              <Text style={styles.nameText}>{player}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`移除选手 ${player}`}
                onPress={() => setPlayers(previous => previous.filter(value => value !== player))} style={styles.remove}>
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>)}
          </View>
          <View style={styles.addRow}>
            <TextInput accessibilityLabel="参赛者名字" placeholder="输入参赛者名字" maxLength={12}
              returnKeyType="done" style={styles.input} value={name}
              onChangeText={value => {setName(value); setError('');}} onSubmitEditing={add} />
            <Button title="添加" onPress={add} disabled={players.length >= MAX_PLAYERS} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {players.length < 2 ? <Text style={styles.error}>至少需要 2 人才能开赛</Text> : null}
        </View>
        <Button title="随机分组，开始比赛" disabled={players.length < 2} onPress={start} style={styles.action} />
      </> : champion ? <>
        <View style={styles.championCard}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.championTitle}>本届冠军</Text>
          <Text style={styles.championName}>{champion}</Text>
          <Text style={s.hint}>经过 {round} 轮比赛，成功夺冠！</Text>
        </View>
        <Button title="重新开赛" onPress={reset} style={styles.action} />
      </> : <>
        <Text style={styles.heading}>第 {round} 轮 · 第 {matchIndex + 1}/{matches.length} 场</Text>
        <Text style={styles.intro}>每位选手轮流选择手势；出拳后不会展示给下一位。</Text>
        <View style={styles.panel}>
          <View style={styles.opponents}>
            <Text style={styles.opponent} numberOfLines={1}>{currentMatch[0]}</Text>
            <Text style={styles.versus}>VS</Text>
            <Text style={styles.opponent} numberOfLines={1}>{currentMatch[1]}</Text>
          </View>
          {resultShown ? <>
            <View style={styles.reveal}>
              {choices.map((hand, index) => <View key={index} style={styles.revealSide}>
                <Text style={styles.revealIcon}>{HANDS.find(item => item.id === hand)?.icon}</Text>
                <Text style={s.hint}>{currentMatch[index]} · {HANDS.find(item => item.id === hand)?.label}</Text>
              </View>)}
            </View>
            <Text style={styles.result}>{matchWinner ? `${matchWinner} 获胜！` : '平局！重新出拳'}</Text>
          </> : <>
            <Text style={styles.turn}>{choices[0] === null ? `请 ${currentMatch[0]} 出拳` : `${currentMatch[0]} 已出拳，请 ${currentMatch[1]} 出拳`}</Text>
            <View style={styles.handRow}>
              {HANDS.map(hand => <Pressable key={hand.id} accessibilityRole="button"
                accessibilityLabel={`选择${hand.label}`} style={styles.handButton} onPress={() => throwHand(hand.id)}>
                <Text style={styles.handIcon}>{hand.icon}</Text><Text style={styles.handName}>{hand.label}</Text>
              </Pressable>)}
            </View>
          </>}
        </View>
        {resultShown ? <Button title={matchWinner ? matchIndex + 1 < matches.length ? '下一场' : entrants.length === 2 ? '查看冠军' : '进入下一轮' : '平局，重赛'}
          onPress={matchWinner ? advance : clearMatch} style={styles.action} /> : null}
        <View style={styles.schedule}>
          <Text style={s.title}>本轮对阵</Text>
          {matches.map(([first, second], index) => <View key={index} style={[styles.matchRow, index === matchIndex && styles.activeRow]}>
            <Text style={styles.matchText} numberOfLines={1}>{index + 1}. {first} vs {second}</Text>
            <Text style={styles.matchStatus}>{index < matchIndex ? `${advanced[index]} 晋级` : index === matchIndex ? matchWinner ? `${matchWinner} 晋级` : '进行中' : '待开始'}</Text>
          </View>)}
          {bye ? <View style={styles.matchRow}><Text style={styles.matchText}>{bye}</Text><Text style={styles.matchStatus}>本轮轮空晋级</Text></View> : null}
        </View>
        <Button title="重新开赛" secondary onPress={reset} style={styles.restart} />
      </>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  body: {padding: 16, paddingBottom: 40},
  heading: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 12},
  intro: {color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 7, marginBottom: 20},
  panel: {backgroundColor: colors.white, borderRadius: 18, padding: 18},
  names: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 18},
  nameTag: {flexDirection: 'row', alignItems: 'center', borderRadius: 18,
    backgroundColor: '#FFF1F2', paddingLeft: 14},
  nameText: {color: colors.ink, fontSize: 14, maxWidth: 150},
  remove: {paddingHorizontal: 10, paddingVertical: 7},
  removeText: {fontSize: 20, lineHeight: 21, color: colors.red},
  addRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  input: {flex: 1, minWidth: 0, minHeight: 46, borderRadius: 12, backgroundColor: colors.bg,
    color: colors.ink, fontSize: 14, paddingHorizontal: 12},
  error: {fontSize: 12, color: colors.red, marginTop: 9},
  action: {marginTop: 18},
  opponents: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  opponent: {flex: 1, textAlign: 'center', fontSize: 20, color: colors.ink, fontWeight: '800'},
  versus: {fontSize: 16, color: colors.red, fontWeight: '800', marginHorizontal: 12},
  turn: {textAlign: 'center', color: colors.muted, fontSize: 14, marginTop: 30, marginBottom: 16},
  handRow: {flexDirection: 'row', gap: 10},
  handButton: {flex: 1, minWidth: 0, borderRadius: 14, backgroundColor: '#FFF0F1', alignItems: 'center', paddingVertical: 15},
  handIcon: {fontSize: 34, includeFontPadding: false},
  handName: {fontSize: 14, color: colors.red, fontWeight: '700', marginTop: 8},
  reveal: {flexDirection: 'row', marginTop: 23},
  revealSide: {flex: 1, alignItems: 'center'},
  revealIcon: {fontSize: 40, marginBottom: 6},
  result: {textAlign: 'center', color: colors.red, fontSize: 18, fontWeight: '800', marginTop: 22},
  schedule: {backgroundColor: colors.white, padding: 16, borderRadius: 16, marginTop: 20},
  matchRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.line},
  activeRow: {backgroundColor: '#FFF9F9'},
  matchText: {flex: 1, minWidth: 0, color: colors.ink, fontSize: 13},
  matchStatus: {color: colors.red, fontSize: 12, marginLeft: 10},
  restart: {marginTop: 18},
  championCard: {backgroundColor: colors.white, borderRadius: 20, alignItems: 'center', marginTop: 40,
    paddingVertical: 45, paddingHorizontal: 20},
  trophy: {fontSize: 60},
  championTitle: {fontSize: 18, color: colors.muted, marginTop: 16},
  championName: {fontSize: 29, fontWeight: '800', color: colors.red, marginTop: 12, marginBottom: 12},
});
