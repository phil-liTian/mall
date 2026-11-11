import {useEffect, useMemo, useRef, useState} from 'react'
import {Input, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useSession} from '../lib/session'
import {Button, Header, Page, toast} from '../lib/ui'
import {MAX_DICE, pips, rollDice} from '../lib/dice'
import {DEFAULT_OPTIONS, equalize, nextRotation, percentTenths, pickOption, slices, wheelError} from '../lib/wheel'
import type {WheelOption} from '../lib/wheel'
import {createMemoryDeck, DEFAULT_PAIRS, MIN_PAIRS, PAIRS} from '../lib/memory'
import {DEFAULT_CHALLENGES, pickChallenge} from '../lib/truth-dare'
import type {Challenge, ChallengeKind} from '../lib/truth-dare'
import {HANDS, shufflePlayers, winner} from '../lib/rps'
import type {Hand} from '../lib/rps'
import {rangeError, secretNumber} from '../lib/guess-number'

function GamePage({title, children}: {title: string; children: React.ReactNode}) {
  const {back} = useSession()
  return <><Header title={title} onBack={back} /><Page>{children}</Page></>
}
function Intro({title, detail}: {title: string; detail: string}) {
  return <><Text className='heading'>{title}</Text><Text className='muted game-intro'>{detail}</Text></>
}
function Stepper({value, min, max, onChange}: {value: number; min: number; max: number; onChange: (n: number) => void}) {
  return <View className='game-stepper'>
    <Text className='step' onClick={() => onChange(Math.max(min, value - 1))}>−</Text>
    <Text className='title'>{value}</Text>
    <Text className='step' onClick={() => onChange(Math.min(max, value + 1))}>＋</Text>
  </View>
}
const games = [
  {name: 'dice', label: '投骰子', icon: '🎲', detail: '自定义骰子数量，一起试试手气'},
  {name: 'roulette', label: '幸运大转盘', icon: '🎡', detail: '自己设定选项和概率'},
  {name: 'memory', label: '翻牌配对', icon: '🃏', detail: '自定义卡片数量，找出相同图案'},
  {name: 'reaction', label: '反应力挑战', icon: '⚡', detail: '等屏幕变绿，挑战最快反应'},
  {name: 'truthDare', label: '真心话大冒险', icon: '❔', detail: '随机抽题，添加你的专属题目'},
  {name: 'rpsTournament', label: '猜拳淘汰赛', icon: '✊', detail: '朋友轮流出拳，决出冠军'},
  {name: 'guessNumber', label: '猜数字', icon: '🔢', detail: '根据提示缩小范围'},
] as const
export function GameHub() {
  const {back, navigate} = useSession()
  return <><Header title='游戏中心' onBack={back} /><Page>
    <Intro title='来玩个小游戏' detail='选一个游戏，随时开玩' />
    {games.map(game => <View className='game-card row' key={game.name} onClick={() => navigate({name: game.name})}>
      <Text className='game-icon'>{game.icon}</Text><View className='grow'>
        <Text className='title block'>{game.label}</Text><Text className='muted small'>{game.detail}</Text>
      </View><Text className='link'>›</Text>
    </View>)}
  </Page></>
}
function Die({value}: {value: number}) {
  return <View className='die-face'>{Array.from({length: 9}, (_, index) =>
    <View className='die-cell' key={index}>{pips[value].includes(index) ? <View className='die-dot' /> : null}</View>)}</View>
}
export function DiceGame() {
  const [countText, setCountText] = useState('2')
  const [dice, setDice] = useState<number[]>([])
  const count = Number(countText)
  const valid = /^(?:[1-9]|1\d|20)$/.test(countText)
  return <GamePage title='投骰子'>
    <Intro title='试试今天的手气' detail={`选择 1–${MAX_DICE} 颗骰子，看看总点数`} />
    <View className='panel space'><Text className='title'>骰子数量</Text>
      <View className='row space'><Stepper value={valid ? count : 1} min={1} max={MAX_DICE}
        onChange={n => {setCountText(String(n)); setDice([])}} />
        <Input type='number' className='input game-number' value={countText} maxlength={2}
          onInput={event => {setCountText(event.detail.value.replace(/\D/g, '').slice(0, 2)); setDice([])}} />
      </View>{!valid ? <Text className='game-error'>请输入 1–{MAX_DICE} 之间的整数</Text> : null}
    </View>
    <View className='panel space'><Text className='title'>{dice.length ? '本次结果' : '准备好了吗？'}</Text>
      <View className='dice-grid'>{(dice.length ? dice : Array.from({length: valid ? count : 0}, () => 1))
        .map((value, index) => <View key={index} className='dice-item'><Die value={value} />
          <Text className='small muted'>第{index + 1}颗 · {dice.length ? `${value}点` : '待投掷'}</Text></View>)}</View>
      {dice.length ? <Text className='game-result'>总点数 {dice.reduce((sum, value) => sum + value, 0)}</Text> : null}
    </View><Button title={dice.length ? '再投一次' : '开始投掷'} disabled={!valid} onClick={() => setDice(rollDice(count))} />
  </GamePage>
}

