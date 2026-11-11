import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {MAX_DICE, pips, rollDice} from './dice';
import {useSession} from './session';
import {Button, colors, Header, s} from './ui';

function Die({value, small = false}: {value: number; small?: boolean}) {
  return <View accessible={false} style={[styles.die, small && styles.smallDie]}>
    <View style={[styles.face, small && styles.smallFace]}>
      {Array.from({length: 9}, (_, index) => <View key={index} style={[styles.cell, small && styles.smallCell]}>
        {pips[value].includes(index) ? <View style={[styles.pip, small && styles.smallPip]} /> : null}
      </View>)}
    </View>
  </View>;
}

export function Games() {
  const {back, navigate} = useSession();
  return <View style={s.page}>
    <Header title="游戏中心" onBack={back} />
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={styles.lead}>来玩个小游戏</Text>
      <Text style={[s.hint, styles.intro]}>选一个游戏，随时开玩</Text>
      <Pressable accessibilityRole="button" onPress={() => navigate({name: 'dice'})} style={styles.gameCard}>
        <View style={styles.gameIcon}><Die value={5} small /></View>
        <View style={styles.gameCopy}>
          <Text style={s.title}>投骰子</Text>
          <Text style={s.hint}>选好骰子数量，看看手气如何</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate({name: 'roulette'})}
        style={[styles.gameCard, styles.nextGame]}>
        <View style={styles.gameIcon}>
          <View style={styles.wheelIcon}><View style={styles.wheelLine} /><View style={styles.wheelDot} /></View>
        </View>
        <View style={styles.gameCopy}>
          <Text style={s.title}>幸运大转盘</Text>
          <Text style={s.hint}>自定义选项和概率，转出幸运结果</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate({name: 'memory'})}
        style={[styles.gameCard, styles.nextGame]}>
        <View style={styles.gameIcon}>
          <View style={styles.memoryIconBack} />
          <View style={styles.memoryIconFront}><Text style={styles.memoryIconText}>★</Text></View>
        </View>
        <View style={styles.gameCopy}>
          <Text style={s.title}>翻牌配对</Text>
          <Text style={s.hint}>翻开卡片，找出相同的图案</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate({name: 'reaction'})}
        style={[styles.gameCard, styles.nextGame]}>
        <View style={styles.gameIcon}>
          <View style={styles.reactionIcon}><View style={styles.reactionDot} /></View>
        </View>
        <View style={styles.gameCopy}>
          <Text style={s.title}>反应力挑战</Text>
          <Text style={s.hint}>等屏幕变绿，看你能多快点中</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate({name: 'truthDare'})}
        style={[styles.gameCard, styles.nextGame]}>
        <View style={styles.gameIcon}>
          <View style={styles.truthIcon}><Text style={styles.truthIconText}>?</Text></View>
        </View>
        <View style={styles.gameCopy}>
          <Text style={s.title}>真心话大冒险</Text>
          <Text style={s.hint}>随机抽题，来一场有趣的聚会</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate({name: 'rpsTournament'})}
        style={[styles.gameCard, styles.nextGame]}>
        <View style={styles.gameIcon}><Text style={styles.rpsIcon}>✊</Text></View>
        <View style={styles.gameCopy}>
          <Text style={s.title}>猜拳淘汰赛</Text>
          <Text style={s.hint}>叫上朋友，猜拳决出最后的冠军</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate({name: 'guessNumber'})}
        style={[styles.gameCard, styles.nextGame]}>
        <View style={styles.gameIcon}><Text style={styles.guessIcon}>#</Text></View>
        <View style={styles.gameCopy}>
          <Text style={s.title}>猜数字</Text>
          <Text style={s.hint}>缩小范围，看看几次能猜中</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </ScrollView>
  </View>;
}

