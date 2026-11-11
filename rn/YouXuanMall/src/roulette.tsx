import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {useSession} from './session';
import {Button, colors, Header, s} from './ui';
import {DEFAULT_OPTIONS, equalize, nextRotation, percentTenths, pickOption, slices, wheelError} from './wheel';
import type {WheelOption} from './wheel';

const segmentColors = ['#EA555A', '#FFAB52', '#62B9A0', '#709DDC', '#AD80CE',
  '#ED8580', '#D8AB5A', '#69B2CE', '#B8A269', '#937FBB'];

function Wheel({options, size, rotation}: {options: WheelOption[]; size: number; rotation: Animated.Value}) {
  const geometry = useMemo(() => {
    const radius = size / 2;
    const triangles: {id: string; angle: number; halfBase: number; height: number; color: string}[] = [];
    const labels: {id: number; text: string; left: number; top: number}[] = [];

    slices(options).forEach(({start, sweep, center}, index) => {
      if (sweep <= 0) return;
      const steps = Math.ceil(sweep / 4);
      const step = sweep / steps;
      for (let n = 0; n < steps; n += 1) {
        // Rotate a full-size layer around the wheel center. Its triangle tip
        // stays at that center while the base spans this part of the rim.
        const angle = start + (n + 0.5) * step;
        const halfBase = radius * Math.tan(step * Math.PI / 360) + 0.4;
        triangles.push({id: `${options[index].id}-${n}`, angle, halfBase,
          height: radius + 0.5, color: segmentColors[index % segmentColors.length]});
      }
      if (sweep >= 24) {
        const angle = center * Math.PI / 180;
        labels.push({id: options[index].id, text: options[index].label.trim(),
          left: radius + radius * 0.62 * Math.sin(angle) - 30,
          top: radius - radius * 0.62 * Math.cos(angle) - 13});
      }
    });
    return {triangles, labels};
  }, [options, size]);

  return <View accessible={false} style={styles.wheelFrame}>
    <Animated.View style={[styles.wheel, {width: size, height: size, borderRadius: size / 2,
      transform: [{rotate: rotation.interpolate({inputRange: [0, 360], outputRange: ['0deg', '360deg'],
        extrapolate: 'extend'})}]}]}>
      {geometry.triangles.map(part => <View key={part.id} pointerEvents="none"
        style={[styles.sliceLayer, {width: size, height: size, transform: [{rotate: `${part.angle}deg`}]}]}>
        <View style={[styles.triangle, {left: size / 2 - part.halfBase,
          top: size / 2 - part.height, borderLeftWidth: part.halfBase,
          borderRightWidth: part.halfBase, borderTopWidth: part.height,
          borderTopColor: part.color}]} />
      </View>)}
      {geometry.labels.map(label => <Text key={label.id} numberOfLines={1}
        style={[styles.wheelLabel, {left: label.left, top: label.top}]}>{label.text}</Text>)}
      <View style={[styles.centerCap, {left: size / 2 - 19, top: size / 2 - 19}]}>
        <View style={styles.centerDot} />
      </View>
    </Animated.View>
    <View style={[styles.pointer, {left: size / 2 - 12}]} />
  </View>;
}