const colors = ['#EA555A', '#FFAB52', '#62B9A0', '#709DDC', '#AD80CE', '#ED8580', '#D8AB5A', '#69B2CE', '#B8A269', '#937FBB']
// CSS triangles work in both H5 and WeChat mini programs (conic-gradient does not).
function Wheel({options, rotation, size}: {options: WheelOption[]; rotation: number; size: number}) {
  const radius = size / 2
  const parts = slices(options).flatMap(({start, sweep}, index) => {
    if (sweep <= 0) return []
    const steps = Math.ceil(sweep / 4)
    return Array.from({length: steps}, (_, n) => {
      const angle = start + (n + .5) * sweep / steps
      const halfBase = radius * Math.tan(sweep / steps * Math.PI / 360) + .45
      return <View key={`${options[index].id}-${n}`} className='wheel-layer' style={{width: `${size}px`, height: `${size}px`, transform: `rotate(${angle}deg)`}}>
        <View className='wheel-triangle' style={{left: `${radius - halfBase}px`, top: '-1px',
          borderLeftWidth: `${halfBase}px`, borderRightWidth: `${halfBase}px`, borderTopWidth: `${radius + 1}px`,
          borderTopColor: colors[index % colors.length]}} />
      </View>
    })
  })
  return <View className='wheel-wrap' style={{width: `${size}px`, height: `${size}px`}}>
    <View className='wheel-pointer'>▼</View>
    <View className='wheel' style={{width: `${size}px`, height: `${size}px`, transform: `rotate(${rotation}deg)`}}>
      {parts}
      {slices(options).map(({sweep, center}, index) => sweep >= 24 ? <Text key={options[index].id}
        className='wheel-label' style={{left: `${radius + radius * .62 * Math.sin(center * Math.PI / 180)}px`,
          top: `${radius - radius * .62 * Math.cos(center * Math.PI / 180)}px`}}>{options[index].label}</Text> : null)}
      <View className='wheel-center' />
    </View>
  </View>
}
export function RouletteGame() {
  const [options, setOptions] = useState<WheelOption[]>(DEFAULT_OPTIONS.map(item => ({...item})))
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [picked, setPicked] = useState('')
  const nextId = useRef(DEFAULT_OPTIONS.length + 1)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {if (timer.current) clearTimeout(timer.current)}, [])
  const size = Math.min(290, Math.max(220, Taro.getSystemInfoSync().windowWidth - 72))
  const error = wheelError(options)
  const change = (next: WheelOption[]) => {if (!spinning) {setOptions(next); setPicked('')}}
  const spin = () => {
    if (error || spinning) return
    const index = pickOption(options)
    setPicked(''); setSpinning(true)
    setRotation(nextRotation(rotation, slices(options)[index].center))
    timer.current = setTimeout(() => {setPicked(options[index].label.trim()); setSpinning(false); timer.current = null}, 3600)
  }
  return <GamePage title='幸运大转盘'>
    <Intro title='让转盘帮你做决定' detail='家务只是默认示例，选项和概率都可以修改' />
    <View className='panel space'><Wheel options={options} rotation={rotation} size={size} />
      <Text className='game-result'>{spinning ? '正在转动…' : picked ? `抽中了：${picked}` : '转动转盘，看看会抽中什么'}</Text>
      <Button title={spinning ? '转动中…' : '开始转动'} disabled={!!error || spinning} onClick={spin} />
    </View>
    <View className='panel space'><View className='between'><Text className='title'>转盘选项</Text>
      <Text className='link' onClick={() => change(equalize(options))}>平均分配</Text></View>
      <Text className='muted small'>2–10 项；概率最多一位小数，合计需为 100%</Text>
      {options.map((item, index) => <View className='row line wheel-option' key={item.id}>
        <View className='wheel-swatch' style={{backgroundColor: colors[index % colors.length]}} />
        <Input className='input grow' value={item.label} maxlength={12} disabled={spinning} placeholder='选项名称'
          onInput={event => change(options.map(option => option.id === item.id ? {...option, label: event.detail.value} : option))} />
        <Input className='input wheel-percent' value={item.percent} type='digit' disabled={spinning}
          onInput={event => change(options.map(option => option.id === item.id ? {...option, percent: event.detail.value} : option))} />
        <Text>%</Text><Text className='link small' onClick={() => options.length > 2 && change(equalize(options.filter(option => option.id !== item.id)))}>删除</Text>
      </View>)}
      <View className='between space'><Text className='link' onClick={() => options.length < 10 && change(equalize([...options, {id: nextId.current++, label: '新选项', percent: '0'}]))}>＋ 添加项目</Text>
        <Text>合计 {options.reduce((sum, item) => sum + (percentTenths(item.percent) ?? 0), 0) / 10}%</Text></View>
      {error ? <Text className='game-error'>{error}</Text> : null}
    </View>
  </GamePage>
}

