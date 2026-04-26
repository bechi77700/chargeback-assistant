'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StepIndicator from '@/components/StepIndicator';
import DeadlinePill from '@/components/DeadlinePill';
import { disputeEmoji, disputeLabel } from '@/lib/dispute-types';
import { parseEvidence, type CaseRecord } from '@/lib/case-types';

export default function LoggedPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [c, setCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<'won' | 'lost' | null>(null);

  useEffect(() => {
    fetch(`/api/cases/${params.id}`)
      .then((r) => r.json())
      .then((data: CaseRecord) => {
        setCase(data);
        setLoading(false);
      });
  }, [params.id]);

  const evidence = useMemo(() => (c ? parseEvidence(c) : []), [c]);
  const checkedEvidence = useMemo(() => evidence.filter((e) => e.checked), [evidence]);

  async function setOutcome(outcome: 'won' | 'lost') {
    if (!c) return;
    setUpdating(outcome);
    const res = await fetch(`/api/cases/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: outcome, skipTimestamp: true }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCase(updated);
    }
    setUpdating(null);
  }

  if (loading || !c) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 md:py-12">
          <div className="card h-72 shimmer" />
        </div>
      </AppShell>
    );
  }

  const outcomeLabel = c.status === 'won' ? 'Won' : c.status === 'lost' ? 'Lost' : null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <StepIndicator current={5} caseId={params.id} />

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-full bg-accent-violet/15 border border-accent-violet/40 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-accent-violet">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-text-primary text-3xl font-bold tracking-tight">Case Logged ✓</h1>
          <p className="text-text-muted mt-2">
            The response has been recorded. You can update the outcome once Shopify rules.
          </p>
        </div>

        {/* Summary card */}
        <div className="card p-5 space-y-3">
          <Row label="Order #" value={`#${c.orderNumber}`} mono />
          <Row label="Dispute type" value={`${disputeEmoji(c.disputeType)} ${disputeLabel(c.disputeType)}`} />
          <Row label="Amount" value={c.amount != null ? `$${c.amount.toFixed(2)}` : '—'} mono />
          <Row
            label="Submitted"
            value={c.submittedAt ? new Date(c.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted text-sm">Deadline</span>
            <DeadlinePill deadline={c.deadline} />
          </div>
          <Row label="Exhibits" value={`${checkedEvidence.length} item${checkedEvidence.length !== 1 ? 's' : ''}`} />
        </div>

        {checkedEvidence.length > 0 && (
          <div className="card p-5 mt-4">
            <h3 className="text-text-muted text-[10px] uppercase tracking-widest font-semibold mb-3">
              Evidence submitted
            </h3>
            <ul className="space-y-1.5">
              {checkedEvidence.map((e) => (
                <li key={e.key} className="text-text-secondary text-sm flex gap-2">
                  <span className="inline-flex items-center px-1.5 rounded bg-accent-violet/15 text-accent-violet text-[10px] font-bold flex-shrink-0">
                    {e.exhibit}
                  </span>
                  <span>{e.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Outcome */}
        <div className="card p-5 mt-4">
          <h3 className="text-text-primary font-semibold text-sm">Outcome</h3>
          <p className="text-text-muted text-xs mt-1 mb-4">
            Update once Shopify rules on the dispute.
          </p>
          {outcomeLabel ? (
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  c.status === 'won'
                    ? 'bg-accent-green/15 text-accent-green border-accent-green/40'
                    : 'bg-accent-red/15 text-accent-red border-accent-red/40'
                }`}
              >
                {outcomeLabel}
              </span>
              {c.closedAt && (
                <span className="text-text-muted text-xs">
                  on {new Date(c.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOutcome('won')}
                disabled={updating !== null}
                className="px-4 py-2 rounded-lg bg-accent-green/15 border border-accent-green/40 text-accent-green text-sm font-semibold hover:bg-accent-green/25 transition-colors disabled:opacity-40"
              >
                {updating === 'won' ? 'Saving…' : '✓ Won'}
              </button>
              <button
                onClick={() => setOutcome('lost')}
                disabled={updating !== null}
                className="px-4 py-2 rounded-lg bg-accent-red/15 border border-accent-red/40 text-accent-red text-sm font-semibold hover:bg-accent-red/25 transition-colors disabled:opacity-40"
              >
                ✗ Lost
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link href="/" className="btn-secondary">View All Cases</Link>
          <Link href="/new" className="btn-primary">+ New Dispute</Link>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-text-muted text-sm">{label}</span>
      <span className={`text-text-primary text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
