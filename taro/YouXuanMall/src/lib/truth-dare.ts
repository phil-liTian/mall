export type ChallengeKind = 'truth' | 'dare';
export type Challenge = {id: string; kind: ChallengeKind; text: string};

const truths = [
  '最近让你最开心的一件小事是什么？',
  '如果明天放假，你最想去哪里？',
  '你小时候最想成为哪种人？',
  '你最近学到的一件新事是什么？',
  '你最想拥有哪种超能力？',
  '有什么食物是你一直想尝试的？',
  '你最欣赏朋友身上的哪种特质？',
  '如果可以回到某一天，你会选哪一天？',
];

const dares = [
  '用三句话夸夸左边的人。',
  '模仿一种动物，让大家猜是什么。',
  '用唱歌的方式说出你的名字。',
  '摆一个最有创意的拍照姿势。',
  '用五个词描述今天的心情。',
  '给大家讲一个一分钟的小故事。',
  '用不同的语气说三遍“今天真不错”。',
  '跟在场的人玩一轮石头剪刀布。',
];

export const DEFAULT_CHALLENGES: Challenge[] = [
  ...truths.map((text, index) => ({id: `truth-${index}`, kind: 'truth' as const, text})),
  ...dares.map((text, index) => ({id: `dare-${index}`, kind: 'dare' as const, text})),
];

export function pickChallenge(challenges: Challenge[], kind: ChallengeKind, usedIds: string[],
  random: () => number = Math.random): Challenge | null {
  const available = challenges.filter(item => item.kind === kind && !usedIds.includes(item.id));
  if (!available.length) return null;
  return available[Math.floor(random() * available.length)];
}