export function MemoryGame() {
  const [pairs, setPairs] = useState(DEFAULT_PAIRS)
  const [deck, setDeck] = useState(() => createMemoryDeck(DEFAULT_PAIRS))
  const [opened, setOpened] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const startedAt = useRef<number | null>(null)
  const locked = useRef(false)
  const openedRef = useRef<number[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const done = matched.length === deck.length
  useEffect(() => {
    if (startedAt.current === null || done) return
    const interval = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current!) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [moves, done])
  useEffect(() => () => {if (timer.current) clearTimeout(timer.current)}, [])
  const restart = (count = pairs) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null; locked.current = false; openedRef.current = []; startedAt.current = null
    setPairs(count); setDeck(createMemoryDeck(count)); setOpened([]); setMatched([]); setMoves(0); setSeconds(0)
  }
  const flip = (id: number) => {
    if (done || locked.current || matched.includes(id) || openedRef.current.includes(id)) return
    if (startedAt.current === null) startedAt.current = Date.now()
    const next = [...openedRef.current, id]; openedRef.current = next; setOpened(next)
    if (next.length < 2) return
    locked.current = true; setMoves(previous => previous + 1)
    const first = deck.find(card => card.id === next[0])!
    const second = deck.find(card => card.id === next[1])!
    if (first.pair === second.pair) {
      setMatched(previous => [...previous, ...next]); openedRef.current = []; setOpened([]); locked.current = false
    } else {
      timer.current = setTimeout(() => {openedRef.current = []; setOpened([]); locked.current = false; timer.current = null}, 900)
    }
  }
  return <GamePage title='翻牌配对'>
    <Intro title='考验你的记忆力' detail='选择卡片数量，翻开两张相同的图案即可配对' />
    <View className='panel space between'><Text>卡片数量：{pairs * 2} 张</Text>
      <Stepper value={pairs} min={MIN_PAIRS} max={PAIRS.length} onChange={restart} />
    </View>
    <Text className='muted space'>设置 {pairs} 对，每次调整 2 张；步数 {moves} · 用时 {seconds} 秒 · 配对 {matched.length / 2}/{pairs}</Text>
    <View className='panel memory-board'>{deck.map((card, index) => {
      const visible = matched.includes(card.id) || opened.includes(card.id)
      return <View key={card.id} className={`memory-card ${visible ? 'flipped' : ''}`} onClick={() => flip(card.id)}>
        <Text>{visible ? card.symbol : '✦'}</Text><Text className='memory-index'>{index + 1}</Text>
      </View>
    })}</View>
    {done ? <Text className='game-result'>🎉 全部配对成功！共 {moves} 步</Text> : null}
    <View className='space'><Button title={done ? '再玩一次' : '重新开始'} onClick={() => restart()} /></View>
  </GamePage>
}

