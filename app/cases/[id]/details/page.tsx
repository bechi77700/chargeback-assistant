'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StepIndicator from '@/components/StepIndicator';
import DeadlinePill from '@/components/DeadlinePill';
import { disputeEmoji, disputeLabel } from '@/lib/dispute-types';
import { isoToDateInput, type CaseRecord } from '@/lib/case-types';

const PACKAGE_STATUSES: { id: string; emoji: string; label: string }[] = [
  { id: 'delivered', emoji: '✅', label: 'Delivered' },
  { id: 'in_transit', emoji: '🚚', label: 'In Transit' },
  { id: 'returned', emoji: '↩️', label: 'Returned' },
];

const CONTACT_OPTIONS: { id: string; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'unknown', label: 'Unknown' },
];

export default function DetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [c, setCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [shipDate, setShipDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageStatus, setPackageStatus] = useState('');
  const [contactedSupport, setContactedSupport] = useState('');

  useEffect(() => {
    fetch(`/api/cases/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Case not found');
        return r.json();
      })
      .then((data: CaseRecord) => {
        setCase(data);
        setCustomerName(data.customerName ?? '');
        setCustomerEmail(data.customerEmail ?? '');
        setAmount(data.amount != null ? String(data.amount) : '');
        setOrderDate(isoToDateInput(data.orderDate));
        setShipDate(isoToDateInput(data.shipDate));
        setTrackingNumber(data.trackingNumber ?? '');
        setPackageStatus(data.packageStatus ?? '');
        setContactedSupport(data.contactedSupport ?? '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const showInTransitBanner =
    c?.disputeType === 'inr' && packageStatus === 'in_transit';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          amount: amount === '' ? null : Number(amount),
          orderDate: orderDate || null,
          shipDate: shipDate || null,
          trackingNumber,
          packageStatus,
          contactedSupport,
          step: Math.max(c?.step ?? 1, 3),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push(`/cases/${params.id}/evidence`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-12">
          <div className="h-8 w-32 shimmer rounded mb-4" />
          <div className="card h-96 shimmer" />
        </div>
      </AppShell>
    );
  }

  if (error && !c) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-12">
          <div className="card p-6 text-center">
            <p className="text-accent-red">{error}</p>
            <Link href="/" className="btn-secondary inline-block mt-4">Back to dashboard</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <StepIndicator current={2} caseId={params.id} />

        {/* Case header */}
        <div className="card px-4 py-3 mb-6 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="text-text-primary font-semibold">#{c?.orderNumber}</div>
            <span className="text-text-secondary text-sm">
              {disputeEmoji(c!.disputeType)} {disputeLabel(c!.disputeType)}
            </span>
          </div>
          <DeadlinePill deadline={c?.deadline} />
        </div>

        <h1 className="text-text-primary text-3xl font-bold tracking-tight">Case Details</h1>
        <p className="text-text-muted mt-2 mb-8">Fill in the order information.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Customer name">
              <input className="input-field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </Field>
            <Field label="Customer email">
              <input type="email" className="input-field" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </Field>
            <Field label="Amount disputed">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </Field>
            <Field label="Order date">
              <input type="date" className="input-field" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </Field>
            <Field label="Ship date">
              <input type="date" className="input-field" value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
            </Field>
            <Field label="Tracking number">
              <input className="input-field" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            </Field>
          </div>

          <Field label="Package status">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PACKAGE_STATUSES.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPackageStatus(p.id)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    packageStatus === p.id
                      ? 'border-accent-violet bg-accent-violet/10 text-accent-violet'
                      : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-text-muted'
                  }`}
                >
                  <span className="text-lg mr-1.5">{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          {showInTransitBanner && (
            <div className="px-4 py-3 rounded-lg bg-accent-blue/10 border border-accent-blue/40 text-accent-blue text-sm flex items-start gap-2">
              <span>ℹ️</span>
              <div>
                Package is still in transit. We&apos;ll use the appropriate response template automatically.
              </div>
            </div>
          )}

          <Field label="Did customer contact support before filing?">
            <div className="flex flex-wrap gap-2">
              {CONTACT_OPTIONS.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => setContactedSupport(o.id)}
                  className={contactedSupport === o.id ? 'tag-active' : 'tag-inactive'}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/40 text-accent-red text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Link href="/" className="btn-secondary">← Back</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Next →'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-text-primary text-sm font-semibold mb-2">{label}</label>
      {children}
    </div>
  );
}
