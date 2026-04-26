'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import StepIndicator from '@/components/StepIndicator';
import DeadlinePill from '@/components/DeadlinePill';
import { PRIMARY_DISPUTE_TYPES, SECONDARY_DISPUTE_TYPES, type DisputeType } from '@/lib/dispute-types';
import { deadlineInfo } from '@/lib/deadline';

export default function NewDisputePage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [disputeType, setDisputeType] = useState<DisputeType | ''>('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const info = deadline ? deadlineInfo(deadline) : null;
  const canSubmit = orderNumber.trim() && disputeType && deadline;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, disputeType, deadline }),
      });
      if (!res.ok) throw new Error('Failed to create case');
      const created = await res.json();
      router.push(`/cases/${created.id}/details`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <StepIndicator current={1} />

        <h1 className="text-text-primary text-3xl md:text-4xl font-bold tracking-tight">New Dispute</h1>
        <p className="text-text-muted mt-2 mb-8">
          Start with the basics. We&apos;ll guide you through the rest.
        </p>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Order # */}
          <Field label="Shopify Order #" required>
            <input
              className="input-field"
              placeholder="e.g. 1042"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              autoFocus
            />
          </Field>

          {/* Dispute type */}
          <Field label="Dispute type" required>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRIMARY_DISPUTE_TYPES.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDisputeType(d.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    disputeType === d.id
                      ? 'border-accent-violet bg-accent-violet/10 shadow-glow-violet'
                      : 'border-bg-border bg-bg-elevated hover:border-text-muted'
                  }`}
                >
                  <div className="text-2xl mb-2">{d.emoji}</div>
                  <div className="text-text-primary font-semibold text-sm">{d.label}</div>
                  <div className="text-text-muted text-xs mt-1 leading-snug">{d.sub}</div>
                </button>
              ))}
            </div>

            <details className="mt-3 group">
              <summary className="text-text-muted text-xs cursor-pointer hover:text-text-secondary list-none flex items-center gap-1.5 select-none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3 transition-transform group-open:rotate-90">
                  <path d="m9 18 6-6-6-6" />
                </svg>
                Less common dispute types
              </summary>
              <div className="mt-3">
                <select
                  className="input-field"
                  value={SECONDARY_DISPUTE_TYPES.some((s) => s.id === disputeType) ? disputeType : ''}
                  onChange={(e) => setDisputeType(e.target.value as DisputeType)}
                >
                  <option value="">— Select —</option>
                  {SECONDARY_DISPUTE_TYPES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </details>
          </Field>

          {/* Deadline */}
          <Field
            label="Response deadline"
            hint="From the Shopify chargeback notification."
            required
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="date"
                className="input-field sm:flex-1"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              {info && <DeadlinePill deadline={deadline} />}
            </div>
            {info && info.warn && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/40 text-accent-red text-xs">
                ⚠️ Deadline is close — prioritize this case now.
              </div>
            )}
          </Field>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/40 text-accent-red text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={!canSubmit || submitting} className="btn-primary">
              {submitting ? 'Starting…' : 'Start →'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-text-primary text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-accent-violet ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-text-muted text-xs mt-1.5">{hint}</p>}
    </div>
  );
}