type Phase = 'idle' | 'waiting' | 'go' | 'early' | 'result'
export function ReactionGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')
  const [result, setResult] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const greenAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {if (timer.current) clearTimeout(timer.current)}, [])
  const setStage = (next: Phase) => {phaseRef.current = next; setPhase(next)}
  const start = () => {
    if (phaseRef.current === 'waiting' || phaseRef.current === 'go') return
    setResult(null); setStage('waiting')
    timer.current = setTimeout(() => {greenAt.current = Date.now(); timer.current = null; setStage('go')}, 1500 + Math.floor(Math.random() * 2501))
  }
  const tap = () => {
    if (phaseRef.current === 'waiting') {if (timer.current) clearTimeout(timer.current); timer.current = null; setStage('early')}
    else if (phaseRef.current === 'go') {
      const ms = Math.max(0, Date.now() - greenAt.current)
      setResult(ms); setBest(previous => previous === null ? ms : Math.min(ms, previous))
      setAttempts(previous => previous + 1); setStage('result')
    }
  }
  const words: Record<Phase, string> = {idle: '准备好了吗？', waiting: '等待变绿…先别点！', go: '现在点击！', early: '抢跑了！', result: `${result} ms`}
  return <GamePage title='反应力挑战'>
    <Intro title='挑战你的手速' detail='开始后等待区域变绿，立刻点击；提前点击算抢跑' />
    <View className='panel space between'><Text>最佳成绩：{best === null ? '—' : `${best} ms`}</Text><Text>完成 {attempts} 次</Text></View>
    <View className={`reaction-target ${phase}`} onClick={tap}><Text>{words[phase]}</Text>
      <Text className='small'>{phase === 'go' ? '越快越好' : phase === 'result' ? '本次反应时间' : '看准时机再点击'}</Text></View>
    <View className='space'><Button title={phase === 'idle' ? '开始挑战' : phase === 'early' || phase === 'result' ? '再来一次' : '正在挑战…'}
      disabled={phase === 'waiting' || phase === 'go'} onClick={start} /></View>
  </GamePage>
}

const names: Record<ChallengeKind, string> = {truth: '真心话', dare: '大冒险'}
export function TruthDareGame() {
  const [kind, setKind] = useState<ChallengeKind>('truth')
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)
  const [used, setUsed] = useState<Record<ChallengeKind, string[]>>({truth: [], dare: []})
  const [current, setCurrent] = useState<Challenge | null>(null)
  const [input, setInput] = useState('')
  const nextId = useRef(0)
  const total = challenges.filter(item => item.kind === kind).length
  const remaining = total - used[kind].length
  const draw = () => {
    const next = pickChallenge(challenges, kind, used[kind]); if (!next) return
    setCurrent(next); setUsed(previous => ({...previous, [kind]: [...previous[kind], next.id]}))
  }
  const add = () => {
    const value = input.trim()
    if (!value) return toast('请输入题目内容')
    if (challenges.some(item => item.kind === kind && item.text === value)) return toast('题目已存在')
    setChallenges(previous => [...previous, {id: `custom-${nextId.current++}`, kind, text: value}]); setInput('')
  }
  const remove = (id: string) => {
    setChallenges(previous => previous.filter(item => item.id !== id))
    setUsed(previous => ({...previous, [kind]: previous[kind].filter(value => value !== id)}))
    if (current?.id === id) setCurrent(null)
  }
  return <GamePage title='真心话大冒险'>
    <Intro title='今天玩点什么？' detail='选一种玩法，随机抽题；本轮抽过的题不会重复' />
    <View className='chips space'>{(['truth', 'dare'] as ChallengeKind[]).map(value =>
      <Text key={value} className={`chip ${kind === value ? 'chip-active' : ''}`} onClick={() => {setKind(value); setCurrent(null); setInput('')}}>{names[value]}</Text>)}</View>
    <View className='panel space center'><Text className='muted'>{names[kind]} · 已抽 {used[kind].length}/{total}</Text>
      <Text className='game-result'>{current?.text ?? (remaining ? `点击抽取一题${names[kind]}` : '本轮题目已抽完')}</Text>
      {remaining === 0 ? <Text className='muted'>重新洗牌即可继续</Text> : null}</View>
    <Button title={remaining ? '抽一题' : '本轮已抽完'} disabled={!remaining} onClick={draw} />
    {used[kind].length ? <View className='space'><Button title='重新洗牌' secondary onClick={() => {setUsed(previous => ({...previous, [kind]: []})); setCurrent(null)}} /></View> : null}
    <View className='panel space'><Text className='title'>添加自定义{names[kind]}</Text>
      <Text className='muted small'>题目仅在本次进入页面时有效</Text>
      <View className='row space'><Input className='input grow' maxlength={60} value={input} placeholder='写下你的题目'
        onInput={event => setInput(event.detail.value)} onConfirm={add} /><Button title='添加' onClick={add} /></View>
      {challenges.filter(item => item.kind === kind && item.id.startsWith('custom-')).map(item =>
        <View key={item.id} className='between line'><Text className='grow'>{item.text}</Text>
          <Text className='link' onClick={() => remove(item.id)}>删除</Text></View>)}
    </View>
  </GamePage>
}

