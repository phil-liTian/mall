export function rangeError(minText: string, maxText: string): string | null {
  const valid = /^[1-9]\d{0,3}$/;
  if (!valid.test(minText) || !valid.test(maxText) || Number(minText) >= Number(maxText)) {
    return '请输入 1–9999 内的整数，且最小值小于最大值';
  }
  return null;
}

export function secretNumber(min: number, max: number, random: () => number = Math.random): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 9999 || min >= max) {
    throw new RangeError('数字范围无效');
  }
  return min + Math.floor(random() * (max - min + 1));
}
