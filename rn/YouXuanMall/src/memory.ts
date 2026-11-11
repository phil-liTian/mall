export const PAIRS = [
  {symbol: '🐼', label: '熊猫'},
  {symbol: '🐱', label: '小猫'},
  {symbol: '🐶', label: '小狗'},
  {symbol: '🐰', label: '兔子'},
  {symbol: '🦊', label: '狐狸'},
  {symbol: '🐸', label: '青蛙'},
  {symbol: '🐻', label: '小熊'},
  {symbol: '🐧', label: '企鹅'},
  {symbol: '🐨', label: '考拉'},
  {symbol: '🐯', label: '老虎'},
] as const;

export type MemoryCard = {id: number; pair: number; symbol: string; label: string};
export const MIN_PAIRS = 2;
export const DEFAULT_PAIRS = 6;

export function createMemoryDeck(pairCount = DEFAULT_PAIRS, random: () => number = Math.random): MemoryCard[] {
  if (!Number.isInteger(pairCount) || pairCount < MIN_PAIRS || pairCount > PAIRS.length) {
    throw new RangeError(`配对数量必须在 ${MIN_PAIRS}–${PAIRS.length} 之间`);
  }
  const cards: MemoryCard[] = PAIRS.slice(0, pairCount).flatMap((item, pair) => [0, 1].map(copy => ({
    id: pair * 2 + copy, pair, symbol: item.symbol, label: item.label,
  })));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
