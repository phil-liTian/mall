export const MAX_DICE = 20;

export const pips: Readonly<Record<number, readonly number[]>> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function rollDice(count: number, random: () => number = Math.random): number[] {
  if (!Number.isInteger(count) || count < 1 || count > MAX_DICE) {
    throw new RangeError(`骰子数量必须在 1–${MAX_DICE} 之间`);
  }
  return Array.from({length: count}, () => Math.floor(random() * 6) + 1);
}
