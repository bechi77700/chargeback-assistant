'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import StepIndicator from '@/components/StepIndicator';
import DeadlinePill from '@/components/DeadlinePill';
import { PRIMARY_DISPUTE_TYPES, SECONDARY_DISPUTE_TYPES, type DisputeType } from '@/lib/dispute-types';
import { deadlineInfo } from '@/lib/deadline';
import { notifyShopsChanged, shopColor, type ShopSummary, type ShopsResponse } from '@/lib/shops';

export default function NewDisputePage() {
  // useSearchParams (for ?shop= preselection) needs a Suspense boundary
  return (
    <Suspense fallback={null}>
      <NewDisputeForm />
    </Suspense>
  );
}

function NewDisputeForm() {
  const router = useRouter();
  const preselectedShop = useSearchParams().get('shop');
  const [shops, setShops] = useState<ShopSummary[] | null>(null);
  const [shopId, setShopId] = useState('');
  const [addingShop, setAddingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [shopError, setShopError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [disputeType, setDisputeType] = useState<DisputeType | ''>('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/shops')
      .then((r) => r.json())
      .then((d: ShopsResponse) => {
        setShops(d.shops);
        // Preselect the shop we came from, or the only one that exists
        if (preselectedShop && d.shops.some((s) => s.id === preselectedShop)) setShopId(preselectedShop);
        else if (d.shops.length === 1) setShopId(d.shops[0].id);
        if (d.shops.length === 0) setAddingShop(true);
      });
  }, [preselectedShop]);

  async function handleAddShop() {
    const name = newShopName.trim();
    if (!name) return;
    setShopError(null);
    const res = await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setShopError(data.error ?? 'Could not add shop');
      return;
    }
    setShops((prev) =>
      [...(prev ?? []), { ...data, caseCount: 0, pendingCount: 0 } as ShopSummary].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setShopId(data.id);
    setNewShopName('');
    setAddingShop(false);
    notifyShopsChanged();
  }

  const info = deadline ? deadlineInfo(deadline) : null;
  const canSubmit = shopId && orderNumber.trim() && disputeType && deadline;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, orderNumber, disputeType, deadline }),
      });
      if (!res.ok) throw new Error('Failed to create case');
      const created = await res.json();
      notifyShopsChanged();
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
          {/* Shop */}
          <Field label="Shop" hint="The store this chargeback comes from." required>
            {shops === null ? (
              <div className="h-9 rounded-lg shimmer" />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {shops.map((s) => {
                  const active = shopId === s.id;
                  const color = shopColor(s);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setShopId(s.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                        active ? 'shadow-sm' : 'border-bg-border bg-bg-card text-text-secondary hover:border-text-muted'
                      }`}
                      style={active ? { color, borderColor: color, backgroundColor: `${color}14` } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {s.name}
                    </button>
                  );
                })}

                {addingShop ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="input-field w-48"
                      placeholder="New shop name"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddShop(); }
                        if (e.key === 'Escape' && shops.length > 0) setAddingShop(false);
                      }}
                      autoFocus
                    />
                    <button type="button" onClick={handleAddShop} disabled={!newShopName.trim()} className="btn-secondary">
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingShop(true)}
                    className="px-3 py-2 rounded-lg border border-dashed border-bg-border text-text-muted text-sm hover:border-accent-violet/50 hover:text-accent-violet transition-colors"
                  >
                    + New shop
                  </button>
                )}
              </div>
            )}
            {shops?.length === 0 && (
              <p className="text-text-muted text-xs mt-2">No shops yet — add the first one to start.</p>
            )}
            {shopError && <p className="text-accent-red text-xs mt-2">{shopError}</p>}
          </Field>

          {/* Order # */}
          <Field label="Shopify Order #" required>
            <input
              className="input-field"
              placeholder="e.g. 1042"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
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
