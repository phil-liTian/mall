export const HANDS = [
  {id: 'rock', label: '石头', icon: '✊'},
  {id: 'scissors', label: '剪刀', icon: '✌️'},
  {id: 'paper', label: '布', icon: '✋'},
] as const;

export type Hand = (typeof HANDS)[number]['id'];

// 0: left wins, 1: right wins, null: draw.
export function winner(left: Hand, right: Hand): 0 | 1 | null {
  if (left === right) return null;
  return (left === 'rock' && right === 'scissors') ||
    (left === 'scissors' && right === 'paper') ||
    (left === 'paper' && right === 'rock') ? 0 : 1;
}

export function shufflePlayers(players: string[], random: () => number = Math.random): string[] {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
