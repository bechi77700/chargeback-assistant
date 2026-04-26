export interface DeadlineInfo {
  days: number;          // whole days remaining (negative if past)
  tone: 'green' | 'orange' | 'red' | 'past';
  label: string;
  warn: boolean;         // true if < 2 days
}

export function deadlineInfo(deadline: Date | string | null | undefined): DeadlineInfo | null {
  if (!deadline) return null;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  // Normalize to midnight to count whole days
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));

  let tone: DeadlineInfo['tone'];
  let label: string;
  if (days < 0) {
    tone = 'past';
    label = `Past due (${Math.abs(days)}d)`;
  } else if (days <= 1) {
    tone = 'red';
    label = days === 0 ? 'Due today' : '1 day left';
  } else if (days <= 3) {
    tone = 'orange';
    label = `${days} days left`;
  } else {
    tone = 'green';
    label = `${days} days left`;
  }

  return { days, tone, label, warn: days < 2 };
}

export function toneClasses(tone: DeadlineInfo['tone']): string {
  switch (tone) {
    case 'green':
      return 'bg-accent-green/15 border border-accent-green/40 text-accent-green';
    case 'orange':
      return 'bg-orange-500/15 border border-orange-500/40 text-orange-400';
    case 'red':
    case 'past':
      return 'bg-accent-red/15 border border-accent-red/40 text-accent-red';
  }
}
