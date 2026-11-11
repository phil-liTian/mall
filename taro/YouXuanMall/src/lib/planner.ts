export type Todo = {id: string; date: string; title: string; done: boolean};

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftMonth(key: string, delta: number): string {
  const date = parseDate(key);
  const day = date.getDate();
  const first = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  return dateKey(new Date(first.getFullYear(), first.getMonth(),
    Math.min(day, new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate())));
}

// Monday first; null entries align the first day with its weekday.
export function monthCells(key: string): (string | null)[] {
  const date = parseDate(key);
  const year = date.getFullYear();
  const month = date.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<null>(offset).fill(null),
    ...Array.from({length: days}, (_, index) => dateKey(new Date(year, month, index + 1))),
  ];
}

export function parseTodos(serialized: string): Todo[] {
  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed)) throw new Error('待办数据格式不正确');
  return parsed.filter((item): item is Todo => {
    if (!item || typeof item.id !== 'string' || typeof item.title !== 'string' ||
      typeof item.done !== 'boolean' || typeof item.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false;
    return dateKey(parseDate(item.date)) === item.date;
  });
}

export function alarmTimeError(hour: string, minute: string): string | null {
  if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) ||
    Number(hour) > 23 || Number(minute) > 59) return '请输入有效的时间（00:00–23:59）';
  return null;
}