export function RouletteGame() {
  const {back} = useSession();
  const {width} = useWindowDimensions();
  const size = Math.min(304, Math.max(220, width - 70));
  const [options, setOptions] = useState<WheelOption[]>(DEFAULT_OPTIONS.map(option => ({...option})));
  const [winner, setWinner] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const currentAngle = useRef(0);
  const nextId = useRef(DEFAULT_OPTIONS.length + 1);
  const error = wheelError(options);
  const total = options.reduce((sum, option) => sum + (percentTenths(option.percent) ?? 0), 0) / 10;

  useEffect(() => () => rotation.stopAnimation(), [rotation]);

  const update = (next: WheelOption[]) => {
    if (spinning) return;
    setOptions(next);
    setWinner(null);
    rotation.setValue(0);
    currentAngle.current = 0;
  };

  const spin = () => {
    if (spinning || error) return;
    const chosen = pickOption(options);
    const landing = slices(options)[chosen].center;
    const target = nextRotation(currentAngle.current, landing);
    setWinner(null);
    setSpinning(true);
    Animated.timing(rotation, {toValue: target, duration: 4300,
      easing: Easing.out(Easing.cubic), useNativeDriver: true}).start(({finished}) => {
      if (finished) {
        currentAngle.current = target;
        setWinner(options[chosen].label.trim());
      }
      setSpinning(false);
    });
  };

  return <View style={s.page}>
    <Header title="幸运大转盘" onBack={back} />
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>让转盘帮你做决定</Text>
      <Text style={[s.hint, styles.subtitle]}>家务只是默认示例，选项和概率都可以修改</Text>

      <View style={styles.wheelPanel}>
        <Wheel options={options} size={size} rotation={rotation} />
        <Text accessibilityLiveRegion="polite" style={[styles.result, winner && styles.winner]}>
          {spinning ? '正在转动…' : winner ? `抽中了：${winner}` : '转动转盘，看看会抽中什么'}
        </Text>
        <Button title={spinning ? '转动中…' : '开始转动'} disabled={spinning || !!error} onPress={spin}
          style={styles.spinButton} />
      </View>

      <View style={styles.settings}>
        <View style={s.between}>
          <Text style={s.title}>转盘选项</Text>
          <Pressable accessibilityRole="button" disabled={spinning} onPress={() => update(equalize(options))}>
            <Text style={styles.link}>平均分配</Text>
          </Pressable>
        </View>
        <Text style={[s.hint, styles.help]}>每项最多一位小数，概率合计需要 100%</Text>
        {options.map((option, index) => <View key={option.id} style={styles.optionRow}>
          <View style={[styles.swatch, {backgroundColor: segmentColors[index % segmentColors.length]}]} />
          <TextInput accessibilityLabel={`第${index + 1}项选项名称`} maxLength={12}
            editable={!spinning} selectTextOnFocus style={styles.nameInput} placeholder="选项名称"
            placeholderTextColor={colors.muted} value={option.label}
            onChangeText={label => update(options.map(item => item.id === option.id ? {...item, label} : item))} />
          <TextInput accessibilityLabel={`第${index + 1}项概率`} keyboardType="decimal-pad" maxLength={5}
            editable={!spinning} selectTextOnFocus style={styles.percentInput} value={option.percent}
            onChangeText={percent => update(options.map(item => item.id === option.id ? {...item, percent} : item))} />
          <Text style={styles.percentSign}>%</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`删除${option.label || `第${index + 1}项`}`}
            disabled={spinning || options.length <= 2} onPress={() => update(equalize(options.filter(item => item.id !== option.id)))}
            style={styles.removeButton}><Text style={[styles.removeText, options.length <= 2 && styles.muted]}>删除</Text></Pressable>
        </View>)}
        <View style={[s.between, styles.settingsFooter]}>
          <Pressable accessibilityRole="button" disabled={spinning || options.length >= 10}
            onPress={() => update(equalize([...options, {id: nextId.current++, label: '新选项', percent: '0'}]))}>
            <Text style={[styles.link, options.length >= 10 && styles.muted]}>添加项目</Text>
          </Pressable>
          <Text style={styles.total}>合计 {total}%</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  body: {padding: 16, paddingBottom: 40},
  heading: {color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 12},
  subtitle: {marginTop: 5, marginBottom: 16},
  wheelPanel: {backgroundColor: colors.white, borderRadius: 18, alignItems: 'center', padding: 16},
  wheelFrame: {alignItems: 'center', justifyContent: 'center', marginTop: 10},
  wheel: {backgroundColor: segmentColors[0], overflow: 'hidden', borderWidth: 2, borderColor: colors.white},
  sliceLayer: {position: 'absolute', left: 0, top: 0},
  triangle: {position: 'absolute', width: 0, height: 0,
    borderLeftColor: 'transparent', borderRightColor: 'transparent'},
  wheelLabel: {position: 'absolute', width: 60, height: 27, color: colors.white, fontSize: 12,
    fontWeight: '800', textAlign: 'center', textAlignVertical: 'center'},
  centerCap: {position: 'absolute', width: 38, height: 38, backgroundColor: colors.white,
    borderRadius: 19, justifyContent: 'center', alignItems: 'center', elevation: 2},
  centerDot: {width: 16, height: 16, borderRadius: 8, backgroundColor: colors.red},
  pointer: {position: 'absolute', top: -5, width: 0, height: 0, borderLeftWidth: 12,
    borderRightWidth: 12, borderTopWidth: 25, borderLeftColor: 'transparent',
    borderRightColor: 'transparent', borderTopColor: colors.ink, zIndex: 2},
  result: {marginTop: 20, color: colors.muted, fontSize: 15, textAlign: 'center'},
  winner: {color: colors.red, fontSize: 18, fontWeight: '800'},
  spinButton: {marginTop: 16, minWidth: 160},
  settings: {backgroundColor: colors.white, borderRadius: 18, padding: 16, marginTop: 14},
  link: {color: colors.red, fontSize: 13, fontWeight: '700'},
  help: {marginTop: 6, marginBottom: 8},
  optionRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 7},
  swatch: {width: 12, height: 12, borderRadius: 6},
  nameInput: {flex: 1, minWidth: 0, height: 42, borderRadius: 9, borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 9, paddingVertical: 0, color: colors.ink, fontSize: 14},
  percentInput: {width: 58, height: 42, borderRadius: 9, borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 3, paddingVertical: 0, textAlign: 'center', color: colors.ink, fontSize: 14},
  percentSign: {color: colors.ink, fontSize: 14},
  removeButton: {width: 36, height: 40, justifyContent: 'center', alignItems: 'center'},
  removeText: {fontSize: 12, color: colors.red},
  muted: {opacity: 0.4},
  settingsFooter: {marginTop: 13},
  total: {fontSize: 13, fontWeight: '700', color: colors.ink},
  error: {marginTop: 12, color: colors.red, fontSize: 13},
});
