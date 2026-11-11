export type WheelOption = {id: number; label: string; percent: string};

export const DEFAULT_OPTIONS: WheelOption[] = [
  {id: 1, label: '洗碗', percent: '20'},
  {id: 2, label: '拖地', percent: '20'},
  {id: 3, label: '倒垃圾', percent: '20'},
  {id: 4, label: '擦桌子', percent: '20'},
  {id: 5, label: '洗衣服', percent: '20'},
];

const percentPattern = /^(?:0|[1-9]\d?)(?:\.\d)?$|^100(?:\.0)?$/;

export function percentTenths(input: string): number | null {
  return percentPattern.test(input) ? Math.round(Number(input) * 10) : null;
}

export function wheelError(options: WheelOption[]): string | null {
  if (options.some(option => !option.label.trim())) return '请填写每个选项的名称';
  const weights = options.map(option => percentTenths(option.percent));
  if (weights.some(weight => weight === null)) return '每项概率请输入 0–100，最多一位小数';
  if (weights.reduce<number>((sum, weight) => sum + (weight ?? 0), 0) !== 1000) {
    return '概率总和需要等于 100%';
  }
  return null;
}

export function equalize(options: WheelOption[]): WheelOption[] {
  const base = Math.floor(1000 / options.length);
  return options.map((option, index) => ({...option, percent: String(
    (base + (index < 1000 % options.length ? 1 : 0)) / 10,
  )}));
}

export function slices(options: WheelOption[]) {
  let start = 0;
  return options.map(option => {
    const sweep = (percentTenths(option.percent) ?? 0) * 0.36;
    const slice = {start, sweep, center: start + sweep / 2};
    start += sweep;
    return slice;
  });
}

export function pickOption(options: WheelOption[], random: () => number = Math.random): number {
  if (wheelError(options)) throw new Error('请先填写有效的项目和概率');
  const ticket = Math.min(999, Math.max(0, Math.floor(random() * 1000)));
  let cumulative = 0;
  for (let index = 0; index < options.length; index += 1) {
    cumulative += percentTenths(options[index].percent)!;
    if (ticket < cumulative) return index;
  }
  return options.length - 1;
}

export function nextRotation(current: number, center: number, turns = 5): number {
  const target = (360 - center % 360) % 360;
  const delta = (target - current % 360 + 360) % 360;
  return current + turns * 360 + delta;
}