const MAX_PLAYERS = 16
type Choices = [Hand | null, Hand | null]
export function RpsTournament() {
  const [players, setPlayers] = useState(['玩家1', '玩家2', '玩家3', '玩家4'])
  const [name, setName] = useState('')
  const [round, setRound] = useState(0)
  const [entrants, setEntrants] = useState<string[]>([])
  const [matchIndex, setMatchIndex] = useState(0)
  const [advanced, setAdvanced] = useState<string[]>([])
  const [choices, setChoices] = useState<Choices>([null, null])
  const [revealed, setRevealed] = useState(false)
  const [matchWinner, setMatchWinner] = useState<string | null>(null)
  const [champion, setChampion] = useState<string | null>(null)
  const matches = useMemo(() => Array.from({length: Math.floor(entrants.length / 2)}, (_, i) =>
    [entrants[i * 2], entrants[i * 2 + 1]] as const), [entrants])
  const match = matches[matchIndex]
  const bye = entrants.length % 2 ? entrants[entrants.length - 1] : null
  const clear = () => {setChoices([null, null]); setRevealed(false); setMatchWinner(null)}
  const addPlayer = () => {
    const value = name.trim()
    if (!value || players.length >= MAX_PLAYERS || players.some(item => item.toLowerCase() === value.toLowerCase())) {
      toast('名字为空、重复或已达到人数上限'); return
    }
    setPlayers(previous => [...previous, value]); setName('')
  }
  const start = () => {setEntrants(shufflePlayers(players)); setRound(1); setMatchIndex(0); setAdvanced([]); setChampion(null); clear()}
  const throwHand = (hand: Hand) => {
    if (!match || revealed) return
    if (choices[0] === null) {setChoices([hand, null]); return}
    setChoices([choices[0], hand]); setRevealed(true)
    const side = winner(choices[0], hand); setMatchWinner(side === null ? null : match[side])
  }
  const advance = () => {
    if (!matchWinner) return
    const winners = [...advanced, matchWinner]
    if (matchIndex + 1 < matches.length) {setAdvanced(winners); setMatchIndex(matchIndex + 1)}
    else {
      if (bye) winners.push(bye)
      if (winners.length === 1) setChampion(winners[0])
      else {setEntrants(shufflePlayers(winners)); setRound(previous => previous + 1); setMatchIndex(0); setAdvanced([])}
    }
    clear()
  }
  return <GamePage title='猜拳淘汰赛'>
    <Intro title='谁能笑到最后？' detail='随机分组，两人轮流出拳；平局重赛，奇数人有一人轮空' />
    {round === 0 ? <><View className='panel space'><Text className='title'>参赛者 · {players.length}/{MAX_PLAYERS}</Text>
      <View className='game-tags'>{players.map(player => <Text key={player} className='game-tag' onClick={() => setPlayers(previous => previous.filter(value => value !== player))}>{player} ×</Text>)}</View>
      <View className='row space'><Input className='input grow' maxlength={12} value={name} placeholder='输入参赛者名字'
        onInput={event => setName(event.detail.value)} onConfirm={addPlayer} /><Button title='添加' onClick={addPlayer} /></View>
      </View><Button title='随机分组，开始比赛' disabled={players.length < 2} onClick={start} /></>
      : champion ? <View className='panel space center'><Text className='game-result'>🏆 本届冠军：{champion}</Text><Text>历经 {round} 轮比赛</Text>
        <Button title='重新开赛' onClick={() => {setRound(0); setChampion(null)}} /></View>
        : <><Text className='title block space'>第 {round} 轮 · 第 {matchIndex + 1}/{matches.length} 场</Text>
          <View className='panel space center'><Text className='title'>{match?.[0]} VS {match?.[1]}</Text>
            {revealed ? <><Text className='game-result'>{choices.map(hand => HANDS.find(item => item.id === hand)?.icon).join(' VS ')}</Text>
              <Text className='title'>{matchWinner ? `${matchWinner} 获胜！` : '平局，重新出拳'}</Text></>
              : <><Text className='muted space'>{choices[0] ? `${match?.[0]} 已出拳，请 ${match?.[1]} 出拳` : `请 ${match?.[0]} 出拳`}</Text>
                <View className='rps-hands'>{HANDS.map(hand => <View key={hand.id} className='rps-hand' onClick={() => throwHand(hand.id)}>
                  <Text>{hand.icon}</Text><Text className='small'>{hand.label}</Text></View>)}</View></>}
          </View>
          {revealed ? <Button title={matchWinner ? '下一场 / 下一轮' : '平局，重赛'} onClick={matchWinner ? advance : clear} /> : null}
          <View className='panel space'><Text className='title'>本轮对阵</Text>
            {matches.map(([first, second], i) => <View key={i} className='between line'><Text>{i + 1}. {first} vs {second}</Text><Text className='muted small'>
              {i < matchIndex ? `${advanced[i]} 晋级` : i === matchIndex ? '进行中' : '待开始'}</Text></View>)}
            {bye ? <Text className='muted'>{bye} 本轮轮空晋级</Text> : null}</View>
          <Button title='重新开赛' secondary onClick={() => {setRound(0); clear()}} />
        </>}
  </GamePage>
}

