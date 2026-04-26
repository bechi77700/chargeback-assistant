'use client';

import { deadlineInfo, toneClasses } from '@/lib/deadline';

export default function DeadlinePill({
  deadline,
  size = 'sm',
}: {
  deadline: Date | string | null | undefined;
  size?: 'xs' | 'sm';
}) {
  const info = deadlineInfo(deadline);
  if (!info) return null;
  const sizeCls = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeCls} ${toneClasses(info.tone)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {info.label}
    </span>
  );
}
