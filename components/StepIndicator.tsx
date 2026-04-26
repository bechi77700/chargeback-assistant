'use client';

import Link from 'next/link';

const STEPS = [
  { n: 1, label: 'Start' },
  { n: 2, label: 'Details' },
  { n: 3, label: 'Evidence' },
  { n: 4, label: 'Response' },
  { n: 5, label: 'Logged' },
];

export default function StepIndicator({
  current,
  caseId,
}: {
  current: number;
  caseId?: string;
}) {
  const hrefFor = (n: number) => {
    if (n === 1) return '/new';
    if (!caseId) return undefined;
    if (n === 2) return `/cases/${caseId}/details`;
    if (n === 3) return `/cases/${caseId}/evidence`;
    if (n === 4) return `/cases/${caseId}/response`;
    if (n === 5) return `/cases/${caseId}/logged`;
    return undefined;
  };

  return (
    <ol className="flex flex-wrap items-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const active = s.n === current;
        const reachable = s.n <= current;
        const href = hrefFor(s.n);
        const content = (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active
                ? 'bg-accent-violet/15 border border-accent-violet/50 text-accent-violet'
                : reachable
                ? 'bg-bg-elevated border border-bg-border text-text-secondary'
                : 'bg-bg-elevated/50 border border-bg-border text-text-muted'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                active
                  ? 'bg-accent-violet text-white'
                  : reachable
                  ? 'bg-bg-hover text-text-primary'
                  : 'bg-bg-hover text-text-muted'
              }`}
            >
              {s.n}
            </span>
            {s.label}
          </div>
        );
        return (
          <li key={s.n} className="flex items-center gap-2">
            {href && reachable && !active ? <Link href={href}>{content}</Link> : content}
            {i < STEPS.length - 1 && <span className="w-4 h-px bg-bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