type Guess = {value: number; hint: string}
export function GuessNumberGame() {
  const [minText, setMinText] = useState('1')
  const [maxText, setMaxText] = useState('100')
  const [phase, setPhase] = useState<'setup' | 'playing' | 'won'>('setup')
  const secret = useRef(0)
  const [guess, setGuess] = useState('')
  const [history, setHistory] = useState<Guess[]>([])
  const [bounds, setBounds] = useState<[number, number]>([1, 100])
  const [hint, setHint] = useState('')
  const start = () => {
    const error = rangeError(minText, maxText); if (error) return toast(error)
    const min = Number(minText), max = Number(maxText)
    secret.current = secretNumber(min, max); setBounds([min, max]); setHistory([]); setGuess(''); setHint('数字已生成，试着猜猜看！'); setPhase('playing')
  }
  const submit = () => {
    if (phase !== 'playing') return
    if (!/^[1-9]\d{0,3}$/.test(guess)) return toast('请输入有效的正整数')
    const value = Number(guess)
    if (history.some(item => item.value === value)) return toast('这个数字已经猜过了')
    if (value < bounds[0] || value > bounds[1]) return toast(`请在 ${bounds[0]}–${bounds[1]} 内猜测`)
    setGuess('')
    if (value === secret.current) {setHistory(previous => [{value, hint: '猜中了'}, ...previous]); setHint(`恭喜猜中！答案是 ${value}`); setPhase('won')}
    else {
      const small = value < secret.current
      setBounds([small ? value + 1 : bounds[0], small ? bounds[1] : value - 1])
      setHint(small ? '太小了，再猜大一点' : '太大了，再猜小一点')
      setHistory(previous => [{value, hint: small ? '偏小' : '偏大'}, ...previous])
    }
  }
  return <GamePage title='猜数字'>
    <Intro title='数字藏在哪里？' detail='设定范围，猜出随机生成的数字；每次猜测都会缩小范围' />
    {phase === 'setup' ? <View className='panel space'><Text className='title'>设定数字范围（1–9999）</Text>
      <View className='row space'><Input className='input grow' type='number' maxlength={4} value={minText} onInput={e => setMinText(e.detail.value)} />
        <Text>—</Text><Input className='input grow' type='number' maxlength={4} value={maxText} onInput={e => setMaxText(e.detail.value)} /></View>
      <Button title='开始游戏' onClick={start} /></View> : <>
        <View className='panel center space'><Text>还可能是</Text><Text className='game-result'>{bounds[0]} – {bounds[1]}</Text>
          <Text className='muted'>已经猜了 {history.length} 次</Text></View>
        <View className='panel space'><Text className='title'>{hint}</Text>
          {phase === 'playing' ? <View className='row space'><Input className='input grow' type='number' maxlength={4} value={guess}
            placeholder='输入数字' onInput={e => setGuess(e.detail.value)} onConfirm={submit} /><Button title='猜一下' onClick={submit} /></View>
            : <Button title='再玩一局' onClick={start} />}</View>
        <Button title='修改范围' secondary onClick={() => setPhase('setup')} />
        {history.length ? <View className='panel space'><Text className='title'>猜测记录</Text>{history.map(item =>
          <View className='between line' key={item.value}><Text>{item.value}</Text><Text className='link'>{item.hint}</Text></View>)}</View> : null}
      </>}
  </GamePage>
}