export function DiceGame() {
  const {back} = useSession();
  const [countText, setCountText] = useState('2');
  const [dice, setDice] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const movement = useRef(new Animated.Value(0)).current;
  useEffect(() => () => movement.stopAnimation(), [movement]);

  const count = Number(countText);
  const valid = /^(?:[1-9]|1\d|20)$/.test(countText);
  const shownDice = dice.length ? dice : Array.from({length: valid ? count : 0}, () => 1);
  const changeCount = (next: string) => {
    setCountText(next.replace(/\D/g, '').slice(0, 2));
    setDice([]);
  };
  const stepCount = (direction: number) => {
    changeCount(String(Math.max(1, Math.min(MAX_DICE, (valid ? count : 1) + direction))));
  };
  const roll = () => {
    if (!valid || rolling) return;
    setRolling(true);
    movement.setValue(0);
    Animated.timing(movement, {toValue: 4, duration: 500, useNativeDriver: true}).start(({finished}) => {
      if (finished) {
        setDice(rollDice(count));
        setRolling(false);
      }
    });
  };

  return <View style={s.page}>
    <Header title="投骰子" onBack={back} />
    <ScrollView contentContainerStyle={styles.gameBody} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>试试今天的手气</Text>
      <Text style={[s.hint, styles.intro]}>选择骰子数量，点击按钮开始投掷</Text>

      <View style={styles.controlCard}>
        <View style={s.between}>
          <Text style={s.title}>骰子数量</Text>
          <Text style={s.hint}>1–{MAX_DICE} 颗</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="减少骰子" disabled={rolling || (valid && count <= 1)}
            style={[styles.stepButton, (rolling || (valid && count <= 1)) && styles.disabled]} onPress={() => stepCount(-1)}>
            <Text style={styles.stepLabel}>−</Text>
          </Pressable>
          <TextInput accessibilityLabel="骰子数量" style={styles.countInput} keyboardType="number-pad"
            selectTextOnFocus maxLength={2} editable={!rolling} value={countText} onChangeText={changeCount} />
          <Pressable accessibilityRole="button" accessibilityLabel="增加骰子" disabled={rolling || (valid && count >= MAX_DICE)}
            style={[styles.stepButton, (rolling || (valid && count >= MAX_DICE)) && styles.disabled]} onPress={() => stepCount(1)}>
            <Text style={styles.stepLabel}>+</Text>
          </Pressable>
        </View>
        {!valid ? <Text style={styles.error}>请输入 1–{MAX_DICE} 之间的整数</Text> : null}
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>{rolling ? '正在投掷…' : dice.length ? '本次结果' : '准备好了吗？'}</Text>
        <Animated.View style={[styles.diceGrid, {transform: [{rotate: movement.interpolate({
          inputRange: [0, 1, 2, 3, 4], outputRange: ['0deg', '-8deg', '8deg', '-6deg', '0deg'],
        })}]}]}>
          {shownDice.map((value, index) => <View key={index} style={styles.dieSlot}>
            <Die value={value} />
            <Text style={styles.dieLabel}>第 {index + 1} 颗{dice.length && !rolling ? ` · ${value} 点` : ''}</Text>
          </View>)}
        </Animated.View>
        {dice.length && !rolling ? <Text accessibilityLabel={`总点数 ${dice.reduce((sum, value) => sum + value, 0)}`}
          style={styles.total}>总点数 {dice.reduce((sum, value) => sum + value, 0)}</Text>
          : <Text style={s.hint}>{rolling ? '祝你好运' : '点一下开始投骰子'}</Text>}
      </View>

      <Button title={rolling ? '投掷中…' : dice.length ? '再投一次' : '开始投掷'} onPress={roll}
        disabled={!valid || rolling} style={styles.rollButton} />
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  lead: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 12},
  intro: {marginTop: 5, marginBottom: 20},
  gameCard: {backgroundColor: colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center'},
  nextGame: {marginTop: 12},
  gameIcon: {width: 58, height: 58, borderRadius: 14, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center'},
  wheelIcon: {width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: colors.red,
    alignItems: 'center', justifyContent: 'center'},
  wheelLine: {width: 2, height: 28, backgroundColor: colors.red, transform: [{rotate: '45deg'}]},
  wheelDot: {position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red},
  memoryIconBack: {position: 'absolute', left: 9, top: 9, width: 31, height: 36, borderRadius: 6,
    borderWidth: 2, borderColor: colors.red, transform: [{rotate: '-15deg'}]},
  memoryIconFront: {position: 'absolute', right: 8, top: 10, width: 31, height: 36, borderRadius: 6,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center'},
  memoryIconText: {color: colors.white, fontSize: 20, lineHeight: 26},
  reactionIcon: {width: 40, height: 40, borderWidth: 3, borderColor: colors.red,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  reactionDot: {width: 16, height: 16, borderRadius: 8, backgroundColor: colors.red},
  truthIcon: {width: 40, height: 40, borderRadius: 12, backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center', transform: [{rotate: '-8deg'}]},
  truthIconText: {color: colors.white, fontSize: 28, fontWeight: '800', lineHeight: 34},
  rpsIcon: {fontSize: 33, includeFontPadding: false},
  guessIcon: {fontSize: 33, color: colors.red, fontWeight: '800', includeFontPadding: false},
  gameCopy: {flex: 1, marginLeft: 14, gap: 4},
  arrow: {color: colors.muted, fontSize: 26},
  gameBody: {padding: 16, paddingBottom: 36},
  controlCard: {backgroundColor: colors.white, borderRadius: 16, padding: 18, marginBottom: 14},
  stepper: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginTop: 20},
  stepButton: {width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center'},
  stepLabel: {color: colors.red, fontSize: 25, fontWeight: '600', lineHeight: 30},
  disabled: {opacity: 0.4},
  countInput: {width: 70, height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 10,
    textAlign: 'center', color: colors.ink, fontSize: 22, fontWeight: '700', padding: 0},
  error: {color: colors.red, fontSize: 12, textAlign: 'center', marginTop: 10},
  resultCard: {backgroundColor: colors.white, borderRadius: 16, alignItems: 'center', padding: 18, minHeight: 186},
  resultTitle: {fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 17},
  diceGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12},
  dieSlot: {alignItems: 'center', width: 84, marginBottom: 8},
  dieLabel: {color: colors.muted, fontSize: 11, marginTop: 6},
  die: {width: 76, height: 76, borderRadius: 16, backgroundColor: '#FFF4F4', borderColor: '#F7CED0',
    borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  face: {width: 48, height: 48, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between'},
  cell: {width: 14, height: 14, alignItems: 'center', justifyContent: 'center'},
  pip: {width: 9, height: 9, borderRadius: 5, backgroundColor: colors.red},
  smallDie: {width: 42, height: 42, borderRadius: 9, backgroundColor: colors.white},
  smallFace: {width: 30, height: 30},
  smallCell: {width: 9, height: 9},
  smallPip: {width: 6, height: 6, borderRadius: 3},
  total: {color: colors.red, fontSize: 19, fontWeight: '800', marginTop: 6},
  rollButton: {marginTop: 18},
});
